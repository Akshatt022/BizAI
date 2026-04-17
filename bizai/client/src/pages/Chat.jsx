import { useState, useRef, useEffect } from 'react';
import API from '../api/axios';

const SUGGESTIONS = [
  'How are my sales doing this week?',
  'Which product category earns the most?',
  'How can I get more customers?',
  'What should I focus on today?',
  'Give me a tip to increase revenue',
];

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm BizAI 👋 I have full access to your business data. Ask me anything — about your sales, customers, or how to grow your shop!" }
  ]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const { data } = await API.post('/ai/chat', { message: msg, history });
      setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't connect right now. Please try again!" }]);
    } finally { setLoading(false); setTimeout(() => inputRef.current?.focus(), 50); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div style={{ height: 'calc(100vh - 65px)', display: 'flex', flexDirection: 'column', padding: 28, gap: 16 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>💬 AI Business Chat</h2>
        <p style={{ color: 'var(--txt-2)', fontSize: 13 }}>Ask anything about your sales, customers, or growth — powered by LLaMA 3</p>
      </div>

      {/* Messages */}
      <div className="glass" style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Suggestions (only at start) */}
        {messages.length === 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'rgba(99,102,241,.1)', color: '#a5b4fc', outline: '1px solid rgba(99,102,241,.2)', transition: 'all .18s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,.2)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(99,102,241,.1)'}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Chat bubbles */}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 10 }}>
            {m.role === 'assistant' && (
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, boxShadow: '0 0 12px rgba(99,102,241,.4)' }}>🤖</div>
            )}
            <div style={{
              maxWidth: '68%', padding: '12px 16px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.role === 'user'
                ? 'linear-gradient(135deg,#6366F1,#7c3aed)'
                : 'rgba(255,255,255,.04)',
              border: m.role === 'user' ? 'none' : '1px solid rgba(99,102,241,.12)',
              color: m.role === 'user' ? '#fff' : 'var(--txt)',
              fontSize: 14, lineHeight: 1.65,
              boxShadow: m.role === 'user' ? '0 4px 14px rgba(99,102,241,.35)' : 'none',
            }}>
              {m.content}
            </div>
            {m.role === 'user' && (
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                U
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
            <div style={{ display: 'flex', gap: 5, padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(99,102,241,.12)' }}>
              {[0,1,2].map(d => (
                <div key={d} style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1', animation: 'livePulse .8s ease-in-out infinite', animationDelay: `${d * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask BizAI anything about your business… (Enter to send)"
          id="chat-input"
          rows={1}
          style={{
            flex: 1, padding: '13px 18px', borderRadius: 14,
            background: 'rgba(15,23,42,.9)', border: '1px solid rgba(99,102,241,.3)',
            color: 'var(--txt)', fontSize: 14, outline: 'none', resize: 'none',
            fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
            transition: 'border-color .2s',
          }}
          onFocus={e => e.target.style.borderColor='rgba(99,102,241,.6)'}
          onBlur={e  => e.target.style.borderColor='rgba(99,102,241,.3)'}
        />
        <button id="chat-send-btn" onClick={() => send()} disabled={loading || !input.trim()}
          style={{ padding: '13px 22px', borderRadius: 14, background: 'linear-gradient(135deg,#6366F1,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', border: 'none', boxShadow: '0 4px 16px rgba(99,102,241,.4)', opacity: loading || !input.trim() ? .5 : 1, transition: 'all .2s', flexShrink: 0 }}>
          ➤
        </button>
      </div>
    </div>
  );
}
