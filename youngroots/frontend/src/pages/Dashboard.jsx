/**
 * YoungRoots — Advocacy Dashboard
 */
import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../utils/api';

const REPORT_TYPE_LABELS = {
  access_denied:    'Access Denied',
  gbv:              'GBV / Violence',
  discrimination:   'Discrimination',
  rights_violation: 'Rights Violation',
  confidentiality:  'Confidentiality',
  other:            'Other',
};

const BAR_COLORS = ['#1D9E75', '#D85A30', '#534AB7', '#BA7517', '#185FA5', '#993556'];

function StatCard({ num, label, change, changeUp }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, padding: 18 }}>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700 }}>{num}</div>
      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4, fontWeight: 500 }}>{label}</div>
      {change && <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6, color: changeUp ? '#1D9E75' : '#D85A30' }}>{change}</div>}
    </div>
  );
}

function BarChart({ data, title }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, padding: 20 }}>
      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#4a4a4a', width: 130, flexShrink: 0 }}>
              {REPORT_TYPE_LABELS[item.report_type] || item.report_type || item.label}
            </span>
            <div style={{ flex: 1, height: 22, background: '#f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${(item.count / max) * 100}%`, height: '100%',
                background: BAR_COLORS[i % BAR_COLORS.length], borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, transition: 'width .5s',
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{item.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, padding: 20 }}>
      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Monthly Report Trend</h4>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90, padding: '0 4px' }}>
        {data.map((item, i) => (
          <div key={i} title={`${item.month}: ${item.count}`} style={{
            flex: 1, height: `${Math.max((item.count / max) * 100, 6)}%`,
            background: i === data.length - 1 ? '#0F6E56' : '#5DCAA5',
            borderRadius: '4px 4px 0 0', cursor: 'pointer', transition: 'background .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1D9E75'}
            onMouseLeave={e => e.currentTarget.style.background = i === data.length - 1 ? '#0F6E56' : '#5DCAA5'}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginTop: 4 }}>
        <span>{data[0]?.month}</span>
        <span>{data[Math.floor(data.length / 2)]?.month}</span>
        <span>{data[data.length - 1]?.month}</span>
      </div>
    </div>
  );
}

function TopicsList({ topics }) {
  const total = topics.reduce((s, t) => s + t.count, 0) || 1;
  const COLORS = ['#1D9E75', '#185FA5', '#D85A30', '#534AB7', '#BA7517', '#993556', '#0F6E56', '#888'];
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, padding: 20 }}>
      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Top AI Questions</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {topics.slice(0, 6).map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#4a4a4a', flex: 1, textTransform: 'capitalize' }}>{t.topic?.replace('_', ' ')}</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{Math.round((t.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getMetrics()
      .then(({ data }) => setMetrics(data))
      .catch(() => {
        // Demo data if API unavailable
        setMetrics({
          reports: {
            total: 847, this_month: 284, month_change: 12,
            by_type: [
              { report_type: 'access_denied', count: 72 },
              { report_type: 'gbv', count: 58 },
              { report_type: 'discrimination', count: 43 },
              { report_type: 'rights_violation', count: 31 },
              { report_type: 'confidentiality', count: 19 },
            ],
            monthly_trend: Array.from({ length: 12 }, (_, i) => ({
              month: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'][i],
              count: [48, 62, 75, 68, 88, 97, 105, 82, 112, 130, 142, 148][i],
            })),
          },
          cases: { avg_resolution_days: 4.2, referral_rate_pct: 91, flagged_gap_areas: 18 },
          ai_assistant: {
            total_sessions: 3240,
            top_topics: [
              { topic: 'contraception', count: 1100 },
              { topic: 'hiv_sti', count: 874 },
              { topic: 'gbv', count: 583 },
              { topic: 'rights', count: 421 },
              { topic: 'mental_health', count: 259 },
            ],
          },
          services: { total_active: 2847, by_type: [] },
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading dashboard...</div>;
  if (!metrics) return null;

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 6 }}>Advocacy & Insights Dashboard</h2>
      <p style={{ color: '#4a4a4a', fontSize: 14, marginBottom: 24 }}>Anonymised data to support evidence-based advocacy, policy, and service planning.</p>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard num={metrics.reports.this_month} label="Reports This Month"  change={`↑ ${metrics.reports.month_change}% vs last month`} changeUp={true} />
        <StatCard num={`${metrics.cases.referral_rate_pct}%`} label="Cases With Referral" change="↑ 5% improvement" changeUp={true} />
        <StatCard num={metrics.cases.flagged_gap_areas} label="Service Gaps Flagged" change="↑ 3 new this week" changeUp={false} />
        <StatCard num={`${metrics.cases.avg_resolution_days}d`} label="Avg Resolution Time" change="↓ 0.8d faster" changeUp={true} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
        <BarChart data={metrics.reports.by_type} title="Reports by Type (This Quarter)" />
        <TopicsList topics={metrics.ai_assistant.top_topics} />
      </div>

      {/* Trend chart */}
      <TrendChart data={metrics.reports.monthly_trend} />

      {/* Summary stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 16 }}>
        <StatCard num={metrics.reports.total}           label="Total Reports (All Time)" />
        <StatCard num={metrics.ai_assistant.total_sessions} label="AI Chat Sessions"   />
        <StatCard num={metrics.services.total_active}   label="Active Services Listed" />
      </div>

      <p style={{ fontSize: 11, color: '#aaa', marginTop: 20, textAlign: 'center' }}>
        All data is fully anonymised and aggregated. No individual reports or identities are shown.
        Last updated: {new Date(metrics.generated_at || Date.now()).toLocaleString()}
      </p>
    </div>
  );
}
