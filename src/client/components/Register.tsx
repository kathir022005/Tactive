import React, { useState } from 'react';
import { Laptop, User as UserIcon, Lock, Mail, Building2, ArrowRight, ShieldAlert, ArrowLeft } from 'lucide-react';

interface RegisterProps {
  onRegister: (data: { username: string; name: string; department: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  onBackToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegister, onBackToLogin }) => {
  const [form, setForm] = useState({ username: '', name: '', department: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const result = await onRegister({ username: form.username, name: form.name, department: form.department, password: form.password });
    if (!result.success) { setError(result.error || 'Registration failed.'); setLoading(false); }
  };

  return (
    <div className="login-container">
      <div className="login-box glass-panel" style={{ maxWidth: 460 }}>
        <div className="login-header">
          <div className="brand-icon" style={{ margin: '0 auto 16px', width: 56, height: 56 }}>
            <Laptop size={28} color="#fff" />
          </div>
          <h1 className="brand-name" style={{ fontSize: '1.8rem', textAlign: 'center' }}>Create Account</h1>
          <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 4, fontSize: '0.9rem' }}>
            Join EquipFlow — Asset Management
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <ShieldAlert size={16} className="alert-icon" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-with-icon">
              <UserIcon size={16} className="input-icon" />
              <input type="text" className="form-control" style={{ paddingLeft: 38 }} placeholder="Your full name"
                value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input type="text" className="form-control" style={{ paddingLeft: 38 }} placeholder="Choose a username"
                value={form.username} onChange={e => set('username', e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <div className="input-with-icon">
              <Building2 size={16} className="input-icon" />
              <input type="text" className="form-control" style={{ paddingLeft: 38 }} placeholder="e.g. Engineering, HR, Marketing"
                value={form.department} onChange={e => set('department', e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input type="password" className="form-control" style={{ paddingLeft: 38 }} placeholder="Min. 6 characters"
                value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input type="password" className="form-control" style={{ paddingLeft: 38 }} placeholder="Re-enter your password"
                value={form.confirm} onChange={e => set('confirm', e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 24, padding: '12px' }} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Create Account'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="divider-text" style={{ margin: '24px 0 16px' }}><span>Already have an account?</span></div>
        <button type="button" className="btn btn-secondary btn-full" onClick={onBackToLogin}>
          <ArrowLeft size={16} />
          Back to Login
        </button>
      </div>
    </div>
  );
};
