import { useState, useEffect } from 'react';

export default function GoalTracker({ salesStats }) {
  const [goal,     setGoal]     = useState(() => parseInt(localStorage.getItem('weeklyGoal') || '0'));
  const [editing,  setEditing]  = useState(false);
  const [input,    setInput]    = useState('');

  const actual   = salesStats?.thisWeekRevenue || 0;
  const pct      = goal > 0 ? Math.min((actual / goal) * 100, 100) : 0;
  const achieved = pct >= 100;
  const color    = achieved ? '#10B981' : pct >= 70 ? '#F59E0B' : '#6366F1';

  const saveGoal = () => {
    const v = parseInt(input);
    if (!isNaN(v) && v > 0) {
      setGoal(v);
      localStorage.setItem('weeklyGoal', v);
    }
    setEditing(false);
  };

  const daysLeft = (() => {
    const d = new Date();
    return 7 - d.getDay() || 7;
  })();

  return (
    <div className="glass card-enter hover-lift" style={{ padding:'20px 22px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},transparent)` }} />

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <h3 style={{ fontWeight:700, fontSize:14 }}>🎯 Weekly Revenue Goal</h3>
        <button onClick={() => { setInput(goal.toString()); setEditing(true); }}
          style={{ fontSize:11, padding:'4px 10px', borderRadius:8, background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.2)', color:'#a5b4fc', cursor:'pointer' }}>
          {goal ? 'Edit' : 'Set Goal'}
        </button>
      </div>

      {editing ? (
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          <input autoFocus value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && saveGoal()}
            placeholder="Enter weekly target (₹)" type="number"
            style={{ flex:1, padding:'9px 12px', borderRadius:9, background:'rgba(15,23,42,.9)', border:'1px solid rgba(99,102,241,.35)', color:'var(--txt)', fontSize:13, outline:'none' }}
          />
          <button onClick={saveGoal}
            style={{ padding:'9px 14px', borderRadius:9, background:'linear-gradient(135deg,#6366F1,#7c3aed)', color:'#fff', fontWeight:700, fontSize:13, border:'none', cursor:'pointer' }}>
            Save
          </button>
        </div>
      ) : goal === 0 ? (
        <div style={{ textAlign:'center', padding:'20px 0', color:'var(--txt-2)' }}>
          <p style={{ fontSize:28, marginBottom:8 }}>🎯</p>
          <p style={{ fontSize:13 }}>Set a weekly revenue goal to track your progress!</p>
          <button onClick={() => { setInput(''); setEditing(true); }}
            style={{ marginTop:12, padding:'8px 18px', borderRadius:10, background:'linear-gradient(135deg,#6366F1,#7c3aed)', color:'#fff', fontWeight:700, fontSize:13, border:'none', cursor:'pointer' }}>
            Set Goal
          </button>
        </div>
      ) : (
        <>
          {/* Amounts */}
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <p style={{ fontSize:11, color:'var(--txt-2)', marginBottom:2 }}>This Week</p>
              <p style={{ fontSize:20, fontWeight:800, color }}> ₹{actual.toLocaleString('en-IN')}</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:11, color:'var(--txt-2)', marginBottom:2 }}>Goal</p>
              <p style={{ fontSize:20, fontWeight:800 }}>₹{goal.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height:10, borderRadius:20, background:'rgba(255,255,255,.06)', overflow:'hidden', marginBottom:10 }}>
            <div style={{ height:'100%', borderRadius:20, background:`linear-gradient(90deg,${color},${color}aa)`, width:`${pct}%`, transition:'width 1s ease', boxShadow:`0 0 10px ${color}66` }} />
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
            <span style={{ color, fontWeight:700 }}>{pct.toFixed(0)}% achieved</span>
            <span style={{ color:'var(--txt-2)' }}>
              {achieved ? '🎉 Goal smashed!' : `₹${(goal - actual).toLocaleString('en-IN')} to go · ${daysLeft}d left`}
            </span>
          </div>

          {achieved && (
            <div style={{ marginTop:12, padding:'10px 14px', borderRadius:10, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', textAlign:'center', fontSize:13, color:'#10B981', fontWeight:700 }}>
              🏆 You've hit your weekly target! Set a higher goal.
            </div>
          )}
        </>
      )}
    </div>
  );
}
