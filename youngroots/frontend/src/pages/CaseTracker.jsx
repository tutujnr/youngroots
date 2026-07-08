import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { referralsAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function CaseTracker() {
  const { caseId } = useParams();
  const [input, setInput] = useState(caseId || '');
  const [caseData, setCaseData] = useState(null);

  const lookup = async () => {
    try { const { data } = await referralsAPI.getCaseDetail(input.trim().toUpperCase()); setCaseData(data); }
    catch { toast.error('Case not found.'); }
  };
  useEffect(() => { if (caseId) lookup(); }, [caseId]);

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 6 }}>Case Tracking</h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Enter case ID e.g. YR-2026-4821" style={{ flex: 1, maxWidth: 300, padding: '11px 14px', border: '1.5px solid #e5e8e3', borderRadius: 10, fontSize: 14, outline: 'none' }} />
        <button onClick={lookup} style={{ padding: '11px 20px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Track Case</button>
      </div>
      {caseData && (
        <div style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>{caseData.report_type}</h3>
          <div style={{ fontSize: 12, color: '#888', margin: '6px 0 16px' }}>{caseData.days_open} days open · {caseData.progress_pct}% complete</div>
          <div style={{ width: '100%', height: 6, background: '#e5e8e3', borderRadius: 6, marginBottom: 16 }}><div style={{ width: `${caseData.progress_pct}%`, height: '100%', background: '#1D9E75', borderRadius: 6 }} /></div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {caseData.steps?.map(step => (
              <span key={step.id} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, background: step.status === 'done' ? '#E1F5EE' : step.status === 'current' ? '#1D9E75' : '#f8faf7', color: step.status === 'done' ? '#0F6E56' : step.status === 'current' ? '#fff' : '#888' }}>{step.title}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
