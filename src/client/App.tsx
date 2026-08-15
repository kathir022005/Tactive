import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { AssetCatalog } from './components/AssetCatalog.js';
import { BookingModal } from './components/BookingModal.js';
import { MyReservations } from './components/MyReservations.js';
import { AdminPanel } from './components/AdminPanel.js';
import { Login } from './components/Login.js';
import { Register } from './components/Register.js';
import { User, Asset, Reservation, Blackout } from './types.js';
import {
  LayoutGrid, CalendarCheck, ShieldCheck, Package, Zap, Users,
  PlusCircle, Edit3, X, AlertTriangle, Settings
} from 'lucide-react';
import './styles/index.css';
import './styles/login.css';

const CATEGORIES = ['Laptop', 'AV Equipment', 'Testing Device', 'Drone', 'Peripherals', 'Server', 'Camera', 'Other'];

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

  // Global Add & Edit Asset Modals
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [editingAsset, setEditingAsset]           = useState<Asset | null>(null);

  // Add Asset form state
  const [newName, setNewName]         = useState('');
  const [newCat, setNewCat]           = useState('Laptop');
  const [newSerial, setNewSerial]     = useState('');
  const [newRate, setNewRate]         = useState(50);
  const [newLoc, setNewLoc]           = useState('Main Office - Locker A');
  const [newDesc, setNewDesc]         = useState('');
  const [addError, setAddError]       = useState('');

  // Edit Asset form state
  const [editName, setEditName]       = useState('');
  const [editCat, setEditCat]         = useState('');
  const [editSerial, setEditSerial]   = useState('');
  const [editStatus, setEditStatus]   = useState<'AVAILABLE' | 'MAINTENANCE' | 'RETIRED'>('AVAILABLE');
  const [editRate, setEditRate]       = useState(50);
  const [editLoc, setEditLoc]         = useState('');
  const [editDesc, setEditDesc]       = useState('');
  const [editError, setEditError]     = useState('');

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
    if (!pwd) {
      const u = users.find(x => x.username === username);
      pwd = u?.role === 'ADMIN' ? 'admin123' : 'user123';
    }
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pwd })
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setCurrentUser(data.user);
        fetchReservations(data.token);
        if (data.user.role === 'ADMIN') {
          fetchBlackouts(data.token);
          setTab('ADMIN'); // Auto-navigate admin directly to Admin Panel!
        } else {
          setTab('CATALOG');
        }
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
    if (u) {
      setReservations([]);
      loginAs(u.username);
      setTab(u.role === 'ADMIN' ? 'ADMIN' : 'CATALOG');
    }
  };

  /* ── API Actions ── */
  const handleBooking = async (assetId: number | string, startDate: string, endDate: string, notes: string) => {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assetId, startDate, endDate, notes })
    });
    const data = await res.json();
    if (res.ok) { fetchReservations(); fetchAssets(); return { success: true }; }
    return { success: false, error: data.reason || data.error };
  };

  const handleReturn = async (id: number | string, returnDate?: string) => {
    const res = await fetch(`/api/reservations/${id}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ returnDate })
    });
    const data = await res.json();
    if (res.ok) { fetchReservations(); fetchAssets(); return { success: true, message: data.message }; }
    return { success: false, message: data.error };
  };

  const handleCancel = async (id: number | string) => {
    const res = await fetch(`/api/reservations/${id}/cancel`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) { fetchReservations(); return { success: true, message: data.message }; }
    return { success: false, message: data.error };
  };

  const handleApprove = async (id: number | string) => {
    await fetch(`/api/reservations/${id}/approve`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } });
    fetchReservations();
  };

  const handleReject = async (id: number | string) => {
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

  const handleUpdateAsset = async (id: string | number, data: any) => {
    const res = await fetch(`/api/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (res.ok) { fetchAssets(); return true; }
    return false;
  };

  const handleDeleteAsset = async (id: string | number) => {
    const res = await fetch(`/api/assets/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
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

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setEditName(asset.name);
    setEditCat(asset.category);
    setEditSerial(asset.serial_number);
    setEditStatus(asset.status);
    setEditRate(asset.daily_penalty_rate);
    setEditLoc(asset.location || 'Main Office');
    setEditDesc(asset.description || '');
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    setEditError('');
    const ok = await handleUpdateAsset(editingAsset.id, {
      name: editName,
      category: editCat,
      serialNumber: editSerial,
      status: editStatus,
      dailyPenaltyRate: editRate,
      location: editLoc,
      description: editDesc,
    });
    if (ok) {
      setEditingAsset(null);
    } else {
      setEditError('Failed to update asset. Check inputs or serial number uniqueness.');
    }
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    const ok = await handleCreateAsset({
      name: newName,
      category: newCat,
      serialNumber: newSerial,
      dailyPenaltyRate: newRate,
      location: newLoc,
      description: newDesc,
    });
    if (ok) {
      setShowAddAssetModal(false);
      setNewName('');
      setNewSerial('');
      setNewDesc('');
    } else {
      setAddError('Failed to create asset. Serial number may already exist.');
    }
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

  const handleLogout = () => {
    setCurrentUser(null);
    setToken('');
    setReservations([]);
    setBlackouts([]);
    setTab('CATALOG');
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
        onLogout={handleLogout}
        stats={{
          total: assets.length,
          available: availableCount,
          pending: pending.length,
          myReservations: reservations.length,
        }}
      />

      <main className="main-container">
        {/* Role Context Banner */}
        {currentUser.role === 'ADMIN' && (
          <div className="role-banner role-banner-admin">
            <div className="role-banner-icon role-banner-icon-admin"><ShieldCheck size={16} /></div>
            <div>
              <strong>Admin Panel Active</strong> — You have full management rights to Add, Edit, and Delete equipment, review pending bookings, and declare maintenance blackouts.
            </div>
          </div>
        )}
        {currentUser.role === 'VIP' && (
          <div className="role-banner role-banner-vip">
            <div className="role-banner-icon role-banner-icon-vip"><Zap size={16} /></div>
            <div>
              <strong>VIP Member</strong> — Your reservations are auto-confirmed instantly (no admin approval required). You also receive a 50% discount on late-return penalties.
            </div>
          </div>
        )}
        {currentUser.role === 'STANDARD' && (
          <div className="role-banner role-banner-user">
            <div className="role-banner-icon role-banner-icon-user"><Users size={16} /></div>
            <div>
              <strong>Standard Account</strong> — Browse and reserve available equipment below. Your reservations enter a pending queue for admin approval. You can hold up to 3 active reservations.
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="stats-bar">
          {(currentUser.role === 'ADMIN' ? [
            { label:'Total Assets',       value: assets.length,         cls:'stat-icon-blue',   Icon: Package },
            { label:'Available Now',      value: availableCount,         cls:'stat-icon-green',  Icon: CalendarCheck },
            { label:'Pending Approvals',  value: pending.length,         cls:'stat-icon-amber',  Icon: ShieldCheck },
            { label:'Active Blackouts',   value: blackouts.length,       cls:'stat-icon-rose',   Icon: LayoutGrid },
          ] : [
            { label:'Total Assets',  value: assets.length,         cls:'stat-icon-blue',   Icon: Package },
            { label:'Available Now', value: availableCount,         cls:'stat-icon-green',  Icon: CalendarCheck },
            { label:'My Bookings',   value: reservations.length,    cls:'stat-icon-purple', Icon: CalendarCheck },
            { label:'Pending Review',value: pending.length,         cls:'stat-icon-amber',  Icon: ShieldCheck },
          ]).map(({ label, value, cls, Icon }) => (
            <div className="stat-card" key={label}>
              <div className={`stat-icon ${cls}`}><Icon size={19} /></div>
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
            <LayoutGrid size={15} /> Equipment Catalog
          </button>
          <button
            className={`tab-btn ${tab === 'MY_RESERVATIONS' ? 'active' : ''}`}
            onClick={() => setTab('MY_RESERVATIONS')}
            id="tab-my-reservations"
          >
            <CalendarCheck size={15} /> My Reservations
            {reservations.length > 0 && (
              <span className="tab-badge">{reservations.length}</span>
            )}
          </button>
          {currentUser.role === 'ADMIN' && (
            <button
              className={`tab-btn tab-admin ${tab === 'ADMIN' ? 'active tab-admin' : ''}`}
              onClick={() => setTab('ADMIN')}
              id="tab-admin"
            >
              <ShieldCheck size={15} /> Admin Panel
              {pending.length > 0 && <span className="tab-badge">{pending.length}</span>}
            </button>
          )}
        </nav>

        {/* Views */}
        {tab === 'CATALOG' && (
          <AssetCatalog
            assets={assets}
            currentUser={currentUser}
            onSelectReserve={setBookingAsset}
            onEditAsset={openEditModal}
            onAddAsset={() => setShowAddAssetModal(true)}
          />
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
            onUpdateAsset={handleUpdateAsset}
            onDeleteAsset={handleDeleteAsset}
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

      {/* Global Add Asset Modal */}
      {showAddAssetModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAddAssetModal(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <div className="modal-title">Add New Equipment</div>
                <div className="modal-subtitle">Register new equipment in the inventory database</div>
              </div>
              <button className="btn-close-modal" onClick={() => setShowAddAssetModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveAdd}>
              <div className="modal-body">
                {addError && (
                  <div className="alert alert-error"><AlertTriangle size={15} className="alert-icon" />{addError}</div>
                )}
                <div className="form-group">
                  <label className="form-label">Equipment Name</label>
                  <input className="form-control" required placeholder="e.g. Dell XPS 15 Workstation" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-control" value={newCat} onChange={e => setNewCat(e.target.value)}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Serial Number</label>
                    <input className="form-control" required placeholder="SN-XXXXXX" value={newSerial} onChange={e => setNewSerial(e.target.value)} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="form-group">
                    <label className="form-label">Late Penalty ($/day)</label>
                    <input type="number" min={1} className="form-control" required value={newRate} onChange={e => setNewRate(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-control" value={newLoc} onChange={e => setNewLoc(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={2} placeholder="Brief description of equipment capabilities..." value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddAssetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><PlusCircle size={13} /> Create Equipment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Edit Asset Modal */}
      {editingAsset && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditingAsset(null); }}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <div className="modal-title">Edit Equipment Details</div>
                <div className="modal-subtitle">Editing: <strong style={{ color:'var(--text-1)' }}>{editingAsset.name}</strong></div>
              </div>
              <button className="btn-close-modal" onClick={() => setEditingAsset(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                {editError && (
                  <div className="alert alert-error"><AlertTriangle size={15} className="alert-icon" />{editError}</div>
                )}
                <div className="form-group">
                  <label className="form-label">Equipment Name</label>
                  <input className="form-control" required value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-control" value={editCat} onChange={e => setEditCat(e.target.value)}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={editStatus} onChange={e => setEditStatus(e.target.value as any)}>
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="RETIRED">RETIRED</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Serial #</label>
                    <input className="form-control" required value={editSerial} onChange={e => setEditSerial(e.target.value)} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="form-group">
                    <label className="form-label">Penalty Rate ($/day)</label>
                    <input type="number" min={1} className="form-control" required value={editRate} onChange={e => setEditRate(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-control" value={editLoc} onChange={e => setEditLoc(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingAsset(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Settings size={13} /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
