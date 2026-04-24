import React, { useState, useEffect, useRef } from 'react';
import { sendChat, getChatHistory, clearChat } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS_ADMIN = [
  'Give me a summary of all partners',
  'Which partner is performing best?',
  'What are the pending targets this month?',
  'Explain home loan interest rates',
];

const SUGGESTIONS_PARTNER = [
  'What are my current targets?',
  'How can I improve my performance?',
  'Explain personal loan eligibility',
  "What's my progress this month?",
];

export default function AIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(true);
  const bottomRef = useRef(null);

  const suggestions = user?.role === 'admin' ? SUGGESTIONS_ADMIN : SUGGESTIONS_PARTNER;

  useEffect(() => {
    getChatHistory()
      .then(r => setMessages(r.data.map(h => ({ role: h.role, text: h.message, time: h.timestamp }))))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg, time: new Date().toISOString() }]);
    setLoading(true);
    try {
      const res = await sendChat(msg);
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply, time: res.data.timestamp }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error. Please try again.', time: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await clearChat();
    setMessages([]);
    toast.success('Chat history cleared');
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🤖 AI Assistant</h1>
          <p style={styles.sub}>Powered by AI — Ask anything about finance, targets, or general knowledge</p>
        </div>
        <button style={styles.clearBtn} onClick={handleClear}>Clear History</button>
      </div>

      <div style={styles.chatContainer}>
        <div style={styles.messages}>
          {histLoading ? (
            <div style={styles.loadingMsg}>Loading history...</div>
          ) : messages.length === 0 ? (
            <div style={styles.welcome}>
              <div style={styles.botAvatar}>🤖</div>
              <h3 style={styles.welcomeTitle}>Hello, {user?.name}!</h3>
              <p style={styles.welcomeText}>
                I'm your TrustPay AI assistant. Ask me anything — finance, targets,
                partner analytics, general knowledge, or anything else!
              </p>
              <div style={styles.suggestions}>
                {suggestions.map(s => (
                  <button key={s} style={styles.suggestion} onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} style={{ ...styles.msgRow, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {m.role === 'assistant' && <div style={styles.aiBubbleAvatar}>🤖</div>}
                  <div style={{
                    ...styles.bubble,
                    ...(m.role === 'user' ? styles.userBubble : styles.aiBubble)
                  }}>
                    {m.role === 'user' ? (
                      <div style={styles.bubbleText}>{m.text}</div>
                    ) : (
                      <div className="markdown-body"> {/* ✅ fixed */}
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                    )}
                    <div style={styles.bubbleTime}>
                      {new Date(m.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {m.role === 'user' && (
                    <div style={styles.userBubbleAvatar}>{user?.name?.[0]?.toUpperCase()}</div>
                  )}
                </div>
              ))}
              {loading && (
                <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
                  <div style={styles.aiBubbleAvatar}>🤖</div>
                  <div style={{ ...styles.bubble, ...styles.aiBubble }}>
                    <div className="typing">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {messages.length > 0 && !loading && (
          <div style={styles.suggBar}>
            {suggestions.slice(0, 2).map(s => (
              <button key={s} style={styles.suggBtn} onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}

        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask anything — finance, AI, targets, general knowledge..."
            disabled={loading}
          />
          <button style={{ ...styles.sendBtn, opacity: loading ? 0.6 : 1 }} onClick={() => send()} disabled={loading}>
            {loading ? '...' : '➤'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        .typing span { display: inline-block; width: 8px; height: 8px; margin: 0 2px; background: #a0aec0; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
        .typing span:nth-child(1) { animation-delay: -0.32s; }
        .typing span:nth-child(2) { animation-delay: -0.16s; }
        .markdown-body p { margin: 0 0 8px; font-size: 14px; }
        .markdown-body p:last-child { margin: 0; }
        .markdown-body ul, .markdown-body ol { padding-left: 20px; margin: 6px 0; }
        .markdown-body li { margin-bottom: 4px; font-size: 14px; }
        .markdown-body strong { color: #1a1a2e; font-weight: 700; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { margin: 10px 0 6px; color: #1a1a2e; font-size: 15px; font-weight: 700; }
        .markdown-body code { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
        .markdown-body pre { background: #e2e8f0; padding: 10px; border-radius: 8px; overflow-x: auto; }
        .markdown-body blockquote { border-left: 3px solid #e2b04a; margin: 8px 0; padding-left: 12px; color: #718096; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' },
  sub: { color: '#718096', margin: 0, fontSize: 14 },
  clearBtn: { padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#718096', cursor: 'pointer', fontSize: 13 },
  chatContainer: { flex: 1, background: '#fff', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  messages: { flex: 1, overflowY: 'auto', padding: '24px 24px 12px', display: 'flex', flexDirection: 'column', gap: 16 },
  loadingMsg: { textAlign: 'center', color: '#a0aec0', padding: '40px' },
  welcome: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '40px 20px' },
  botAvatar: { fontSize: 56, marginBottom: 16 },
  welcomeTitle: { fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: '0 0 12px' },
  welcomeText: { color: '#718096', maxWidth: 420, lineHeight: 1.7, marginBottom: 24 },
  suggestions: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  suggestion: { padding: '10px 16px', borderRadius: 100, border: '2px solid #e2e8f0', background: '#f8f9ff', color: '#4a5568', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  msgRow: { display: 'flex', alignItems: 'flex-end', gap: 8 },
  aiBubbleAvatar: { width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  userBubbleAvatar: { width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #e2b04a, #c9953a)', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '70%', padding: '12px 16px', borderRadius: 16, lineHeight: 1.6 },
  userBubble: { background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: '#fff', borderBottomRightRadius: 4 },
  aiBubble: { background: '#f4f7fb', color: '#2d3748', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, whiteSpace: 'pre-wrap' },
  bubbleTime: { fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' },
  typing: { display: 'flex', alignItems: 'center', height: 20 },
  suggBar: { display: 'flex', gap: 8, padding: '8px 24px', borderTop: '1px solid #f0f4f8', flexWrap: 'wrap' },
  suggBtn: { padding: '6px 14px', borderRadius: 100, border: '1px solid #e2e8f0', background: '#f8f9ff', color: '#718096', fontSize: 12, cursor: 'pointer' },
  inputRow: { display: 'flex', gap: 12, padding: '16px 24px', borderTop: '1px solid #f0f4f8' },
  input: { flex: 1, padding: '14px 18px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' },
  sendBtn: { width: 52, height: 52, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #e2b04a, #c9953a)', color: '#fff', fontSize: 20, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};