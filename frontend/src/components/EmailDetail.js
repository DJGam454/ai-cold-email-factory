import React, { useState } from 'react';
import { emailsApi } from '../utils/api';
import Modal from './Modal';

function EmailDetail({ email, onClose }) {
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  if (!email) return null;

  async function handleSend() {
    setSending(true);
    setSendResult(null);
    try {
      await emailsApi.sendEmail(email.id);
      setSendResult({ type: 'success', message: 'Sent! Check your inbox.' });
    } catch (err) {
      setSendResult({ type: 'error', message: err.response?.data?.error || 'Failed to send' });
    }
    setSending(false);
  }

  return (
    <Modal title="Email Preview" onClose={onClose}>
      <div style={{ marginBottom: 12 }}>
        <span className="badge badge-active" style={{ marginRight: 8 }}>{email.cta_type}</span>
        <span className="badge badge-pending">{email.opening_hook ? email.opening_hook.substring(0, 50) + '...' : ''}</span>
      </div>
      <div className="form-group">
        <label className="form-label">To</label>
        <div className="form-input" style={{ background: '#f8f9fa' }}>{email.recipient_name} — {email.recipient_title} at {email.recipient_company}</div>
      </div>
      <div className="form-group">
        <label className="form-label">Subject</label>
        <div className="form-input" style={{ background: '#f8f9fa', fontWeight: 600 }}>{email.subject_line}</div>
      </div>
      <div className="form-group">
        <label className="form-label">Opening Hook</label>
        <div className="form-input" style={{ background: '#f8f9fa' }}>{email.opening_hook}</div>
      </div>
      <div className="form-group">
        <label className="form-label">Email Body</label>
        <div className="form-input email-preview" style={{ background: '#f8f9fa', minHeight: 200 }}>{email.email_body}</div>
      </div>
      <div className="form-group">
        <label className="form-label">CTA</label>
        <div className="form-input" style={{ background: '#f8f9fa' }}>{email.cta_text}</div>
      </div>

      <div style={{ borderTop: '1px solid #e9ecef', paddingTop: 16, marginTop: 16 }}>
        <button className="btn btn-success" onClick={handleSend} disabled={sending || sendResult?.type === 'success'} style={{ width: '100%' }}>
          {sending ? 'Sending...' : sendResult?.type === 'success' ? 'Sent!' : 'Send Test Email'}
        </button>
        {sendResult && (
          <p style={{ marginTop: 8, fontSize: 13, color: sendResult.type === 'success' ? '#155724' : '#dc3545', textAlign: 'center' }}>
            {sendResult.message}
          </p>
        )}
      </div>
    </Modal>
  );
}

export default EmailDetail;
