import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import API from '../api/axios';

export default function AddCustomerModal({ show, onClose, onAdded }) {
  const [form, setForm]     = useState({ name:'', email:'', isNewCustomer:true });
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const btnRef = useRef();

  if (!show) return null;

  const ripple = (e) => {
    const btn = btnRef.current, rect = btn.getBoundingClientRect();
    const r = document.createElement('span');
    r.className = 'btn-ripple';
    const s = Math.max(rect.width, rect.height);
    r.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-rect.left-s/2}px;top:${e.clientY-rect.top-s/2}px`;
    btn.appendChild(r); setTimeout(() => r.remove(), 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Customer name is required.');
    setLoading(true);
    try {
      const { data } = await API.post('/customers', form);
      if (data.success) {
        toast.success('Customer added! 👤');
        onAdded(); onClose();
        setForm({ name:'', email:'', isNewCustomer:true });
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add customer.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-bg fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background:'rgba(0,0,0,.65)', backdropFilter:'blur(6px)' }}
      onClick={onClose}>
      <div className="modal-box glass w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span style={{ filter:'drop-shadow(0 0 8px rgba(16,185,129,.6))' }}>👤</span> Add Customer
          </h2>
          <button onClick={onClose} className="text-2xl" style={{ color:'var(--txt-2)' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: focused==='name' ? 'var(--accent-2)' : 'var(--txt-2)', transition:'color .3s' }}>
              Customer Name
            </label>
            <input id="customer-name" type="text" value={form.name} placeholder="Jane Doe"
              className="inp" onFocus={()=>setFocused('name')} onBlur={()=>setFocused('')}
              onChange={e=>setForm({...form,name:e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: focused==='email' ? 'var(--accent-2)' : 'var(--txt-2)', transition:'color .3s' }}>
              Email <span style={{ color:'rgba(148,163,184,.5)', fontWeight:400 }}>(optional)</span>
            </label>
            <input id="customer-email" type="email" value={form.email} placeholder="jane@email.com"
              className="inp" onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')}
              onChange={e=>setForm({...form,email:e.target.value})} />
          </div>

          {/* Type toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color:'var(--txt-2)' }}>
              Customer Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val:true,  icon:'🆕', label:'New Customer' },
                { val:false, icon:'🔄', label:'Returning'    },
              ].map(opt => (
                <button key={String(opt.val)} type="button"
                  onClick={()=>setForm({...form,isNewCustomer:opt.val})}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all"
                  style={{
                    border:`1px solid ${form.isNewCustomer===opt.val
                      ? (opt.val ? 'var(--accent)' : 'var(--success)')
                      : 'rgba(51,65,85,.8)'}`,
                    background: form.isNewCustomer===opt.val
                      ? (opt.val ? 'rgba(99,102,241,.15)' : 'rgba(16,185,129,.15)')
                      : 'transparent',
                    color: form.isNewCustomer===opt.val
                      ? (opt.val ? 'var(--accent-2)' : 'var(--success)')
                      : 'var(--txt-2)',
                    transform: form.isNewCustomer===opt.val ? 'scale(1.02)' : 'scale(1)',
                  }}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-white/5"
              style={{ border:'1px solid var(--border)', color:'var(--txt-2)' }}>
              Cancel
            </button>
            <button id="customer-submit" ref={btnRef} type="submit" disabled={loading}
              className="btn flex-1 py-3 rounded-xl" onClick={ripple}>
              {loading ? 'Adding…' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
