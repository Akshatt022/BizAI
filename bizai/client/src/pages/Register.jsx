import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [role,     setRole]    = useState('seller');
  const [form,     setForm]    = useState({ name:'', email:'', password:'', businessName:'', shopAddress:'', shopPhone:'', shopCategory:'General Store' });
  const [loading,  setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all required fields.');
    if (role === 'seller' && !form.businessName)    return toast.error('Shop name is required.');
    setLoading(true);
    try {
      await login({ ...form, role }, true); // true = isRegister
      toast.success('Account created! Welcome to BizAI 🎉');
      navigate(role === 'consumer' ? '/consumer' : '/');
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const inp = {
    width: '100%', padding: '12px 16px', borderRadius: 11,
    background: 'rgba(15,23,42,.85)', border: '1px solid rgba(99,102,241,.25)',
    color: '#e2e8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:20, position:'relative', overflow:'hidden' }}>
      {/* background orbs */}
      {[{top:'10%',left:'5%',w:340},{top:'60%',right:'5%',w:280,color:'#7c3aed'}].map((o,i)=>(
        <div key={i} className="orb" style={{ width:o.w,height:o.w,top:o.top,left:o.left,right:o.right,background:`radial-gradient(circle,${o.color||'#6366F1'}22,transparent 70%)` }} />
      ))}

      <div className="glass" style={{ width:'100%', maxWidth:460, padding:'36px 38px', position:'relative', zIndex:10 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52,height:52,borderRadius:14,background:'linear-gradient(135deg,#6366F1,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,margin:'0 auto 12px',boxShadow:'0 0 24px rgba(99,102,241,.4)' }}>⚡</div>
          <h1 style={{ fontWeight:800, fontSize:22 }}>Create your BizAI account</h1>
          <p style={{ color:'var(--txt-2)', fontSize:13, marginTop:4 }}>Join thousands of local businesses</p>
        </div>

        {/* Role toggle */}
        <div style={{ display:'flex', gap:8, marginBottom:24, background:'rgba(99,102,241,.06)', padding:5, borderRadius:12, border:'1px solid rgba(99,102,241,.15)' }}>
          {[{id:'seller',label:'🏪 I\'m a Shop Owner',sub:'Sell & manage inventory'},{id:'consumer',label:'🛒 I\'m a Customer',sub:'Browse & order from shops'}].map(r => (
            <button key={r.id} onClick={() => setRole(r.id)} type="button"
              style={{ flex:1, padding:'12px 8px', borderRadius:9, border:'none', cursor:'pointer', textAlign:'center', transition:'all .2s',
                background: role===r.id ? 'linear-gradient(135deg,#6366F1,#7c3aed)' : 'transparent',
                color: role===r.id ? '#fff' : 'var(--txt-2)',
                boxShadow: role===r.id ? '0 4px 14px rgba(99,102,241,.35)' : 'none',
              }}>
              <p style={{ fontWeight:700, fontSize:13 }}>{r.label}</p>
              <p style={{ fontSize:11, opacity:.75, marginTop:2 }}>{r.sub}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <input style={inp} placeholder="Full Name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            <input style={inp} type="email" placeholder="Email *" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
          </div>
          <input style={inp} type="password" placeholder="Password (min 6 chars) *" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />

          {role === 'seller' && (
            <>
              <input style={inp} placeholder="Shop Name *" value={form.businessName} onChange={e=>setForm(f=>({...f,businessName:e.target.value}))} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <input style={inp} placeholder="Address (optional)" value={form.shopAddress} onChange={e=>setForm(f=>({...f,shopAddress:e.target.value}))} />
                <input style={inp} placeholder="Phone (optional)" value={form.shopPhone} onChange={e=>setForm(f=>({...f,shopPhone:e.target.value}))} />
              </div>
              <select style={{...inp, appearance:'none'}} value={form.shopCategory} onChange={e=>setForm(f=>({...f,shopCategory:e.target.value}))}>
                {['General Store','Kirana / Grocery','Clothing','Electronics','Food & Beverages','Health & Beauty','Hardware','Pharmacy','Other'].map(c=>(
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </>
          )}

          <button type="submit" disabled={loading}
            style={{ marginTop:6, padding:'14px', borderRadius:12, background:'linear-gradient(135deg,#6366F1,#7c3aed)', color:'#fff', fontWeight:800, fontSize:15, border:'none', cursor:loading?'not-allowed':'pointer', opacity:loading?.7:1, boxShadow:'0 4px 20px rgba(99,102,241,.4)', transition:'all .2s' }}>
            {loading ? '⏳ Creating account…' : `🚀 Create ${role === 'seller' ? 'Seller' : 'Customer'} Account`}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--txt-2)' }}>
          Already have an account? <Link to="/login" style={{ color:'#a5b4fc', fontWeight:600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
