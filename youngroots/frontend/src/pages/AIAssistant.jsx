/**
 * YoungRoots — AI Assistant Page
 * Full anonymous chat with Yara (Claude-powered SRHR guide).
 */
import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../utils/api';
import toast from 'react-hot-toast';

const QUICK_QUESTIONS = [
  { label: 'Contraception options',   q: 'What contraception options are available for young women?' },
  { label: 'STI symptoms',            q: 'How do I know if I have an STI?' },
  { label: 'My rights',               q: 'What are my rights to access health services as a young person?' },
  { label: 'Safe relationships',      q: 'How can I protect myself in a relationship?' },
  { label: 'HIV testing',             q: 'How does HIV testing work and where can I get tested?' },
  { label: 'Emergency contraception', q: 'What is emergency contraception and how does it work?' },
];

const styles = {
  container: { background: '#fff', border: '1px solid #e5e8e3', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 520 },
  header: { padding: '14px 20px', borderBottom: '1px solid #e5e8e3', display: 'flex', alignItems: 'center', gap: 10, background: '#E1F5EE' },
  avatar: { width: 38, height: 38, background: '#1D9E75', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 },
  messages: { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  msgAI:   { maxWidth: '80%', padding: '10px 14px', borderRadius: '4px 12px 12px 12px', background: '#E1F5EE', color: '#1a1a1a', fontSize: 13, lineHeight: 1.55, alignSelf: 'flex-start' },
  msgUser: { maxWidth: '80%', padding: '10px 14px', borderRadius: '12px 4px 12px 12px', background: '#1D9E75', color: '#fff', fontSize: 13, lineHeight: 1.55, alignSelf: 'flex-end' },
  msgLoad: { maxWidth: '80%', padding: '10px 14px', borderRadius: '4px 12px 12px 12px', background: '#E1F5EE', color: '#888', fontSize: 13, fontStyle: 'italic', alignSelf: 'flex-start' },
  quickRow: { display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 16px', borderTop: '1px solid #e5e8e3' },
  quickBtn: { padding: '5px 12px', borderRadius: 8, border: '1px solid #9FE1CB', background: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#0F6E56', cursor: 'pointer', fontWeight: 500 },
  inputRow: { display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid #e5e8e3' },
  input: { flex: 1, padding: '10px 14px', border: '1.5px solid #e5e8e3', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 13, outline: 'none' },
  sendBtn: { padding: '10px 18px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};

export default function AIAssistant() {
  const [messages, setMessages]         = useState([
    { role: 'ai', content: "Hi! I'm Yara, your private sexual and reproductive health guide. 💚\n\nYou can ask me anything about contraception, STIs, relationships, rights, or finding services. Everything stays anonymous. What's on your mind?" }
  ]);
  const [input, setInput]               = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const messagesEndRef                  = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    } catch (err) {
      toast.error('Connection issue. Please try again.');
      setMessages(prev => [...prev, {
        role: 'ai',
        content: "I'm having trouble connecting right now. If you need urgent help, please contact a local health service directly. 💚"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Privacy notice */}
      <div style={{ background: '#E1F5EE', border: '1px solid #5DCAA5', borderRadius: 12, padding: 16, display: 'flex', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 20 }}>🛡️</span>
        <div>
          <strong style={{ fontSize: 13, color: '#0F6E56' }}>Your privacy is fully protected</strong>
          <p style={{ fontSize: 12, color: '#4a4a4a', marginTop: 2, lineHeight: 1.5 }}>
            This conversation is anonymous and not linked to your identity. Messages are deleted within 24 hours.
            For emergencies, contact local emergency services immediately.
          </p>
        </div>
      </div>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.avatar}>Y</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F6E56' }}>Yara — AYSRHR AI Guide</div>
            <div style={{ fontSize: 11, color: '#1D9E75' }}>Powered by Claude · Anonymous · Youth-friendly</div>
          </div>
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {messages.map((msg, i) => (
            <div key={i} style={msg.role === 'user' ? styles.msgUser : styles.msgAI}>
              {msg.content.split('\n').map((line, j) => (
                <React.Fragment key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</React.Fragment>
              ))}
            </div>
          ))}
          {isLoading && <div style={styles.msgLoad}>Yara is thinking...</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick questions */}
        <div style={styles.quickRow}>
          {QUICK_QUESTIONS.map(({ label, q }) => (
            <button key={label} style={styles.quickBtn} onClick={() => sendMessage(q)}>
              {label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your question anonymously..."
          />
          <button style={styles.sendBtn} onClick={() => sendMessage()}>Send →</button>
        </div>
      </div>
    </div>
  );
}
