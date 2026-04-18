import { useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';
import API from '../api/axios';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const isForecast = label?.startsWith('▶');
  return (
    <div style={{ background:'rgba(13,18,30,.98)', border:`1px solid ${isForecast ? 'rgba(245,158,11,.4)' : 'rgba(99,102,241,.3)'}`, borderRadius:12, padding:'12px 16px', boxShadow:'0 8px 24px rgba(0,0,0,.4)' }}>
      <p style={{ fontWeight:700, marginBottom:6, color: isForecast ? '#F59E0B' : '#a5b4fc' }}>
        {isForecast ? '🔮 Forecast — ' : ''}{label?.replace('▶ ','') }
      </p>
      {payload.map(p => p.value != null && (
        <p key={p.name} style={{ fontSize:13, color: p.name === 'Actual' ? '#10B981' : '#F59E0B' }}>
          {p.name}: <strong>₹{(p.value||0).toLocaleString('en-IN')}</strong>
          {p.payload?.confidence && <span style={{ opacity:.6, marginLeft:6 }}>({p.payload.confidence})</span>}
        </p>
      ))}
      {payload[0]?.payload?.count > 0 && (
        <p style={{ fontSize:11, color:'var(--txt-2)', marginTop:4 }}>{payload[0].payload.count} transactions</p>
      )}
    </div>
  );
};

export default function SalesChart({ data = [], loading }) {
  const [forecast,        setForecast]        = useState([]);
  const [loadingForecast, setLoadingForecast] = useState(false);

  const loadForecast = async () => {
    setLoadingForecast(true);
    try {
      const { data: res } = await API.post('/ai/forecast', { weeklyData: data });
      setForecast(res.data || []);
      toast.success('7-day forecast generated! 📈');
    } catch { toast.error('Could not generate forecast.'); }
    finally { setLoadingForecast(false); }
  };

  const hasData     = data.some(d => d.total > 0);
  const hasForecast = forecast.length > 0;

  // Merge historical + forecast into one dataset.
  // Forecast labels get a "▶" prefix so they are visually distinct on the x-axis.
  // We also add a "bridge" point at the junction so the predicted line starts
  // from the last actual value (smooth visual connection).
  const lastActual  = data.length > 0 ? data[data.length - 1] : null;

  const chartData = [
    ...data.map(d => ({ label: d.day, Actual: d.total, Predicted: null, count: d.count || 0 })),
    // Bridge point: connects actual end to forecast start (only when forecast exists)
    ...(hasForecast && lastActual ? [{
      label: lastActual.day,
      Actual: null,
      Predicted: lastActual.total,   // starts from where actual ended
      count: 0,
      isBridge: true,
    }] : []),
    ...forecast.map(f => ({
      label: `▶ ${f.day}`,        // prefix makes x-axis labels clearly "future"
      Actual: null,
      Predicted: f.predicted,
      confidence: f.confidence,
      count: 0,
    })),
  ];

  const todayLabel = lastActual?.day;

  if (loading) {
    return (
      <div className="glass" style={{ padding:24, height:340 }}>
        <div className="skel" style={{ height:20, width:160, marginBottom:20 }} />
        <div className="skel" style={{ height:280, borderRadius:12 }} />
      </div>
    );
  }

  return (
    <div className="glass card-enter" style={{ padding:'22px 24px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h2 style={{ fontWeight:700, fontSize:16 }}>📈 Revenue Trend</h2>
          {hasForecast && <p style={{ fontSize:11, color:'#F59E0B', marginTop:2 }}>+ 7-day AI forecast (dashed)</p>}
          {!hasForecast && <p style={{ fontSize:11, color:'var(--txt-2)', marginTop:2 }}>Last 7 days • Click button for AI forecast</p>}
        </div>
        <button id="forecast-btn" onClick={loadForecast} disabled={loadingForecast || !hasData}
          style={{ padding:'8px 16px', borderRadius:10, background: hasForecast ? 'rgba(245,158,11,.12)' : 'rgba(99,102,241,.1)', border:`1px solid ${hasForecast ? 'rgba(245,158,11,.3)' : 'rgba(99,102,241,.25)'}`, color: hasForecast ? '#F59E0B' : '#a5b4fc', fontWeight:600, fontSize:12, cursor: loadingForecast || !hasData ? 'not-allowed' : 'pointer', opacity: loadingForecast ? .6 : 1, transition:'all .2s' }}>
          {loadingForecast ? '⏳ Forecasting…' : hasForecast ? '🔄 Re-forecast' : '🔮 AI Forecast'}
        </button>
      </div>

      {!hasData ? (
        <div style={{ height:280, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--txt-2)' }}>
          <p style={{ fontSize:36, marginBottom:12 }}>📊</p>
          <p style={{ fontWeight:600 }}>No sales data yet</p>
          <p style={{ fontSize:12, marginTop:4 }}>Add sales to see the revenue chart</p>
        </div>
      ) : (
        <>
          {/* Legend hints */}
          <div style={{ display:'flex', gap:16, marginBottom:12, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:'#10B981', display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:20, height:3, background:'#10B981', display:'inline-block', borderRadius:2 }} />
              Actual Revenue
            </span>
            {hasForecast && (
              <span style={{ fontSize:12, color:'#F59E0B', display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:20, height:2, background:'#F59E0B', display:'inline-block', borderRadius:2, borderTop:'2px dashed #F59E0B' }} />
                AI Predicted (next 7 days)
              </span>
            )}
          </div>

          <ResponsiveContainer width="100%" height={270}>
            <ComposedChart data={chartData} margin={{ top:8, right:8, bottom:0, left:0 }}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#F59E0B" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,.08)" />
              <XAxis dataKey="label"
                tick={{ fill:'var(--txt-2)', fontSize:10 }}
                axisLine={false} tickLine={false}
                interval={0}
              />
              <YAxis tick={{ fill:'var(--txt-2)', fontSize:11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={46} />
              <Tooltip content={<CustomTooltip />} />

              {/* Today separator line */}
              {hasForecast && (
                <ReferenceLine
                  x={todayLabel}
                  stroke="rgba(99,102,241,.5)"
                  strokeDasharray="5 3"
                  label={{ value:'Today ↑', fill:'#a5b4fc', fontSize:10, position:'insideTopLeft' }}
                />
              )}

              {/* Actual area (solid green) */}
              <Area type="monotone" dataKey="Actual"
                stroke="#10B981" strokeWidth={2.5} fill="url(#actualGrad)"
                dot={{ r:3, fill:'#10B981', strokeWidth:0 }}
                activeDot={{ r:6, fill:'#10B981', filter:'url(#glow)' }}
                connectNulls={false}
              />

              {/* Forecast line (dashed amber) — only shown when hasForecast */}
              {hasForecast && (
                <Line type="monotone" dataKey="Predicted"
                  stroke="#F59E0B" strokeWidth={2.5} strokeDasharray="7 4"
                  dot={{ r:4, fill:'#F59E0B', strokeWidth:0 }}
                  activeDot={{ r:6, fill:'#F59E0B', filter:'url(#glow)' }}
                  connectNulls={true}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
