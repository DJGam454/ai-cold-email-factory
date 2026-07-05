const express = require('express');
const router = express.Router();
const db = require('../db');
const { GoogleGenAI } = require('@google/genai');
const { buildEmailPrompt } = require('../prompts/emailPrompts');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = 'gemini-3.5-flash';
const EMAILS_PER_BATCH = 5;
const MAX_CONCURRENT_CALLS = 3;
const MAX_RETRIES = 2;

router.post('/', async (req, res) => {
  try {
    const { company_id, target_industry_id, count } = req.body;
    console.log('[GENERATE] POST /api/generate — company_id=' + company_id + ', target_industry_id=' + target_industry_id + ', count=' + count);

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
      generateEmails(batch.id, company, industry.industry_name, servicesResult.rows, caseStudiesResult.rows, pricingResult.rows, count)
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

async function generateEmails(batchId, company, industry, services, caseStudies, pricingPlans, totalCount) {
  console.log('[GENERATE] generateEmails started for batch #' + batchId + ' — target=' + industry + ', count=' + totalCount);
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
      const promises = chunk.map((batchSize) => callGemini(promptData, batchSize));

      const results = await Promise.allSettled(promises);

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
          const emails = result.value;
          console.log('[GENERATE] Gemini returned ' + emails.length + ' emails for sub-batch');
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
          console.error('[GENERATE] Gemini call rejected for batch #' + batchId + ':', result.reason);
        } else {
          console.warn('[GENERATE] Gemini call returned empty/null for batch #' + batchId);
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
      console.error('[GENERATE] Batch #' + batchId + ' FAILED — 0 emails generated. Check Gemini API key and logs above.');
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

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 1.0,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 65536,
      },
    });

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
    console.error('[GEMINI] ERROR —', err.constructor.name + ':', err.message);
    if (err.status) console.error('[GEMINI] HTTP status:', err.status);
    if (attempt < MAX_RETRIES) {
      console.log('[GEMINI] Retrying (attempt ' + (attempt + 1) + ' of ' + MAX_RETRIES + ')...');
      await new Promise(r => setTimeout(r, 2000));
      return callGemini(promptData, count, attempt + 1);
    }
    if (err.stack) console.error('[GEMINI] Stack:', err.stack.split('\n').slice(0, 4).join('\n'));
    return [];
  }
}

module.exports = router;
