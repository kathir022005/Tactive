import React from 'react';
import { Laptop, LogOut } from 'lucide-react';
import { User } from '../types.js';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: number) => void;
  onLogout: () => void;
  stats: { total: number; available: number; pending: number; myReservations: number };
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, allUsers, onSwitchUser, onLogout, stats }) => {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon">
          <Laptop size={20} color="#fff" />
        </div>
        <div>
          <span className="brand-name">EquipFlow</span>
          <span className="brand-sub">Asset Reservation Platform</span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Quick counts */}
        <div style={{ display:'flex', gap:'20px', marginRight:'8px' }}>
          {[
            { label:'Assets', value: stats.total, color:'#60a5fa' },
            { label:'Available', value: stats.available, color:'#34d399' },
            { label:'My Bookings', value: stats.myReservations, color:'#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center', display:'flex', flexDirection:'column' }}>
              <span style={{ fontSize:'1.1rem', fontWeight:800, color: s.color, lineHeight:1 }}>{s.value}</span>
              <span style={{ fontSize:'0.65rem', color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'0.4px', fontWeight:600 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Live indicator */}
        <div className="navbar-status-dot" title="Server Connected" />

        {/* User Switcher */}
        <div className="user-selector">
          <label>User</label>
          <select
            value={currentUser.id}
            onChange={e => onSwitchUser(Number(e.target.value))}
            id="user-switch-select"
          >
            {allUsers.map(u => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <span className={`role-badge role-${currentUser.role}`}>{currentUser.role}</span>
        </div>

        {/* Logout Button */}
        <button
          className="btn btn-sm btn-secondary"
          onClick={onLogout}
          id="logout-btn"
          title="Sign out of EquipFlow"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
