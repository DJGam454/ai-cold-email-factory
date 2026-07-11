const express = require('express');
const router = express.Router();
const db = require('../db');
const { GoogleGenAI } = require('@google/genai');
const { buildEmailPrompt } = require('../prompts/emailPrompts');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = 'gemini-3.5-flash';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const EMAILS_PER_BATCH = 5;
const MAX_CONCURRENT_CALLS = 3;
const MAX_RETRIES = 2;
const MAX_RATE_LIMIT_RETRIES = 3;

router.post('/', async (req, res) => {
  try {
    const { company_id, target_industry_id, count, model } = req.body;
    const validModels = ['gemini', 'ollama', 'groq'];
    const activeModel = model && (validModels.includes(model) || model.startsWith('groq:')) ? model : 'gemini';
    console.log('[GENERATE] POST /api/generate — company_id=' + company_id + ', target_industry_id=' + target_industry_id + ', count=' + count + ', model=' + activeModel);

    if (!company_id || !target_industry_id || !count) {
      return res.status(400).json({ error: 'company_id, target_industry_id, and count are required' });
    }
    if (count < 1 || count > 500) {
      return res.status(400).json({ error: 'Count must be between 1 and 500' });
    }

    const companyResult = await db.query('SELECT * FROM companies WHERE id=$1', [company_id]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    const company = companyResult.rows[0];

    const industryResult = await db.query('SELECT * FROM target_industries WHERE id=$1', [target_industry_id]);
    if (industryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Target industry not found' });
    }
    const industry = industryResult.rows[0];

    const servicesResult = await db.query('SELECT * FROM services WHERE company_id=$1 AND is_active=true', [company_id]);
    const caseStudiesResult = await db.query('SELECT * FROM case_studies WHERE company_id=$1 AND is_active=true', [company_id]);
    const pricingResult = await db.query('SELECT * FROM pricing_plans WHERE company_id=$1 AND is_active=true', [company_id]);
    console.log('[GENERATE] Fetched ' + servicesResult.rows.length + ' services, ' + caseStudiesResult.rows.length + ' case studies, ' + pricingResult.rows.length + ' pricing plans');

    const batchResult = await db.query(
      `INSERT INTO email_batches (company_id, target_industry_id, status, total_requested, progress_pct)
       VALUES ($1, $2, 'pending', $3, 0) RETURNING *`,
      [company_id, target_industry_id, count]
    );
    const batch = batchResult.rows[0];
    console.log('[GENERATE] Batch #' + batch.id + ' created with status=pending, count=' + count);

    setImmediate(() => {
      generateEmails(batch.id, company, industry.industry_name, servicesResult.rows, caseStudiesResult.rows, pricingResult.rows, count, activeModel)
        .catch(err => {
          console.error('[GENERATE] Unhandled error in generateEmails for batch #' + batch.id + ':', err);
          db.query('UPDATE email_batches SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2', ['failed', batch.id])
            .catch(e => console.error('[GENERATE] Failed to mark batch #' + batch.id + ' as failed:', e.message));
        });
    });

    res.status(201).json({ batchId: batch.id, message: 'Email generation started' });
  } catch (err) {
    console.error('[GENERATE] POST handler error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/status/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const result = await db.query(
      'SELECT id, status, total_requested, total_generated, progress_pct, created_at, updated_at FROM email_batches WHERE id=$1',
      [batchId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Batch not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function generateEmails(batchId, company, industry, services, caseStudies, pricingPlans, totalCount, model = 'gemini') {
  console.log('[GENERATE] generateEmails started for batch #' + batchId + ' — target=' + industry + ', count=' + totalCount + ', model=' + model);
  try {
    await db.query(
      `UPDATE email_batches SET status='processing', updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
      [batchId]
    );
    console.log('[GENERATE] Batch #' + batchId + ' status updated to processing');

    const promptData = { companyName: company.name, companyDescription: company.description, services, caseStudies, pricingPlans, industry };
    const batches = [];
    let remaining = totalCount;

    while (remaining > 0) {
      const batchSize = Math.min(remaining, EMAILS_PER_BATCH);
      batches.push(batchSize);
      remaining -= batchSize;
    }
    console.log('[GENERATE] Split ' + totalCount + ' emails into ' + batches.length + ' API calls of up to ' + EMAILS_PER_BATCH + ' each');

    let totalGenerated = 0;

    for (let i = 0; i < batches.length; i += MAX_CONCURRENT_CALLS) {
      const chunk = batches.slice(i, i + MAX_CONCURRENT_CALLS);
      console.log('[GENERATE] Starting concurrent batch ' + ((i / MAX_CONCURRENT_CALLS) + 1) + ' — requesting ' + chunk.join(',') + ' emails');
      const modelLabel = model === 'ollama' ? 'Ollama' : model.startsWith('groq') ? 'Groq' : 'Gemini';
      const promises = chunk.map((batchSize) => {
        if (model === 'ollama') return callOllama(promptData, batchSize);
        if (model.startsWith('groq')) return callGroq(promptData, batchSize, model);
        return callGemini(promptData, batchSize);
      });

      const results = await Promise.allSettled(promises);

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
          const emails = result.value;
          console.log('[GENERATE] ' + modelLabel + ' returned ' + emails.length + ' emails for sub-batch');
          for (const email of emails) {
            try {
              await db.query(
                `INSERT INTO generated_emails (batch_id, recipient_name, recipient_title, recipient_company, subject_line, opening_hook, cta_type, cta_text, email_body)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [batchId, email.recipient_name, email.recipient_title, email.recipient_company, email.subject_line, email.opening_hook, email.cta_type, email.cta_text, email.email_body]
              );
              totalGenerated++;
            } catch (insertErr) {
              console.error('[GENERATE] Insert error for batch #' + batchId + ':', insertErr.message);
            }
          }
        } else if (result.status === 'rejected') {
          console.error('[GENERATE] ' + modelLabel + ' call rejected for batch #' + batchId + ':', result.reason);
        } else {
          console.warn('[GENERATE] ' + modelLabel + ' call returned empty/null for batch #' + batchId);
        }
      }

      const pct = Math.min(Math.round((totalGenerated / totalCount) * 100), 100);
      console.log('[GENERATE] Progress: ' + totalGenerated + '/' + totalCount + ' emails (' + pct + '%)');
      await db.query(
        `UPDATE email_batches SET total_generated=$1, progress_pct=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3`,
        [totalGenerated, pct, batchId]
      );
    }

    if (totalGenerated > 0) {
      console.log('[GENERATE] Batch #' + batchId + ' COMPLETED — ' + totalGenerated + '/' + totalCount + ' emails generated');
      await db.query(
        `UPDATE email_batches SET status='completed', total_generated=$1, progress_pct=100, updated_at=CURRENT_TIMESTAMP WHERE id=$2`,
        [totalGenerated, batchId]
      );
    } else {
      const modelLabel2 = model === 'ollama' ? 'Ollama' : model.startsWith('groq') ? 'Groq' : 'Gemini';
      console.error('[GENERATE] Batch #' + batchId + ' FAILED — 0 emails generated. Check ' + modelLabel2 + ' configuration and logs above.');
      await db.query(
        `UPDATE email_batches SET status='failed', updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
        [batchId]
      );
    }
  } catch (err) {
    console.error('[GENERATE] Fatal error in generateEmails for batch #' + batchId + ':', err);
    try {
      await db.query(
        `UPDATE email_batches SET status='failed', updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
        [batchId]
      );
    } catch (dbErr) {
      console.error('[GENERATE] Failed to update batch status:', dbErr.message);
    }
  }
}

async function callGemini(promptData, count, attempt = 1) {
  try {
    const prompt = buildEmailPrompt({ ...promptData, count });
    console.log('[GEMINI] Sending prompt to Gemini (count=' + count + ', prompt_length=' + prompt.length + ' chars, attempt=' + attempt + ')');
    console.log('[GEMINI] PROMPT PREVIEW (first 500 chars):', prompt.substring(0, 500));

    const TIMEOUT_MS = 120000;
    let timeoutHandle;

    const response = await Promise.race([
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          temperature: 1.0,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 65536,
        },
      }),
      new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('Gemini API timed out after ' + (TIMEOUT_MS / 1000) + 's')), TIMEOUT_MS);
      }),
    ]);
    clearTimeout(timeoutHandle);

    let text = response.text;
    if (!text) {
      console.warn('[GEMINI] Empty response received');
      return [];
    }
    console.log('[GEMINI] Raw response received (length=' + text.length + ' chars)');
    console.log('[GEMINI] RESPONSE PREVIEW (first 300 chars):', text.substring(0, 300));

    text = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();

    const emails = JSON.parse(text);
    if (Array.isArray(emails)) {
      console.log('[GEMINI] Successfully parsed ' + emails.length + ' emails from response');
      return emails.slice(0, count);
    }
    console.warn('[GEMINI] Parsed response is not an array:', typeof emails);
    return [];
  } catch (err) {
    const errMsg = err.message || '';
    const isRateLimit = err.status === 429 || errMsg.includes('429') || errMsg.includes('RATE_LIMIT') || errMsg.includes('quota') || errMsg.includes('resource exhausted');
    console.error('[GEMINI] ERROR —', err.constructor.name + ':', err.message + (isRateLimit ? ' (RATE LIMITED)' : ''));
    if (err.status) console.error('[GEMINI] HTTP status:', err.status);

    if (isRateLimit && attempt < MAX_RATE_LIMIT_RETRIES) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000) + Math.random() * 2000;
      console.log('[GEMINI] Rate limited. Retrying in ' + Math.round(delay) + 'ms (attempt ' + (attempt + 1) + '/' + MAX_RATE_LIMIT_RETRIES + ')');
      await new Promise(r => setTimeout(r, delay));
      return callGemini(promptData, count, attempt + 1);
    }

    if (attempt < MAX_RETRIES && !isRateLimit) {
      console.log('[GEMINI] Retrying (attempt ' + (attempt + 1) + ' of ' + MAX_RETRIES + ')...');
      await new Promise(r => setTimeout(r, 2000));
      return callGemini(promptData, count, attempt + 1);
    }

    const exhaustedMsg = isRateLimit ? 'Gemini API rate limit reached after ' + MAX_RATE_LIMIT_RETRIES + ' retries. Try again later.' : err.message;
    console.error('[GEMINI] Giving up:', exhaustedMsg);
    if (!isRateLimit && err.stack) console.error('[GEMINI] Stack:', err.stack.split('\n').slice(0, 4).join('\n'));
    return [];
  }
}

