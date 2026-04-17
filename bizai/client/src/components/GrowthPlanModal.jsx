export default function GrowthPlanModal({ show, onClose, plan, loading }) {
  if (!show) return null;

  return (
    <div className="modal-bg fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background:'rgba(0,0,0,.7)', backdropFilter:'blur(6px)' }}
      onClick={onClose}>
      <div className="modal-box glass w-full max-w-2xl max-h-[88vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor:'var(--border)' }}>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span style={{ filter:'drop-shadow(0 0 10px rgba(99,102,241,.8))' }}>⚡</span>
              7-Day Growth Plan
            </h2>
            {plan?.week_goal && !loading && (
              <p className="text-sm mt-1" style={{ color:'var(--txt-2)' }}>
                🎯 {plan.week_goal}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-3xl leading-none hover:opacity-60 transition-opacity"
            style={{ color:'var(--txt-2)' }}>&times;</button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              <div className="skel h-14 w-full" />
              {[1,2,3,4,5,6,7].map(i => <div key={i} className="skel" style={{ height:60 }} />)}
            </div>
          ) : plan ? (
            <>
              {/* Weekly goal banner */}
              <div className="p-4 rounded-2xl mb-6 card-enter"
                style={{
                  background:'linear-gradient(135deg,rgba(99,102,241,.15),rgba(124,58,237,.12))',
                  border:'1px solid rgba(99,102,241,.3)',
                }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color:'var(--accent-2)' }}>Weekly Goal</p>
                <p className="font-semibold text-base">{plan.week_goal}</p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl" style={{ border:'1px solid var(--border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background:'rgba(99,102,241,.08)' }}>
                      {['Day','Task','Expected Impact'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider"
                          style={{ color:'var(--accent-2)', borderBottom:'1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {plan.daily_actions?.map((action, i) => (
                      <tr key={i} className="plan-row card-enter"
                        style={{
                          borderBottom: i < plan.daily_actions.length-1 ? `1px solid var(--border)` : 'none',
                          animationDelay:`${i*70}ms`,
                        }}>
                        <td className="px-4 py-3.5 font-bold whitespace-nowrap" style={{ color:'var(--accent-2)', minWidth:100 }}>
                          {action.day}
                        </td>
                        <td className="px-4 py-3.5 leading-relaxed">{action.task}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ background:'rgba(16,185,129,.12)', color:'var(--success)', border:'1px solid rgba(16,185,129,.25)' }}>
                            {action.expected_impact}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose}
            className="btn w-full py-3.5 text-base"
            style={{ background:'linear-gradient(135deg,#6366F1,#7c3aed,#a78bfa)', boxShadow:'0 4px 24px rgba(99,102,241,.4)' }}>
            Got it — Let's Grow! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
