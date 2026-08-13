import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { AssetCatalog } from './components/AssetCatalog.js';
import { BookingModal } from './components/BookingModal.js';
import { MyReservations } from './components/MyReservations.js';
import { AdminPanel } from './components/AdminPanel.js';
import { Login } from './components/Login.js';
import { Register } from './components/Register.js';
import { User, Asset, Reservation, Blackout } from './types.js';
import { LayoutGrid, CalendarCheck, ShieldCheck } from 'lucide-react';
import './styles/login.css';

export function App() {
  const [users, setUsers]               = useState<User[]>([]);
  const [currentUser, setCurrentUser]   = useState<User | null>(null);
  const [token, setToken]               = useState('');
  const [assets, setAssets]             = useState<Asset[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blackouts, setBlackouts]       = useState<Blackout[]>([]);
  const [tab, setTab]                   = useState<'CATALOG' | 'MY_RESERVATIONS' | 'ADMIN'>('CATALOG');
  const [bookingAsset, setBookingAsset] = useState<Asset | null>(null);
  const [appReady, setAppReady]         = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  /* ── Bootstrap ── */
  useEffect(() => {
    fetch('/api/auth/users')
      .then(r => r.json())
      .then(data => {
        if (data.users?.length) {
          setUsers(data.users);
        }
      })
      .catch(console.error);
    fetchAssets();
  }, []);

  const loginAs = async (username: string, pwd?: string) => {
    // If pwd is not provided, look it up based on standard test accounts for the user switcher
    if (!pwd) {
      const u = users.find(x => x.username === username);
      pwd = u?.role === 'ADMIN' ? 'admin123' : 'user123';
    }
    
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pwd })
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setCurrentUser(data.user);
        fetchReservations(data.token);
        if (data.user.role === 'ADMIN') fetchBlackouts(data.token);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (e: any) { 
      return { success: false, error: 'Network error occurred' };
    }
  };

  const fetchAssets = () =>
    fetch('/api/assets')
      .then(r => r.json())
      .then(d => { if (d.assets) setAssets(d.assets); })
      .catch(console.error);

  const fetchReservations = (tk = token) => {
    if (!tk) return;
    fetch('/api/reservations', { headers: { Authorization: `Bearer ${tk}` } })
      .then(r => r.json())
      .then(d => { if (d.reservations) setReservations(d.reservations); })
      .catch(console.error);
  };

  const fetchBlackouts = (tk = token) => {
    if (!tk) return;
    fetch('/api/admin/blackouts', { headers: { Authorization: `Bearer ${tk}` } })
      .then(r => r.json())
      .then(d => { if (d.blackouts) setBlackouts(d.blackouts); })
      .catch(console.error);
  };

  const handleSwitchUser = (userId: number) => {
    const u = users.find(x => x.id === userId);
    if (u) { setReservations([]); loginAs(u.username); setTab('CATALOG'); }
  };

  /* ── API Actions ── */
  const handleBooking = async (assetId: number, startDate: string, endDate: string, notes: string) => {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assetId, startDate, endDate, notes })
    });
    const data = await res.json();
    if (res.ok) { fetchReservations(); fetchAssets(); return { success: true }; }
    return { success: false, error: data.reason || data.error };
  };

  const handleReturn = async (id: number, returnDate?: string) => {
    const res = await fetch(`/api/reservations/${id}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ returnDate })
    });
    const data = await res.json();
    if (res.ok) { fetchReservations(); fetchAssets(); return { success: true, message: data.message }; }
    return { success: false, message: data.error };
  };

  const handleCancel = async (id: number) => {
    const res = await fetch(`/api/reservations/${id}/cancel`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) { fetchReservations(); return { success: true, message: data.message }; }
    return { success: false, message: data.error };
  };

  const handleApprove = async (id: number) => {
    await fetch(`/api/reservations/${id}/approve`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } });
    fetchReservations();
  };

  const handleReject = async (id: number) => {
    await fetch(`/api/reservations/${id}/reject`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } });
    fetchReservations();
  };

  const handleCreateAsset = async (data: any) => {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (res.ok) { fetchAssets(); return true; }
    return false;
  };

  const handleCreateBlackout = async (data: any) => {
    const res = await fetch('/api/admin/blackouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (res.ok) { fetchBlackouts(); fetchAssets(); return true; }
    return false;
  };

  const handleRegister = async (data: { username: string; name: string; department: string; password: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (res.ok && json.token) {
        setToken(json.token);
        setCurrentUser(json.user);
        fetchReservations(json.token);
        setShowRegister(false);
        return { success: true };
      }
      return { success: false, error: json.error || 'Registration failed' };
    } catch { return { success: false, error: 'Network error' }; }
  };

  /* ── Loading / Login state ── */
  if (!appReady) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
        <div className="spinner" style={{ width:48, height:48 }} />
        <p style={{ color:'var(--text-3)', fontSize:'0.9rem' }}>Initialising EquipFlow...</p>
      </div>
    );
  }

  if (!currentUser) {
    if (showRegister) return <Register onRegister={handleRegister} onBackToLogin={() => setShowRegister(false)} />;
    return <Login onLogin={loginAs} onShowRegister={() => setShowRegister(true)} />;
  }

  const pending = reservations.filter(r => r.status === 'PENDING');
  const availableCount = assets.filter(a => a.status === 'AVAILABLE').length;

  return (
    <>
      <Navbar
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={handleSwitchUser}
        stats={{
          total: assets.length,
          available: availableCount,
          pending: pending.length,
          myReservations: reservations.length,
        }}
      />

      <main className="main-container">
        {/* Stats Bar */}
        <div className="stats-bar">
          {[
            { label:'Total Assets', value: assets.length, cls:'stat-icon-blue', Icon: LayoutGrid },
            { label:'Available Now', value: availableCount, cls:'stat-icon-green', Icon: CalendarCheck },
            { label:'My Bookings', value: reservations.length, cls:'stat-icon-purple', Icon: CalendarCheck },
            { label:'Pending Review', value: pending.length, cls:'stat-icon-amber', Icon: ShieldCheck },
          ].map(({ label, value, cls, Icon }) => (
            <div className="stat-card" key={label}>
              <div className={`stat-icon ${cls}`}><Icon size={20} /></div>
              <div>
                <div className="stat-label">{label}</div>
                <div className="stat-value">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <nav className="tab-navigation">
          <button
            className={`tab-btn ${tab === 'CATALOG' ? 'active' : ''}`}
            onClick={() => setTab('CATALOG')}
            id="tab-catalog"
          >
            <LayoutGrid size={16} /> Equipment Catalog
          </button>
          <button
            className={`tab-btn ${tab === 'MY_RESERVATIONS' ? 'active' : ''}`}
            onClick={() => setTab('MY_RESERVATIONS')}
            id="tab-my-reservations"
          >
            <CalendarCheck size={16} /> My Reservations
            {reservations.length > 0 && (
              <span className="tab-badge">{reservations.length}</span>
            )}
          </button>
          {currentUser.role === 'ADMIN' && (
            <button
              className={`tab-btn ${tab === 'ADMIN' ? 'active' : ''}`}
              onClick={() => setTab('ADMIN')}
              id="tab-admin"
            >
              <ShieldCheck size={16} /> Admin
              {pending.length > 0 && <span className="tab-badge">{pending.length}</span>}
            </button>
          )}
        </nav>

        {/* Views */}
        {tab === 'CATALOG' && (
          <AssetCatalog assets={assets} currentUser={currentUser} onSelectReserve={setBookingAsset} />
        )}
        {tab === 'MY_RESERVATIONS' && (
          <MyReservations
            reservations={reservations}
            currentUser={currentUser}
            onReturn={handleReturn}
            onCancel={handleCancel}
          />
        )}
        {tab === 'ADMIN' && currentUser.role === 'ADMIN' && (
          <AdminPanel
            pendingReservations={pending}
            assets={assets}
            blackouts={blackouts}
            onApprove={handleApprove}
            onReject={handleReject}
            onCreateAsset={handleCreateAsset}
            onCreateBlackout={handleCreateBlackout}
          />
        )}
      </main>

      {/* Booking Modal */}
      {bookingAsset && (
        <BookingModal
          asset={bookingAsset}
          currentUser={currentUser}
          onClose={() => setBookingAsset(null)}
          onSubmit={handleBooking}
        />
      )}
    </>
  );
}
