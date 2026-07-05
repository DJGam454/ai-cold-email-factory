import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { emailsApi } from '../utils/api';
import EmailDetail from './EmailDetail';

function EmailResults() {
  const { batchId } = useParams();
  const [emails, setEmails] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ cta: '', hook: '', search: '' });
  const [selectedEmail, setSelectedEmail] = useState(null);

  const limit = 50;

  useEffect(() => {
    loadEmails();
  }, [batchId, page, filters]);

  async function loadEmails() {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filters.cta) params.cta = filters.cta;
      if (filters.hook) params.hook = filters.hook;
      if (filters.search) params.search = filters.search;

      const res = await emailsApi.getByBatch(batchId, params);
      setEmails(res.data.emails);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function handleFilterChange(key, value) {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  }

  async function deleteEmail(id) {
    if (!window.confirm('Delete this email?')) return;
    try {
      await emailsApi.delete(id);
      loadEmails();
    } catch (err) {
      alert('Error deleting email');
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24 }}>Batch #{batchId} — {total} Emails</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/batches" className="btn btn-secondary btn-sm">Back to Batches</Link>
          <a href={emailsApi.getCsvUrl(batchId)} className="btn btn-success btn-sm" download>Download CSV</a>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <input className="form-input" placeholder="Search..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} style={{ minWidth: 250 }} />
          <select className="form-select" value={filters.cta} onChange={(e) => handleFilterChange('cta', e.target.value)}>
            <option value="">All CTAs</option>
            <option value="call">Call</option>
            <option value="demo">Demo</option>
            <option value="consultation">Consultation</option>
            <option value="resource">Resource</option>
            <option value="reply">Reply</option>
          </select>
          <select className="form-select" value={filters.hook} onChange={(e) => handleFilterChange('hook', e.target.value)}>
            <option value="">All Hooks</option>
            <option value="statistic">Statistic</option>
            <option value="pain">Pain Point</option>
            <option value="compliment">Compliment</option>
            <option value="question">Question</option>
            <option value="story">Story</option>
          </select>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : emails.length === 0 ? (
          <div className="empty-state">
            <h3>No emails found</h3>
            <p>Try changing your filters or generate a new batch.</p>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Company</th>
                  <th>Subject</th>
                  <th>CTA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((e) => (
                  <tr key={e.id}>
                    <td>{e.recipient_name}<br /><span style={{ fontSize: 12, color: '#6c757d' }}>{e.recipient_title}</span></td>
                    <td>{e.recipient_company}</td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.subject_line}</td>
                    <td><span className="badge badge-active">{e.cta_type}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => setSelectedEmail(e)}>View</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteEmail(e.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button className="btn btn-sm btn-outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedEmail && (
        <EmailDetail email={selectedEmail} onClose={() => setSelectedEmail(null)} />
      )}
    </div>
  );
}

export default EmailResults;
