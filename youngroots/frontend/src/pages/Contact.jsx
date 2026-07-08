import React, { useState } from 'react';
import { contactAPI } from '../utils/api';
import toast from 'react-hot-toast';

const CONTACTS = [
  { ic: '✉️', title: 'Email', value: 'hello@youngroots.org' },
  { ic: '📞', title: 'Helpline', value: '0800 YOUNGROOTS (toll-free)' },
  { ic: '🟢', title: 'WhatsApp', value: '+254 700 000 927' },
  { ic: '📍', title: 'Office', value: 'Westlands, Nairobi, Kenya' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.message.trim()) { toast.error('Please write a message.'); return; }
    setLoading(true);
    try {
      await contactAPI.submit(form);
      toast.success('Message sent! We will respond within 24 hours.');
      setForm({ name: '', email: '', message: '' });
    } catch {
      toast.error('Could not send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = { padding: '11px 14px', border: '1.5px solid #e5e8e3', borderRadius: 10, fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box' };

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 6 }}>Contact Us</h2>
      <p style={{ color: '#4a4a4a', fontSize: 14, marginBottom: 22 }}>Reach out to the YoungRoots team — we usually respond within 24 hours.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          {CONTACTS.map(c => (
            <div key={c.title} style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, padding: 18, display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 20, width: 38, height: 38, background: '#E1F5EE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.ic}</div>
              <div><h5 style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{c.title}</h5><p style={{ fontSize: 12, color: '#4a4a4a' }}>{c.value}</p></div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div><label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', display: 'block', marginBottom: 6 }}>Your name</label>
            <input style={inp} placeholder="Optional" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', display: 'block', marginBottom: 6 }}>Email</label>
            <input style={inp} placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div><label style={{ fontSize: 13, fontWeight: 600, color: '#4a4a4a', display: 'block', marginBottom: 6 }}>Message</label>
            <textarea style={{ ...inp, minHeight: 100, resize: 'vertical' }} placeholder="How can we help?" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} /></div>
          <button onClick={submit} disabled={loading} style={{ padding: '12px 28px', background: loading ? '#9FE1CB' : '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', width: 'fit-content' }}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
}
