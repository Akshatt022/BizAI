import { useEffect, useRef } from 'react';

const COLORS = ['#6366F1','#10B981','#F59E0B','#8B5CF6'];

function useCounter(target, duration = 1100) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const raw = String(target).replace(/[₹,]/g, '');
    const num = parseFloat(raw);
    if (isNaN(num)) { ref.current.textContent = target; return; }
    const isRupee = String(target).startsWith('₹');
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
      const val = Math.round(ease * num);
      ref.current.textContent = isRupee ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return ref;
}

export default function StatCard({ icon, title, value, subtitle, trend, loading, delay = 0 }) {
  const counterRef = useCounter(value);
  const isPositive = trend >= 0;

  const accentMap = {
    '💰': '#6366F1',
    '📈': '#10B981',
    '👥': '#F59E0B',
    '🆕': '#8B5CF6',
  };
  const accent = accentMap[icon] || '#6366F1';

  if (loading) {
    return (
      <div className="glass" style={{ padding:'22px 22px', animationDelay:`${delay}ms`, position:'relative', overflow:'hidden' }}>
        <div className="skel" style={{ height:38, width:38, borderRadius:10, marginBottom:16 }} />
        <div className="skel" style={{ height:12, width:90, marginBottom:10 }} />
        <div className="skel" style={{ height:28, width:120, marginBottom:8 }} />
        <div className="skel" style={{ height:10, width:70 }} />
      </div>
    );
  }

  return (
    <div className="glass hover-lift card-enter"
      style={{ padding:'22px', position:'relative', overflow:'hidden', cursor:'default', animationDelay:`${delay}ms` }}>

      {/* Top accent bar */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${accent},${accent}80,transparent)` }} />

      {/* Icon + trend */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ width:42, height:42, borderRadius:12, background:`${accent}18`, border:`1px solid ${accent}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize:12, fontWeight:700, padding:'4px 10px', borderRadius:20,
            color: isPositive ? 'var(--success)' : 'var(--danger)',
            background: isPositive ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)',
            border: `1px solid ${isPositive ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}`,
          }}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Value */}
      <p ref={counterRef} style={{ fontSize:26, fontWeight:800, lineHeight:1.2, marginBottom:4,
        background:`linear-gradient(135deg,#fff 60%,${accent})`,
        WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
      }}>
        {value}
      </p>

      <p style={{ fontSize:13, color:'var(--txt-2)', fontWeight:500, marginBottom:2 }}>{title}</p>
      {subtitle && <p style={{ fontSize:11, color:'rgba(148,163,184,.5)' }}>{subtitle}</p>}

      {/* Subtle corner glow */}
      <div style={{ position:'absolute', bottom:-20, right:-20, width:80, height:80, borderRadius:'50%', background:`${accent}12`, filter:'blur(16px)', pointerEvents:'none' }} />
    </div>
  );
}
