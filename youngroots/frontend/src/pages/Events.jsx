import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../utils/api';

const FALLBACK = [
  { id: 1, d: '14', m: 'Jun', title: 'Youth SRHR Advocacy Training', desc: 'A full-day training for peer educators and youth advocates.', loc: 'Nairobi Community Hall · 9am–4pm' },
  { id: 2, d: '22', m: 'Jun', title: 'World Refugee Day: SRHR Access Panel', desc: 'A panel discussion on SRHR access for displaced youth populations.', loc: 'Online via Zoom · 2pm EAT' },
  { id: 3, d: '05', m: 'Jul', title: 'Yara AI Demo Day for Partner NGOs', desc: 'Live demonstration of the AI assistant and dashboard for prospective partners.', loc: 'Westlands Office, Nairobi · 11am' },
];

export default function Events() {
  const [events, setEvents] = useState(FALLBACK);

  useEffect(() => {
    eventsAPI.list().then(({ data }) => {
      const results = data.results || data;
      if (results?.length) setEvents(results.map(e => {
        const dt = new Date(e.event_date);
        return {
          id: e.id, d: String(dt.getDate()).padStart(2, '0'),
          m: dt.toLocaleString('en', { month: 'short' }),
          title: e.title, desc: e.description, loc: e.location,
        };
      }));
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 6 }}>Upcoming Events</h2>
      <p style={{ color: '#4a4a4a', fontSize: 14, marginBottom: 22 }}>Join workshops, trainings, and community sessions near you.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {events.map(ev => (
          <div key={ev.id} style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ background: '#0F6E56', color: '#fff', borderRadius: 10, width: 64, height: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Fraunces, serif' }}>{ev.d}</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{ev.m}</div>
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{ev.title}</h4>
              <p style={{ fontSize: 12, color: '#4a4a4a' }}>{ev.desc}</p>
              <div style={{ fontSize: 11.5, color: '#0F6E56', fontWeight: 500, marginTop: 3 }}>📍 {ev.loc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
