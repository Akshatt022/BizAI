import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out. See you soon! 👋');
    navigate('/login');
  };

  return (
    <nav className="nav-glow sticky top-0 z-50 flex items-center justify-between px-6 py-4"
      style={{ background: 'rgba(15,23,42,.85)', backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background:'linear-gradient(135deg,#6366F1,#7c3aed)', boxShadow:'0 4px 12px rgba(99,102,241,.4)' }}>
          <span style={{ fontSize:16 }}>⚡</span>
        </div>
        <span className="text-xl font-extrabold gtext tracking-tight">BizAI</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.2)' }}>
          <div className="w-2 h-2 rounded-full" style={{ background:'var(--success)' }} />
          <span className="text-xs font-medium" style={{ color:'var(--txt-2)' }}>{user?.businessName}</span>
        </div>

        <button id="logout-btn" onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all hover:scale-105"
          style={{
            background: 'rgba(239,68,68,.1)',
            border: '1px solid rgba(239,68,68,.25)',
            color: '#EF4444',
            transition: 'all .25s',
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,.2)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,.1)'}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
}
