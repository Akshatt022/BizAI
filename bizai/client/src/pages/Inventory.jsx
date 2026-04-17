import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['General','Food & Beverages','Clothing','Electronics','Groceries','Health & Beauty','Hardware','Other'];
const UNITS      = ['piece','kg','gram','litre','ml','dozen','pack','box','bottle'];

function ProductModal({ show, onClose, onSaved, existing }) {
  const [form, setForm] = useState({ name:'', description:'', price:'', stock:'', category:'General', unit:'piece' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) setForm({ name:existing.name, description:existing.description||'', price:existing.price, stock:existing.stock, category:existing.category||'General', unit:existing.unit||'piece' });
    else          setForm({ name:'', description:'', price:'', stock:'', category:'General', unit:'piece' });
  }, [existing, show]);

  if (!show) return null;

  const save = async () => {
    if (!form.name || form.price === '') return toast.error('Name and price are required.');
    setSaving(true);
    try {
      if (existing) await API.put('/products/' + existing._id, form);
      else          await API.post('/products', form);
      toast.success(existing ? 'Product updated!' : 'Product added!');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving product.'); }
    finally { setSaving(false); }
  };

  const inp = { width:'100%', padding:'10px 13px', borderRadius:10, background:'rgba(15,23,42,.85)', border:'1px solid rgba(99,102,241,.25)', color:'var(--txt)', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }} onClick={onClose}>
      <div className="glass" onClick={e=>e.stopPropagation()} style={{ width:'100%',maxWidth:480,padding:'28px',borderRadius:20,border:'1px solid rgba(99,102,241,.25)' }}>
        <h2 style={{ fontWeight:800, fontSize:18, marginBottom:18 }}>{existing ? '✏️ Edit Product' : '➕ Add New Product'}</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input style={inp} placeholder="Product name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
          <input style={inp} placeholder="Description (optional)" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <input style={inp} type="number" placeholder="Price (₹) *" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} />
            <input style={inp} type="number" placeholder="Stock qty" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <select style={{...inp,appearance:'none'}} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
            <select style={{...inp,appearance:'none'}} value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
              {UNITS.map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:6 }}>
            <button onClick={onClose} style={{ flex:1,padding:'12px',borderRadius:11,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',color:'var(--txt-2)',fontWeight:600,cursor:'pointer' }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ flex:2,padding:'12px',borderRadius:11,background:'linear-gradient(135deg,#6366F1,#7c3aed)',color:'#fff',fontWeight:700,border:'none',cursor:saving?'not-allowed':'pointer',opacity:saving?.7:1 }}>
              {saving ? '⏳ Saving…' : existing ? '✅ Update' : '➕ Add Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]  = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await API.get('/products'); setProducts(data.data || []); }
    catch { toast.error('Could not load products.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await API.delete('/products/' + id); toast.success('Product deleted.'); setProducts(p => p.filter(x => x._id !== id)); }
    catch { toast.error('Could not delete.'); }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const inStockCount = products.filter(p => p.inStock).length;

  return (
    <>
      <ProductModal show={showModal} onClose={() => { setShowModal(false); setEditing(null); }} onSaved={() => { setShowModal(false); setEditing(null); load(); }} existing={editing} />

      <div style={{ padding:28, display:'flex', flexDirection:'column', gap:20 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h2 style={{ fontWeight:800, fontSize:22, marginBottom:4 }}>📦 Inventory</h2>
            <p style={{ color:'var(--txt-2)', fontSize:13 }}>{inStockCount} items in stock · {products.length} total products</p>
          </div>
          <button id="add-product-btn" onClick={() => { setEditing(null); setShowModal(true); }}
            style={{ padding:'11px 22px', borderRadius:12, background:'linear-gradient(135deg,#6366F1,#7c3aed)', color:'#fff', fontWeight:700, fontSize:14, border:'none', cursor:'pointer', boxShadow:'0 4px 16px rgba(99,102,241,.4)' }}>
            ➕ Add Product
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
          {[
            { label:'Total Products',  value: products.length,     color:'#6366F1', icon:'📦' },
            { label:'In Stock',        value: inStockCount,        color:'#10B981', icon:'✅' },
            { label:'Out of Stock',    value: products.length - inStockCount, color:'#EF4444', icon:'⚠️' },
            { label:'Total Value',     value: `₹${products.reduce((t,p) => t + p.price * p.stock, 0).toLocaleString('en-IN')}`, color:'#F59E0B', icon:'💰' },
          ].map((s,i) => (
            <div key={i} className="glass card-enter hover-lift" style={{ padding:'16px 18px', position:'relative', overflow:'hidden', animationDelay:`${i*60}ms` }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${s.color},transparent)` }} />
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <span style={{ fontSize:18, width:32, height:32, borderRadius:8, background:`${s.color}15`, border:`1px solid ${s.color}25`, display:'flex', alignItems:'center', justifyContent:'center' }}>{s.icon}</span>
                <span style={{ fontSize:12, color:'var(--txt-2)' }}>{s.label}</span>
              </div>
              <p style={{ fontWeight:800, fontSize:20, color:s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search products…"
          style={{ padding:'11px 16px', borderRadius:12, background:'rgba(15,23,42,.85)', border:'1px solid rgba(99,102,241,.25)', color:'var(--txt)', fontSize:14, outline:'none' }} />

        {/* Table */}
        <div className="glass table-scroll" style={{ borderRadius:16 }}>
          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'var(--txt-2)' }}>⏳ Loading inventory…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:60, textAlign:'center', color:'var(--txt-2)' }}>
              <p style={{ fontSize:40, marginBottom:12 }}>📦</p>
              <p style={{ fontWeight:700 }}>No products yet</p>
              <p style={{ fontSize:13, marginTop:6 }}>Click "Add Product" to start building your inventory!</p>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(99,102,241,.15)', background:'rgba(99,102,241,.04)' }}>
                  {['Product','Category','Price','Stock','Status','Actions'].map(h => (
                    <th key={h} style={{ padding:'14px 16px', textAlign:'left', fontSize:12, fontWeight:700, color:'var(--txt-2)', textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p._id} style={{ borderBottom:'1px solid rgba(99,102,241,.08)', background: i%2===0 ? 'transparent' : 'rgba(99,102,241,.02)', transition:'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,.05)'}
                    onMouseLeave={e => e.currentTarget.style.background= i%2===0 ? 'transparent' : 'rgba(99,102,241,.02)'}>
                    <td style={{ padding:'13px 16px' }}>
                      <p style={{ fontWeight:600, fontSize:14 }}>{p.name}</p>
                      {p.description && <p style={{ fontSize:11, color:'var(--txt-2)', marginTop:1 }}>{p.description.substring(0,40)}{p.description.length>40?'…':''}</p>}
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(99,102,241,.1)', color:'#a5b4fc' }}>{p.category}</span>
                    </td>
                    <td style={{ padding:'13px 16px', fontWeight:700 }}>₹{p.price.toLocaleString('en-IN')}<span style={{ fontSize:11, color:'var(--txt-2)', fontWeight:400 }}>/{p.unit}</span></td>
                    <td style={{ padding:'13px 16px', fontWeight:600 }}>{p.stock}</td>
                    <td style={{ padding:'13px 16px' }}>
                      <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:700, background: p.inStock ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)', color: p.inStock ? '#10B981' : '#EF4444' }}>
                        {p.inStock ? '✅ In Stock' : '⚠️ Out'}
                      </span>
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => { setEditing(p); setShowModal(true); }}
                          style={{ padding:'6px 12px', borderRadius:8, background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.2)', color:'#a5b4fc', fontSize:12, fontWeight:600, cursor:'pointer' }}>Edit</button>
                        <button onClick={() => handleDelete(p._id)}
                          style={{ padding:'6px 12px', borderRadius:8, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', color:'#F87171', fontSize:12, fontWeight:600, cursor:'pointer' }}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
