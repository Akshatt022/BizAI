import { useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';
import API from '../api/axios';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(13,18,30,.98)', border:'1px solid rgba(99,102,241,.3)', borderRadius:12, padding:'12px 16px', boxShadow:'0 8px 24px rgba(0,0,0,.4)' }}>
      <p style={{ fontWeight:700, marginBottom:6, color:'#a5b4fc' }}>{label}</p>
      {payload.map(p => (
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

  // Merge historical + forecast into one dataset for the chart
  const today = new Date();
  const chartData = [
    ...data.map(d => ({ ...d, label: d.day, Actual: d.total, Predicted: null })),
    ...forecast.map((f, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i + 1);
      return {
        label: f.day,
        Actual: null,
        Predicted: f.predicted,
        confidence: f.confidence,
        count: 0,
      };
    }),
  ];

  const hasData    = data.some(d => d.total > 0);
  const hasForecast = forecast.length > 0;
  const todayIndex = data.length - 1;

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
          {hasForecast && <p style={{ fontSize:11, color:'#F59E0B', marginTop:2 }}>+ 7-day AI forecast</p>}
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
        <ResponsiveContainer width="100%" height={290}>
          <ComposedChart data={chartData} margin={{ top:8, right:8, bottom:0, left:0 }}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,.08)" />
            <XAxis dataKey="label" tick={{ fill:'var(--txt-2)', fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:'var(--txt-2)', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={46} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={v => <span style={{ fontSize:12, color: v === 'Actual' ? '#10B981' : '#F59E0B' }}>{v}</span>}
            />

            {/* Reference line between actual and forecast */}
            {hasForecast && <ReferenceLine x={data[data.length-1]?.day} stroke="rgba(99,102,241,.4)" strokeDasharray="4 4" label={{ value:'Today', fill:'#a5b4fc', fontSize:10 }} />}

            {/* Actual area */}
            <Area type="monotone" dataKey="Actual" stroke="#10B981" strokeWidth={2.5} fill="url(#actualGrad)"
              dot={{ r:3, fill:'#10B981', strokeWidth:0 }} activeDot={{ r:6, fill:'#10B981', filter:'url(#glow)' }}
              connectNulls={false} />

            {/* Forecast line - dashed */}
            <Line type="monotone" dataKey="Predicted" stroke="#F59E0B" strokeWidth={2.5} strokeDasharray="6 4"
              dot={{ r:4, fill:'#F59E0B', strokeWidth:0 }} activeDot={{ r:6, fill:'#F59E0B' }}
              connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
