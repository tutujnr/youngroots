import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/services', label: 'Services', icon: '🗺️' },
  { to: '/ai-guide', label: 'AI Guide', icon: '💬' },
  { to: '/report', label: 'Report', icon: '🔒' },
  { to: '/cases', label: 'My Cases', icon: '📋' },
];

const MORE_LINKS = [
  { to: '/notes', label: 'AYSRHR Notes', icon: '📝' },
  { to: '/about', label: 'About Us', icon: '💚' },
  { to: '/blog', label: 'Blog', icon: '📰' },
  { to: '/events', label: 'Upcoming Events', icon: '📅' },
  { to: '/contact', label: 'Contact Us', icon: '✉️' },
];

export default function Layout() {
  const { user, isAnonymous, logout, isAdmin, isAdvocate } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const extraLinks = [];
  if (isAdvocate?.()) extraLinks.push({ to: '/dashboard', label: 'Insights', icon: '📊' });
  extraLinks.push({ to: '/admin', label: 'Admin', icon: '⚙️' });

  const linkStyle = ({ isActive }) => ({
    padding: '6px 12px', borderRadius: 8, border: 'none',
    background: isActive ? '#1D9E75' : 'transparent',
    color: isActive ? '#fff' : '#4a4a4a',
    fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', textDecoration: 'none', transition: 'all .15s', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf7', fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e8e3', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60,
        position: 'sticky', top: 0, zIndex: 200 }}>

        <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: '#0F6E56' }}>
          🌱 YoungRoots
          <span style={{ background: '#1D9E75', color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 500 }}>AYSRHR</span>
        </div>

        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {NAV_LINKS.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'} style={linkStyle}>{icon} {label}</NavLink>
          ))}
          {extraLinks.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} style={linkStyle}>{icon} {label}</NavLink>
          ))}

          {/* More dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button onClick={() => setDropdownOpen(o => !o)} style={{
              padding: '6px 12px', borderRadius: 8, border: 'none', background: dropdownOpen ? '#E1F5EE' : 'transparent',
              color: '#4a4a4a', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>More ▾</button>
            {dropdownOpen && (
              <div style={{ position: 'absolute', top: 38, right: 0, background: '#fff', border: '1px solid #e5e8e3',
                borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 190, padding: 6, zIndex: 300 }}>
                {MORE_LINKS.map(({ to, label, icon }) => (
                  <div key={to} onClick={() => { navigate(to); setDropdownOpen(false); }} style={{
                    padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#4a4a4a',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .12s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#E1F5EE'; e.currentTarget.style.color = '#0F6E56'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a4a4a'; }}
                  >{icon} {label}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isAnonymous && (
            <span style={{ background: '#FAEEDA', color: '#BA7517', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🔒 Anonymous</span>
          )}
          {user && !isAnonymous ? (
            <button onClick={logout} style={{ padding: '6px 14px', background: 'transparent', border: '1.5px solid #e5e8e3',
              borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#4a4a4a' }}>Sign Out</button>
          ) : (
            <button onClick={() => navigate('/login')} style={{ padding: '6px 14px', background: '#1D9E75', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
          )}
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
        <Outlet />
      </main>

      <footer style={{ borderTop: '1px solid #e5e8e3', padding: '20px 24px', textAlign: 'center', fontSize: 12, color: '#888', marginTop: 40 }}>
        YoungRoots AYSRHR Platform · All conversations and reports are anonymous · Built with ❤️ for young people
      </footer>
    </div>
  );
}
