import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../utils/api';
import toast from 'react-hot-toast';

const QUICK_QUESTIONS = [
  { label: 'Contraception options', q: 'What contraception options are available for young women?' },
  { label: 'STI symptoms', q: 'How do I know if I have an STI?' },
  { label: 'My rights', q: 'What are my rights to access health services?' },
];

const WA_NUMBER = 'coming soon'; // matches settings.WHATSAPP_BOT_NUMBER

export default function AIAssistant() {
  const [tab, setTab] = useState('web');
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! I'm Yara, your private sexual and reproductive health guide. 💚\n\nYou can ask me anything about contraception, STIs, relationships, rights, or finding services. Everything stays anonymous. What's on your mind?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsLoading(true);
    try {
      const { data } = await aiAPI.chat({ message: msg, session_token: sessionToken });
      setSessionToken(data.session_token);
      setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch {
      toast.error('Connection issue. Please try again.');
      setMessages(prev => [...prev, { role: 'ai', content: "I'm having trouble connecting. For urgent help, contact a local health service directly. 💚" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent("Hi Yara, I'd like to ask about sexual health.");
    window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, '_blank');
  };

  const tabBtn = (id, label, active) => (
    <button onClick={() => setTab(id)} style={{
      padding: '9px 18px', borderRadius: 10, border: '1.5px solid', borderColor: active ? (id === 'wa' ? '#25D366' : '#1D9E75') : '#e5e8e3',
      background: active ? (id === 'wa' ? '#25D366' : '#1D9E75') : '#fff', color: active ? '#fff' : '#4a4a4a',
      fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
    }}>{label}</button>
  );

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, marginBottom: 6 }}>AI Sexual Health Guide</h2>
      <p style={{ color: '#4a4a4a', fontSize: 14, marginBottom: 16 }}>Chat with Yara on the web, or continue the same conversation on WhatsApp.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabBtn('web', '💬 Web Chat', tab === 'web')}
        {tabBtn('wa', '🟢 WhatsApp', tab === 'wa')}
      </div>

      {tab === 'web' ? (
        <>
          <div style={{ background: '#E1F5EE', border: '1px solid #5DCAA5', borderRadius: 12, padding: 16, display: 'flex', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <div><strong style={{ fontSize: 13, color: '#0F6E56' }}>Your privacy is protected</strong>
              <p style={{ fontSize: 12, color: '#4a4a4a', marginTop: 2 }}>No personal data is collected. Messages are deleted after 24 hours.</p></div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e8e3', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 480 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e8e3', display: 'flex', alignItems: 'center', gap: 10, background: '#E1F5EE' }}>
              <div style={{ width: 36, height: 36, background: '#1D9E75', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>Y</div>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: '#0F6E56' }}>Yara — AYSRHR AI Guide</div><div style={{ fontSize: 11, color: '#1D9E75' }}>Powered by Claude · Anonymous</div></div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((m, i) => (
                <div key={i} style={{
                  maxWidth: '80%', padding: '10px 14px', fontSize: 13, lineHeight: 1.55,
                  borderRadius: m.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                  background: m.role === 'user' ? '#1D9E75' : '#E1F5EE', color: m.role === 'user' ? '#fff' : '#1a1a1a',
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', whiteSpace: 'pre-wrap',
                }}>{m.content}</div>
              ))}
              {isLoading && <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic' }}>Yara is thinking...</div>}
              <div ref={endRef} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 16px', borderTop: '1px solid #e5e8e3' }}>
              {QUICK_QUESTIONS.map(q => <button key={q.label} onClick={() => sendMessage(q.q)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #9FE1CB', background: '#fff', fontSize: 12, color: '#0F6E56', cursor: 'pointer' }}>{q.label}</button>)}
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid #e5e8e3' }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type your question anonymously..." style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e5e8e3', borderRadius: 10, fontSize: 13, outline: 'none' }} />
              <button onClick={() => sendMessage()} style={{ padding: '10px 18px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Send →</button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ background: '#E8F8EF', border: '1px solid #25D366', borderRadius: 12, padding: 16, display: 'flex', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>🟢</span>
            <div><strong style={{ fontSize: 13, color: '#075E54' }}>Yara is also available on WhatsApp</strong>
              <p style={{ fontSize: 12, color: '#4a4a4a', marginTop: 2 }}>Message Yara directly from your phone — same AI engine, same privacy protections.</p></div>
          </div>
          <div style={{ background: '#E5DDD5', border: '1px solid #e5e8e3', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: '#075E54', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: '#25D366', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🟢</div>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Yara on WhatsApp</div><div style={{ fontSize: 11, color: '#cde' }}>+{WA_NUMBER} · Online</div></div>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 240 }}>
              <div style={{ maxWidth: '80%', background: '#fff', borderRadius: '4px 12px 12px 12px', padding: '10px 14px', fontSize: 13, boxShadow: '0 1px 1px rgba(0,0,0,.1)' }}>Hi 👋 I'm Yara from YoungRoots. Ask me anything about sexual health, relationships, or your rights — totally confidential.</div>
              <div style={{ maxWidth: '80%', alignSelf: 'flex-end', background: '#DCF8C6', borderRadius: '12px 4px 12px 12px', padding: '10px 14px', fontSize: 13, boxShadow: '0 1px 1px rgba(0,0,0,.1)' }}>Is the morning after pill safe?</div>
              <div style={{ maxWidth: '80%', background: '#fff', borderRadius: '4px 12px 12px 12px', padding: '10px 14px', fontSize: 13, boxShadow: '0 1px 1px rgba(0,0,0,.1)' }}>Yes — emergency contraception is safe and WHO-approved. It works best within 72 hours. Want me to find a free pharmacy near you?</div>
            </div>
            <div style={{ background: '#fff', padding: 18 }}>
              <button onClick={openWhatsApp} style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>🟢 Continue on WhatsApp</button>
              <span style={{ fontSize: 12, color: '#888', marginLeft: 12 }}>or save: <b style={{ color: '#4a4a4a' }}>+{WA_NUMBER}</b></span>
              <p style={{ fontSize: 11.5, color: '#888', marginTop: 14, lineHeight: 1.6 }}>
                Powered by the WhatsApp Business API (Twilio / Meta Cloud API) + Claude. Conversations are end-to-end encrypted by WhatsApp and auto-deleted from YoungRoots servers after 24 hours, same as web chat.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
