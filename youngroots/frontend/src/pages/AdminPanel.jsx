/**
 * YoungRoots — Admin Panel
 */
import React, { useState, useEffect } from 'react';
import { adminAPI, reportsAPI, servicesAPI } from '../utils/api';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'users',    icon: '👤', label: 'Users'     },
  { id: 'services', icon: '🏥', label: 'Services'  },
  { id: 'reports',  icon: '📋', label: 'Reports'   },
  { id: 'roles',    icon: '🔐', label: 'Roles'     },
  { id: 'settings', icon: '⚙️', label: 'Settings'  },
];

const ROLE_STYLES = {
  youth:       { bg: '#E1F5EE', color: '#0F6E56' },
  advocate:    { bg: '#EEEDFE', color: '#534AB7' },
  admin:       { bg: '#FAECE7', color: '#D85A30' },
  super_admin: { bg: '#FCEBEB', color: '#A32D2D' },
};

const STATUS_STYLES = {
  new:      { bg: '#FAEEDA', color: '#BA7517' },
  active:   { bg: '#E6F1FB', color: '#185FA5' },
  resolved: { bg: '#E1F5EE', color: '#0F6E56' },
  assigned: { bg: '#E6F1FB', color: '#185FA5' },
  pending:  { bg: '#FAEEDA', color: '#BA7517' },
};

function Table({ cols, rows, onAction }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, overflow: 'hidden' }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888', background: '#f8faf7', borderBottom: '1px solid #e5e8e3' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background = '#fafdf9')}
              onMouseLeave={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background = '')}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #e5e8e3' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleBadge({ role }) {
  const s = ROLE_STYLES[role] || { bg: '#f0f0f0', color: '#555' };
  return <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{role?.replace('_', ' ')}</span>;
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#f0f0f0', color: '#555' };
  return <span style={{ padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{status}</span>;
}

function ActionBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: '4px 10px', border: '1px solid #e5e8e3', background: '#fff', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 11, cursor: 'pointer', color: '#4a4a4a', transition: 'all .1s' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#E1F5EE'; e.currentTarget.style.color = '#0F6E56'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#4a4a4a'; }}>
      {label}
    </button>
  );
}

