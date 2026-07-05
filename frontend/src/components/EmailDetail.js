import React from 'react';
import Modal from './Modal';

function EmailDetail({ email, onClose }) {
  if (!email) return null;

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
    </Modal>
  );
}

export default EmailDetail;
