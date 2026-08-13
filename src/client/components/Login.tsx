import React, { useState } from 'react';
import { Laptop, Lock, User as UserIcon, ShieldAlert, ArrowRight, Zap } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onShowRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onShowRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await onLogin(username, password);
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
      setLoading(false);
    }
  };

  const quickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="login-container">
      <div className="login-box glass-panel">
        
        <div className="login-header">
          <div className="brand-icon" style={{ margin: '0 auto 16px', width: 56, height: 56 }}>
            <Laptop size={28} color="#fff" />
          </div>
          <h1 className="brand-name" style={{ fontSize: '1.8rem', textAlign: 'center' }}>EquipFlow</h1>
          <p style={{ color: 'var(--text-3)', textAlign: 'center', marginTop: 4, fontSize: '0.9rem' }}>
            Enterprise Asset Management
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
            <label className="form-label">Username</label>
            <div className="input-with-icon">
              <UserIcon size={16} className="input-icon" />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 38 }}
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: 38 }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 24, padding: '12px' }} disabled={loading}>
            {loading ? <div className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> : 'Sign In'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="quick-login-section">
          <div className="divider-text"><span>Assessment Quick Login</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-full" style={{ justifyContent: 'space-between' }} onClick={() => quickLogin('admin', 'admin123')}>
              <span style={{ color: '#fbbf24' }}>Admin (Full Access)</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>admin / admin123</span>
            </button>
            <button type="button" className="btn btn-secondary btn-full" style={{ justifyContent: 'space-between' }} onClick={() => quickLogin('jane_doe', 'user123')}>
              <span style={{ color: '#c4b5fd' }}>VIP User (Auto-Approve)</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>jane_doe / user123</span>
            </button>
            <button type="button" className="btn btn-secondary btn-full" style={{ justifyContent: 'space-between' }} onClick={() => quickLogin('john_smith', 'user123')}>
              <span style={{ color: '#93c5fd' }}>Standard User</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>john_smith / user123</span>
            </button>
          </div>
          <div className="divider-text" style={{ margin: '24px 0 16px' }}><span>New user?</span></div>
          <button type="button" className="btn btn-secondary btn-full" onClick={onShowRegister}>
            Create Account
          </button>
        </div>

      </div>
    </div>
  );
};
