import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  pending:   { bg:'rgba(245,158,11,.1)',  border:'rgba(245,158,11,.3)',  color:'#F59E0B', label:'⏳ Pending' },
  confirmed: { bg:'rgba(99,102,241,.1)',  border:'rgba(99,102,241,.3)',  color:'#818CF8', label:'✅ Confirmed' },
  ready:     { bg:'rgba(16,185,129,.1)',  border:'rgba(16,185,129,.3)',  color:'#10B981', label:'📦 Ready' },
  completed: { bg:'rgba(16,185,129,.06)', border:'rgba(16,185,129,.2)',  color:'#6EE7B7', label:'🎉 Done' },
  cancelled: { bg:'rgba(239,68,68,.08)', border:'rgba(239,68,68,.2)',   color:'#F87171', label:'❌ Cancelled' },
};

const NEXT_STATUS = { pending:'confirmed', confirmed:'ready', ready:'completed' };
const NEXT_LABEL  = { pending:'Confirm Order', confirmed:'Mark Ready', ready:'Mark Completed' };

export default function Orders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    try { const { data } = await API.get('/orders'); setOrders(data.data || []); }
    catch { toast.error('Could not load orders.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const id = setInterval(load, 8000); return () => clearInterval(id); }, [load]);

  const updateStatus = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating(order._id);
    try {
      const { data } = await API.patch('/orders/' + order._id + '/status', { status: next });
      setOrders(prev => prev.map(o => o._id === order._id ? data.data : o));
      toast.success(`Order marked as ${next}!`);
    } catch { toast.error('Could not update order.'); }
    finally { setUpdating(null); }
  };

  const cancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    setUpdating(orderId);
    try {
      const { data } = await API.patch('/orders/' + orderId + '/status', { status: 'cancelled' });
      setOrders(prev => prev.map(o => o._id === orderId ? data.data : o));
      toast.success('Order cancelled.');
    } catch { toast.error('Could not cancel.'); }
    finally { setUpdating(null); }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const counts = orders.reduce((a, o) => ({ ...a, [o.status]: (a[o.status]||0) + 1 }), {});
  const pendingCount = counts.pending || 0;

  return (
    <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontWeight:800, fontSize:22, marginBottom:4 }}>🛒 Incoming Orders</h2>
          <p style={{ color:'var(--txt-2)', fontSize:13 }}>
            {pendingCount > 0 ? <span style={{ color:'#F59E0B', fontWeight:700 }}> ⚠️ {pendingCount} pending orders need attention</span> : 'All caught up!'} · Auto-refreshes every 8s
          </p>
        </div>
        <button onClick={load} style={{ padding:'9px 18px', borderRadius:11, background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.25)', color:'#a5b4fc', fontWeight:600, fontSize:13, cursor:'pointer' }}>🔄 Refresh</button>
      </div>

      {/* Status tabs */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {['all','pending','confirmed','ready','completed','cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding:'7px 16px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer', border:'none', transition:'all .18s', textTransform:'capitalize',
              background: filter===s ? (STATUS_STYLE[s]?.color || '#6366F1') : 'rgba(99,102,241,.08)',
              color: filter===s ? '#fff' : 'var(--txt-2)',
            }}>
            {s === 'all' ? `All (${orders.length})` : `${STATUS_STYLE[s]?.label || s} (${counts[s]||0})`}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[1,2,3].map(i => <div key={i} className="glass skel" style={{ height:160, borderRadius:16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{ padding:60, textAlign:'center', color:'var(--txt-2)' }}>
          <p style={{ fontSize:48, marginBottom:12 }}>📭</p>
          <p style={{ fontWeight:700, fontSize:18 }}>No orders yet</p>
          <p style={{ fontSize:13, marginTop:6 }}>Share your shop link with customers to start receiving orders!</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {filtered.map(order => {
            const s = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
            const nextLabel = NEXT_LABEL[order.status];
            return (
              <div key={order._id} className="glass card-enter" style={{ padding:'20px 22px', borderRadius:16, position:'relative', overflow:'hidden', border:`1px solid ${s.border}` }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${s.color},transparent)` }} />

                {/* Order header */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
                  <div>
                    <p style={{ fontWeight:800, fontSize:15, marginBottom:2 }}>
                      👤 {order.consumerName}
                      {order.consumerPhone && <span style={{ fontSize:12, color:'var(--txt-2)', fontWeight:400, marginLeft:8 }}>📞 {order.consumerPhone}</span>}
                    </p>
                    <p style={{ fontSize:12, color:'var(--txt-2)' }}>{new Date(order.createdAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                  </div>
                  <span style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}`, flexShrink:0 }}>{s.label}</span>
                </div>

                {/* Items */}
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'8px 12px', borderRadius:9, background:'rgba(99,102,241,.04)' }}>
                      <span><strong>{item.name}</strong> × {item.quantity} {item.unit}</span>
                      <span style={{ fontWeight:700 }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  {order.notes && <p style={{ fontSize:12, color:'#F59E0B', padding:'6px 12px', borderRadius:9, background:'rgba(245,158,11,.06)' }}>📝 {order.notes}</p>}
                </div>

                {/* Footer */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                  <p style={{ fontWeight:800, fontSize:18 }}>₹{order.total.toLocaleString('en-IN')} <span style={{ fontSize:12, color:'var(--txt-2)', fontWeight:400 }}>· Cash on pickup</span></p>
                  <div style={{ display:'flex', gap:8 }}>
                    {nextLabel && (
                      <button onClick={() => updateStatus(order)} disabled={!!updating}
                        style={{ padding:'9px 18px', borderRadius:11, background:`linear-gradient(135deg,${s.color},${s.color}bb)`, color: order.status==='ready' ? '#fff' : '#000', fontWeight:700, fontSize:13, border:'none', cursor:updating?'not-allowed':'pointer', opacity:updating===order._id?.7:1 }}>
                        {updating === order._id ? '⏳…' : nextLabel}
                      </button>
                    )}
                    {['pending','confirmed'].includes(order.status) && (
                      <button onClick={() => cancel(order._id)} disabled={!!updating}
                        style={{ padding:'9px 14px', borderRadius:11, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', color:'#F87171', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
