import mongoose, { Schema, model, Document, Types } from 'mongoose';

// ── User ──────────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  password_hash: string;
  name: string;
  role: 'STANDARD' | 'VIP' | 'ADMIN';
  department: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  username:      { type: String, required: true, unique: true, trim: true },
  password_hash: { type: String, required: true },
  name:          { type: String, required: true },
  role:          { type: String, enum: ['STANDARD', 'VIP', 'ADMIN'], default: 'STANDARD' },
  department:    { type: String, required: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

export const User = model<IUser>('User', userSchema);

// ── Asset ─────────────────────────────────────────────────────────
export interface IAsset extends Document {
  _id: Types.ObjectId;
  name: string;
  category: string;
  serial_number: string;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED';
  daily_penalty_rate: number;
  description: string;
  location: string;
  createdAt: Date;
}

const assetSchema = new Schema<IAsset>({
  name:               { type: String, required: true },
  category:           { type: String, required: true },
  serial_number:      { type: String, required: true, unique: true },
  status:             { type: String, enum: ['AVAILABLE', 'MAINTENANCE', 'RETIRED'], default: 'AVAILABLE' },
  daily_penalty_rate: { type: Number, default: 50.0 },
  description:        { type: String, default: '' },
  location:           { type: String, default: 'Main Office - Locker A' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

export const Asset = model<IAsset>('Asset', assetSchema);

// ── Reservation ───────────────────────────────────────────────────
export interface IReservation extends Document {
  _id: Types.ObjectId;
  asset_id: Types.ObjectId;
  user_id: Types.ObjectId;
  start_date: string;
  end_date: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_OUT' | 'RETURNED' | 'REJECTED' | 'CANCELLED';
  is_vip_auto_approved: boolean;
  penalty_fee: number;
  actual_return_date?: string;
  notes: string;
  createdAt: Date;
}

const reservationSchema = new Schema<IReservation>({
  asset_id:             { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  user_id:              { type: Schema.Types.ObjectId, ref: 'User',  required: true },
  start_date:           { type: String, required: true },
  end_date:             { type: String, required: true },
  status:               { type: String, enum: ['PENDING','CONFIRMED','CHECKED_OUT','RETURNED','REJECTED','CANCELLED'], default: 'PENDING' },
  is_vip_auto_approved: { type: Boolean, default: false },
  penalty_fee:          { type: Number, default: 0 },
  actual_return_date:   { type: String },
  notes:                { type: String, default: '' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

export const Reservation = model<IReservation>('Reservation', reservationSchema);

// ── Blackout ──────────────────────────────────────────────────────
export interface IBlackout extends Document {
  _id: Types.ObjectId;
  asset_id: Types.ObjectId;
  start_date: string;
  end_date: string;
  reason: string;
  createdAt: Date;
}

const blackoutSchema = new Schema<IBlackout>({
  asset_id:   { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  start_date: { type: String, required: true },
  end_date:   { type: String, required: true },
  reason:     { type: String, required: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

export const Blackout = model<IBlackout>('Blackout', blackoutSchema);

// ── AuditLog ──────────────────────────────────────────────────────
export interface IAuditLog extends Document {
  action: string;
  user_id?: Types.ObjectId;
  details: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  action:    { type: String, required: true },
  user_id:   { type: Schema.Types.ObjectId, ref: 'User' },
  details:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
