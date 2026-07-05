require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');

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
  console.log(`Server running on port ${PORT}`);
});
