/**
 * YoungRoots — Layout Component
 */
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

const NAV_LINKS = [
  { to: '/',           label: 'Home',       icon: '🏠' },
  { to: '/services',   label: 'Services',   icon: '🗺️' },
  { to: '/ai-guide',   label: 'AI Guide',   icon: '💬' },
  { to: '/report',     label: 'Report',     icon: '🔒' },
  { to: '/cases',      label: 'My Cases',   icon: '📋' },
];

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'sw', label: 'SW', name: 'Swahili' },
  { code: 'fr', label: 'FR', name: 'French'  },
  { code: 'pt', label: 'PT', name: 'Português'},
];

export default function Layout() {
  const { user, isAnonymous, logout, isAdmin, isAdvocate } = useAuthStore();
  const [lang, setLang] = useState('en');
  const navigate = useNavigate();

  const extraLinks = [];
  if (isAdvocate?.()) extraLinks.push({ to: '/dashboard', label: 'Insights', icon: '📊' });
  if (isAdmin?.())    extraLinks.push({ to: '/admin',     label: 'Admin',    icon: '⚙️' });

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf7', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Navbar */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e5e8e3',
        padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 60,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                   fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: '#0F6E56' }}
        >
          🌱 YoungRoots
          <span style={{ background: '#1D9E75', color: '#fff', borderRadius: 8,
                         padding: '2px 8px', fontSize: 12, fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
            AYSRHR
          </span>
        </div>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: 2 }}>
          {[...NAV_LINKS, ...extraLinks].map(({ to, label, icon }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: isActive ? '#1D9E75' : 'transparent',
                color: isActive ? '#fff' : '#4a4a4a',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', textDecoration: 'none', transition: 'all .15s',
              })}
            >
              {icon} {label}
            </NavLink>
          ))}
        </div>

        {/* Right: Lang + Auth */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isAnonymous && (
            <span style={{ background: '#FAEEDA', color: '#BA7517', padding: '4px 10px',
                           borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              🔒 Anonymous
            </span>
          )}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{ padding: '6px 10px', border: '1.5px solid #e5e8e3', borderRadius: 8,
                     fontFamily: 'DM Sans, sans-serif', fontSize: 13, background: '#fff', cursor: 'pointer' }}
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label} — {l.name}</option>)}
          </select>
          {user && !isAnonymous ? (
            <button
              onClick={logout}
              style={{ padding: '6px 14px', background: 'transparent', border: '1.5px solid #e5e8e3',
                       borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 13,
                       cursor: 'pointer', color: '#4a4a4a' }}
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{ padding: '6px 14px', background: '#1D9E75', color: '#fff', border: 'none',
                       borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 13,
                       fontWeight: 600, cursor: 'pointer' }}
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Page content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px' }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e5e8e3', padding: '20px 24px',
                       textAlign: 'center', fontSize: 12, color: '#888', marginTop: 40 }}>
        YoungRoots AYSRHR Platform · All conversations and reports are anonymous · Built with ❤️ for young people
      </footer>
    </div>
  );
}
