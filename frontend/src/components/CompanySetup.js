import React, { useEffect, useState } from 'react';
import { companyApi, servicesApi, caseStudiesApi, pricingApi, industriesApi } from '../utils/api';
import Modal from './Modal';

function CompanySetup() {
  const [company, setCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({ name: '', description: '', website: '', industry_focus: '' });

  const [services, setServices] = useState([]);
  const [caseStudies, setCaseStudies] = useState([]);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [industries, setIndustries] = useState([]);

  const [showModal, setShowModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    try {
      const res = await companyApi.get();
      const c = res.data;
      if (c) {
        setCompany(c);
        setCompanyForm({ name: c.name, description: c.description || '', website: c.website || '', industry_focus: c.industry_focus || '' });
        loadAll(c.id);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAll(companyId) {
    try {
      const [svc, cs, pr, ind] = await Promise.all([
        servicesApi.getByCompany(companyId),
        caseStudiesApi.getByCompany(companyId),
        pricingApi.getByCompany(companyId),
        industriesApi.getByCompany(companyId),
      ]);
      setServices(svc.data);
      setCaseStudies(cs.data);
      setPricingPlans(pr.data);
      setIndustries(ind.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function saveCompany() {
    try {
      if (company) {
        const res = await companyApi.update(company.id, companyForm);
        setCompany(res.data);
      } else {
        const res = await companyApi.create(companyForm);
        setCompany(res.data);
      }
      alert('Company saved!');
    } catch (err) {
      alert('Error saving company');
    }
  }

  function openAdd(type) {
    setShowModal(type);
    setEditItem(null);
    setFormData({ company_id: company?.id });
  }

  function openEdit(type, item) {
    setShowModal(type);
    setEditItem(item);
    setFormData({ ...item });
  }

  async function saveItem() {
    try {
      const type = showModal;
      let res;
      if (editItem) {
        if (type === 'service') res = await servicesApi.update(editItem.id, formData);
        else if (type === 'caseStudy') res = await caseStudiesApi.update(editItem.id, formData);
        else if (type === 'pricing') res = await pricingApi.update(editItem.id, formData);
        else if (type === 'industry') res = await industriesApi.update(editItem.id, formData);
      } else {
        if (type === 'service') res = await servicesApi.create(formData);
        else if (type === 'caseStudy') res = await caseStudiesApi.create(formData);
        else if (type === 'pricing') res = await pricingApi.create(formData);
        else if (type === 'industry') res = await industriesApi.create(formData);
      }
      setShowModal(null);
      loadAll(company.id);
    } catch (err) {
      alert('Error saving');
    }
  }

  async function deleteItem(type, id) {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (type === 'service') await servicesApi.delete(id);
      else if (type === 'caseStudy') await caseStudiesApi.delete(id);
      else if (type === 'pricing') await pricingApi.delete(id);
      else if (type === 'industry') await industriesApi.delete(id);
      loadAll(company.id);
    } catch (err) {
      alert('Error deleting');
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>Company Setup</h1>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Company Profile</span>
          <button className="btn btn-primary" onClick={saveCompany}>Save</button>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input className="form-input" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Website</label>
            <input className="form-input" value={companyForm.website} onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={companyForm.description} onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Industry Focus</label>
          <input className="form-input" value={companyForm.industry_focus} onChange={(e) => setCompanyForm({ ...companyForm, industry_focus: e.target.value })} />
        </div>
      </div>

      {company && (
        <>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Services ({services.length})</span>
              <button className="btn btn-primary btn-sm" onClick={() => openAdd('service')}>+ Add</button>
            </div>
            <ul className="item-list">
              {services.map((s) => (
                <li key={s.id}>
                  <div>
                    <strong>{s.name}</strong>
                    <br /><span style={{ fontSize: 13, color: '#6c757d' }}>{s.description}</span>
                  </div>
                  <div className="item-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit('service', s)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteItem('service', s.id)}>Del</button>
                  </div>
                </li>
              ))}
              {services.length === 0 && <li style={{ color: '#6c757d' }}>No services added yet</li>}
            </ul>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Case Studies ({caseStudies.length})</span>
              <button className="btn btn-primary btn-sm" onClick={() => openAdd('caseStudy')}>+ Add</button>
            </div>
            <ul className="item-list">
              {caseStudies.map((cs) => (
                <li key={cs.id}>
                  <div>
                    <strong>{cs.title}</strong>
                    <br /><span style={{ fontSize: 13, color: '#6c757d' }}>{cs.client_name} — {cs.results}</span>
                  </div>
                  <div className="item-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit('caseStudy', cs)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteItem('caseStudy', cs.id)}>Del</button>
                  </div>
                </li>
              ))}
              {caseStudies.length === 0 && <li style={{ color: '#6c757d' }}>No case studies added yet</li>}
            </ul>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Pricing Plans ({pricingPlans.length})</span>
              <button className="btn btn-primary btn-sm" onClick={() => openAdd('pricing')}>+ Add</button>
            </div>
            <ul className="item-list">
              {pricingPlans.map((p) => (
                <li key={p.id}>
                  <div>
                    <strong>{p.plan_name}</strong> — ${p.price}
                    <br /><span style={{ fontSize: 13, color: '#6c757d' }}>{(p.features || []).join(', ')}</span>
                  </div>
                  <div className="item-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit('pricing', p)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteItem('pricing', p.id)}>Del</button>
                  </div>
                </li>
              ))}
              {pricingPlans.length === 0 && <li style={{ color: '#6c757d' }}>No pricing plans added yet</li>}
            </ul>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Target Industries ({industries.length})</span>
              <button className="btn btn-primary btn-sm" onClick={() => openAdd('industry')}>+ Add</button>
            </div>
            <ul className="item-list">
              {industries.map((ind) => (
                <li key={ind.id}>
                  <div><strong>{ind.industry_name}</strong></div>
                  <div className="item-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit('industry', ind)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteItem('industry', ind.id)}>Del</button>
                  </div>
                </li>
              ))}
              {industries.length === 0 && <li style={{ color: '#6c757d' }}>No industries added yet</li>}
            </ul>
          </div>
        </>
      )}

      {showModal && (
        <Modal title={editItem ? 'Edit Item' : `Add ${showModal}`} onClose={() => setShowModal(null)}>
          {showModal === 'service' && (
            <>
              <div className="form-group">
                <label className="form-label">Service Name</label>
                <input className="form-input" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </>
          )}
          {showModal === 'caseStudy' && (
            <>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Client Name</label>
                <input className="form-input" value={formData.client_name || ''} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Challenge</label>
                <textarea className="form-textarea" value={formData.challenge || ''} onChange={(e) => setFormData({ ...formData, challenge: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Solution</label>
                <textarea className="form-textarea" value={formData.solution || ''} onChange={(e) => setFormData({ ...formData, solution: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Results</label>
                <textarea className="form-textarea" value={formData.results || ''} onChange={(e) => setFormData({ ...formData, results: e.target.value })} />
              </div>
            </>
          )}
          {showModal === 'pricing' && (
            <>
              <div className="form-group">
                <label className="form-label">Plan Name</label>
                <input className="form-input" value={formData.plan_name || ''} onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Price ($)</label>
                <input className="form-input" type="number" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Features (comma-separated)</label>
                <input className="form-input" value={(formData.features || []).join(', ')} onChange={(e) => setFormData({ ...formData, features: e.target.value.split(',').map((f) => f.trim()) })} />
              </div>
            </>
          )}
          {showModal === 'industry' && (
            <div className="form-group">
              <label className="form-label">Industry Name</label>
              <input className="form-input" value={formData.industry_name || ''} onChange={(e) => setFormData({ ...formData, industry_name: e.target.value })} />
            </div>
          )}
          <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveItem}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default CompanySetup;
