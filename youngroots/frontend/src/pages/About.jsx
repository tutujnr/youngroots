import React from 'react';

const VALUES = [
  { ic: '🔒', title: 'Privacy First', desc: 'No identity required for any core feature' },
  { ic: '🌍', title: 'Inclusive', desc: 'Built for every language, every region' },
  { ic: '💚', title: 'Youth-Led', desc: 'Co-designed with the young people we serve' },
  { ic: '📊', title: 'Evidence-Based', desc: 'Data drives every advocacy decision we make' },
];

export default function About() {
  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 6 }}>About YoungRoots</h2>
      <p style={{ color: '#4a4a4a', fontSize: 14, marginBottom: 22 }}>Why we exist, and who we serve.</p>

      <div style={{ background: '#E1F5EE', borderRadius: 16, padding: 28, marginBottom: 22 }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: '#0F6E56', marginBottom: 8 }}>Our Mission</h3>
        <p style={{ fontSize: 13.5, color: '#4a4a4a', lineHeight: 1.65, maxWidth: 760 }}>
          To ensure every young person — regardless of location, gender, or background — can safely access SRHR
          information, find verified health services, report rights violations anonymously, and receive dignified
          support through a rights-based, technology-enabled platform.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {VALUES.map(v => (
          <div key={v.title} style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{v.ic}</div>
            <h5 style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>{v.title}</h5>
            <p style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{v.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, padding: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Our Story</h4>
        <p style={{ fontSize: 13, color: '#4a4a4a', lineHeight: 1.6 }}>
          YoungRoots was founded after years of frontline work showing that the biggest barrier to youth SRHR
          wasn't a lack of services — it was fear. Fear of judgement, fear of being seen, fear of nowhere safe
          to ask. We built a platform that removes that fear entirely, putting privacy and dignity first.
        </p>
      </div>
    </div>
  );
}
