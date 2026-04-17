import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const CATEGORIES = ['Food & Beverages','Electronics','Clothing','Services','Groceries','Health & Beauty','Other'];

export default function AddSaleModal({ show, onClose, onAdded }) {
  const [form, setForm] = useState({
    amount:'', description:'', category:'Other',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const btnRef = useRef();

  if (!show) return null;

  const ripple = (e) => {
    const btn = btnRef.current, rect = btn.getBoundingClientRect();
    const r = document.createElement('span');
    r.className = 'btn-ripple';
    const size = Math.max(rect.width, rect.height);
    r.style.cssText=`width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    btn.appendChild(r); setTimeout(() => r.remove(), 600);
  };

  const reset = () => setForm({ amount:'', description:'', category:'Other', date:new Date().toISOString().split('T')[0] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Enter a valid amount.');
    setLoading(true);
    try {
      const { data } = await API.post('/sales', { ...form, amount: parseFloat(form.amount) });
      if (data.success) {
        toast.success('Sale recorded! 💰');
        onAdded(); onClose(); reset();
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add sale.'); }
    finally { setLoading(false); }
  };

  const inp = (extra='') =>
    `inp ${extra} ${focused ? '' : ''}`;

  return (
    <div className="modal-bg fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background:'rgba(0,0,0,.65)', backdropFilter:'blur(6px)' }}
      onClick={onClose}>
      <div className="modal-box glass w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span style={{ filter:'drop-shadow(0 0 8px rgba(99,102,241,.6))' }}>💰</span> Add Sale
          </h2>
          <button onClick={onClose} className="text-2xl" style={{ color:'var(--txt-2)' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: focused==='amt' ? 'var(--accent-2)' : 'var(--txt-2)', transition:'color .3s' }}>
              Amount (₹)
            </label>
            <input id="sale-amount" type="number" step="0.01" value={form.amount} placeholder="1500"
              className="inp" onFocus={()=>setFocused('amt')} onBlur={()=>setFocused('')}
              onChange={e=>setForm({...form,amount:e.target.value})} />
          </div>
          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: focused==='desc' ? 'var(--accent-2)' : 'var(--txt-2)', transition:'color .3s' }}>
              Description
            </label>
            <input id="sale-description" type="text" value={form.description} placeholder="Sold Product X"
              className="inp" onFocus={()=>setFocused('desc')} onBlur={()=>setFocused('')}
              onChange={e=>setForm({...form,description:e.target.value})} />
          </div>
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color:'var(--txt-2)' }}>Category</label>
            <select id="sale-category" value={form.category}
              onChange={e=>setForm({...form,category:e.target.value})}
              className="inp cursor-pointer appearance-none"
              style={{ colorScheme:'dark' }}>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {/* Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color:'var(--txt-2)' }}>Date</label>
            <input id="sale-date" type="date" value={form.date}
              onChange={e=>setForm({...form,date:e.target.value})}
              className="inp" style={{ colorScheme:'dark' }} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-white/5"
              style={{ border:'1px solid var(--border)', color:'var(--txt-2)' }}>
              Cancel
            </button>
            <button id="sale-submit" ref={btnRef} type="submit" disabled={loading}
              className="btn flex-1 py-3 rounded-xl" onClick={ripple}>
              {loading ? 'Adding…' : 'Add Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
