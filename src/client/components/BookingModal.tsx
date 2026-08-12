import React, { useState } from 'react';
import { X, Calendar, AlertTriangle, Info, Zap, Clock, DollarSign, FileText } from 'lucide-react';
import { Asset, User } from '../types.js';

interface BookingModalProps {
  asset: Asset;
  currentUser: User;
  onClose: () => void;
  onSubmit: (assetId: number, startDate: string, endDate: string, notes: string) => Promise<{ success: boolean; error?: string }>;
}

export const BookingModal: React.FC<BookingModalProps> = ({ asset, currentUser, onClose, onSubmit }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(threeDaysLater);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const diffDays = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
  ) + 1;
  const durationOk = diffDays >= 1 && diffDays <= 14;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!durationOk) return;
    setError(null);
    setLoading(true);
    const result = await onSubmit(asset.id, startDate, endDate, notes);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Reservation failed. Please try again.');
    } else {
      onClose();
    }
  };

  const isVIP = currentUser.role === 'VIP';
  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Reserve Equipment</div>
            <div className="modal-subtitle">{asset.name} — {asset.category}</div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Role-based notification */}
            {(isVIP) && (
              <div className="alert alert-vip">
                <Zap size={18} className="alert-icon" />
                <div>
                  <strong>VIP Priority Active —</strong> Your booking skips the approval queue and confirms instantly. 50% discount applies if returned late.
                </div>
              </div>
            )}
            {(!isVIP && !isAdmin) && (
              <div className="alert alert-info">
                <Info size={18} className="alert-icon" />
                <div>
                  <strong>Standard User:</strong> Reservations enter the admin approval queue. Max 3 active bookings allowed at any time.
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="alert alert-error" id="booking-error-alert">
                <AlertTriangle size={18} className="alert-icon" />
                <div>{error}</div>
              </div>
            )}

            {/* Date pickers */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  min={todayStr}
                  onChange={e => setStartDate(e.target.value)}
                  required
                  id="booking-start-date"
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  min={startDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                  id="booking-end-date"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="booking-preview">
              <div className="booking-preview-row">
                <span className="label"><Clock size={13} style={{ marginRight:4, verticalAlign:'middle' }} />Duration</span>
                <span className={`value ${!durationOk ? 'danger' : diffDays > 10 ? 'warn' : 'good'}`}>
                  {isNaN(diffDays) ? '—' : `${diffDays} day${diffDays !== 1 ? 's' : ''}`}
                  {diffDays > 14 && ' ⚠ Exceeds max 14-day limit'}
                  {diffDays < 1  && ' ⚠ Invalid range'}
                </span>
              </div>
              <div className="booking-preview-row">
                <span className="label"><DollarSign size={13} style={{ marginRight:4, verticalAlign:'middle' }} />Late Penalty Rate</span>
                <span className="value warn">
                  ${asset.daily_penalty_rate.toFixed(2)}/day
                  {isVIP && <span style={{ color:'#a78bfa', marginLeft:6 }}>→ ${(asset.daily_penalty_rate * 0.5).toFixed(2)}/day (VIP 50% off)</span>}
                </span>
              </div>
              <div className="booking-preview-row">
                <span className="label">Approval Mode</span>
                <span className={`value ${isVIP || isAdmin ? 'good' : 'warn'}`}>
                  {isVIP ? '⚡ Auto-Confirmed (VIP)' : isAdmin ? '⚡ Auto-Confirmed (Admin)' : '⏳ Pending Admin Review'}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label"><FileText size={12} style={{ marginRight:4, verticalAlign:'middle' }} />Purpose / Notes</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Describe the business purpose for this reservation (e.g. hardware integration testing for Project Alpha)..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                id="booking-notes-input"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !durationOk}
              id="submit-booking-btn"
            >
              {loading ? (
                <><div className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> Processing...</>
              ) : (
                <><Calendar size={15} /> Confirm Reservation</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
