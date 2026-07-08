import React, { useState, useEffect } from 'react';
import useAuthStore from '../context/authStore';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

const ROLE_STYLES = {
  youth: { bg: '#E1F5EE', color: '#0F6E56' },
  advocate: { bg: '#EEEDFE', color: '#534AB7' },
  admin: { bg: '#FAECE7', color: '#D85A30' },
  super_admin: { bg: '#FCEBEB', color: '#A32D2D' },
};

function RoleBadge({ role }) {
  const s = ROLE_STYLES[role] || { bg: '#f0f0f0', color: '#555' };
  return <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{role?.replace('_', ' ')}</span>;
}

// ── Login screen ────────────────────────────────────────────────────────────
function AdminLogin({ onSuccess }) {
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    const result = await login(email, password);
    if (result.success) {
      if (!['advocate', 'admin', 'super_admin'].includes(result.user.role)) {
        setError('This account does not have admin or advocate access.');
        return;
      }
      toast.success(`Welcome, ${result.user.display_name || result.user.role}!`);
      onSuccess();
    } else {
      setError(result.error || 'Invalid email or password.');
    }
  };

  const inp = { padding: '11px 14px', border: '1.5px solid #e5e8e3', borderRadius: 10, fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', background: '#fff', border: '1px solid #e5e8e3', borderRadius: 18, padding: 36 }}>
      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, textAlign: 'center', color: '#0F6E56', marginBottom: 4 }}>🔐 Admin & Advocate Login</h3>
      <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 22 }}>Sign in to manage YoungRoots services, reports, and team accounts.</p>
      {error && <div style={{ background: '#FAECE7', color: '#D85A30', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 14, fontWeight: 500 }}>{error}</div>}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a' }}>Email</label>
        <input style={inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@youngroots.demo" />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a' }}>Password</label>
        <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••••" />
      </div>
      <button onClick={handleLogin} disabled={isLoading} style={{ width: '100%', padding: '12px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
      <div style={{ background: '#f8faf7', border: '1px solid #e5e8e3', borderRadius: 10, padding: '12px 14px', marginTop: 18, fontSize: 11, color: '#888', lineHeight: 1.6 }}>
        <b style={{ color: '#4a4a4a' }}>Demo Super Admin:</b> admin@youngroots.demo / AdminPass2024!<br />
        <b style={{ color: '#4a4a4a' }}>Demo Advocate:</b> advocate@youngroots.demo / AdvocatePass2024!
      </div>
    </div>
  );
}

// ── Add User Modal ────────────────────────────────────────────────────────────
function AddUserModal({ onClose, onAdded, currentRole }) {
  const [form, setForm] = useState({ display_name: '', email: '', role: 'advocate' });
  const [loading, setLoading] = useState(false);

  const availableRoles = currentRole === 'super_admin'
    ? [{ v: 'advocate', l: 'Advocate' }, { v: 'admin', l: 'Admin' }, { v: 'super_admin', l: 'Super Admin' }]
    : [{ v: 'advocate', l: 'Advocate' }];

  const submit = async () => {
    if (!form.display_name || !form.email) { toast.error('Please fill in name and email.'); return; }
    setLoading(true);
    try {
      const { data } = await adminAPI.users.create({
        ...form, password: 'TempPass2026!', password2: 'TempPass2026!', preferred_language: 'en',
      });
      toast.success(data.message || 'User added successfully!');
      onAdded(data.user);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.role?.[0] || err.response?.data?.email?.[0] || 'Could not add user.');
    } finally {
      setLoading(false);
    }
  };

  const inp = { padding: '10px 14px', border: '1.5px solid #e5e8e3', borderRadius: 10, fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 26, width: 360 }} onClick={e => e.stopPropagation()}>
        <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, marginBottom: 16, color: '#0F6E56' }}>Add Admin / Advocate</h4>
        <div style={{ marginBottom: 12 }}><label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a' }}>Full name</label>
          <input style={inp} value={form.display_name} onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))} placeholder="e.g. Grace Achieng" /></div>
        <div style={{ marginBottom: 12 }}><label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a' }}>Email</label>
          <input style={inp} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="name@youngroots.demo" /></div>
        <div style={{ marginBottom: 18 }}><label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a' }}>Role</label>
          <select style={inp} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
            {availableRoles.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
          </select></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={submit} disabled={loading} style={{ padding: '10px 20px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{loading ? 'Adding...' : 'Add User'}</button>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', color: '#1D9E75', border: '1.5px solid #1D9E75', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Users tab ──────────────────────────────────────────────────────────────
function UsersTab({ currentRole }) {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    adminAPI.users.list().then(({ data }) => setUsers(data.results || data)).catch(() => {
      setUsers([
        { id: '1', display_name: 'System Admin', email: 'admin@youngroots.demo', role: 'super_admin', date_joined: '2026-05-04' },
        { id: '2', display_name: 'Demo Advocate', email: 'advocate@youngroots.demo', role: 'advocate', date_joined: '2026-05-03' },
      ]);
    }).finally(() => setLoading(false));
  };
  useEffect(fetchUsers, []);

  return (
    <div>
      {showModal && <AddUserModal currentRole={currentRole} onClose={() => setShowModal(false)} onAdded={() => fetchUsers()} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 20 }}>User Management</h3>
        {currentRole !== 'advocate' && (
          <button onClick={() => setShowModal(true)} style={{ padding: '9px 16px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Admin / Advocate</button>
        )}
      </div>
      {loading ? <p style={{ color: '#888', fontSize: 13 }}>Loading users...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, overflow: 'hidden' }}>
          <thead><tr>
            {['Email', 'Display Name', 'Role', 'Joined'].map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#888', background: '#f8faf7', borderBottom: '1px solid #e5e8e3' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #e5e8e3' }}>{u.email || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #e5e8e3' }}>{u.display_name}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #e5e8e3' }}><RoleBadge role={u.role} /></td>
                <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #e5e8e3' }}>{new Date(u.date_joined).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user, logout } = useAuthStore();
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState('users');

  useEffect(() => {
    if (user && ['advocate', 'admin', 'super_admin'].includes(user.role)) setLoggedIn(true);
  }, [user]);

  if (!loggedIn) return <AdminLogin onSuccess={() => setLoggedIn(true)} />;

  const isAdvocate = user.role === 'advocate';
  const TABS = [
    { id: 'users', label: 'Users', icon: '👤', hide: isAdvocate },
    { id: 'services', label: 'Services', icon: '🏥' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️', hide: isAdvocate },
  ].filter(t => !t.hide);

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 4 }}>Administration Panel</h2>
      <div style={{ background: '#E1F5EE', border: '1px solid #5DCAA5', borderRadius: 10, padding: '10px 16px', margin: '14px 0 20px', fontSize: 13, color: '#0F6E56', display: 'flex', justifyContent: 'space-between' }}>
        <span>Signed in as <b>{user.display_name || user.role}</b> ({user.role?.replace('_', ' ')})</span>
        <button onClick={() => { logout(); setLoggedIn(false); }} style={{ padding: '4px 10px', border: '1px solid #5DCAA5', background: 'transparent', borderRadius: 6, fontSize: 11, cursor: 'pointer', color: '#0F6E56' }}>Log out</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, padding: 12, alignSelf: 'start' }}>
          {TABS.map(t => (
            <div key={t.id} onClick={() => setTab(t.id)} style={{ padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8, background: tab === t.id ? '#1D9E75' : 'transparent', color: tab === t.id ? '#fff' : '#4a4a4a' }}>
              <span>{t.icon}</span> {t.label}
            </div>
          ))}
        </div>
        <div>
          {tab === 'users' && <UsersTab currentRole={user.role} />}
          {tab === 'services' && <p style={{ fontSize: 13, color: '#888' }}>Service management — connect to /api/v1/services/ admin endpoints.</p>}
          {tab === 'reports' && <p style={{ fontSize: 13, color: '#888' }}>Reports list — connect to /api/v1/reports/admin/.</p>}
          {tab === 'settings' && <p style={{ fontSize: 13, color: '#888' }}>System settings panel.</p>}
        </div>
      </div>
    </div>
  );
}
