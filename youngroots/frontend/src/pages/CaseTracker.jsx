/**
 * YoungRoots — Case Tracker Page
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { referralsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  new:      { bg: '#FAEEDA', color: '#BA7517' },
  assigned: { bg: '#E6F1FB', color: '#185FA5' },
  active:   { bg: '#E6F1FB', color: '#185FA5' },
  referred: { bg: '#EEEDFE', color: '#534AB7' },
  resolved: { bg: '#E1F5EE', color: '#0F6E56' },
  closed:   { bg: '#F1EFE8', color: '#5F5E5A' },
};

export default function CaseTracker() {
  const { caseId } = useParams();
  const navigate   = useNavigate();
  const [input, setInput]     = useState(caseId || '');
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (caseId) lookupCase(caseId);
  }, [caseId]);

  const lookupCase = async (id) => {
    const lookupId = (id || input).trim().toUpperCase();
    if (!lookupId) return;
    setLoading(true);
    try {
      const { data } = await referralsAPI.getCaseDetail(lookupId);
      setCaseData(data);
      if (!caseId) navigate(`/cases/${lookupId}`, { replace: true });
    } catch {
      toast.error('Case not found. Please check your case ID.');
      setCaseData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 6 }}>Case Tracking</h2>
      <p style={{ color: '#4a4a4a', fontSize: 14, marginBottom: 20 }}>Track your anonymous case using your case ID.</p>

      {/* Lookup input */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && lookupCase()}
          placeholder="Enter your case ID e.g. YR-2026-4821"
          style={{ flex: 1, maxWidth: 300, padding: '11px 14px', border: '1.5px solid #e5e8e3', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 14, outline: 'none' }}
        />
        <button onClick={() => lookupCase()} disabled={loading}
          style={{ padding: '11px 20px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {loading ? 'Looking up...' : 'Track Case'}
        </button>
      </div>

      {caseData && (
        <div style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 16, padding: 24 }}>
          {/* Case header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#888', marginBottom: 4 }}>#{caseData.case_id}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>{caseData.report_type}</h3>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                Submitted {new Date(caseData.submitted_at).toLocaleDateString()} · {caseData.days_open} days open
              </div>
            </div>
            <span style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: STATUS_COLORS[caseData.status]?.bg || '#F1EFE8',
              color: STATUS_COLORS[caseData.status]?.color || '#888',
            }}>
              {caseData.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
              <span>Progress</span>
              <span>{caseData.progress_pct}% complete</span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#e5e8e3', borderRadius: 6 }}>
              <div style={{ width: `${caseData.progress_pct}%`, height: '100%', background: '#1D9E75', borderRadius: 6, transition: 'width .4s' }} />
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {caseData.steps?.map(step => (
              <span key={step.id} style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: step.status === 'done' ? '#E1F5EE' : step.status === 'current' ? '#1D9E75' : '#f8faf7',
                color:      step.status === 'done' ? '#0F6E56' : step.status === 'current' ? '#fff' : '#888',
                border:     '1px solid',
                borderColor: step.status === 'done' ? '#9FE1CB' : step.status === 'current' ? '#1D9E75' : '#e5e8e3',
              }}>
                {step.status === 'done' ? '✓ ' : step.status === 'current' ? '→ ' : ''}{step.title}
              </span>
            ))}
          </div>

          {/* Referrals */}
          {caseData.referrals?.length > 0 && (
            <div style={{ borderTop: '1px solid #e5e8e3', paddingTop: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', marginBottom: 10 }}>Referrals</h4>
              {caseData.referrals.map(ref => (
                <div key={ref.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8faf7', borderRadius: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>🏥 {ref.service_name || 'Service'}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#185FA5' }}>{ref.status.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
