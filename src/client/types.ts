export interface User {
  id: number;
  username: string;
  name: string;
  role: 'STANDARD' | 'VIP' | 'ADMIN';
  department: string;
}

export interface Asset {
  id: number;
  name: string;
  category: string;
  serial_number: string;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED';
  daily_penalty_rate: number;
  description: string;
  location: string;
}

export interface Reservation {
  id: number;
  asset_id: number;
  user_id: number;
  asset_name: string;
  asset_category: string;
  serial_number: string;
  daily_penalty_rate: number;
  user_name: string;
  user_role: string;
  start_date: string;
  end_date: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_OUT' | 'RETURNED' | 'REJECTED' | 'CANCELLED';
  is_vip_auto_approved: number;
  penalty_fee: number;
  actual_return_date?: string;
  notes?: string;
  created_at: string;
}

export interface Blackout {
  id: number;
  asset_id: number;
  asset_name?: string;
  start_date: string;
  end_date: string;
  reason: string;
}
