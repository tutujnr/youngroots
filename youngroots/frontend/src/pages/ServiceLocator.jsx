/**
 * YoungRoots — Service Locator Page
 */
import React, { useState, useEffect, useCallback } from 'react';
import { servicesAPI } from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: '',          label: 'All Services', icon: '🏠' },
  { value: 'clinic',    label: 'Clinics',       icon: '🏥' },
  { value: 'hiv',       label: 'HIV Testing',   icon: '🧪' },
  { value: 'gbv',       label: 'GBV Support',   icon: '🛡️' },
  { value: 'counselling',label: 'Counselling',   icon: '💜' },
  { value: 'mental',    label: 'Mental Health',  icon: '🧠' },
  { value: 'family',    label: 'Family Planning',icon: '👨‍👩‍👧' },
  { value: 'legal',     label: 'Legal Aid',      icon: '⚖️' },
];

const TAG_STYLES = {
  clinic:    { bg: '#E1F5EE', color: '#0F6E56' },
  hiv:       { bg: '#E6F1FB', color: '#185FA5' },
  gbv:       { bg: '#FAECE7', color: '#D85A30' },
  counselling:{ bg: '#EEEDFE', color: '#534AB7' },
  mental:    { bg: '#EEEDFE', color: '#534AB7' },
  family:    { bg: '#FAEEDA', color: '#BA7517' },
  legal:     { bg: '#FBEAF0', color: '#993556' },
};

function ServiceCard({ service, onSelect }) {
  const tag = TAG_STYLES[service.category] || { bg: '#f0f0f0', color: '#555' };
  return (
    <div onClick={() => onSelect(service)} style={{
      background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14,
      padding: 18, cursor: 'pointer', transition: 'all .15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#1D9E75'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,158,117,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e8e3'; e.currentTarget.style.boxShadow = ''; }}
    >
      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8, background: tag.bg, color: tag.color }}>
        {CATEGORIES.find(c => c.value === service.category)?.icon} {service.category?.replace('_', ' ')}
      </span>
      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{service.name}</h4>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
        📍 {service.region}{service.distance_km ? ` · ${service.distance_km.toFixed(1)} km away` : ''}
      </div>
      {service.is_free && (
        <span style={{ fontSize: 11, fontWeight: 600, color: '#1D9E75', background: '#E1F5EE', padding: '2px 8px', borderRadius: 6, marginRight: 6 }}>Free</span>
      )}
      <p style={{ fontSize: 12, color: '#4a4a4a', marginTop: 8, lineHeight: 1.5 }}>{service.short_desc}</p>
    </div>
  );
}

