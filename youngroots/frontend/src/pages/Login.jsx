/**
 * YoungRoots — Login Page
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, startAnonymousSession, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error(result.error || 'Login failed.');
    }
  };

  const handleAnon = async () => {
    const result = await startAnonymousSession();
    if (result.success) {
      toast.success('Anonymous session started. Your privacy is protected.');
      navigate('/');
    }
  };

  const inp = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #e5e8e3',
    borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 14,
    outline: 'none', boxSizing: 'border-box', marginTop: 6,
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <div style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 20, padding: 36 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌱</div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, color: '#0F6E56', marginBottom: 4 }}>YoungRoots</h2>
          <p style={{ fontSize: 13, color: '#888' }}>Sign in or continue anonymously</p>
        </div>

        {/* Anonymous option — always show prominently */}
        <button onClick={handleAnon} style={{
          width: '100%', padding: '13px 20px', background: '#E1F5EE', border: '1.5px solid #9FE1CB',
          borderRadius: 12, fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600,
          color: '#0F6E56', cursor: 'pointer', marginBottom: 20,
        }}>
          🔒 Continue Anonymously — No Account Needed
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#e5e8e3' }} />
          <span style={{ fontSize: 12, color: '#888' }}>or sign in for full access</span>
          <div style={{ flex: 1, height: 1, background: '#e5e8e3' }} />
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a' }}>Email</label>
            <input style={inp} type="email" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="your@email.com" required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a' }}>Password</label>
            <input style={inp} type="password" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••••" required />
          </div>
          <button type="submit" disabled={isLoading} style={{
            width: '100%', padding: '13px 20px', background: isLoading ? '#9FE1CB' : '#1D9E75',
            color: '#fff', border: 'none', borderRadius: 12,
            fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 16 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#1D9E75', fontWeight: 600, textDecoration: 'none' }}>
            Register
          </Link>
        </p>

        <div style={{ background: '#FAEEDA', border: '1px solid #F0D090', borderRadius: 10, padding: '10px 14px', marginTop: 20 }}>
          <p style={{ fontSize: 11, color: '#BA7517', lineHeight: 1.5, margin: 0 }}>
            <strong>Privacy note:</strong> You can use all core features (services, AI guide, reporting) without creating an account. An account is only needed for admin and advocate roles.
          </p>
        </div>
      </div>
    </div>
  );
}