async function callGroq(promptData, count, modelParam, attempt = 1) {
  try {
    const prompt = buildEmailPrompt({ ...promptData, count });
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('[GROQ] No GROQ_API_KEY set in .env');
      return [];
    }

    const groqModelId = (modelParam && modelParam.startsWith('groq:') ? modelParam.split(':')[1] : null) || process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    console.log('[GROQ] Sending prompt to Groq (model=' + groqModelId + ', count=' + count + ', prompt_length=' + prompt.length + ' chars, attempt=' + attempt + ')');
    console.log('[GROQ] PROMPT PREVIEW (first 500 chars):', prompt.substring(0, 500));

    const TIMEOUT_MS = 120000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response;
    try {
      response = await fetch(GROQ_BASE_URL + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: groqModelId,
          messages: [
            { role: 'system', content: 'You are an expert B2B cold email copywriter. You ALWAYS respond with ONLY a valid JSON array. No explanations, no introductions, no markdown formatting. Just the JSON array.' },
            { role: 'user', content: prompt },
          ],
          temperature: 1.0,
          max_tokens: 16384,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      let errMsg = 'Groq API returned status ' + response.status;

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const retrySec = retryAfter ? parseInt(retryAfter) : Math.pow(2, attempt);
        errMsg = 'Groq rate limited (retry-after: ' + retrySec + 's)';

        if (attempt < MAX_RATE_LIMIT_RETRIES) {
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(1000 * Math.pow(2, attempt), 30000) + Math.random() * 2000;
          console.log('[GROQ] Rate limited. Retrying in ' + Math.round(delay) + 'ms (attempt ' + (attempt + 1) + '/' + MAX_RATE_LIMIT_RETRIES + ')');
          await new Promise(r => setTimeout(r, delay));
          return callGroq(promptData, count, modelParam, attempt + 1);
        }

        console.error('[GROQ] Rate limit exhausted after ' + MAX_RATE_LIMIT_RETRIES + ' retries.');
        return [];
      }

      if (response.status === 498) {
        console.warn('[GROQ] Flex capacity exceeded. Will retry.');
        if (attempt < MAX_RATE_LIMIT_RETRIES) {
          await new Promise(r => setTimeout(r, 5000 * attempt));
          return callGroq(promptData, count, modelParam, attempt + 1);
        }
        return [];
      }

      throw new Error(errMsg + ': ' + errBody.substring(0, 200));
    }

    const data = await response.json();
    let text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!text) {
      console.warn('[GROQ] Empty response received');
      return [];
    }
    console.log('[GROQ] Raw response received (length=' + text.length + ' chars)');
    console.log('[GROQ] RESPONSE PREVIEW (first 500 chars):', text.substring(0, 500));

    text = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();

    function extractJsonArray(t) {
      let start = t.indexOf('[');
      if (start === -1) return null;
      let depth = 0, inStr = false, escape = false;
      for (let i = start; i < t.length; i++) {
        const ch = t[i];
        if (escape) { escape = false; continue; }
        if (inStr) {
          if (ch === '\\') { escape = true; }
          else if (ch === '"') { inStr = false; }
          continue;
        }
        if (ch === '"') { inStr = true; }
        else if (ch === '[') { depth++; }
        else if (ch === ']') { depth--; if (depth === 0) return t.slice(start, i + 1); }
      }
      if (depth > 0) return t.slice(start) + ']'.repeat(depth);
      return null;
    }

    let emails = [];
    try {
      emails = JSON.parse(text);
    } catch (_) {
      const jsonStr = extractJsonArray(text);
      if (jsonStr) {
        try {
          emails = JSON.parse(jsonStr);
        } catch (_2) {
          const cleaned = jsonStr.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
          try {
            emails = JSON.parse(cleaned);
          } catch (_3) {
            const lastLine = text.slice(-200);
            console.warn('[GROQ] JSON parse failed. Last 200 chars: ' + lastLine.replace(/\n/g, '\\n'));
          }
        }
      } else {
        console.warn('[GROQ] No JSON array found in response');
      }
    }

    if (Array.isArray(emails) && emails.length > 0) {
      console.log('[GROQ] Successfully parsed ' + emails.length + ' emails from response');
      return emails.slice(0, count);
    }

    console.warn('[GROQ] Could not parse valid email array from response');
    if (attempt < MAX_RETRIES) {
      console.log('[GROQ] Retrying (attempt ' + (attempt + 1) + ' of ' + MAX_RETRIES + ')...');
      await new Promise(r => setTimeout(r, 2000));
      return callGroq(promptData, count, modelParam, attempt + 1);
    }
    return [];
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[GROQ] Request timed out after 120s');
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 2000));
        return callGroq(promptData, count, modelParam, attempt + 1);
      }
      return [];
    }
    console.error('[GROQ] ERROR —', err.constructor.name + ':', err.message);
    if (attempt < MAX_RETRIES) {
      console.log('[GROQ] Retrying (attempt ' + (attempt + 1) + ' of ' + MAX_RETRIES + ')...');
      await new Promise(r => setTimeout(r, 2000));
      return callGroq(promptData, count, modelParam, attempt + 1);
    }
    return [];
  }
}

