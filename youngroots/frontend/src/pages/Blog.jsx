import React, { useState, useEffect } from 'react';
import { blogAPI } from '../utils/api';

const FALLBACK = [
  { id: 3, emoji: '🌍', bg: '#FAECE7', date: '02-05 June 2026', title: '9th Pan-African AYSRHR Scientific Conference', excerpt: 'Strengthening SRHR to Achieve Youth Agency, Full Potential and Meaningful Participation in Africa’s Dynamic Socio-Political and Economic Landscape.' },
  { id: 1, emoji: '📰', bg: '#E1F5EE', date: '12 May 2026', title: 'Why Anonymous Reporting Changes Everything', excerpt: 'How removing identity from the reporting process increased disclosures by 3x in our pilot regions.' },
  { id: 2, emoji: '🤖', bg: '#E6F1FB', date: '02 May 2026', title: 'Meet Yara: Building an AI That Listens', excerpt: 'The design choices behind our AI health guide — and why empathy was the hardest feature to build.' },
];

export default function Blog() {
  const [posts, setPosts] = useState(FALLBACK);

  useEffect(() => {
    blogAPI.list().then(({ data }) => {
      const results = data.results || data;
      if (results?.length) setPosts(results.map(p => ({
        id: p.id, emoji: p.cover_emoji || '📰', bg: '#E1F5EE',
        date: new Date(p.published_at).toLocaleDateString(), title: p.title, excerpt: p.excerpt,
      })));
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 6 }}>Blog</h2>
      <p style={{ color: '#4a4a4a', fontSize: 14, marginBottom: 22 }}>Stories, updates, and insights from the YoungRoots community.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {posts.map(post => (
          <div key={post.id} style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ height: 90, background: post.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{post.emoji}</div>
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 10.5, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{post.date}</div>
              <h4 style={{ fontSize: 13.5, fontWeight: 600, margin: '6px 0' }}>{post.title}</h4>
              <p style={{ fontSize: 11.5, color: '#4a4a4a', lineHeight: 1.5 }}>{post.excerpt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
