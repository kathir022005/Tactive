import React, { useState } from 'react';
import {
  ShieldCheck, CheckCircle2, X, PlusCircle, AlertOctagon,
  ClipboardList, Package, AlertTriangle, Info, Edit3, Trash2
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

  // Asset creation form
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('Laptop');
  const [serial, setSerial] = useState('');
  const [rate, setRate] = useState(50);
  const [location, setLocation] = useState('Main Office - Locker A');
  const [desc, setDesc] = useState('');
  const [assetError, setAssetError] = useState('');

  // Asset edit form
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
    if (ok) { setShowAssetModal(false); setAssetName(''); setSerial(''); }
    else setAssetError('Failed to create asset. Serial number may already exist.');
  };

  const startEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setEditName(asset.name);
    setEditCategory(asset.category);
    setEditSerial(asset.serial_number);
    setEditStatus(asset.status);
    setEditRate(asset.daily_penalty_rate);
    setEditLocation(asset.location || 'Main Office');
    setEditDesc(asset.description || '');
    setEditError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset || !onUpdateAsset) return;
    setEditError('');
    const ok = await onUpdateAsset(editingAsset.id, {
      name: editName,
      category: editCategory,
      serialNumber: editSerial,
      status: editStatus,
      dailyPenaltyRate: editRate,
      location: editLocation,
      description: editDesc
    });
    if (ok) {
      setEditingAsset(null);
    } else {
      setEditError('Failed to update asset. Check serial number or inputs.');
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!onDeleteAsset) return;
    if (window.confirm('Are you sure you want to delete this asset from inventory?')) {
      await onDeleteAsset(id);
    }
  };

  const handleBlackoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onCreateBlackout({ assetId: boAssetId, startDate:boStart, endDate:boEnd, reason:boReason });
    if (ok) { setShowBlackoutModal(false); setBoStart(''); setBoEnd(''); setBoReason(''); }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display:'flex', alignItems:'center', gap:10 }}>
            <ShieldCheck color="var(--amber)" size={26} /> Admin Dashboard
          </h1>
          <p className="page-subtitle">
            Manage inventory products, edit equipment details, review pending bookings, and declare maintenance blackouts.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-amber" onClick={() => setShowBlackoutModal(true)} id="add-blackout-btn">
            <AlertOctagon size={15} /> Declare Blackout
          </button>
          <button className="btn btn-primary" onClick={() => setShowAssetModal(true)} id="add-asset-btn">
            <PlusCircle size={15} /> Add Asset
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar" style={{ marginBottom:28 }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-amber"><ClipboardList size={20} /></div>
          <div>
            <div className="stat-label">Pending Approvals</div>
            <div className="stat-value">{pendingReservations.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><Package size={20} /></div>
          <div>
            <div className="stat-label">Total Inventory Assets</div>
            <div className="stat-value">{assets.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-purple"><AlertOctagon size={20} /></div>
          <div>
            <div className="stat-label">Active Blackouts</div>
            <div className="stat-value">{blackouts.length}</div>
          </div>
        </div>
      </div>

      {/* ── Asset Inventory Management Table (ADD & EDIT PRODUCTS) ── */}
      <div style={{ marginBottom:36 }}>
        <div className="section-heading">
          <div className="section-title">
            <Package size={18} color="var(--blue)" />
            Inventory & Asset Management (Add / Edit Equipment)
          </div>
        </div>
        <div className="glass-panel table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Serial Number</th>
                <th>Status</th>
                <th>Penalty Rate</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(a => (
                <tr key={a.id}>
                  <td>
                    <div className="td-primary">{a.name}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-3)' }}>{a.description}</div>
                  </td>
                  <td>{a.category}</td>
                  <td className="td-mono">{a.serial_number}</td>
                  <td>
                    <span className={`badge ${
                      a.status === 'AVAILABLE' ? 'badge-available' :
                      a.status === 'MAINTENANCE' ? 'badge-maintenance' : 'badge-retired'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="td-mono" style={{ color:'var(--amber)' }}>${a.daily_penalty_rate}/day</td>
                  <td>{a.location}</td>
                  <td>
                    <div className="action-group">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => startEditAsset(a)}
                        title="Edit Asset Details"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      {onDeleteAsset && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(a.id)}
                          title="Delete Asset"
                        >
                          <Trash2 size={13} />
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

      <hr className="divider" />

      {/* Pending Queue */}
      <div style={{ marginBottom:32 }}>
        <div className="section-heading">
          <div className="section-title">
            <ClipboardList size={18} color="var(--blue)" />
            Pending Approval Queue
            {pendingReservations.length > 0 && (
              <span className="tab-badge" style={{ background:'rgba(245,158,11,0.8)' }}>
                {pendingReservations.length}
              </span>
            )}
          </div>
        </div>

        {pendingReservations.length === 0 ? (
          <div className="glass-panel">
            <div className="empty-state" style={{ padding:'32px 20px' }}>
              <CheckCircle2 size={32} color="#34d399" />
              <h3>All clear — no pending approvals</h3>
              <p>Standard user reservations will appear here for review.</p>
            </div>
          </div>
        ) : (
          <div className="glass-panel table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Requested By</th>
                  <th>Asset</th>
                  <th>Dates</th>
                  <th>Purpose</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingReservations.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="td-primary">{r.user_name}</div>
                      <div className="td-mono">{r.user_role}</div>
                    </td>
                    <td>{r.asset_name}</td>
                    <td>
                      <div style={{ fontSize:'0.83rem', color:'var(--text-2)' }}>
                        {r.start_date} → {r.end_date}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize:'0.82rem', color:'var(--text-3)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {r.notes || <em>No notes provided</em>}
                      </div>
                    </td>
                    <td>
                      <div className="action-group">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => onApprove(r.id)}
                          id={`admin-approve-${r.id}`}
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => onReject(r.id)}
                          id={`admin-reject-${r.id}`}
                        >
                          <X size={13} /> Reject
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

      <hr className="divider" />

      {/* Blackouts */}
      <div>
        <div className="section-heading">
          <div className="section-title">
            <AlertOctagon size={18} color="var(--amber)" />
            Maintenance Blackout Windows
          </div>
        </div>
        <div className="glass-panel table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Blackout Window</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {blackouts.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign:'center', color:'var(--text-4)', padding:'28px' }}>No blackouts declared.</td></tr>
              ) : blackouts.map(b => (
                <tr key={b.id}>
                  <td className="td-primary">{b.asset_name}</td>
                  <td>
                    <span style={{ fontFamily:'var(--mono)', fontSize:'0.8rem', color:'var(--amber)' }}>
                      {b.start_date} → {b.end_date}
                    </span>
                  </td>
                  <td>{b.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Asset Modal ── */}
      {showAssetModal && (
        <div className="modal-overlay" onClick={e => { if (e.target===e.currentTarget) setShowAssetModal(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <div className="modal-title">Add New Asset</div>
                <div className="modal-subtitle">Register equipment in the inventory</div>
              </div>
              <button className="btn-close-modal" onClick={() => setShowAssetModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAssetSubmit}>
              <div className="modal-body">
                {assetError && (
                  <div className="alert alert-error"><AlertTriangle size={16} className="alert-icon" />{assetError}</div>
                )}
                <div className="form-group">
                  <label className="form-label">Asset Name</label>
                  <input className="form-control" required placeholder="e.g. Dell XPS 15 Workstation" value={assetName} onChange={e => setAssetName(e.target.value)} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                      {['Laptop','AV Equipment','Testing Device','Drone','Peripherals','Server','Camera','Other'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Serial Number</label>
                    <input className="form-control" required placeholder="SN-XXXXXX" value={serial} onChange={e => setSerial(e.target.value)} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div className="form-group">
                    <label className="form-label">Late Penalty Rate ($/day)</label>
                    <input type="number" min={1} className="form-control" required value={rate} onChange={e => setRate(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-control" value={location} onChange={e => setLocation(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={2} placeholder="Brief description of the asset capabilities..." value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><PlusCircle size={14} /> Create Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Asset Modal ── */}
      {editingAsset && (
        <div className="modal-overlay" onClick={e => { if (e.target===e.currentTarget) setEditingAsset(null); }}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <div className="modal-title">Edit Asset Details</div>
                <div className="modal-subtitle">Update product parameters in MongoDB</div>
              </div>
              <button className="btn-close-modal" onClick={() => setEditingAsset(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {editError && (
                  <div className="alert alert-error"><AlertTriangle size={16} className="alert-icon" />{editError}</div>
                )}
                <div className="form-group">
                  <label className="form-label">Asset Name</label>
                  <input className="form-control" required value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-control" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                      {['Laptop','AV Equipment','Testing Device','Drone','Peripherals','Server','Camera','Other'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={editStatus} onChange={e => setEditStatus(e.target.value as any)}>
                      <option value="AVAILABLE">AVAILABLE 🟢</option>
                      <option value="MAINTENANCE">MAINTENANCE 🟡</option>
                      <option value="RETIRED">RETIRED 🔴</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Serial Number</label>
                    <input className="form-control" required value={editSerial} onChange={e => setEditSerial(e.target.value)} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div className="form-group">
                    <label className="form-label">Late Penalty Rate ($/day)</label>
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
                <button type="submit" className="btn btn-primary"><Edit3 size={14} /> Save Asset Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Blackout Modal ── */}
      {showBlackoutModal && (
        <div className="modal-overlay" onClick={e => { if (e.target===e.currentTarget) setShowBlackoutModal(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <div className="modal-title">Declare Maintenance Blackout</div>
                <div className="modal-subtitle">Block an asset for a maintenance window</div>
              </div>
              <button className="btn-close-modal" onClick={() => setShowBlackoutModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleBlackoutSubmit}>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <Info size={16} className="alert-icon" />
                  <div>All existing reservations overlapping with this blackout window will be blocked from new bookings.</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Select Asset</label>
                  <select className="form-control" value={boAssetId} onChange={e => setBoAssetId(e.target.value)}>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.serial_number})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
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
                <button type="submit" className="btn btn-amber"><AlertOctagon size={14} /> Declare Blackout</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