async function callOllama(promptData, count, attempt = 1) {
  try {
    const prompt = buildEmailPrompt({ ...promptData, count });
    console.log('[OLLAMA] Sending prompt to Ollama (model=' + OLLAMA_MODEL + ', count=' + count + ', prompt_length=' + prompt.length + ' chars, attempt=' + attempt + ')');

    const TIMEOUT_MS = 300000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response;
    try {
      response = await fetch(OLLAMA_BASE_URL + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: 'system', content: 'You are an expert B2B cold email copywriter. You ALWAYS respond with ONLY a valid JSON array. No explanations, no introductions, no markdown formatting. Just the JSON array.' },
            { role: 'user', content: prompt },
          ],
          stream: false,
          options: {
            temperature: 1.0,
            top_p: 0.95,
            top_k: 40,
            num_predict: 16384,
          },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error('Ollama API returned status ' + response.status + ': ' + errText);
    }

    const data = await response.json();
    let text = data.message && data.message.content;
    if (!text) {
      console.warn('[OLLAMA] Empty response received');
      return [];
    }
    console.log('[OLLAMA] Raw response received (length=' + text.length + ' chars)');
    console.log('[OLLAMA] RESPONSE PREVIEW (first 500 chars):', text.substring(0, 500));

    text = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();

    function extractJsonArray(t) {
      let start = t.indexOf('[');
      if (start === -1) return null;
      let depth = 0, inStr = false, escape = false;
      for (let i = start; i < t.length; i++) {
        const ch = t[i];
        if (escape) { escape = false; continue; }
        if (inStr) {
          if (ch === '\\') { escape = true; }
          else if (ch === '"') { inStr = false; }
          continue;
        }
        if (ch === '"') { inStr = true; }
        else if (ch === '[') { depth++; }
        else if (ch === ']') { depth--; if (depth === 0) return t.slice(start, i + 1); }
      }
      if (depth > 0) return t.slice(start) + ']'.repeat(depth);
      return null;
    }

    let emails = [];
    try {
      emails = JSON.parse(text);
    } catch (_) {
      const jsonStr = extractJsonArray(text);
      if (jsonStr) {
        try {
          emails = JSON.parse(jsonStr);
        } catch (_2) {
          const cleaned = jsonStr.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
          try {
            emails = JSON.parse(cleaned);
          } catch (_3) {
            const lines = jsonStr.split('\n').filter(l => l.trim());
            const lastLine = jsonStr.slice(-200);
            console.warn('[OLLAMA] JSON parse failed. Last 200 chars: ' + lastLine.replace(/\n/g, '\\n'));
          }
        }
      } else {
        console.warn('[OLLAMA] No JSON array found in response');
      }
    }

    if (Array.isArray(emails) && emails.length > 0) {
      console.log('[OLLAMA] Successfully parsed ' + emails.length + ' emails from response');
      return emails.slice(0, count);
    }
    console.warn('[OLLAMA] Could not parse valid email array from response (length=' + text.length + ' chars)');
    if (attempt < MAX_RETRIES) {
      console.log('[OLLAMA] Retrying with adjusted prompt (attempt ' + (attempt + 1) + ' of ' + MAX_RETRIES + ')...');
      await new Promise(r => setTimeout(r, 2000));
      return callOllama(promptData, count, attempt + 1);
    }
    return [];
  } catch (err) {
    console.error('[OLLAMA] ERROR —', err.constructor.name + ':', err.message);
    if (err.name === 'AbortError') {
      console.error('[OLLAMA] Request timed out after 300s');
    }
    if (attempt < MAX_RETRIES) {
      console.log('[OLLAMA] Retrying (attempt ' + (attempt + 1) + ' of ' + MAX_RETRIES + ')...');
      await new Promise(r => setTimeout(r, 2000));
      return callOllama(promptData, count, attempt + 1);
    }
    return [];
  }
}

module.exports = router;
