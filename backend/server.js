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
const PORT = process.env.PORT || 5001;

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
      console.warn('[STARTUP] Gemini API key: INVALID —', err.message);
      console.warn('[STARTUP] Email generation will fail until a valid key is provided in .env');
    }
  } else {
    console.warn('[STARTUP] Gemini API key: NOT SET — email generation will not work');
  }
})();

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
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

app.listen(PORT, () => {
  console.log('[STARTUP] Server listening on port ' + PORT);
});
