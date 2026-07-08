import React, { useState, useEffect } from 'react';
import { notesAPI } from '../utils/api';

const FALLBACK = [
  { id: 1, category: 'Contraception', title: 'Contraception 101: Know Your Options', summary: 'A quick guide to condoms, the pill, implants, and IUDs — what they do and where to get them for free.' },
  { id: 2, category: 'Rights', title: 'Know Your Rights at the Clinic', summary: "You have the right to confidential, non-judgmental care regardless of your age. Here's what that means." },
  { id: 3, category: 'GBV', title: 'Recognising the Signs of GBV', summary: "Gender-based violence isn't always physical. Learn the signs of emotional, financial, and coercive control." },
  { id: 4, category: 'HIV / STIs', title: 'HIV Testing: What to Expect', summary: 'Testing is free, confidential, and takes 15–20 minutes. Here is exactly what happens, step by step.' },
  { id: 5, category: 'Consent', title: 'Understanding Consent', summary: 'Consent must be informed, freely given, and can be withdrawn at any time. A simple breakdown.' },
  { id: 6, category: 'Mental Health', title: 'Coping With Anxiety About Sexual Health', summary: "It's normal to feel nervous. Here are healthy ways to manage anxiety before a clinic visit." },
];

export default function Notes() {
  const [notes, setNotes] = useState(FALLBACK);

  useEffect(() => {
    notesAPI.list().then(({ data }) => {
      const results = data.results || data;
      if (results?.length) setNotes(results.map(n => ({ id: n.id, category: n.category_display || n.category, title: n.title, summary: n.summary })));
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 6 }}>AYSRHR Notes</h2>
      <p style={{ color: '#4a4a4a', fontSize: 14, marginBottom: 22 }}>Short, easy-to-read health notes written for young people.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {notes.map(note => (
          <div key={note.id} style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 14, padding: 18 }}>
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10.5, fontWeight: 600, background: '#E1F5EE', color: '#0F6E56', marginBottom: 8 }}>
              {note.category}
            </span>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#0F6E56' }}>{note.title}</h4>
            <p style={{ fontSize: 12.5, color: '#4a4a4a', lineHeight: 1.55 }}>{note.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