// ── Tab panels ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const DEMO_USERS = [
    { id: '#U-0001', name: 'System Admin',     role: 'super_admin', last: '4 May 2026' },
    { id: '#U-0038', name: 'A. Mwangi',        role: 'advocate',    last: '3 May 2026' },
    { id: '#U-0041', name: 'Anonymous User',   role: 'youth',       last: '2 May 2026' },
    { id: '#U-0035', name: 'Anonymous User',   role: 'youth',       last: '1 May 2026' },
    { id: '#U-0029', name: 'Dr. Wanjiru K.',   role: 'advocate',    last: '30 Apr 2026' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <input placeholder="Search users..." style={{ padding: '9px 14px', border: '1.5px solid #e5e8e3', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 13, outline: 'none', width: 240 }} />
        <button onClick={() => toast('Add user modal')} style={{ padding: '9px 16px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add User</button>
      </div>
      <Table
        cols={['User ID', 'Display Name', 'Role', 'Last Active', 'Actions']}
        rows={DEMO_USERS.map(u => [
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#888' }}>{u.id}</span>,
          u.name, <RoleBadge role={u.role} />, u.last,
          <ActionBtn label="View" onClick={() => toast(`Viewing ${u.name}`)} />,
        ])}
      />
    </div>
  );
}

function ServicesTab() {
  const DEMO = [
    { name: 'Kenyatta National Youth Clinic', type: 'clinic',    loc: 'Nairobi Central', status: 'active' },
    { name: 'CHS Free HIV Testing Centre',    type: 'hiv',       loc: 'Westlands',       status: 'active' },
    { name: 'Gender Violence Recovery Centre',type: 'gbv',       loc: 'Karen',           status: 'pending' },
    { name: 'Befrienders Kenya',              type: 'mental',    loc: 'Kilimani',        status: 'active' },
    { name: 'Marie Stopes Youth Hub',         type: 'family',    loc: 'Kibera',          status: 'active' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <input placeholder="Search services..." style={{ padding: '9px 14px', border: '1.5px solid #e5e8e3', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 13, outline: 'none', width: 240 }} />
        <button onClick={() => toast('Add service modal')} style={{ padding: '9px 16px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Service</button>
      </div>
      <Table
        cols={['Service Name', 'Type', 'Location', 'Status', 'Actions']}
        rows={DEMO.map(s => [
          s.name, s.type.toUpperCase(), s.loc, <StatusBadge status={s.status} />,
          <div style={{ display: 'flex', gap: 4 }}>
            <ActionBtn label="Edit"   onClick={() => toast('Editing service')} />
            <ActionBtn label="Verify" onClick={() => toast('Service verified!')} />
          </div>,
        ])}
      />
    </div>
  );
}

function ReportsTab() {
  const DEMO = [
    { id: 'YR-2026-5503', type: 'Access Denial', loc: 'Nairobi',  urgency: 'moderate', status: 'new'      },
    { id: 'YR-2026-4821', type: 'GBV',           loc: 'Kisumu',   urgency: 'urgent',   status: 'active'   },
    { id: 'YR-2026-3159', type: 'Discrimination', loc: 'Mombasa',  urgency: 'low',      status: 'resolved' },
    { id: 'YR-2026-2944', type: 'Rights Violation',loc:'Nakuru',  urgency: 'moderate', status: 'assigned' },
  ];
  const urgencyColor = { low: '#1D9E75', moderate: '#BA7517', urgent: '#D85A30', crisis: '#A32D2D' };
  return (
    <Table
      cols={['Case ID', 'Type', 'Location', 'Urgency', 'Status', 'Actions']}
      rows={DEMO.map(r => [
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>#{r.id}</span>,
        r.type, r.loc,
        <span style={{ fontSize: 12, fontWeight: 600, color: urgencyColor[r.urgency] }}>{r.urgency.toUpperCase()}</span>,
        <StatusBadge status={r.status} />,
        <div style={{ display: 'flex', gap: 4 }}>
          <ActionBtn label="View"   onClick={() => toast('Viewing case')} />
          <ActionBtn label="Assign" onClick={() => toast('Advocate assigned')} />
        </div>,
      ])}
    />
  );
}

function RolesTab() {
  const ROLES = [
    { role: 'youth',       view: 'Own only', manage: '✗', editServices: '✗', dashboard: 'Public summary' },
    { role: 'advocate',    view: 'Assigned', manage: '✗', editServices: 'Suggest', dashboard: 'Limited' },
    { role: 'admin',       view: 'All',      manage: '✓', editServices: '✓', dashboard: 'Full access' },
    { role: 'super_admin', view: 'All',      manage: '✓ + roles', editServices: '✓', dashboard: 'Full + settings' },
  ];
  return (
    <Table
      cols={['Role', 'View Reports', 'Manage Users', 'Edit Services', 'Dashboard']}
      rows={ROLES.map(r => [<RoleBadge role={r.role} />, r.view, r.manage, r.editServices, r.dashboard])}
    />
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState({ language: 'en', retention: 90, prefix: 'YR', aiEnabled: true, ipLogging: false });
  const inp = { padding: '10px 14px', border: '1.5px solid #e5e8e3', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' };
  return (
    <div style={{ maxWidth: 480, display: 'grid', gap: 16 }}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', display: 'block', marginBottom: 6 }}>Default language</label>
        <select style={inp} value={settings.language} onChange={e => setSettings(p => ({ ...p, language: e.target.value }))}>
          <option value="en">English</option><option value="sw">Swahili</option>
          <option value="fr">French</option><option value="pt">Portuguese</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', display: 'block', marginBottom: 6 }}>Data retention (days)</label>
        <input style={inp} type="number" min="30" max="365" value={settings.retention} onChange={e => setSettings(p => ({ ...p, retention: e.target.value }))} />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', display: 'block', marginBottom: 6 }}>Anonymous case ID prefix</label>
        <input style={inp} value={settings.prefix} onChange={e => setSettings(p => ({ ...p, prefix: e.target.value }))} />
      </div>
      {[
        { key: 'aiEnabled', label: 'AI assistant enabled' },
        { key: 'ipLogging', label: 'IP logging disabled (privacy mode)' },
      ].map(({ key, label }) => (
        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          <input type="checkbox" style={{ width: 16, height: 16 }} checked={settings[key]} onChange={e => setSettings(p => ({ ...p, [key]: e.target.checked }))} />
          {label}
        </label>
      ))}
      <button onClick={() => toast.success('Settings saved!')} style={{ padding: '12px 24px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}>
        Save Settings
      </button>
    </div>
  );
}

// ── Main Admin Panel ───────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const { user } = useAuthStore();

  const PANELS = { users: <UsersTab />, services: <ServicesTab />, reports: <ReportsTab />, roles: <RolesTab />, settings: <SettingsTab /> };

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 4 }}>Administration Panel</h2>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        Signed in as: <strong style={{ color: '#D85A30' }}>{user?.role?.replace('_', ' ').toUpperCase()}</strong> · {user?.display_name || user?.email}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 20 }}>
        {/* Sidebar */}
        <div style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, padding: 12, alignSelf: 'start', position: 'sticky', top: 80 }}>
          {TABS.map(tab => (
            <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s',
              background: activeTab === tab.id ? '#1D9E75' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#4a4a4a',
            }}
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.background = '#E1F5EE'; }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 14 }}>{tab.icon}</span> {tab.label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, marginBottom: 16, textTransform: 'capitalize' }}>
            {TABS.find(t => t.id === activeTab)?.label}
          </h3>
          {PANELS[activeTab]}
        </div>
      </div>
    </div>
  );
}
