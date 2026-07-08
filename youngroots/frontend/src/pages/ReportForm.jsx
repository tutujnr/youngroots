import React, { useState } from 'react';
import { reportsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const TYPES = ['Denied access to health services', 'Gender-based violence (GBV)', 'Discrimination by healthcare provider', 'Rights violation / Forced procedure', 'Other concern'];

export default function ReportForm() {
  const [form, setForm] = useState({ report_type: '', description: '', location_area: '', urgency: 'low' });
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.report_type || form.description.length < 30) { toast.error('Please complete all required fields (30+ char description).'); return; }
    setLoading(true);
    try {
      const { data } = await reportsAPI.submit(form);
      setSubmitted(data);
    } catch { toast.error('Submission failed.'); } finally { setLoading(false); }
  };

  const inp = { padding: '11px 14px', border: '1.5px solid #e5e8e3', borderRadius: 10, fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box' };

  if (submitted) return (
    <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, color: '#0F6E56' }}>Report Submitted Safely</h2>
      <div style={{ background: '#1D9E75', color: '#fff', padding: '10px 24px', borderRadius: 10, fontSize: 20, fontWeight: 700, fontFamily: 'monospace', display: 'inline-block', margin: '16px 0' }}>{submitted.case_id}</div>
      <p style={{ fontSize: 13, color: '#888' }}>Save this case ID to track your report.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 6 }}>Anonymous Rights Reporting</h2>
      <p style={{ color: '#4a4a4a', fontSize: 14, marginBottom: 20 }}>No personal information required. All reports are encrypted.</p>
      <div style={{ display: 'grid', gap: 18 }}>
        <div><label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', display: 'block', marginBottom: 6 }}>Type of concern *</label>
          <select style={inp} value={form.report_type} onChange={e => setForm(p => ({ ...p, report_type: e.target.value }))}>
            <option value="">Select...</option>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
        <div><label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', display: 'block', marginBottom: 6 }}>Location</label>
          <input style={inp} value={form.location_area} onChange={e => setForm(p => ({ ...p, location_area: e.target.value }))} placeholder="e.g. Nairobi" /></div>
        <div><label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', display: 'block', marginBottom: 6 }}>Describe what happened *</label>
          <textarea style={{ ...inp, minHeight: 100, resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="In your own words..." /></div>
        <button onClick={submit} disabled={loading} style={{ padding: '12px 28px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}>{loading ? 'Submitting...' : '🔒 Submit Anonymously'}</button>
      </div>
    </div>
  );
}
