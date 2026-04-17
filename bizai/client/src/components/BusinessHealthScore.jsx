import { useState, useEffect } from 'react';
import API from '../api/axios';

function GaugeArc({ score }) {
  // SVG arc gauge 0-100
  const r    = 70;
  const cx   = 90;
  const cy   = 90;
  const full = Math.PI * r; // half circle circumference
  const dash = (score / 100) * full;
  const gap  = full - dash;

  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : score >= 25 ? '#F97316' : '#EF4444';

  return (
    <svg width="180" height="100" viewBox="0 0 180 100" style={{ overflow:'visible' }}>
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#EF4444" />
          <stop offset="33%"  stopColor="#F97316" />
          <stop offset="66%"  stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id="gaugeGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background track */}
      <path d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
        fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={14} strokeLinecap="round" />

      {/* Colored fill */}
      <path d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
        fill="none" stroke="url(#gaugeGrad)" strokeWidth={14} strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        style={{ filter: 'url(#gaugeGlow)', transition: 'stroke-dasharray 1s ease' }} />

      {/* Score text */}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={30} fontWeight="800" fill={color}>{score}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill="var(--txt-2)">/100</text>
    </svg>
  );
}

export default function BusinessHealthScore({ salesStats, customerStats }) {
  const [score,   setScore]   = useState(null);
  const [label,   setLabel]   = useState('');
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salesStats || !customerStats) return;

    async function compute() {
      setLoading(true);
      try {
        const { data } = await API.post('/ai/health-score', { salesStats, customerStats });
        setScore(data.data.score);
        setLabel(data.data.label);
        setFactors(data.data.factors || []);
      } catch {
        // Local compute fallback
        let s = 50;
        if ((salesStats.percentChange || 0) > 10)  s += 15;
        if ((salesStats.percentChange || 0) > 0)   s +=  5;
        if ((salesStats.percentChange || 0) < -10) s -= 15;
        if ((customerStats.newThisWeek || 0) > 3)  s += 10;
        if ((customerStats.returningCustomers || 0) > 5) s += 10;
        if ((salesStats.thisWeekCount || 0) > 10) s += 10;
        s = Math.max(10, Math.min(100, s));
        setScore(s);
        setLabel(s >= 75 ? 'Thriving' : s >= 50 ? 'Stable' : 'Needs Attention');
        setFactors([
          { icon: salesStats.percentChange > 0 ? '📈' : '📉', text: `Revenue ${salesStats.percentChange > 0 ? 'growing' : 'declining'} ${Math.abs(salesStats.percentChange || 0)}%` },
          { icon: '👥', text: `${customerStats.newThisWeek || 0} new customers this week` },
        ]);
      } finally { setLoading(false); }
    }

    compute();
  }, [salesStats, customerStats]);

  if (loading) return (
    <div className="glass" style={{ padding:'20px', textAlign:'center' }}>
      <div className="skel" style={{ width:180, height:100, margin:'0 auto 12px', borderRadius:90 }} />
      <div className="skel" style={{ width:120, height:16, margin:'0 auto' }} />
    </div>
  );

  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : score >= 25 ? '#F97316' : '#EF4444';

  return (
    <div className="glass hover-lift card-enter" style={{ padding:'20px 22px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},transparent)` }} />

      <h3 style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>🏥 Business Health Score</h3>

      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:14 }}>
        <GaugeArc score={score} />
        <div style={{ textAlign:'center', marginTop:4 }}>
          <span style={{ fontWeight:800, fontSize:16, color }}>{label}</span>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {factors.map((f, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:12, color:'var(--txt-2)' }}>
            <span>{f.icon}</span>
            <span>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
