import React, { useState, useEffect, useCallback } from 'react';
import { servicesAPI } from '../utils/api';

const CATEGORIES = [
  { value: '', label: 'All', icon: '🏠' }, { value: 'clinic', label: 'Clinics', icon: '🏥' },
  { value: 'hiv', label: 'HIV Testing', icon: '🧪' }, { value: 'gbv', label: 'GBV Support', icon: '🛡️' },
  { value: 'counselling', label: 'Counselling', icon: '💜' },
];

const FALLBACK = [
  { id: '1', name: 'Kenyatta National Youth Clinic', category: 'clinic', region: 'Nairobi Central', short_desc: 'Full SRHR clinic — free for under-24', is_free: true },
  { id: '2', name: 'CHS Free HIV Testing Centre', category: 'hiv', region: 'Westlands', short_desc: 'Free HIV testing — same-day results', is_free: true },
  { id: '3', name: 'Gender Violence Recovery Centre', category: 'gbv', region: 'Karen', short_desc: 'GBV support — legal, medical & counselling', is_free: true },
  { id: '4', name: 'Befrienders Kenya', category: 'mental', region: 'Kilimani', short_desc: 'Anonymous mental health & crisis support', is_free: true },
];

export default function ServiceLocator() {
  const [services, setServices] = useState(FALLBACK);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const fetchServices = useCallback(() => {
    servicesAPI.list({ category: category || undefined, search: search || undefined })
      .then(({ data }) => setServices(data.results?.length ? data.results : FALLBACK))
      .catch(() => setServices(FALLBACK));
  }, [category, search]);

  useEffect(() => { const t = setTimeout(fetchServices, 350); return () => clearTimeout(t); }, [fetchServices]);

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 6 }}>Find Youth-Friendly Services</h2>
      <p style={{ color: '#4a4a4a', fontSize: 14, marginBottom: 20 }}>All services are verified youth-friendly. Your search is private.</p>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name or area..." style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e8e3', borderRadius: 10, fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)} style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${category === c.value ? '#1D9E75' : '#e5e8e3'}`, background: category === c.value ? '#1D9E75' : '#fff', color: category === c.value ? '#fff' : '#4a4a4a', fontSize: 12, cursor: 'pointer' }}>{c.icon} {c.label}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {services.map(s => (
          <div key={s.id} style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, padding: 18 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.name}</h4>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>📍 {s.region}</div>
            {s.is_free && <span style={{ fontSize: 11, fontWeight: 600, color: '#1D9E75', background: '#E1F5EE', padding: '2px 8px', borderRadius: 6 }}>Free</span>}
            <p style={{ fontSize: 12, color: '#4a4a4a', marginTop: 8 }}>{s.short_desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
