import { useState, useCallback } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import AIInsightsPanel from '../components/AIInsightsPanel';
import GrowthPlanModal from '../components/GrowthPlanModal';

export default function AIInsights() {
  const [insights,      setInsights]      = useState([]);
  const [growthPlan,    setGrowthPlan]    = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [showPlan,      setShowPlan]      = useState(false);
  const [loadingPlan,   setLoadingPlan]   = useState(false);
  const [hasLoaded,     setHasLoaded]     = useState(false);

  const loadInsights = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [s, c] = await Promise.all([API.get('/sales/stats'), API.get('/customers/stats')]);
      const { data } = await API.post('/ai/insights', { salesStats: s.data.data, customerStats: c.data.data });
      setInsights(data.data || []);
      setHasLoaded(true);
      if (isRefresh) toast.success('Insights refreshed! 🤖');
    } catch { toast.error('Could not generate insights.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const loadGrowthPlan = useCallback(async () => {
    setLoadingPlan(true); setShowPlan(true);
    try {
      const [s, c] = await Promise.all([API.get('/sales/stats'), API.get('/customers/stats')]);
      const { data } = await API.post('/ai/growth-plan', { salesStats: s.data.data, customerStats: c.data.data });
      setGrowthPlan(data.data);
    } catch { toast.error('Could not generate growth plan.'); setShowPlan(false); }
    finally { setLoadingPlan(false); }
  }, []);

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>AI Business Insights</h2>
          <p style={{ color: 'var(--txt-2)', fontSize: 13 }}>Powered by Google Gemini — personalised for your business</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button id="ai-generate-insights-btn"
            onClick={() => loadInsights(hasLoaded)}
            disabled={loading || refreshing}
            style={{ padding: '10px 22px', borderRadius: 11, background: 'linear-gradient(135deg,#6366F1,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', boxShadow: '0 4px 16px rgba(99,102,241,.4)', opacity: (loading||refreshing) ? .6 : 1, transition: 'opacity .2s' }}>
            {loading ? '⏳ Generating…' : refreshing ? '🔄 Refreshing…' : hasLoaded ? '🔄 Refresh Insights' : '⚡ Generate Insights'}
          </button>
          <button id="ai-growth-plan-btn"
            onClick={loadGrowthPlan}
            disabled={loadingPlan}
            style={{ padding: '10px 22px', borderRadius: 11, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', boxShadow: '0 4px 16px rgba(124,58,237,.4)', opacity: loadingPlan ? .6 : 1, transition: 'opacity .2s' }}>
            {loadingPlan ? '⏳ Planning…' : '📋 7-Day Growth Plan'}
          </button>
        </div>
      </div>

      {/* Call-to-action when not yet loaded */}
      {!hasLoaded && !loading && (
        <div className="glass" style={{ padding: 60, textAlign: 'center', background: 'linear-gradient(135deg,rgba(99,102,241,.06),rgba(124,58,237,.06))', border: '1px dashed rgba(99,102,241,.3)' }}>
          <p style={{ fontSize: 56, marginBottom: 16 }}>🤖</p>
          <p style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Your AI Business Advisor</p>
          <p style={{ color: 'var(--txt-2)', fontSize: 14, maxWidth: 400, margin: '0 auto 28px' }}>
            Click <strong style={{ color: '#a5b4fc' }}>Generate Insights</strong> to get personalised AI recommendations based on your sales and customer data.
          </p>
          <button onClick={() => loadInsights(false)}
            style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#6366F1,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 'none', boxShadow: '0 4px 24px rgba(99,102,241,.45)' }}>
            ⚡ Generate Now
          </button>
        </div>
      )}

      {/* Insights + extra tips side-by-side */}
      {(hasLoaded || loading) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Main insights panel (full-width on load) */}
          <AIInsightsPanel insights={insights} loading={loading} onRefresh={() => loadInsights(true)} refreshing={refreshing} />

          {/* Tips card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '📈', title: 'Track Daily', tip: 'Record every sale the same day for the most accurate AI recommendations.' },
              { icon: '👥', title: 'Know Your Customers', tip: 'Marking customers as New vs Returning helps the AI find loyalty patterns.' },
              { icon: '🎯', title: 'Act on Plans', tip: 'Generate a fresh 7-Day Growth Plan each week and tick off actions daily.' },
              { icon: '💡', title: 'Category Insight', tip: 'Tag each sale with the right category — the AI uses this to spot your best revenue streams.' },
            ].map(t => (
              <div key={t.title} className="glass hover-lift" style={{ padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{t.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.6 }}>{t.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <GrowthPlanModal show={showPlan} onClose={() => setShowPlan(false)} plan={growthPlan} loading={loadingPlan} />
    </div>
  );
}
