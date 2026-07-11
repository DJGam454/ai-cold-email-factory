const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const db = require('./db');

const companyRoutes = require('./routes/company');
const servicesRoutes = require('./routes/services');
const caseStudiesRoutes = require('./routes/caseStudies');
const pricingRoutes = require('./routes/pricing');
const industriesRoutes = require('./routes/industries');
const generateRoutes = require('./routes/generate');
const emailsRoutes = require('./routes/emails');
const batchesRoutes = require('./routes/batches');

const app = express();
const PORT = process.env.PORT || 5002;

console.log('[STARTUP] === AI Cold Email Factory Backend ===');
console.log('[STARTUP] Node version:', process.version);
console.log('[STARTUP] Server port:', PORT);
console.log('[STARTUP] Database URL:', process.env.DATABASE_URL || 'postgresql://localhost:5433/ai_cold_email_factory');
const apiKey = process.env.GEMINI_API_KEY;
console.log('[STARTUP] GEMINI_API_KEY loaded:', apiKey ? 'YES (length: ' + apiKey.length + ')' : 'NO');

(async () => {
  try {
    await db.query('SELECT 1');
    console.log('[STARTUP] Database connection: OK');
  } catch (err) {
    console.error('[STARTUP] Database connection: FAILED —', err.message);
    process.exit(1);
  }
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: 'Reply with just the word: OK',
      });
      const reply = (response.text || '').trim();
      console.log('[STARTUP] Gemini API key: VALID (' + (reply || 'connected') + ')');
    } catch (err) {
      const isQuota = err.message && err.message.includes('429');
      if (isQuota) {
        console.warn('[STARTUP] Gemini API key: VALID but daily quota exhausted (resets at midnight PT)');
      } else {
        console.warn('[STARTUP] Gemini API key: INVALID —', err.message);
        console.warn('[STARTUP] Email generation will fail until a valid key is provided in .env');
      }
    }
  } else {
    console.warn('[STARTUP] Gemini API key: NOT SET — email generation will not work');
  }

  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2:1b';
  try {
    const tagRes = await fetch(ollamaBaseUrl + '/api/tags');
    if (tagRes.ok) {
      const tags = await tagRes.json();
      const modelFound = (tags.models || []).some(m => m.name === ollamaModel);
      if (modelFound) {
        console.log('[STARTUP] Ollama: RUNNING (' + ollamaBaseUrl + '), model ' + ollamaModel + ': AVAILABLE');
      } else {
        console.warn('[STARTUP] Ollama: RUNNING but model ' + ollamaModel + ' not found — run: ollama pull ' + ollamaModel);
      }
    } else {
      console.warn('[STARTUP] Ollama: RESPONDED with status ' + tagRes.status);
    }
  } catch (err) {
    console.warn('[STARTUP] Ollama: NOT AVAILABLE (' + ollamaBaseUrl + ') — ' + err.message);
    console.warn('[STARTUP]   Start Ollama with: ollama serve');
  }
})();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/company', companyRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/case-studies', caseStudiesRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/industries', industriesRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/batches', batchesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/seed-demo', async (req, res) => {
  try {
    await db.query('DELETE FROM generated_emails; DELETE FROM email_batches;');

    const batch = await db.query(
      `INSERT INTO email_batches (company_id, target_industry_id, status, total_requested, total_generated, progress_pct)
       VALUES (1, 1, 'completed', 1, 1, 100) RETURNING *`
    );
    const batchId = batch.rows[0].id;

    const seedEmails = [
      ['Marcus Vance', 'CTO', 'Sterling Capital', 'Can legacy banks afford to ignore AI-driven fraud detection?', 'Did you know 78% of Financial Services leaders report rising compliance costs eating into margins?', 'call', 'Would you be open to a 15-minute call this week to explore how we\'ve helped similar firms reduce compliance spend by 40%?', 'Hi Marcus,\n\nI noticed Sterling Capital has been expanding your digital banking offerings — impressive growth trajectory.\n\nMany financial institutions we work with face the same challenge: legacy systems that limit how fast you can launch new features. Our team recently helped a top-20 bank modernize their core infrastructure in 12 weeks, cutting time-to-market for new products from 6 months to 3 weeks.\n\nWould you be open to a brief call to discuss how we could approach this for Sterling Capital?'],
    ];

    for (const e of seedEmails) {
      await db.query(
        `INSERT INTO generated_emails (batch_id, recipient_name, recipient_title, recipient_company, subject_line, opening_hook, cta_type, cta_text, email_body)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [batchId, ...e]
      );
    }

    res.json({ message: 'Seed data created', batchId, count: seedEmails.length });
  } catch (err) {
    console.error('[SEED-DEMO] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

const frontendBuild = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendBuild));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log('[STARTUP] Server listening on port ' + PORT);
});
