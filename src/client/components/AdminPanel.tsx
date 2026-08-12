import React, { useState } from 'react';
import {
  ShieldCheck, CheckCircle2, X, PlusCircle, AlertOctagon,
  ClipboardList, Layers, Package, AlertTriangle, Info
} from 'lucide-react';
import { Reservation, Asset, Blackout } from '../types.js';

interface AdminPanelProps {
  pendingReservations: Reservation[];
  assets: Asset[];
  blackouts: Blackout[];
  onApprove: (id: number) => Promise<void>;
  onReject:  (id: number) => Promise<void>;
  onCreateAsset:   (data: any) => Promise<boolean>;
  onCreateBlackout:(data: any) => Promise<boolean>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  pendingReservations, assets, blackouts,
  onApprove, onReject, onCreateAsset, onCreateBlackout
}) => {
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showBlackoutModal, setShowBlackoutModal] = useState(false);

  // Asset form
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('Laptop');
  const [serial, setSerial] = useState('');
  const [rate, setRate] = useState(50);
  const [location, setLocation] = useState('Main Office - Locker A');
  const [desc, setDesc] = useState('');
  const [assetError, setAssetError] = useState('');

  // Blackout form
  const [boAssetId, setBoAssetId] = useState(assets[0]?.id || 1);
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

  const handleBlackoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onCreateBlackout({ assetId:Number(boAssetId), startDate:boStart, endDate:boEnd, reason:boReason });
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
            Review pending bookings, manage maintenance blackouts, and register new inventory.
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
            <div className="stat-label">Total Assets</div>
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
                  <select className="form-control" value={boAssetId} onChange={e => setBoAssetId(Number(e.target.value))}>
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
