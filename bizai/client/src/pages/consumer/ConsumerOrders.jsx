import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

const STATUS_STYLE = {
  pending:   { bg:'rgba(245,158,11,.1)',  border:'rgba(245,158,11,.3)',  color:'#F59E0B', label:'⏳ Pending' },
  confirmed: { bg:'rgba(99,102,241,.1)',  border:'rgba(99,102,241,.3)',  color:'#818CF8', label:'✅ Confirmed' },
  ready:     { bg:'rgba(16,185,129,.1)',  border:'rgba(16,185,129,.3)',  color:'#10B981', label:'📦 Ready for pickup' },
  completed: { bg:'rgba(16,185,129,.06)', border:'rgba(16,185,129,.2)',  color:'#6EE7B7', label:'🎉 Completed' },
  cancelled: { bg:'rgba(239,68,68,.08)', border:'rgba(239,68,68,.2)',   color:'#F87171', label:'❌ Cancelled' },
};

export default function ConsumerOrders() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/orders/mine')
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--txt)' }}>
      <div style={{ padding:'16px 24px', borderBottom:'1px solid rgba(99,102,241,.12)', background:'rgba(13,18,30,.9)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <button onClick={() => navigate('/consumer')} style={{ background:'none', border:'none', color:'var(--txt-2)', cursor:'pointer', fontSize:14 }}>← All Shops</button>
        <h1 style={{ fontWeight:800, fontSize:18 }}>📦 My Orders</h1>
        <button onClick={logout} style={{ padding:'8px 16px', borderRadius:10, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', color:'#F87171', fontSize:13, fontWeight:600, cursor:'pointer' }}>Logout</button>
      </div>

      <div style={{ maxWidth:700, margin:'0 auto', padding:'28px 20px' }}>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[1,2,3].map(i => <div key={i} className="glass skel" style={{ height:140, borderRadius:16 }} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="glass" style={{ padding:60, textAlign:'center', color:'var(--txt-2)' }}>
            <p style={{ fontSize:48, marginBottom:16 }}>📭</p>
            <p style={{ fontWeight:700, fontSize:18 }}>No orders yet</p>
            <p style={{ fontSize:13, marginTop:6, marginBottom:24 }}>Browse shops and place your first order!</p>
            <button onClick={() => navigate('/consumer')} style={{ padding:'12px 24px', borderRadius:12, background:'linear-gradient(135deg,#6366F1,#7c3aed)', color:'#fff', fontWeight:700, fontSize:14, border:'none', cursor:'pointer' }}>
              Browse Shops
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {orders.map(order => {
              const s = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
              return (
                <div key={order._id} className="glass" style={{ padding:'20px 22px', borderRadius:16, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${s.color},transparent)` }} />

                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
                    <div>
                      <h3 style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>{order.shopId?.businessName || 'Shop'}</h3>
                      <p style={{ fontSize:12, color:'var(--txt-2)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                    </div>
                    <span style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>{s.label}</span>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                        <span style={{ color:'var(--txt-2)' }}>{item.name} × {item.quantity}</span>
                        <span style={{ fontWeight:600 }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop:'1px solid rgba(99,102,241,.12)', paddingTop:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      {order.notes && <p style={{ fontSize:12, color:'var(--txt-2)' }}>📝 {order.notes}</p>}
                      {order.shopId?.shopAddress && <p style={{ fontSize:12, color:'var(--txt-2)', marginTop:4 }}>📍 {order.shopId.shopAddress}</p>}
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontSize:12, color:'var(--txt-2)' }}>Total</p>
                      <p style={{ fontWeight:800, fontSize:18 }}>₹{order.total.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {order.status === 'ready' && (
                    <div style={{ marginTop:12, padding:'12px 16px', borderRadius:12, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.3)', textAlign:'center', fontSize:13, fontWeight:700, color:'#10B981' }}>
                      🎉 Your order is ready! Head to the shop now to pick it up.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
