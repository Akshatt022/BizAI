import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const CAT_COLORS = { 'Food & Beverages':'#F59E0B','Clothing':'#8B5CF6','Electronics':'#06B6D4','Health & Beauty':'#EC4899','Groceries':'#10B981','General':'#6366F1' };

export default function ShopPage() {
  const { shopId }  = useParams();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [shop,      setShop]      = useState(null);
  const [products,  setProducts]  = useState([]);
  const [cart,      setCart]      = useState({});     // { productId: qty }
  const [catFilter, setCatFilter] = useState('All');
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [placing,   setPlacing]   = useState(false);
  const [showCart,  setShowCart]  = useState(false);
  const [phone,     setPhone]     = useState('');
  const [notes,     setNotes]     = useState('');

  useEffect(() => {
    API.get('/shops/' + shopId)
      .then(({ data }) => { setShop(data.data.shop); setProducts(data.data.products); })
      .catch(() => toast.error('Shop not found.'))
      .finally(() => setLoading(false));
  }, [shopId]);

  const addToCart  = (pid) => setCart(c => ({ ...c, [pid]: (c[pid] || 0) + 1 }));
  const removeOne  = (pid) => setCart(c => { const n = {...c}; if (n[pid] > 1) n[pid]--; else delete n[pid]; return n; });

  const cartItems  = Object.entries(cart).map(([pid, qty]) => ({ product: products.find(p => p._id === pid), qty })).filter(i => i.product);
  const cartTotal  = cartItems.reduce((t, {product, qty}) => t + product.price * qty, 0);
  const cartCount  = cartItems.reduce((t, {qty}) => t + qty, 0);

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered   = products.filter(p => {
    const matchCat    = catFilter === 'All' || p.category === catFilter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const placeOrder = async () => {
    if (!cartItems.length) return;
    setPlacing(true);
    try {
      const items = cartItems.map(({product, qty}) => ({ productId: product._id, name: product.name, quantity: qty }));
      await API.post('/orders', { shopId, items, notes, consumerPhone: phone });
      toast.success('🎉 Order placed! The shop will prepare your items. Come pick them up!');
      setCart({}); setShowCart(false); setNotes(''); setPhone('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not place order.');
    } finally { setPlacing(false); }
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',color:'var(--txt-2)'}}>Loading shop…</div>;
  if (!shop) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',color:'var(--txt-2)'}}>Shop not found.</div>;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--txt)' }}>
      {/* Top bar */}
      <div style={{ padding:'14px 24px', borderBottom:'1px solid rgba(99,102,241,.12)', background:'rgba(13,18,30,.9)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <button onClick={() => navigate('/consumer')} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', color:'var(--txt-2)', cursor:'pointer', fontSize:14 }}>
          ← All Shops
        </button>
        <button onClick={() => setShowCart(true)} disabled={!cartCount}
          style={{ padding:'10px 20px', borderRadius:11, background: cartCount ? 'linear-gradient(135deg,#6366F1,#7c3aed)' : 'rgba(99,102,241,.08)', border: cartCount ? 'none' : '1px solid rgba(99,102,241,.2)', color: cartCount ? '#fff' : 'var(--txt-2)', fontWeight:700, fontSize:14, cursor: cartCount ? 'pointer' : 'default', boxShadow: cartCount ? '0 4px 14px rgba(99,102,241,.4)' : 'none', transition:'all .2s' }}>
          🛒 Cart ({cartCount}) · ₹{cartTotal.toLocaleString('en-IN')}
        </button>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 20px' }}>
        {/* Shop header */}
        <div className="glass" style={{ padding:'24px 28px', marginBottom:24, background:'linear-gradient(135deg,rgba(99,102,241,.06),rgba(124,58,237,.06))', border:'1px solid rgba(99,102,241,.18)', borderRadius:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:18, marginBottom:shop.shopDescription ? 12 : 0 }}>
            <div style={{ width:60,height:60,borderRadius:16,background:'linear-gradient(135deg,#6366F1,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,boxShadow:'0 0 20px rgba(99,102,241,.35)' }}>🏪</div>
            <div>
              <h1 style={{ fontWeight:900, fontSize:24, marginBottom:4 }}>{shop.businessName}</h1>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {shop.shopCategory && <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:'rgba(99,102,241,.15)', color:'#a5b4fc' }}>{shop.shopCategory}</span>}
                <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background: shop.isOpen ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)', color: shop.isOpen ? '#10B981' : '#EF4444' }}>{shop.isOpen ? '🟢 Open Now' : '🔴 Closed'}</span>
                {shop.shopAddress && <span style={{ fontSize:12, color:'var(--txt-2)' }}>📍 {shop.shopAddress}</span>}
                {shop.shopPhone && <span style={{ fontSize:12, color:'var(--txt-2)' }}>📞 {shop.shopPhone}</span>}
              </div>
            </div>
          </div>
          {shop.shopDescription && <p style={{ fontSize:13, color:'var(--txt-2)', marginTop:4 }}>{shop.shopDescription}</p>}
        </div>

        {/* Search + category */}
        <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search items…"
            style={{ flex:1, minWidth:180, padding:'10px 14px', borderRadius:10, background:'rgba(15,23,42,.85)', border:'1px solid rgba(99,102,241,.25)', color:'var(--txt)', fontSize:13, outline:'none' }} />
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', border:'none', background: catFilter===c ? '#6366F1' : 'rgba(99,102,241,.08)', color: catFilter===c ? '#fff' : 'var(--txt-2)', transition:'all .15s' }}>
              {c}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div className="glass" style={{ padding:48, textAlign:'center', color:'var(--txt-2)' }}>
            <p style={{ fontSize:40, marginBottom:12 }}>📦</p>
            <p>No items found.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
            {filtered.map(p => {
              const qty   = cart[p._id] || 0;
              const color = CAT_COLORS[p.category] || '#6366F1';
              return (
                <div key={p._id} className="glass hover-lift" style={{ padding:'18px', borderRadius:14, position:'relative', overflow:'hidden', opacity: p.inStock ? 1 : .5 }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},transparent)` }} />

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <span style={{ fontSize:11, padding:'2px 9px', borderRadius:20, background:`${color}15`, color, fontWeight:600 }}>{p.category}</span>
                    {!p.inStock && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'rgba(239,68,68,.1)', color:'#EF4444' }}>Out of stock</span>}
                  </div>

                  <h3 style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{p.name}</h3>
                  {p.description && <p style={{ fontSize:11, color:'var(--txt-2)', marginBottom:10, lineHeight:1.5 }}>{p.description}</p>}

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
                    <div>
                      <p style={{ fontWeight:800, fontSize:18, color }}>₹{p.price.toLocaleString('en-IN')}</p>
                      <p style={{ fontSize:11, color:'var(--txt-2)' }}>per {p.unit}</p>
                    </div>

                    {p.inStock && (
                      qty === 0 ? (
                        <button onClick={() => addToCart(p._id)}
                          style={{ padding:'8px 16px', borderRadius:10, background:`linear-gradient(135deg,#6366F1,#7c3aed)`, color:'#fff', fontWeight:700, fontSize:13, border:'none', cursor:'pointer', boxShadow:'0 4px 12px rgba(99,102,241,.35)' }}>
                          + Add
                        </button>
                      ) : (
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <button onClick={() => removeOne(p._id)} style={{ width:30,height:30,borderRadius:8,background:'rgba(99,102,241,.12)',border:'none',color:'#a5b4fc',fontWeight:700,fontSize:16,cursor:'pointer' }}>−</button>
                          <span style={{ fontWeight:800, fontSize:15, minWidth:20, textAlign:'center' }}>{qty}</span>
                          <button onClick={() => addToCart(p._id)} style={{ width:30,height:30,borderRadius:8,background:'rgba(99,102,241,.12)',border:'none',color:'#a5b4fc',fontWeight:700,fontSize:16,cursor:'pointer' }}>+</button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart drawer */}
      {showCart && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:100,display:'flex',alignItems:'flex-end',justifyContent:'flex-end' }} onClick={() => setShowCart(false)}>
          <div onClick={e=>e.stopPropagation()} className="glass" style={{ width:420,maxWidth:'100vw',height:'100vh',padding:'28px',display:'flex',flexDirection:'column',gap:16,background:'rgba(13,18,30,.98)',borderLeft:'1px solid rgba(99,102,241,.25)',overflow:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <h2 style={{ fontWeight:800, fontSize:18 }}>🛒 Your Order</h2>
              <button onClick={() => setShowCart(false)} style={{ background:'none',border:'none',color:'var(--txt-2)',fontSize:20,cursor:'pointer' }}>✕</button>
            </div>

            <p style={{ fontSize:13, color:'var(--txt-2)' }}>
              From <strong style={{ color:'#a5b4fc' }}>{shop.businessName}</strong> — Pay when you pick up!
            </p>

            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, overflow:'auto' }}>
              {cartItems.map(({product, qty}) => (
                <div key={product._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:12, background:'rgba(99,102,241,.06)', border:'1px solid rgba(99,102,241,.12)' }}>
                  <div>
                    <p style={{ fontWeight:600, fontSize:13 }}>{product.name}</p>
                    <p style={{ fontSize:12, color:'var(--txt-2)' }}>₹{product.price} × {qty}</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button onClick={() => removeOne(product._id)} style={{ width:26,height:26,borderRadius:7,background:'rgba(99,102,241,.12)',border:'none',color:'#a5b4fc',fontWeight:700,cursor:'pointer' }}>−</button>
                    <span style={{ fontWeight:700, minWidth:16, textAlign:'center' }}>{qty}</span>
                    <button onClick={() => addToCart(product._id)} style={{ width:26,height:26,borderRadius:7,background:'rgba(99,102,241,.12)',border:'none',color:'#a5b4fc',fontWeight:700,cursor:'pointer' }}>+</button>
                    <p style={{ fontWeight:800, minWidth:60, textAlign:'right' }}>₹{(product.price*qty).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop:'1px solid rgba(99,102,241,.15)', paddingTop:16, display:'flex', flexDirection:'column', gap:12 }}>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="📞 Your phone number (optional)"
                style={{ padding:'10px 14px', borderRadius:10, background:'rgba(15,23,42,.85)', border:'1px solid rgba(99,102,241,.25)', color:'var(--txt)', fontSize:13, outline:'none' }} />
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="📝 Any special notes? (optional)" rows={2}
                style={{ padding:'10px 14px', borderRadius:10, background:'rgba(15,23,42,.85)', border:'1px solid rgba(99,102,241,.25)', color:'var(--txt)', fontSize:13, outline:'none', resize:'none', fontFamily:'inherit' }} />

              <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:800 }}>
                <span>Total</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>

              <button onClick={placeOrder} disabled={placing}
                style={{ padding:'14px', borderRadius:12, background:'linear-gradient(135deg,#10B981,#059669)', color:'#fff', fontWeight:800, fontSize:15, border:'none', cursor:placing?'not-allowed':'pointer', opacity:placing?.7:1, boxShadow:'0 4px 18px rgba(16,185,129,.4)' }}>
                {placing ? '⏳ Placing order…' : '✅ Place Order — Pay at Pickup'}
              </button>

              <p style={{ fontSize:11, color:'var(--txt-2)', textAlign:'center' }}>No payment now. Come to the shop, show this order, pay & collect.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
