import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

const NAV = [
  { icon: '📊', label: 'Dashboard',   path: '/'            },
  { icon: '💰', label: 'Sales',       path: '/sales'       },
  { icon: '👥', label: 'Customers',   path: '/customers'   },
  { icon: '📦', label: 'Inventory',   path: '/inventory'   },
  { icon: '🛒', label: 'Orders',      path: '/orders',  badge: true },
  { icon: '🤖', label: 'AI Insights', path: '/ai-insights' },
  { icon: '💬', label: 'Chat',        path: '/chat'        },
  { icon: '⚙️', label: 'Settings',   path: '/settings'    },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [sidebarOpen,   setSidebarOpen]   = useState(true);   // desktop collapse
  const [mobileOpen,    setMobileOpen]    = useState(false);  // mobile drawer
  const [isMobile,      setIsMobile]      = useState(window.innerWidth <= 768);
  const [isTablet,      setIsTablet]      = useState(window.innerWidth <= 1024 && window.innerWidth > 768);
  const [seeding,       setSeeding]       = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);

  // Detect viewport size
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setIsMobile(w <= 768);
      setIsTablet(w <= 1024 && w > 768);
      if (w > 768) setMobileOpen(false); // auto-close drawer on resize up
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Poll for pending orders every 8s so the red badge appears quickly
  useEffect(() => {
    const check = () => API.get('/orders').then(({ data }) => {
      const count = (data.data || []).filter(o => o.status === 'pending').length;
      setPendingOrders(count);
    }).catch(() => {});
    check();
    const id = setInterval(check, 8000);
    return () => clearInterval(id);
  }, []);

  const handleSeedDemo = async () => {
    if (!window.confirm('⚠️ This will replace ALL your current data with 30 days of realistic demo data. Continue?')) return;
    setSeeding(true);
    try {
      const { data } = await API.post('/seed/demo');
      toast.success(`🌱 Demo data loaded! ${data.data.salesCount} sales & ${data.data.customersCount} customers.`);
      window.location.href = '/';
    } catch { toast.error('Could not seed demo data.'); }
    finally { setSeeding(false); }
  };

  const hour     = new Date().getHours();
  const greeting = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${user?.businessName || user?.name}`;
  const dateStr  = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const currentNav = NAV.find(n => n.path === location.pathname) || NAV[0];

  // Sidebar width logic
  const sidebarW = isMobile ? 260 : (isTablet || !sidebarOpen) ? 72 : 240;
  const showLabels = isMobile ? true : (!isTablet && sidebarOpen);

  const NavItems = () => (
    <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
      {NAV.map(item => {
        const active       = location.pathname === item.path;
        const pendingBadge = item.badge && pendingOrders > 0;
        return (
          <button key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', border: 'none',
              padding: '12px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              background:  active ? 'linear-gradient(135deg,rgba(99,102,241,.28),rgba(124,58,237,.18))' : 'transparent',
              outline:     active ? '1px solid rgba(99,102,241,.4)' : '1px solid transparent',
              color:       active ? '#a5b4fc' : 'var(--txt-2)',
              fontWeight:  active ? 650 : 400,
              fontSize:    14,
              transition:  'all .18s',
              whiteSpace:  'nowrap', overflow: 'hidden',
              position: 'relative',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(99,102,241,.08)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>

            <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
            {showLabels && <span style={{ flex: 1 }}>{item.label}</span>}
            {showLabels && pendingBadge && (
              <span style={{ background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 20, flexShrink: 0, boxShadow: '0 0 8px rgba(239,68,68,.5)' }}>{pendingOrders}</span>
            )}
            {!showLabels && pendingBadge && (
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 6px #EF4444' }} />
            )}
            {showLabels && active && !pendingBadge && (
              <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 10px #818cf8', flexShrink: 0 }} />
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Mobile overlay ──────────────────────────────────── */}
      {isMobile && (
        <div className={`sidebar-overlay${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={isMobile ? `sidebar-drawer${mobileOpen ? ' open' : ''}` : ''}
        style={{
          width:       isMobile ? 260 : sidebarW,
          minHeight:   '100vh',
          background:  'rgba(13,18,30,.97)',
          borderRight: '1px solid rgba(99,102,241,.15)',
          display:     'flex',
          flexDirection: 'column',
          transition:  'width .32s cubic-bezier(.4,0,.2,1)',
          overflow:    'hidden',
          flexShrink:  0,
          position:    isMobile ? 'fixed' : 'sticky',
          top: 0,
          zIndex: isMobile ? 39 : 40,
          boxShadow:   '4px 0 24px rgba(0,0,0,.25)',
        }}>

        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(99,102,241,.1)', display: 'flex', alignItems: 'center', gap: 12, justifyContent: showLabels ? 'flex-start' : 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: '0 4px 14px rgba(99,102,241,.55)' }}>⚡</div>
          {showLabels && <span style={{ fontSize: 18, fontWeight: 800, background: 'linear-gradient(135deg,#818CF8,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-.3px' }}>BizAI</span>}
        </div>

        {/* Collapse toggle — only on desktop */}
        {!isMobile && (
          <button onClick={() => setSidebarOpen(o => !o)}
            style={{ margin: '10px 12px 4px', padding: '7px', borderRadius: 9, background: 'rgba(99,102,241,.07)', border: '1px solid rgba(99,102,241,.14)', color: 'var(--txt-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, transition: 'all .2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,.07)'}>
            {showLabels ? '◀ Collapse' : '▶'}
          </button>
        )}

        <NavItems />

        {/* Demo seed button */}
        {showLabels && (
          <div style={{ padding: '8px 10px' }} className="sidebar-demo-btn">
            <button id="demo-seed-btn" onClick={handleSeedDemo} disabled={seeding}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 11, background: seeding ? 'rgba(16,185,129,.06)' : 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)', color: '#10B981', fontSize: 12, fontWeight: 700, cursor: seeding ? 'not-allowed' : 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onMouseEnter={e => { if (!seeding) e.currentTarget.style.background = 'rgba(16,185,129,.2)'; }}
              onMouseLeave={e => { if (!seeding) e.currentTarget.style.background = 'rgba(16,185,129,.1)'; }}>
              {seeding ? '⏳ Loading demo…' : '🌱 Load Demo Data'}
            </button>
          </div>
        )}

        {/* User info */}
        <div style={{ padding: '14px 10px', borderTop: '1px solid rgba(99,102,241,.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.12)', justifyContent: showLabels ? 'flex-start' : 'center', overflow: 'hidden' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {showLabels && (
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
                <p style={{ fontSize: 11, color: 'var(--txt-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: isMobile ? 0 : undefined }}>

        {/* Top bar */}
        <header className="topbar" style={{
          padding: '14px 22px', borderBottom: '1px solid rgba(99,102,241,.1)',
          background: 'rgba(13,18,30,.9)', backdropFilter: 'blur(14px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 30, gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {/* Hamburger — mobile only */}
            {isMobile && (
              <button className="hamburger-btn"
                onClick={() => setMobileOpen(o => !o)}
                style={{ display : 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: 10, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.25)', color: 'var(--txt-2)', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6"  x2="21" y2="6"  />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--txt-2)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dateStr}</p>
              <h1 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: 'var(--txt)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentNav.icon} {currentNav.label}</h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span className="topbar-biz-badge" style={{ fontSize: 12, color: 'var(--txt-2)', padding: '5px 12px', borderRadius: 20, background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.15)', whiteSpace: 'nowrap' }}>
              {user?.businessName}
            </span>
            <button id="nav-logout-btn"
              onClick={() => { if (window.confirm('Log out?')) { logout(); navigate('/login'); } }}
              style={{ padding: isMobile ? '8px 10px' : '8px 14px', borderRadius: 9, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--danger)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,.08)'}>
              {isMobile ? '↪' : '↪ Logout'}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
