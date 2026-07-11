import React, { useEffect, useState } from 'react';
import api, { companyApi, servicesApi, caseStudiesApi, pricingApi, industriesApi } from '../utils/api';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState({
    services: 0,
    caseStudies: 0,
    pricing: 0,
    industries: 0,
    emails: 0,
    batches: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const companyRes = await companyApi.get();
      const c = companyRes.data;
      if (!c) return;
      setCompany(c);

      const [svcRes, csRes, prRes, indRes] = await Promise.all([
        servicesApi.getByCompany(c.id),
        caseStudiesApi.getByCompany(c.id),
        pricingApi.getByCompany(c.id),
        industriesApi.getByCompany(c.id),
      ]);

      let totalEmails = 0;
      let totalBatches = 0;

      try {
        const batchesRes = await api.get('/batches');
        totalBatches = batchesRes.data.length;
        for (const batch of batchesRes.data) {
          totalEmails += parseInt(batch.total_generated || 0);
        }
      } catch (e) {}

      setStats({
        services: svcRes.data.length,
        caseStudies: csRes.data.length,
        pricing: prRes.data.length,
        industries: indRes.data.length,
        emails: totalEmails,
        batches: totalBatches,
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>
        {company ? company.name : 'Dashboard'}
      </h1>

      <div className="grid-3">
        <div className="stat-card">
          <div className="stat-value">{stats.services}</div>
          <div className="stat-label">Services</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.caseStudies}</div>
          <div className="stat-label">Case Studies</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pricing}</div>
          <div className="stat-label">Pricing Plans</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.industries}</div>
          <div className="stat-label">Target Industries</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.emails}</div>
          <div className="stat-label">Emails Generated</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.batches}</div>
          <div className="stat-label">Batches</div>
        </div>
      </div>

      {!company && (
        <div className="card empty-state" style={{ marginTop: 24 }}>
          <h3>No company configured yet</h3>
          <p>Start by setting up your company profile and adding your services.</p>
          <Link to="/setup" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
            Go to Setup
          </Link>
        </div>
      )}

      {company && (
        <>
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <span className="card-title">Quick Actions</span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/setup" className="btn btn-primary">Manage Data</Link>
              <Link to="/generate" className="btn btn-success">Generate Emails</Link>
              <Link to="/batches" className="btn btn-secondary">View Batches</Link>
              {stats.batches === 0 && (
                <button className="btn btn-outline" onClick={async () => {
                  await api.post('/seed-demo');
                  loadData();
                }}>Quick Start</button>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <span className="card-title">How to Use</span>
            </div>
            <ol className="steps-list">
              <li>
                <span className="step-number">1</span>
                <div className="step-content">
                  <div className="step-title">Set up your company</div>
                  <div className="step-desc">
                    Go to <strong>Setup</strong> and add your company name, description, services, case studies, and pricing plans. This data powers every generated email.
                  </div>
                </div>
              </li>
              <li>
                <span className="step-number">2</span>
                <div className="step-content">
                  <div className="step-title">Add target industries</div>
                  <div className="step-desc">
                    In <strong>Setup</strong>, define the industries you want to reach (e.g. Financial Services, Healthcare, Retail). Each industry gets its own set of personalized emails.
                  </div>
                </div>
              </li>
              <li>
                <span className="step-number">3</span>
                <div className="step-content">
                  <div className="step-title">Generate emails</div>
                  <div className="step-desc">
                    Go to <strong>Generate</strong>, pick a target industry, set the count (1-500), and click start. Watch real-time progress as AI crafts each email.
                  </div>
                </div>
              </li>
              <li>
                <span className="step-number">4</span>
                <div className="step-content">
                  <div className="step-title">Review & export</div>
                  <div className="step-desc">
                    Browse results in <strong>Batches</strong>, click any batch to see all emails. Filter by CTA type or keyword, then download as CSV for your email campaigns.
                  </div>
                </div>
              </li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
