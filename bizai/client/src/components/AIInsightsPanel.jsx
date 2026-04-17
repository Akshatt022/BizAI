const PRIORITY = {
  high:   { label:'High',   bg:'rgba(239,68,68,.1)',   border:'rgba(239,68,68,.3)',   color:'#EF4444' },
  medium: { label:'Medium', bg:'rgba(245,158,11,.1)',  border:'rgba(245,158,11,.3)',  color:'#F59E0B' },
  low:    { label:'Low',    bg:'rgba(16,185,129,.1)',  border:'rgba(16,185,129,.3)',  color:'#10B981' },
};

export default function AIInsightsPanel({ insights, loading, onRefresh, refreshing }) {
  if (loading) {
    return (
      <div className="glass p-6">
        <div className="skel h-5 w-44 mb-6" />
        {[1,2,3].map(i => <div key={i} className="skel mb-4" style={{ height:90 }} />)}
      </div>
    );
  }

  return (
    <div className="glass p-6 card-enter" style={{ animationDelay:'200ms' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">🤖 AI Insights</h2>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full"
            style={{ background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.2)' }}>
            <div className="live-dot" />
            <span className="text-xs font-semibold" style={{ color:'var(--success)' }}>Live</span>
          </div>
        </div>

        <button id="refresh-insights-btn" onClick={onRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all"
          style={{
            color: 'var(--accent-2)',
            border: '1px solid rgba(99,102,241,.3)',
            background: 'rgba(99,102,241,.07)',
            opacity: refreshing ? .6 : 1,
          }}>
          <svg className={`w-4 h-4 ${refreshing ? 'spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Cards with staggered entrance */}
      <div className="space-y-3">
        {insights?.length > 0 ? insights.map((ins, i) => {
          const p = PRIORITY[ins.priority] || PRIORITY.medium;
          return (
            <div key={i} className="insight-card p-4 rounded-2xl card-enter"
              style={{
                background: p.bg, border: `1px solid ${p.border}`,
                animationDelay: `${i * 100}ms`,
              }}>
              <div className="flex gap-3">
                <span className="text-2xl flex-shrink-0 mt-px"
                  style={{ filter:'drop-shadow(0 0 6px rgba(99,102,241,.5))' }}>
                  {ins.icon || '💡'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h3 className="font-semibold text-sm">{ins.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ color: p.color, background:`${p.color}18`, border:`1px solid ${p.border}` }}>
                      {p.label}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color:'var(--txt-2)' }}>
                    {ins.description}
                  </p>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-12" style={{ color:'var(--txt-2)' }}>
            <div className="text-5xl mb-3">🤖</div>
            <p className="font-medium">No insights yet.</p>
            <p className="text-sm mt-1">Add sales and customer data to get AI-powered recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
