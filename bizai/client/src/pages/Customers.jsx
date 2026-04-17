import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import AddCustomerModal from '../components/AddCustomerModal';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('All'); // All | New | Returning
  const [deleting, setDeleting]   = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/customers');
      setCustomers(data.data || []);
    } catch { toast.error('Could not load customers.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this customer?')) return;
    setDeleting(id);
    try {
      await API.delete(`/customers/${id}`);
      setCustomers(prev => prev.filter(c => c._id !== id));
      toast.success('Customer removed.');
    } catch { toast.error('Could not delete customer.'); }
    finally { setDeleting(null); }
  };

  const filtered = customers.filter(c => {
    const matchFilter = filter === 'All' || (filter === 'New' ? c.isNewCustomer : !c.isNewCustomer);
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const newCount       = customers.filter(c => c.isNewCustomer).length;
  const returningCount = customers.filter(c => !c.isNewCustomer).length;

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Customers</h2>
          <p style={{ color: 'var(--txt-2)', fontSize: 13 }}>
            {customers.length} total · <span style={{ color: '#10B981', fontWeight: 600 }}>{newCount} new</span> · <span style={{ color: '#8B5CF6', fontWeight: 600 }}>{returningCount} returning</span>
          </p>
        </div>
        <button id="customers-add-btn" onClick={() => setShowModal(true)}
          style={{ padding: '10px 22px', borderRadius: 11, background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', boxShadow: '0 4px 16px rgba(16,185,129,.35)', transition: 'opacity .2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity='.85'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}>
          + Add Customer
        </button>
      </div>

      {/* Stats mini row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[
          { label: 'Total Customers', value: customers.length, color: '#6366F1', icon: '👥' },
          { label: 'New Customers',   value: newCount,          color: '#10B981', icon: '🆕' },
          { label: 'Returning',       value: returningCount,    color: '#8B5CF6', icon: '🔄' },
        ].map(m => (
          <div key={m.label} className="glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${m.color}18`, border: `1px solid ${m.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>{m.icon}</div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</p>
              <p style={{ fontSize: 12, color: 'var(--txt-2)' }}>{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search by name or email…" id="customers-search"
          style={{ padding: '9px 14px', borderRadius: 10, background: 'rgba(15,23,42,.9)', border: '1px solid rgba(99,102,241,.25)', color: 'var(--txt)', fontSize: 13, outline: 'none', width: 260 }} />
        {['All','New','Returning'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all .18s',
              background: filter === f ? 'linear-gradient(135deg,#6366F1,#7c3aed)' : 'rgba(99,102,241,.08)',
              color: filter === f ? '#fff' : 'var(--txt-2)',
              outline: filter === f ? 'none' : '1px solid rgba(99,102,241,.15)',
            }}>
            {f === 'All' ? '📋 All' : f === 'New' ? '🆕 New' : '🔄 Returning'}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
        {loading
          ? [1,2,3,4,5,6].map(i => <div key={i} className="skel" style={{ height: 100, borderRadius: 14 }} />)
          : filtered.length === 0
            ? (
              <div style={{ gridColumn: '1/-1', padding: 60, textAlign: 'center' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>👤</p>
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No customers found</p>
                <p style={{ color: 'var(--txt-2)', fontSize: 13 }}>Add your first customer to get started</p>
              </div>
            )
            : filtered.map(c => (
              <div key={c._id} className="glass hover-lift"
                style={{ padding: '18px 20px', borderTop: `3px solid ${c.isNewCustomer ? '#10B981' : '#8B5CF6'}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg,${c.isNewCustomer ? '#10B981' : '#8B5CF6'},${c.isNewCustomer ? '#059669' : '#6D28D9'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: '#fff' }}>
                      {c.name?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--txt-2)' }}>{c.email || 'No email'}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                    background: c.isNewCustomer ? 'rgba(16,185,129,.12)' : 'rgba(139,92,246,.12)',
                    color: c.isNewCustomer ? '#10B981' : '#8B5CF6',
                    border: `1px solid ${c.isNewCustomer ? 'rgba(16,185,129,.25)' : 'rgba(139,92,246,.25)'}`,
                  }}>
                    {c.isNewCustomer ? '🆕 New' : '🔄 Returning'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 12, color: 'var(--txt-2)' }}>
                    Visits: <span style={{ color: 'var(--txt)', fontWeight: 600 }}>{c.visitCount || 1}</span>
                    {c.date && <span style={{ marginLeft: 10 }}>· {new Date(c.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>}
                  </div>
                  <button onClick={() => handleDelete(c._id)} disabled={deleting === c._id}
                    style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)', color: 'var(--danger)', fontSize: 11, cursor: 'pointer', transition: 'all .18s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,.2)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,.08)'}>
                    {deleting === c._id ? '…' : 'Remove'}
                  </button>
                </div>
              </div>
            ))
        }
      </div>

      <AddCustomerModal show={showModal} onClose={() => setShowModal(false)} onAdded={() => { fetchCustomers(); toast.success('Customer added! 👤'); }} />
    </div>
  );
}
