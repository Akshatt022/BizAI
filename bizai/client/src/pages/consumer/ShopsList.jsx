import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

const CATEGORIES = ['All','Kirana / Grocery','General Store','Food & Beverages','Clothing','Electronics','Health & Beauty','Pharmacy','Hardware','Other'];

export default function ShopsList() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [shops,   setShops]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [catFilter, setCat]   = useState('All');

  useEffect(() => { fetchShops(); }, []);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/shops');
      setShops(data.data || []);
    } catch { setShops([]); } finally { setLoading(false); }
  };

  const filtered = shops.filter(s => {
    const matchSearch = s.businessName?.toLowerCase().includes(search.toLowerCase()) ||
                        s.shopAddress?.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'All' || s.shopCategory === catFilter;
    return matchSearch && matchCat;
  });

  const catColors = { 'Kirana / Grocery':'#10B981','Food & Beverages':'#F59E0B','Clothing':'#8B5CF6','Electronics':'#06B6D4','Health & Beauty':'#EC4899','Pharmacy':'#EF4444','Hardware':'#F97316','General Store':'#6366F1','Other':'#64748B' };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--txt)' }}>
      {/* Top bar */}
      <div style={{ padding:'16px 24px', borderBottom:'1px solid rgba(99,102,241,.12)', background:'rgba(13,18,30,.9)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#6366F1,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>⚡</div>
          <div>
            <p style={{ fontWeight:800, fontSize:16 }}>BizAI Shop</p>
            <p style={{ fontSize:11, color:'var(--txt-2)' }}>Browse local shops near you</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate('/consumer/orders')}
            style={{ padding:'8px 16px', borderRadius:10, background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.25)', color:'#a5b4fc', fontWeight:600, fontSize:13, cursor:'pointer' }}>
            📦 My Orders
          </button>
          <button onClick={logout}
            style={{ padding:'8px 16px', borderRadius:10, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', color:'#F87171', fontWeight:600, fontSize:13, cursor:'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 20px' }}>
        {/* Welcome banner */}
        <div className="glass" style={{ padding:'24px 28px', marginBottom:28, background:'linear-gradient(135deg,rgba(99,102,241,.08),rgba(124,58,237,.08))', border:'1px solid rgba(99,102,241,.2)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 style={{ fontWeight:800, fontSize:22, marginBottom:4 }}>Welcome back, {user?.name || 'Customer'}! 👋</h1>
            <p style={{ color:'var(--txt-2)', fontSize:14 }}>Browse {shops.length} local shops. Reserve items online, pick up in-store.</p>
          </div>
          <div style={{ fontSize:48 }}>🛒</div>
        </div>

        {/* Search + Filter */}
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search shops by name or area…"
            style={{ flex:1, minWidth:200, padding:'11px 16px', borderRadius:11, background:'rgba(15,23,42,.85)', border:'1px solid rgba(99,102,241,.25)', color:'var(--txt)', fontSize:14, outline:'none' }} />
        </div>

        {/* Category chips */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', border:'none', transition:'all .18s',
                background: catFilter===c ? (catColors[c]||'#6366F1') : 'rgba(99,102,241,.08)',
                color: catFilter===c ? '#fff' : 'var(--txt-2)',
                boxShadow: catFilter===c ? `0 4px 12px ${catColors[c]||'#6366F1'}44` : 'none',
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* Shops grid */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="glass skel" style={{ height:180, borderRadius:16 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass" style={{ padding:60, textAlign:'center', color:'var(--txt-2)' }}>
            <p style={{ fontSize:48, marginBottom:12 }}>🏪</p>
            <p style={{ fontWeight:700, fontSize:18 }}>No shops found</p>
            <p style={{ fontSize:13, marginTop:6 }}>Try a different search or category</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {filtered.map(shop => {
              const color = catColors[shop.shopCategory] || '#6366F1';
              return (
                <div key={shop._id} onClick={() => navigate('/consumer/shop/' + shop._id)}
                  className="glass hover-lift" style={{ padding:'22px', borderRadius:16, cursor:'pointer', position:'relative', overflow:'hidden', transition:'all .22s' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${color},${color}66)` }} />

                  <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
                    <div style={{ width:48,height:48,borderRadius:13,background:`${color}18`,border:`1px solid ${color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>
                      🏪
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <h2 style={{ fontWeight:800, fontSize:16, marginBottom:3 }}>{shop.businessName}</h2>
                      <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:`${color}18`, color, border:`1px solid ${color}30` }}>
                        {shop.shopCategory}
                      </span>
                    </div>
                  </div>

                  {shop.shopAddress && (
                    <p style={{ fontSize:12, color:'var(--txt-2)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                      📍 {shop.shopAddress}
                    </p>
                  )}
                  {shop.shopPhone && (
                    <p style={{ fontSize:12, color:'var(--txt-2)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                      📞 {shop.shopPhone}
                    </p>
                  )}

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:12, color:'var(--txt-2)' }}>
                      {shop.productCount || 0} items in stock
                    </span>
                    <span style={{ fontSize:12, fontWeight:700, padding:'4px 10px', borderRadius:20, background: shop.isOpen ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)', color: shop.isOpen ? '#10B981' : '#EF4444', border:`1px solid ${shop.isOpen ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}` }}>
                      {shop.isOpen ? '🟢 Open' : '🔴 Closed'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
