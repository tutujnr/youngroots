import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../utils/api';

const MODULES = [
  { path: '/services', icon: '🗺️', title: 'Service Locator', color: '#1D9E75', bg: '#E1F5EE', desc: 'Find nearby SRHR clinics, HIV testing, GBV support and counselling with maps.' },
  { path: '/ai-guide', icon: '🤖', title: 'AI Health Guide', color: '#534AB7', bg: '#EEEDFE', desc: 'Chat with Yara on the web or WhatsApp for anonymous health guidance.' },
  { path: '/report', icon: '🔒', title: 'Anonymous Reporting', color: '#D85A30', bg: '#FAECE7', desc: 'Report rights violations or GBV concerns safely — no identity required.' },
  { path: '/cases', icon: '📋', title: 'Case Tracking', color: '#185FA5', bg: '#E6F1FB', desc: 'Track your anonymous case, get next steps, and connect with support.' },
  { path: '/dashboard', icon: '📊', title: 'Advocacy Dashboard', color: '#BA7517', bg: '#FAEEDA', desc: 'Anonymised trend data and service gaps to power data-driven advocacy.' },
  { path: '/admin', icon: '⚙️', title: 'Admin Panel', color: '#993556', bg: '#FBEAF0', desc: 'Manage users, services, reports and referrals with role-based access.' },
];

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ services_listed: '—', cases_resolved: '—', reports_total: '—' });

  useEffect(() => { dashboardAPI.getSummary().then(({ data }) => setStats(data)).catch(() => {}); }, []);

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #0F6E56 0%, #1D9E75 60%, #5DCAA5 100%)', borderRadius: 20, padding: '48px 40px', color: '#fff', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 38, fontWeight: 700, lineHeight: 1.2, marginBottom: 14 }}>
          Your health.<br /><em style={{ fontStyle: 'italic', opacity: 0.85 }}>Your rights. Your choice.</em>
        </h1>
        <p style={{ fontSize: 16, opacity: 0.88, maxWidth: 520, lineHeight: 1.65, marginBottom: 28 }}>
          A safe, private space for young people to access sexual and reproductive health services, ask questions, and get support — anonymously.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[{ label: '🗺️ Find Services', path: '/services', primary: true }, { label: '💬 Ask AI Guide', path: '/ai-guide' }, { label: '🔒 Report Anonymously', path: '/report' }].map(btn => (
            <button key={btn.path} onClick={() => navigate(btn.path)} style={{ padding: '12px 22px', borderRadius: 10, border: btn.primary ? 'none' : '1.5px solid rgba(255,255,255,0.45)', background: btn.primary ? '#fff' : 'rgba(255,255,255,0.15)', color: btn.primary ? '#0F6E56' : '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{btn.label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[{ num: stats.services_listed, label: 'Services Listed' }, { num: '18,420+', label: 'Youth Served' }, { num: stats.cases_resolved, label: 'Cases Resolved' }, { num: '6', label: 'Languages' }].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, padding: '18px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 700, color: '#1D9E75' }}>{s.num}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {MODULES.map(m => (
          <div key={m.path} onClick={() => navigate(m.path)} style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 16, padding: 24, cursor: 'pointer', borderTop: `3px solid ${m.color}` }}>
            <div style={{ width: 44, height: 44, background: m.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>{m.icon}</div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{m.title}</h3>
            <p style={{ fontSize: 13, color: '#4a4a4a', lineHeight: 1.55 }}>{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
