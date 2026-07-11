import React, { useEffect, useState } from 'react';
import { companyApi, industriesApi, generateApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';

function EmailGenerator() {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [industries, setIndustries] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [emailCount, setEmailCount] = useState(10);
  const [model, setModel] = useState('gemini');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchId, setBatchId] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (generating && batchId) {
      const interval = setInterval(async () => {
        try {
          const res = await generateApi.getStatus(batchId);
          const data = res.data;
          setProgress(data.progress_pct);
          if (data.status === 'completed') {
            setGenerating(false);
            setStatus('Completed!');
            clearInterval(interval);
          } else if (data.status === 'failed') {
            setGenerating(false);
            setStatus('Generation failed');
            clearInterval(interval);
          } else {
            setStatus(`Generating... (${data.total_generated} emails)`);
          }
        } catch (err) {
          clearInterval(interval);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [generating, batchId]);

  async function loadData() {
    try {
      const compRes = await companyApi.get();
      const c = compRes.data;
      if (!c) return;
      setCompany(c);
      const indRes = await industriesApi.getByCompany(c.id);
      setIndustries(indRes.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function startGeneration() {
    if (!selectedIndustry) {
      alert('Please select a target industry');
      return;
    }
    if (emailCount < 1 || emailCount > 500) {
      alert('Count must be between 1 and 500');
      return;
    }

    setGenerating(true);
    setProgress(0);
    setStatus('Starting...');

    try {
      const res = await generateApi.start({
        company_id: company.id,
        target_industry_id: parseInt(selectedIndustry),
        count: parseInt(emailCount),
        model: model,
      });
      setBatchId(res.data.batchId);
    } catch (err) {
      setGenerating(false);
      setStatus('Error starting generation');
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  }

  async function viewResults() {
    if (batchId) navigate(`/emails/${batchId}`);
  }

  if (!company) {
    return (
      <div className="card empty-state">
        <h3>No company configured</h3>
        <p>Please set up your company profile first.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>Generate Cold Emails</h1>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Company</label>
          <input className="form-input" value={company.name} disabled />
        </div>

        <div className="form-group">
          <label className="form-label">Target Industry</label>
          <select className="form-select" value={selectedIndustry} onChange={(e) => setSelectedIndustry(e.target.value)} disabled={generating}>
            <option value="">Select an industry...</option>
            {industries.map((ind) => (
              <option key={ind.id} value={ind.id}>{ind.industry_name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Number of Emails to Generate (1-500)</label>
          <input className="form-input" type="number" min="1" max="500" value={emailCount} onChange={(e) => setEmailCount(e.target.value)} disabled={generating} />
        </div>

        <div className="form-group">
          <label className="form-label">AI Model</label>
          <select className="form-select" value={model} onChange={(e) => setModel(e.target.value)} disabled={generating}>
            <option value="gemini">Gemini (Cloud)</option>
            <option value="groq:llama-3.1-8b-instant">Groq — Llama 3.1 8B (Fast)</option>
            <option value="groq:llama-3.3-70b-versatile">Groq — Llama 3.3 70B (Best Quality)</option>
            <option value="ollama">Llama 3.2 1B (Local — Ollama)</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={startGeneration} disabled={generating}>
          {generating ? 'Generating...' : 'Start Generation'}
        </button>
      </div>

      {generating && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Generation Progress</span>
            <span className="badge badge-processing">{status}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            <span className="progress-text">{progress}%</span>
          </div>
        </div>
      )}

      {!generating && batchId && progress === 100 && (
        <div className="card">
          <p style={{ marginBottom: 16, color: '#155724' }}>Email generation completed successfully!</p>
          <button className="btn btn-success" onClick={viewResults}>View Results</button>
        </div>
      )}
    </div>
  );
}

export default EmailGenerator;
