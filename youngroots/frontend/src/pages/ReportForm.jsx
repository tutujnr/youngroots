/**
 * YoungRoots — Anonymous Report Form
 */
import React, { useState } from 'react';
import { reportsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { value: 'access_denied',    label: 'Denied access to health services' },
  { value: 'gbv',              label: 'Gender-based violence (GBV)' },
  { value: 'discrimination',   label: 'Discrimination by healthcare provider' },
  { value: 'rights_violation', label: 'Rights violation / Forced procedure' },
  { value: 'confidentiality',  label: 'Confidentiality breach' },
  { value: 'other',            label: 'Other concern' },
];

const SUPPORT_OPTIONS = [
  { value: 'referral',         label: 'Referral to a support service' },
  { value: 'legal',            label: 'Legal information' },
  { value: 'medical',          label: 'Medical help' },
  { value: 'emotional',        label: 'Emotional support / counselling' },
  { value: 'report_only',      label: 'I just want to report — no follow-up needed' },
];

const URGENCIES = [
  { value: 'low',      label: 'Not urgent' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'urgent',   label: 'Urgent' },
  { value: 'crisis',   label: '🚨 Crisis / Immediate danger' },
];

export default function ReportForm() {
  const [form, setForm]         = useState({ report_type: '', description: '', location_area: '', urgency: 'low', support_needed: '' });
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.report_type)                  e.report_type   = 'Please select a concern type.';
    if (form.description.trim().length < 30) e.description  = 'Please describe in at least 30 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await reportsAPI.submit(form);
      setSubmitted(data);
      toast.success('Report submitted securely!');
    } catch (err) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, color: '#0F6E56', marginBottom: 12 }}>Report Submitted Safely</h2>
      <p style={{ color: '#4a4a4a', marginBottom: 20, lineHeight: 1.6 }}>Your report has been received and encrypted. No personal information was stored.</p>
      <div style={{ background: '#1D9E75', color: '#fff', padding: '10px 24px', borderRadius: 10, fontSize: 20, fontWeight: 700, fontFamily: 'monospace', display: 'inline-block', letterSpacing: 2, marginBottom: 16 }}>
        {submitted.case_id}
      </div>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Save this case ID to track your report. A support advocate has been notified.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <a href={`/cases/${submitted.case_id}`} style={{ padding: '12px 24px', background: '#1D9E75', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          Track My Case →
        </a>
        <button onClick={() => { setSubmitted(null); setForm({ report_type:'', description:'', location_area:'', urgency:'low', support_needed:'' }); }}
          style={{ padding: '12px 24px', background: 'transparent', color: '#1D9E75', border: '1.5px solid #1D9E75', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Submit Another
        </button>
      </div>
    </div>
  );

  const inp = { padding: '11px 14px', border: '1.5px solid #e5e8e3', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 6 }}>Anonymous Rights Reporting</h2>
      <p style={{ color: '#4a4a4a', marginBottom: 20, fontSize: 14 }}>Report safely. No personal information is required. All reports are encrypted.</p>

      {/* Privacy banner */}
      <div style={{ background: '#E1F5EE', border: '1px solid #5DCAA5', borderRadius: 12, padding: 16, display: 'flex', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 22 }}>🛡️</span>
        <div>
          <strong style={{ fontSize: 13, color: '#0F6E56' }}>Fully anonymous & confidential</strong>
          <p style={{ fontSize: 12, color: '#4a4a4a', marginTop: 2, lineHeight: 1.5 }}>
            Your report cannot be traced back to you. No IP addresses are logged. A random case ID lets you follow up anonymously.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 18 }}>
        {/* Type */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', display: 'block', marginBottom: 6 }}>
            Type of concern <span style={{ color: '#D85A30' }}>*</span>
          </label>
          <select value={form.report_type} onChange={e => update('report_type', e.target.value)} style={inp}>
            <option value="">Select type...</option>
            {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {errors.report_type && <p style={{ color: '#D85A30', fontSize: 12, marginTop: 4 }}>{errors.report_type}</p>}
        </div>

        {/* Location */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', display: 'block', marginBottom: 6 }}>
            General location (county/area — no specific addresses please)
          </label>
          <input style={inp} placeholder="e.g. Nairobi, Mombasa, Kisumu..." value={form.location_area} onChange={e => update('location_area', e.target.value)} />
        </div>

        {/* Description */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', display: 'block', marginBottom: 6 }}>
            Describe what happened <span style={{ color: '#D85A30' }}>*</span>
          </label>
          <textarea
            style={{ ...inp, resize: 'vertical', minHeight: 110, lineHeight: 1.55 }}
            placeholder="Describe in your own words. Do not include your name or identifying details..."
            value={form.description}
            onChange={e => update('description', e.target.value)}
          />
          {errors.description && <p style={{ color: '#D85A30', fontSize: 12, marginTop: 4 }}>{errors.description}</p>}
        </div>

        {/* Support needed */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', display: 'block', marginBottom: 6 }}>What kind of support do you need?</label>
          <select value={form.support_needed} onChange={e => update('support_needed', e.target.value)} style={inp}>
            <option value="">Select (optional)...</option>
            {SUPPORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Urgency */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', display: 'block', marginBottom: 8 }}>Urgency level</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {URGENCIES.map(u => (
              <button key={u.value} onClick={() => update('urgency', u.value)}
                style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid',
                  borderColor: form.urgency === u.value ? '#1D9E75' : '#e5e8e3',
                  background: form.urgency === u.value ? '#1D9E75' : '#fff',
                  color: form.urgency === u.value ? '#fff' : '#4a4a4a',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ padding: '13px 28px', background: loading ? '#9FE1CB' : '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', width: 'fit-content' }}>
          {loading ? 'Submitting securely...' : '🔒 Submit Anonymously'}
        </button>
      </div>
    </div>
  );
}
