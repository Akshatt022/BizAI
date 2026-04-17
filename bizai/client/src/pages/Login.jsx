import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* floating particles */
function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size:  Math.random() * 4 + 2,
    left:  Math.random() * 100,
    delay: Math.random() * 12,
    dur:   Math.random() * 8 + 8,
    color: ['#6366F1','#818CF8','#10B981','#A78BFA'][Math.floor(Math.random()*4)],
  }));
  return (
    <>
      {particles.map(p => (
        <span key={p.id} className="particle" style={{
          width: p.size, height: p.size,
          left: `${p.left}%`, bottom: 0,
          background: p.color,
          animationDuration: `${p.dur}s`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}
    </>
  );
}

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();
  const btnRef    = useRef();

  const ripple = (e) => {
    const btn  = btnRef.current;
    const rect = btn.getBoundingClientRect();
    const r = document.createElement('span');
    r.className = 'btn-ripple';
    const size = Math.max(rect.width, rect.height);
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('All fields are required.');
    setLoading(true);
    try {
      const user = await login(form, false);
      toast.success(`Welcome back, ${user.name}! 👋`);
      navigate(user.role === 'consumer' ? '/consumer' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed.');
    } finally { setLoading(false); }
  };


  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #1a1440 0%, #0F172A 60%)' }}>

      {/* Animated orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <Particles />

      {/* Card */}
      <div className="glass auth-card-enter w-full max-w-lg p-10 relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg,#6366F1,#7c3aed)', boxShadow: '0 8px 24px rgba(99,102,241,.5)' }}>
            <span style={{ fontSize: 28 }}>⚡</span>
          </div>
          <h1 className="text-4xl font-bold gtext mb-1">BizAI</h1>
          <p className="text-sm" style={{ color: 'var(--txt-2)' }}>AI-Powered Business Growth Assistant</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="relative">
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: focused === 'email' ? 'var(--accent-2)' : 'var(--txt-2)', transition:'color .3s' }}>
              Email Address
            </label>
            <input id="login-email" type="email" value={form.email} placeholder="you@business.com"
              className="inp" onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: focused === 'pass' ? 'var(--accent-2)' : 'var(--txt-2)', transition:'color .3s' }}>
              Password
            </label>
            <input id="login-password" type="password" value={form.password} placeholder="••••••••"
              className="inp" onFocus={() => setFocused('pass')} onBlur={() => setFocused('')}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          <button id="login-submit" ref={btnRef} type="submit" disabled={loading}
            className="btn w-full py-3.5 text-base mt-2" onClick={ripple}>
            {loading
              ? <><svg className="spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 60" /></svg> Signing in…</>
              : '→ Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--txt-2)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--accent-2)' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
