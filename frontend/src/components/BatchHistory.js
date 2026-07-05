import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function BatchHistory() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  async function loadBatches() {
    try {
      const res = await api.get('/batches');
      setBatches(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function deleteBatch(id) {
    if (!window.confirm('Delete this batch and all its emails?')) return;
    try {
      await api.delete(`/batches/${id}`);
      loadBatches();
    } catch (err) {
      alert('Error deleting batch');
    }
  }

  function getStatusBadge(status) {
    return <span className={`badge badge-${status}`}>{status}</span>;
  }

  if (loading) return <div className="card"><p>Loading...</p></div>;

  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>Batch History</h1>

      <div className="card">
        {batches.length === 0 ? (
          <div className="empty-state">
            <h3>No batches yet</h3>
            <p>Generate your first batch of cold emails to see them here.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Created</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Generated</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <td>#{b.id}</td>
                  <td>{new Date(b.created_at).toLocaleDateString()}</td>
                  <td>{getStatusBadge(b.status)}</td>
                  <td>{b.total_requested}</td>
                  <td>{b.total_generated}</td>
                  <td>
                    <div className="progress-bar" style={{ height: 18 }}>
                      <div className="progress-fill" style={{ width: `${b.progress_pct}%` }}></div>
                      <span className="progress-text">{b.progress_pct}%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-primary" onClick={() => navigate(`/emails/${b.id}`)}>View</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteBatch(b.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default BatchHistory;
