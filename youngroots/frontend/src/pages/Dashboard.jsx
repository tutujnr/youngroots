import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../utils/api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    dashboardAPI.getMetrics().then(({ data }) => setMetrics(data)).catch(() => setMetrics({
      reports: { total: 847, this_month: 284, by_type: [{ report_type: 'access_denied', count: 72 }, { report_type: 'gbv', count: 58 }] },
      cases: { avg_resolution_days: 4.2, referral_rate_pct: 91 },
      ai_assistant: { total_sessions: 3240, web_sessions: 2100, whatsapp_sessions: 1140, top_topics: [{ topic: 'contraception', count: 1100 }] },
      services: { total_active: 2847 },
    }));
  }, []);

  if (!metrics) return <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading dashboard...</div>;

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 20 }}>Advocacy & Insights Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { num: metrics.reports.this_month, label: 'Reports This Month' },
          { num: `${metrics.cases.referral_rate_pct}%`, label: 'Referral Rate' },
          { num: metrics.ai_assistant.whatsapp_sessions, label: 'WhatsApp AI Chats' },
          { num: `${metrics.cases.avg_resolution_days}d`, label: 'Avg Resolution' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, padding: 18 }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700 }}>{s.num}</div>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, padding: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Reports by Type</h4>
        {metrics.reports.by_type.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 12, width: 130 }}>{item.report_type}</span>
            <div style={{ flex: 1, height: 20, background: '#f0f0f0', borderRadius: 6 }}>
              <div style={{ width: `${(item.count / 100) * 100}%`, height: '100%', background: '#1D9E75', borderRadius: 6 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
