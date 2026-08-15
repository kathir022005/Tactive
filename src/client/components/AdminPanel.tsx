import React, { useState } from 'react';
import {
  ShieldCheck, CheckCircle2, X, PlusCircle, AlertOctagon,
  ClipboardList, Package, AlertTriangle, Info, Edit3, Trash2,
  Settings, CalendarOff, Lock
} from 'lucide-react';
import { Reservation, Asset, Blackout } from '../types.js';

interface AdminPanelProps {
  pendingReservations: Reservation[];
  assets: Asset[];
  blackouts: Blackout[];
  onApprove: (id: number | string) => Promise<void>;
  onReject:  (id: number | string) => Promise<void>;
  onCreateAsset:   (data: any) => Promise<boolean>;
  onUpdateAsset?:  (id: string | number, data: any) => Promise<boolean>;
  onDeleteAsset?:  (id: string | number) => Promise<boolean>;
  onCreateBlackout:(data: any) => Promise<boolean>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  pendingReservations, assets, blackouts,
  onApprove, onReject, onCreateAsset, onUpdateAsset, onDeleteAsset, onCreateBlackout
}) => {
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showBlackoutModal, setShowBlackoutModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Create form
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('Laptop');
  const [serial, setSerial] = useState('');
  const [rate, setRate] = useState(50);
  const [location, setLocation] = useState('Main Office - Locker A');
  const [desc, setDesc] = useState('');
  const [assetError, setAssetError] = useState('');

  // Edit form
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSerial, setEditSerial] = useState('');
  const [editStatus, setEditStatus] = useState<'AVAILABLE' | 'MAINTENANCE' | 'RETIRED'>('AVAILABLE');
  const [editRate, setEditRate] = useState(50);
  const [editLocation, setEditLocation] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editError, setEditError] = useState('');

  // Blackout form
  const [boAssetId, setBoAssetId] = useState<string | number>(assets[0]?.id || '');
  const [boStart, setBoStart] = useState('');
  const [boEnd, setBoEnd] = useState('');
  const [boReason, setBoReason] = useState('');

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssetError('');
    const ok = await onCreateAsset({ name:assetName, category, serialNumber:serial, dailyPenaltyRate:rate, location, description:desc });
    if (ok) { setShowAssetModal(false); setAssetName(''); setSerial(''); setDesc(''); }
    else setAssetError('Failed to create asset. Serial number may already exist.');
  };

  const startEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setEditName(asset.name);
    setEditCategory(asset.category);
    setEditSerial(asset.serial_number);
    setEditStatus(asset.status);
    setEditRate(asset.daily_penalty_rate);
    setEditLocation(asset.location || '');
    setEditDesc(asset.description || '');
    setEditError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset || !onUpdateAsset) return;
    setEditError('');
    const ok = await onUpdateAsset(editingAsset.id, {
      name: editName, category: editCategory, serialNumber: editSerial,
      status: editStatus, dailyPenaltyRate: editRate, location: editLocation, description: editDesc
    });
    if (ok) setEditingAsset(null);
    else setEditError('Failed to update. Check serial number or inputs.');
  };

  const handleDelete = async (id: string | number, name: string) => {
    if (!onDeleteAsset) return;
    if (window.confirm(`Delete "${name}" from inventory? This cannot be undone.`)) {
      await onDeleteAsset(id);
    }
  };

  const handleBlackoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onCreateBlackout({ assetId: boAssetId, startDate:boStart, endDate:boEnd, reason:boReason });
    if (ok) { setShowBlackoutModal(false); setBoStart(''); setBoEnd(''); setBoReason(''); }
  };

  const CATEGORIES = ['Laptop','AV Equipment','Testing Device','Drone','Peripherals','Server','Camera','Other'];

  return (
    <div className="admin-panel-wrapper">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShieldCheck color="var(--amber)" size={24} />
            Admin Control Panel
          </h1>
          <p className="page-subtitle">
            Manage equipment inventory · Review reservation requests · Declare maintenance windows
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-amber" onClick={() => setShowBlackoutModal(true)} id="add-blackout-btn">
            <CalendarOff size={14} /> Declare Blackout
          </button>
          <button className="btn btn-primary" onClick={() => setShowAssetModal(true)} id="add-asset-btn">
            <PlusCircle size={14} /> Add Equipment
          </button>
        </div>
      </div>

      {/* ── What admin can do — Quick Guide ──────────────────── */}
      <div className="alert alert-warning" style={{ marginBottom: 24 }}>
        <Lock size={15} className="alert-icon" />
        <div>
          <strong>Admin-only capabilities:</strong> Add new equipment to inventory · Edit asset details (name, status, penalty rate, location) · Delete retired assets · Approve or reject standard user reservation requests · Block equipment during maintenance windows. Standard users and VIP users cannot access this panel.
        </div>
      </div>

      {/* ── Section 1: Inventory Management ──────────────────── */}
      <div className="admin-section">
        <div className="admin-section-header">
          <div className="admin-section-title">
            <Package size={16} color="var(--blue)" />
            Inventory Management
            <span className="admin-section-badge">{assets.length} assets</span>
          </div>
          <button className="btn btn-sm btn-primary" onClick={() => setShowAssetModal(true)}>
            <PlusCircle size={13} /> Add Equipment
          </button>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Equipment Name</th>
                <th>Category</th>
                <th>Serial Number</th>
                <th>Status</th>
                <th>Penalty Rate</th>
                <th>Location</th>
                <th style={{ textAlign:'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(a => (
                <tr key={a.id}>
                  <td>
                    <div className="td-primary">{a.name}</div>
                    {a.description && (
                      <div style={{ fontSize:'0.74rem', color:'var(--text-3)', marginTop:2 }}>
                        {a.description.length > 60 ? a.description.slice(0, 60) + '…' : a.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="cat-tag">{a.category}</span>
                  </td>
                  <td className="td-mono">{a.serial_number}</td>
                  <td>
                    <span className={`status-badge status-${a.status}`}>{a.status}</span>
                  </td>
                  <td style={{ fontFamily:'var(--mono)', fontSize:'0.8rem', color:'var(--amber)', fontWeight:600 }}>
                    ${a.daily_penalty_rate}/day
                  </td>
                  <td style={{ fontSize:'0.82rem', color:'var(--text-3)' }}>{a.location}</td>
                  <td>
                    <div className="action-group" style={{ justifyContent:'flex-end' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => startEditAsset(a)}
                        title="Edit asset details"
                        id={`edit-asset-${a.id}`}
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      {onDeleteAsset && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(a.id, a.name)}
                          title="Delete asset"
                          id={`delete-asset-${a.id}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 2: Pending Approval Queue ─────────────────── */}
      <div className="admin-section">
        <div className="admin-section-header">
          <div className="admin-section-title">
            <ClipboardList size={16} color="var(--amber)" />
            Pending Approval Queue
            {pendingReservations.length > 0 && (
              <span className="admin-section-badge">{pendingReservations.length} awaiting</span>
            )}
          </div>
        </div>

        {pendingReservations.length === 0 ? (
          <div className="empty-state" style={{ padding:'38px 20px' }}>
            <CheckCircle2 size={30} color="#34d399" />
            <h3>All clear — no pending requests</h3>
            <p>Standard user reservations will appear here for review.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Requested By</th>
                  <th>Equipment</th>
                  <th>Date Range</th>
                  <th>Notes / Purpose</th>
                  <th style={{ textAlign:'right' }}>Approve / Reject</th>
                </tr>
              </thead>
              <tbody>
                {pendingReservations.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="td-primary">{r.user_name}</div>
                      <span className={`role-badge role-${r.user_role}`} style={{ marginTop:4, display:'inline-block' }}>{r.user_role}</span>
                    </td>
                    <td style={{ fontWeight:600, color:'var(--text-1)' }}>{r.asset_name}</td>
                    <td>
                      <span style={{ fontFamily:'var(--mono)', fontSize:'0.78rem', color:'var(--sky)' }}>
                        {r.start_date} → {r.end_date}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize:'0.8rem', color:'var(--text-3)' }}>
                        {r.notes || <em>No notes</em>}
                      </span>
                    </td>
                    <td>
                      <div className="action-group" style={{ justifyContent:'flex-end' }}>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => onApprove(r.id)}
                          id={`admin-approve-${r.id}`}
                        >
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => onReject(r.id)}
                          id={`admin-reject-${r.id}`}
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 3: Maintenance Blackouts ──────────────────── */}
      <div className="admin-section">
        <div className="admin-section-header">
          <div className="admin-section-title">
            <CalendarOff size={16} color="var(--amber)" />
            Maintenance Blackout Windows
            {blackouts.length > 0 && (
              <span className="admin-section-badge">{blackouts.length} active</span>
            )}
          </div>
          <button className="btn btn-sm btn-amber" onClick={() => setShowBlackoutModal(true)}>
            <AlertOctagon size={13} /> Declare Blackout
          </button>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Blackout Window</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {blackouts.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign:'center', color:'var(--text-4)', padding:'28px' }}>No blackouts declared yet.</td></tr>
              ) : blackouts.map(b => (
                <tr key={b.id}>
                  <td className="td-primary">{b.asset_name}</td>
                  <td>
                    <span style={{ fontFamily:'var(--mono)', fontSize:'0.78rem', color:'var(--amber)' }}>
                      {b.start_date} → {b.end_date}
                    </span>
                  </td>
                  <td style={{ color:'var(--text-2)', fontSize:'0.845rem' }}>{b.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ Add Asset Modal ═══════════════════════════════════════ */}
      {showAssetModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAssetModal(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <div className="modal-title">Add New Equipment</div>
                <div className="modal-subtitle">Register a new asset in the inventory database</div>
              </div>
              <button className="btn-close-modal" onClick={() => setShowAssetModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAssetSubmit}>
              <div className="modal-body">
                {assetError && (
                  <div className="alert alert-error"><AlertTriangle size={15} className="alert-icon" />{assetError}</div>
                )}
                <div className="form-group">
                  <label className="form-label">Equipment Name</label>
                  <input className="form-control" required placeholder="e.g. Dell XPS 15 Workstation" value={assetName} onChange={e => setAssetName(e.target.value)} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Serial Number</label>
                    <input className="form-control" required placeholder="SN-XXXXXX" value={serial} onChange={e => setSerial(e.target.value)} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="form-group">
                    <label className="form-label">Late Penalty ($/day)</label>
                    <input type="number" min={1} className="form-control" required value={rate} onChange={e => setRate(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-control" value={location} onChange={e => setLocation(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={2} placeholder="Brief description of equipment capabilities..." value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><PlusCircle size={13} /> Create Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Edit Asset Modal ═══════════════════════════════════════ */}
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
            <form onSubmit={handleEditSubmit}>
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
                    <select className="form-control" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
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
                    <input className="form-control" value={editLocation} onChange={e => setEditLocation(e.target.value)} />
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

      {/* ══ Blackout Modal ════════════════════════════════════════ */}
      {showBlackoutModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowBlackoutModal(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <div className="modal-title">Declare Maintenance Blackout</div>
                <div className="modal-subtitle">Block an asset from new bookings during a maintenance window</div>
              </div>
              <button className="btn-close-modal" onClick={() => setShowBlackoutModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleBlackoutSubmit}>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <Info size={14} className="alert-icon" />
                  <div>Any new reservation attempts overlapping this window will be automatically blocked for this asset.</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Select Equipment</label>
                  <select className="form-control" value={boAssetId} onChange={e => setBoAssetId(e.target.value)}>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} — {a.serial_number}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-control" required value={boStart} onChange={e => setBoStart(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-control" required value={boEnd} onChange={e => setBoEnd(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <input className="form-control" required placeholder="e.g. Scheduled firmware upgrade & recalibration" value={boReason} onChange={e => setBoReason(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBlackoutModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-amber"><AlertOctagon size={13} /> Declare Blackout</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
