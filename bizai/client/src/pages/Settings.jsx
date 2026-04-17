import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, logout } = useAuth();

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Passwords do not match.'); return; }
    if (pwForm.newPw.length < 6) { toast.error('New password must be at least 6 characters.'); return; }
    setSavingPw(true);
    try {
      await API.put('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      toast.success('Password updated! 🔒');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update password.');
    } finally { setSavingPw(false); }
  };

  return (
    <div style={{ padding: 28, maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div>
        <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Settings</h2>
        <p style={{ color: 'var(--txt-2)', fontSize: 13 }}>Manage your account and preferences</p>
      </div>

      {/* Account info */}
      <div className="glass" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(99,102,241,.1)' }}>Account Info</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Business Name', value: user?.businessName || '—' },
            { label: 'Your Name',     value: user?.name        || '—' },
            { label: 'Email Address', value: user?.email       || '—' },
            { label: 'Account Type',  value: 'Business Owner'         },
          ].map(f => (
            <div key={f.label}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--txt-2)', marginBottom: 6, fontWeight: 600 }}>{f.label}</p>
              <p style={{ fontSize: 15, fontWeight: 600, padding: '10px 14px', borderRadius: 10, background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.12)' }}>{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="glass" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(99,102,241,.1)' }}>Change Password</h3>
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { id: 'current-pw',  label: 'Current Password',  key: 'current', placeholder: 'Enter current password'  },
            { id: 'new-pw',      label: 'New Password',      key: 'newPw',   placeholder: 'Min. 6 characters'        },
            { id: 'confirm-pw',  label: 'Confirm Password',  key: 'confirm', placeholder: 'Repeat new password'      },
          ].map(f => (
            <div key={f.id}>
              <label htmlFor={f.id} style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--txt-2)', marginBottom: 6, fontWeight: 600 }}>{f.label}</label>
              <input id={f.id} type="password" placeholder={f.placeholder}
                value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="inp" required />
            </div>
          ))}
          <button id="save-password-btn" type="submit" disabled={savingPw}
            style={{ padding: '11px 24px', borderRadius: 11, background: 'linear-gradient(135deg,#6366F1,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: savingPw ? 'not-allowed' : 'pointer', border: 'none', opacity: savingPw ? .7 : 1, alignSelf: 'flex-start', transition: 'opacity .2s', boxShadow: '0 4px 14px rgba(99,102,241,.4)' }}>
            {savingPw ? '⏳ Saving…' : '🔒 Update Password'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="glass" style={{ padding: 24, border: '1px solid rgba(239,68,68,.2)' }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: 'var(--danger)' }}>⚠️ Danger Zone</h3>
        <p style={{ color: 'var(--txt-2)', fontSize: 13, marginBottom: 16 }}>These actions are permanent and cannot be undone.</p>
        <button id="logout-all-btn"
          onClick={() => { if (window.confirm('Log out of all devices? This will clear your session.')) { logout(); window.location.href = '/login'; } }}
          style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', color: 'var(--danger)', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .2s' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,.18)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,.08)'}>
          ↪ Log Out
        </button>
      </div>
    </div>
  );
}
