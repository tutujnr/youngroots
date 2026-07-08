import React from 'react';
import { useNavigate } from 'react-router-dom';
export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🌿</div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, color: '#0F6E56', marginBottom: 10 }}>Page Not Found</h2>
      <p style={{ color: '#888', marginBottom: 24 }}>The page you're looking for doesn't exist or has moved.</p>
      <button onClick={() => navigate('/')} style={{ padding: '12px 24px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Go Home</button>
    </div>
  );
}