function ServiceModal({ service, onClose }) {
  if (!service) return null;
  const tag = TAG_STYLES[service.category] || { bg: '#f0f0f0', color: '#555' };
  const days = ['mon','tue','wed','thu','fri','sat','sun'];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 540, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', background: tag.bg, color: tag.color }}>
            {service.category}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
        </div>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, marginBottom: 8 }}>{service.name}</h2>
        <p style={{ fontSize: 13, color: '#4a4a4a', lineHeight: 1.6, marginBottom: 20 }}>{service.description}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {service.phone && <div><span style={{ fontSize: 11, color: '#888', display: 'block' }}>PHONE</span><strong style={{ fontSize: 13 }}>📞 {service.phone}</strong></div>}
          {service.hotline && <div><span style={{ fontSize: 11, color: '#888', display: 'block' }}>HOTLINE</span><strong style={{ fontSize: 13, color: '#D85A30' }}>🆘 {service.hotline}</strong></div>}
          <div><span style={{ fontSize: 11, color: '#888', display: 'block' }}>AGES SERVED</span><strong style={{ fontSize: 13 }}>{service.serves_ages}</strong></div>
          <div><span style={{ fontSize: 11, color: '#888', display: 'block' }}>COST</span><strong style={{ fontSize: 13, color: service.is_free ? '#1D9E75' : '#BA7517' }}>{service.is_free ? 'Free' : 'Fees apply'}</strong></div>
        </div>

        {service.services_offered?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>SERVICES OFFERED</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {service.services_offered.map(s => (
                <span key={s} style={{ padding: '4px 10px', background: '#f8faf7', border: '1px solid #e5e8e3', borderRadius: 8, fontSize: 12 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {Object.keys(service.operating_hours || {}).length > 0 && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>HOURS</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
              {days.filter(d => service.operating_hours[d]).map(day => (
                <div key={day} style={{ fontSize: 12, padding: '4px 8px', background: '#f8faf7', borderRadius: 6 }}>
                  <strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong> {service.operating_hours[day]}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServiceLocator() {
  const [services, setServices]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('');
  const [selected, setSelected]   = useState(null);
  const [freeOnly, setFreeOnly]   = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (category)  params.category = category;
      if (freeOnly)  params.is_free  = true;
      if (search)    params.search   = search;
      const { data } = await servicesAPI.list(params);
      setServices(data.results || data);
    } catch {
      // Show sample data if API unavailable
      setServices([
        { id: '1', name: 'Kenyatta National Youth Clinic', category: 'clinic', region: 'Nairobi Central', short_desc: 'Full SRHR clinic — free for under-24', is_free: true, serves_ages: '10-24', phone: '+254 20 272 6300', description: 'Comprehensive SRHR services including contraception, STI testing and counselling.', services_offered: ['Contraception', 'STI Testing', 'HIV Testing'], operating_hours: { mon: '8am-6pm', sat: '9am-1pm' } },
        { id: '2', name: 'CHS Free HIV Testing Centre', category: 'hiv', region: 'Westlands, Nairobi', short_desc: 'Free HIV testing — same-day results', is_free: true, serves_ages: '15-35', hotline: '0800 723 100', description: 'Confidential free HIV testing and linkage to care.', services_offered: ['HIV Testing', 'ART Linkage'], operating_hours: { mon: '9am-5pm', sun: '10am-2pm' } },
        { id: '3', name: 'Gender Violence Recovery Centre', category: 'gbv', region: 'Karen, Nairobi', short_desc: 'GBV support — legal, medical & counselling', is_free: true, serves_ages: '10-35', hotline: '1195', description: '24/7 support for GBV survivors with legal aid and medical care.', services_offered: ['GBV Support', 'Legal Aid', 'Medical Care'], operating_hours: { mon: '24hrs' } },
        { id: '4', name: 'Befrienders Kenya', category: 'mental', region: 'Kilimani, Nairobi', short_desc: 'Anonymous mental health & crisis support', is_free: true, serves_ages: '10-30', hotline: '+254 722 178 177', description: 'Anonymous mental health support and crisis counselling 24/7.', services_offered: ['Crisis Counselling', 'Mental Health'], operating_hours: { mon: '24hrs' } },
        { id: '5', name: 'Marie Stopes Youth Hub', category: 'family', region: 'Kibera, Nairobi', short_desc: 'Family planning & reproductive health', is_free: false, serves_ages: '15-35', phone: '+254 20 387 5445', description: 'Family planning, contraception, and safe abortion services.', services_offered: ['Contraception', 'Family Planning', 'Safe Abortion'], operating_hours: { mon: '7am-7pm', sat: '8am-4pm' } },
      ]);
    } finally {
      setLoading(false);
    }
  }, [category, freeOnly, search]);

  useEffect(() => {
    const timer = setTimeout(fetchServices, 400);
    return () => clearTimeout(timer);
  }, [fetchServices]);

  const filtered = services.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.region?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <ServiceModal service={selected} onClose={() => setSelected(null)} />

      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 6 }}>Find Youth-Friendly Services</h2>
      <p style={{ color: '#4a4a4a', fontSize: 14, marginBottom: 20 }}>All services are verified youth-friendly. Your search is private and not logged.</p>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search by name or area..."
          style={{ flex: 1, minWidth: 220, padding: '11px 14px', border: '1.5px solid #e5e8e3', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 14, outline: 'none' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} />
          Free only
        </label>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCategory(cat.value)} style={{
            padding: '8px 14px', borderRadius: 10,
            border: `1.5px solid ${category === cat.value ? '#1D9E75' : '#e5e8e3'}`,
            background: category === cat.value ? '#1D9E75' : '#fff',
            color: category === cat.value ? '#fff' : '#4a4a4a',
            fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Map placeholder */}
      <div style={{ background: 'linear-gradient(135deg, #e8f5ee, #d4f0e3)', border: '1px solid #9FE1CB', borderRadius: 14, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', fontSize: 22 }}>📍</div>
        <div style={{ color: '#0F6E56', fontSize: 13, fontWeight: 500, marginTop: 32 }}>
          Interactive Map · Integrate Leaflet with react-leaflet for live GPS
        </div>
        {['28%,30%', '55%,45%', '70%,20%', '40%,60%'].map((pos, i) => (
          <span key={i} style={{ position: 'absolute', left: pos.split(',')[0], top: pos.split(',')[1], fontSize: 18 }}>📍</span>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading services...</div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>{filtered.length} services found</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {filtered.map(s => <ServiceCard key={s.id} service={s} onSelect={setSelected} />)}
          </div>
        </>
      )}
    </div>
  );
}
