import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import AddSaleModal from '../components/AddSaleModal';

const CATEGORY_ICONS = { 'Food & Beverages':'🍔','Electronics':'⚡','Clothing':'👗','Services':'🔧','Groceries':'🛒','Health & Beauty':'💄','Other':'📦' };
const CATEGORIES = ['All', 'Food & Beverages', 'Electronics', 'Clothing', 'Services', 'Groceries', 'Health & Beauty', 'Other'];

export default function Sales() {
  const [sales, setSales]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter]       = useState('All');
  const [search, setSearch]       = useState('');
  const [deleting, setDeleting]   = useState(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/sales');
      setSales(data.data || []);
    } catch { toast.error('Could not load sales.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale?')) return;
    setDeleting(id);
    try {
      await API.delete(`/sales/${id}`);
      setSales(prev => prev.filter(s => s._id !== id));
      toast.success('Sale deleted.');
    } catch { toast.error('Could not delete sale.'); }
    finally { setDeleting(null); }
  };

  const filtered = sales.filter(s => {
    const matchCat = filter === 'All' || s.category === filter;
    const matchSearch = !search || s.description?.toLowerCase().includes(search.toLowerCase()) || s.category?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Sales Transactions</h2>
          <p style={{ color: 'var(--txt-2)', fontSize: 13 }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''} · Total: <span style={{ color: '#10B981', fontWeight: 700 }}>₹{totalRevenue.toLocaleString('en-IN')}</span>
          </p>
        </div>
        <button id="sales-add-btn" onClick={() => setShowModal(true)}
          style={{ padding: '10px 22px', borderRadius: 11, background: 'linear-gradient(135deg,#6366F1,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', boxShadow: '0 4px 16px rgba(99,102,241,.4)', transition: 'opacity .2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity='.85'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}>
          + Record Sale
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search sales…" id="sales-search"
          style={{ padding: '9px 14px', borderRadius: 10, background: 'rgba(15,23,42,.9)', border: '1px solid rgba(99,102,241,.25)', color: 'var(--txt)', fontSize: 13, outline: 'none', width: 220 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .18s', border: 'none',
                background: filter === cat ? 'linear-gradient(135deg,#6366F1,#7c3aed)' : 'rgba(99,102,241,.08)',
                color: filter === cat ? '#fff' : 'var(--txt-2)',
                outline: filter === cat ? 'none' : '1px solid rgba(99,102,241,.15)',
              }}>
              {cat === 'All' ? '📋 All' : `${CATEGORY_ICONS[cat] || '📦'} ${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skel" style={{ height: 52 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>💸</p>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No sales found</p>
            <p style={{ color: 'var(--txt-2)', fontSize: 13 }}>Try changing the filter or add your first sale</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: 0, padding: '12px 20px', borderBottom: '1px solid rgba(99,102,241,.1)', background: 'rgba(99,102,241,.04)' }}>
              {['Description', 'Category', 'Amount', 'Date', ''].map(h => (
                <span key={h} style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--txt-2)', fontWeight: 600 }}>{h}</span>
              ))}
            </div>
            {/* Rows */}
            {filtered.map((s, i) => (
              <div key={s._id}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: 0, padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(99,102,241,.06)' : 'none', alignItems: 'center', transition: 'background .18s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,.05)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
                    {CATEGORY_ICONS[s.category] || '📦'}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description || '—'}</span>
                </div>
                <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'rgba(99,102,241,.1)', color: '#a5b4fc', fontWeight: 500, display: 'inline-block', width: 'fit-content' }}>{s.category}</span>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#10B981' }}>₹{s.amount.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: 13, color: 'var(--txt-2)' }}>{new Date(s.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                <button onClick={() => handleDelete(s._id)} disabled={deleting === s._id}
                  style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--danger)', fontSize: 12, cursor: 'pointer', fontWeight: 600, transition: 'all .18s', opacity: deleting === s._id ? .5 : 1 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,.18)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,.08)'}>
                  {deleting === s._id ? '…' : 'Delete'}
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <AddSaleModal show={showModal} onClose={() => setShowModal(false)} onAdded={() => { fetchSales(); toast.success('Sale recorded! 💰'); }} />
    </div>
  );
}
