import React, { useState } from 'react';
import {
  CalendarCheck, RotateCcw, XCircle, CheckCircle2,
  Clock, AlertTriangle, Inbox, DollarSign, Crown
} from 'lucide-react';
import { Reservation, User } from '../types.js';

interface MyReservationsProps {
  reservations: Reservation[];
  currentUser: User;
  onReturn:  (id: number, returnDate?: string) => Promise<{ success: boolean; message?: string }>;
  onCancel:  (id: number) => Promise<{ success: boolean; message?: string }>;
}

export const MyReservations: React.FC<MyReservationsProps> = ({
  reservations, currentUser, onReturn, onCancel
}) => {
  const [returningId, setReturningId] = useState<number | null>(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleReturnConfirm = async (id: number) => {
    const res = await onReturn(id, returnDate);
    setReturningId(null);
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message || '' });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Cancel this reservation?')) return;
    const res = await onCancel(id);
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message || '' });
    setTimeout(() => setFeedback(null), 4000);
  };

  const activeCount = reservations.filter(r =>
    ['PENDING','CONFIRMED','CHECKED_OUT'].includes(r.status)
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Reservations</h1>
          <p className="page-subtitle">
            {activeCount} active · {reservations.length} total
            {currentUser.role === 'STANDARD' && (
              <span style={{ marginLeft:8, color: activeCount >= 3 ? '#f87171' : '#34d399' }}>
                · Quota: {activeCount}/3
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`alert alert-${feedback.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom:20 }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} className="alert-icon" /> : <AlertTriangle size={18} className="alert-icon" />}
          <div>{feedback.text}</div>
        </div>
      )}

      {/* Quota warning */}
      {currentUser.role === 'STANDARD' && activeCount >= 3 && (
        <div className="alert alert-warning" style={{ marginBottom:20 }}>
          <AlertTriangle size={18} className="alert-icon" />
          <div>
            <strong>Reservation Quota Reached (3/3).</strong> Return or cancel an active booking to make a new reservation.
          </div>
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="glass-panel">
          <div className="empty-state">
            <Inbox size={40} color="var(--text-4)" />
            <h3>No reservations yet</h3>
            <p>Browse the Equipment Catalog and reserve laptops, cameras, or testing rigs.</p>
          </div>
        </div>
      ) : (
        <div className="glass-panel table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Penalty Fee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(r => {
                const overdue =
                  r.status === 'CONFIRMED' || r.status === 'CHECKED_OUT'
                    ? new Date() > new Date(r.end_date)
                    : false;

                return (
                  <tr key={r.id} id={`reservation-row-${r.id}`}>
                    <td>
                      <div className="td-primary">{r.asset_name}</div>
                      <div className="td-mono">{r.serial_number}</div>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.83rem', color:'var(--text-2)' }}>
                        <Clock size={13} color="var(--blue)" />
                        {r.start_date} → {r.end_date}
                      </div>
                      {overdue && (
                        <div style={{ fontSize:'0.72rem', color:'#f87171', marginTop:3, display:'flex', alignItems:'center', gap:4 }}>
                          <AlertTriangle size={11} /> Overdue
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge status-${r.status}`}>{r.status}</span>
                    </td>
                    <td>
                      {r.is_vip_auto_approved === 1 ? (
                        <span className="vip-crown"><Crown size={10} /> VIP AUTO</span>
                      ) : (
                        <span className="role-badge role-STANDARD">Standard</span>
                      )}
                    </td>
                    <td>
                      {r.penalty_fee > 0 ? (
                        <span className="penalty-active">
                          <DollarSign size={13} style={{ verticalAlign:'middle' }} />
                          {r.penalty_fee.toFixed(2)}
                        </span>
                      ) : (
                        <span className="penalty-none">$0.00</span>
                      )}
                    </td>
                    <td>
                      <div className="action-group">
                        {(r.status === 'CONFIRMED' || r.status === 'CHECKED_OUT') && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => { setReturningId(r.id); setReturnDate(new Date().toISOString().split('T')[0]); }}
                            id={`return-btn-${r.id}`}
                          >
                            <RotateCcw size={13} /> Return
                          </button>
                        )}
                        {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleCancel(r.id)}
                            id={`cancel-btn-${r.id}`}
                          >
                            <XCircle size={13} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Return Modal */}
      {returningId && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setReturningId(null); }}>
          <div className="modal-box" style={{ maxWidth:400 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Return Equipment</div>
                <div className="modal-subtitle">Select the return date to process check-in</div>
              </div>
              <button className="btn-close-modal" onClick={() => setReturningId(null)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                <DollarSign size={16} className="alert-icon" />
                <div>Late returns incur a per-day penalty fee based on the asset's daily rate.
                  {currentUser.role === 'VIP' && ' VIP users receive 50% discount on late fees.'}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Actual Return Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  id="return-date-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReturningId(null)}>Cancel</button>
              <button className="btn btn-success" onClick={() => handleReturnConfirm(returningId)} id="confirm-return-submit-btn">
                <CheckCircle2 size={15} /> Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
