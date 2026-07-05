const express = require('express');
const router = express.Router();
const db = require('../db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildEmailPrompt } = require('../prompts/emailPrompts');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const EMAILS_PER_BATCH = 10;
const MAX_CONCURRENT_CALLS = 3;

router.post('/', async (req, res) => {
  try {
    const { company_id, target_industry_id, count } = req.body;

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

    const batchResult = await db.query(
      `INSERT INTO email_batches (company_id, target_industry_id, status, total_requested, progress_pct)
       VALUES ($1, $2, 'pending', $3, 0) RETURNING *`,
      [company_id, target_industry_id, count]
    );
    const batch = batchResult.rows[0];

    setImmediate(() => generateEmails(batch.id, company, industry.industry_name, servicesResult.rows, caseStudiesResult.rows, pricingResult.rows, count));

    res.status(201).json({ batchId: batch.id, message: 'Email generation started' });
  } catch (err) {
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
  try {
    await db.query(
      `UPDATE email_batches SET status='processing', updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
      [batchId]
    );

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const promptData = { companyName: company.name, companyDescription: company.description, services, caseStudies, pricingPlans, industry };
    const batches = [];
    let remaining = totalCount;

    while (remaining > 0) {
      const batchSize = Math.min(remaining, EMAILS_PER_BATCH);
      batches.push(batchSize);
      remaining -= batchSize;
    }

    let totalGenerated = 0;

    for (let i = 0; i < batches.length; i += MAX_CONCURRENT_CALLS) {
      const chunk = batches.slice(i, i + MAX_CONCURRENT_CALLS);
      const promises = chunk.map((batchSize) => callGemini(model, promptData, batchSize));

      const results = await Promise.allSettled(promises);

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const emails = result.value;
          for (const email of emails) {
            try {
              await db.query(
                `INSERT INTO generated_emails (batch_id, recipient_name, recipient_title, recipient_company, subject_line, opening_hook, cta_type, cta_text, email_body)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [batchId, email.recipient_name, email.recipient_title, email.recipient_company, email.subject_line, email.opening_hook, email.cta_type, email.cta_text, email.email_body]
              );
              totalGenerated++;
            } catch (insertErr) {
              console.error('Insert error:', insertErr.message);
            }
          }
        }
      }

      const pct = Math.min(Math.round((totalGenerated / totalCount) * 100), 100);
      await db.query(
        `UPDATE email_batches SET total_generated=$1, progress_pct=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3`,
        [totalGenerated, pct, batchId]
      );
    }

    await db.query(
      `UPDATE email_batches SET status='completed', total_generated=$1, progress_pct=100, updated_at=CURRENT_TIMESTAMP WHERE id=$2`,
      [totalGenerated, batchId]
    );
  } catch (err) {
    console.error('Generation error:', err);
    await db.query(
      `UPDATE email_batches SET status='failed', updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
      [batchId]
    );
  }
}

async function callGemini(model, promptData, count) {
  try {
    const prompt = buildEmailPrompt({ ...promptData, count });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 1.0,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    const response = result.response;
    let text = response.text();

    text = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();

    const emails = JSON.parse(text);
    if (Array.isArray(emails)) {
      return emails.slice(0, count);
    }
    return null;
  } catch (err) {
    console.error('Gemini call error:', err.message);
    return null;
  }
}

module.exports = router;
