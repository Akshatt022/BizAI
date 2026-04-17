import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

import StatCard              from '../components/StatCard';
import SalesChart            from '../components/SalesChart';
import AIInsightsPanel       from '../components/AIInsightsPanel';
import AddSaleModal          from '../components/AddSaleModal';
import AddCustomerModal      from '../components/AddCustomerModal';
import GrowthPlanModal       from '../components/GrowthPlanModal';
import GoalTracker           from '../components/GoalTracker';
import BusinessHealthScore   from '../components/BusinessHealthScore';

/* ── typed greeting ─────────────────────────────────────── */
function TypedText({ text }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => { setShown(text.slice(0, ++i)); if (i >= text.length) clearInterval(id); }, 38);
    return () => clearInterval(id);
  }, [text]);
  return (
    <span>{shown}
      <span style={{ display:'inline-block', width:2, height:'1em', background:'var(--accent)', verticalAlign:'middle', marginLeft:2, animation:'livePulse .7s step-end infinite' }} />
    </span>
  );
}

/* ── ripple helper ─────────────────────────────────────── */
function addRipple(e, ref) {
  const btn = ref?.current ?? e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const r = document.createElement('span');
  r.className = 'btn-ripple';
  const s = Math.max(rect.width, rect.height);
  r.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX-rect.left-s/2}px;top:${e.clientY-rect.top-s/2}px`;
  btn.appendChild(r); setTimeout(() => r.remove(), 600);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [salesStats,    setSalesStats]    = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const [weeklyData,    setWeeklyData]    = useState([]);
  const [insights,      setInsights]      = useState([]);
  const [growthPlan,    setGrowthPlan]    = useState(null);

  const [loadingStats,    setLoadingStats]    = useState(true);
  const [loadingChart,    setLoadingChart]    = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [refreshingIns,   setRefreshingIns]   = useState(false);
  const [loadingPlan,     setLoadingPlan]     = useState(false);

  const [showSale,     setShowSale]     = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showGrowth,   setShowGrowth]   = useState(false);

  const gpBtnRef = useRef();

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [s, c] = await Promise.all([API.get('/sales/stats'), API.get('/customers/stats')]);
      setSalesStats(s.data.data); setCustomerStats(c.data.data);
    } catch { toast.error('Failed to load stats.'); }
    finally { setLoadingStats(false); }
  }, []);

  const fetchWeekly = useCallback(async () => {
    setLoadingChart(true);
    try { const { data } = await API.get('/sales/weekly'); setWeeklyData(data.data); }
    catch { toast.error('Failed to load chart.'); }
    finally { setLoadingChart(false); }
  }, []);

  const fetchInsights = useCallback(async (refresh = false) => {
    if (refresh) setRefreshingIns(true); else setLoadingInsights(true);
    try {
      const [s, c] = await Promise.all([API.get('/sales/stats'), API.get('/customers/stats')]);
      const { data } = await API.post('/ai/insights', { salesStats: s.data.data, customerStats: c.data.data });
      setInsights(data.data);
      if (refresh) toast.success('Insights refreshed! 🤖');
    } catch { toast.error('Could not load AI insights.'); }
    finally { setLoadingInsights(false); setRefreshingIns(false); }
  }, []);

  const fetchGrowthPlan = useCallback(async () => {
    setLoadingPlan(true); setShowGrowth(true);
    try {
      const [s, c] = await Promise.all([API.get('/sales/stats'), API.get('/customers/stats')]);
      const { data } = await API.post('/ai/growth-plan', { salesStats: s.data.data, customerStats: c.data.data });
      setGrowthPlan(data.data);
    } catch { toast.error('Could not generate growth plan.'); setShowGrowth(false); }
    finally { setLoadingPlan(false); }
  }, []);

  useEffect(() => { fetchStats(); fetchWeekly(); fetchInsights(); }, [fetchStats, fetchWeekly, fetchInsights]);
  const handleDataAdded = () => { fetchStats(); fetchWeekly(); fetchInsights(true); };

  const hour = new Date().getHours();
  const userName = authUser?.businessName || authUser?.name || 'there';
  const greetingText = `${hour<12?'Good morning':hour<18?'Good afternoon':'Good evening'}, ${userName} 👋`;

  const returnRate = customerStats && customerStats.totalCustomers > 0
    ? Math.round((customerStats.returningCustomers / customerStats.totalCustomers) * 100) : 0;

  return (
    <div className="dash-pad" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Welcome */}
      <div style={{ paddingBottom: 4 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>
          <TypedText text={greetingText} />
        </h2>
        <p style={{ color: 'var(--txt-2)', fontSize: 13, marginTop: 4 }}>Here's your business overview for today.</p>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: '+ Record Sale',      color: '#6366F1', onClick: () => setShowSale(true),     id: 'dash-add-sale-btn'     },
          { label: '+ Add Customer',     color: '#10B981', onClick: () => setShowCustomer(true), id: 'dash-add-customer-btn' },
          { label: '⚡ Growth Plan',     color: '#7c3aed', onClick: (e) => { addRipple(e, gpBtnRef); fetchGrowthPlan(); }, id: 'dash-growth-plan-btn', ref: gpBtnRef },
          { label: '💰 All Sales',       color: '#F59E0B', onClick: () => navigate('/sales'),     id: 'dash-goto-sales-btn'   },
          { label: '👥 All Customers',   color: '#8B5CF6', onClick: () => navigate('/customers'), id: 'dash-goto-customers-btn' },
          { label: '🤖 AI Insights',    color: '#06B6D4', onClick: () => navigate('/ai-insights'), id: 'dash-goto-ai-btn'    },
        ].map(btn => (
          <button key={btn.id} id={btn.id} ref={btn.ref} onClick={btn.onClick}
            style={{ padding: '9px 18px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: 'none', transition: 'all .2s',
              background: `${btn.color}18`, color: btn.color, outline: `1px solid ${btn.color}35`,
            }}
            onMouseEnter={e => { e.currentTarget.style.background=`${btn.color}30`; e.currentTarget.style.transform='translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background=`${btn.color}18`; e.currentTarget.style.transform='translateY(0)'; }}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* KPI row 1 */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        <StatCard icon="💰" title="Total Revenue"
          value={salesStats ? `₹${salesStats.totalRevenue?.toLocaleString('en-IN')||0}` : '₹0'}
          trend={salesStats?.percentChange} subtitle="vs last week" loading={loadingStats} delay={0} />
        <StatCard icon="📈" title="This Week's Sales"
          value={salesStats?.thisWeekCount ?? 0} subtitle="transactions" loading={loadingStats} delay={80} />
        <StatCard icon="👥" title="Total Customers"
          value={customerStats?.totalCustomers ?? 0} loading={loadingStats} delay={160} />
        <StatCard icon="🆕" title="New This Week"
          value={customerStats?.newThisWeek ?? 0} subtitle="new customers" loading={loadingStats} delay={240} />
      </div>

      {/* KPI row 2 */}
      <div className="mini-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 16 }}>
        {[
          { icon:'🔄', label:'Returning Customers', value: customerStats?.returningCustomers ?? 0,                               color:'#8B5CF6' },
          { icon:'📊', label:'Customer Return Rate', value: `${returnRate}%`,                                                     color:'#06B6D4' },
          { icon:'💳', label:'Avg Sale Value',
            value: salesStats?.thisWeekCount > 0 ? `₹${Math.round(salesStats.thisWeekRevenue/salesStats.thisWeekCount).toLocaleString('en-IN')}` : '₹0',
            color:'#F59E0B' },
          { icon:'📅', label:"This Week Revenue",
            value: salesStats ? `₹${salesStats.thisWeekRevenue?.toLocaleString('en-IN')||0}` : '₹0',
            color:'#10B981' },
        ].map((m, i) => (
          <div key={i} className="glass card-enter hover-lift" style={{ padding:'18px 20px', animationDelay:`${i*60}ms`, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${m.color},transparent)` }} />
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:`${m.color}18`, border:`1px solid ${m.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{m.icon}</div>
              <span style={{ fontSize:12, color:'var(--txt-2)', fontWeight:500 }}>{m.label}</span>
            </div>
            {loadingStats
              ? <div className="skel" style={{ height:26, width:80 }} />
              : <p style={{ fontSize:22, fontWeight:800, color:m.color }}>{m.value}</p>
            }
          </div>
        ))}
      </div>

      {/* Chart + AI Panel */}
      <div className="chart-ai-grid" style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:20 }}>
        <SalesChart data={weeklyData} loading={loadingChart} />
        <AIInsightsPanel insights={insights} loading={loadingInsights}
          onRefresh={() => fetchInsights(true)} refreshing={refreshingIns} />
      </div>

      {/* Goal Tracker + Business Health Score */}
      <div className="goal-health-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <GoalTracker salesStats={salesStats} />
        <BusinessHealthScore salesStats={salesStats} customerStats={customerStats} />
      </div>

      {/* Recent activity */}
      <RecentActivity />

      {/* Modals */}
      <AddSaleModal     show={showSale}     onClose={() => setShowSale(false)}     onAdded={handleDataAdded} />
      <AddCustomerModal show={showCustomer} onClose={() => setShowCustomer(false)} onAdded={handleDataAdded} />
      <GrowthPlanModal  show={showGrowth}   onClose={() => setShowGrowth(false)}   plan={growthPlan} loading={loadingPlan} />
    </div>
  );
}

/* ── Recent Activity ─────────────────────────────────────── */
function RecentActivity() {
  const [sales, setSales]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/sales')
      .then(r => setSales(r.data.data?.slice(0,6) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const catIcon = { 'Food & Beverages':'🍔','Electronics':'⚡','Clothing':'👗','Services':'🔧','Groceries':'🛒','Health & Beauty':'💄','Other':'📦' };

  if (loading) return (
    <div className="glass" style={{ padding:'24px' }}>
      <div className="skel" style={{ height:18, width:160, marginBottom:16 }} />
      {[1,2,3].map(i => <div key={i} className="skel" style={{ height:52, marginBottom:8 }} />)}
    </div>
  );
  if (!sales.length) return null;

  return (
    <div className="glass card-enter" style={{ padding:'24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h3 style={{ fontWeight:700, fontSize:15 }}>Recent Transactions</h3>
        <span style={{ fontSize:12, color:'var(--txt-2)' }}>{sales.length} latest</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {sales.map(s => (
          <div key={s._id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderRadius:12, background:'rgba(15,23,42,.6)', border:'1px solid rgba(99,102,241,.08)', transition:'all .2s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,.07)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(15,23,42,.6)'}>
            <div style={{ width:38, height:38, borderRadius:10, background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
              {catIcon[s.category] || '📦'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.description || s.category}</p>
              <p style={{ fontSize:11, color:'var(--txt-2)', marginTop:2 }}>{new Date(s.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })} · {s.category}</p>
            </div>
            <span style={{ fontWeight:800, fontSize:15, color:'#10B981', flexShrink:0 }}>+₹{s.amount.toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
