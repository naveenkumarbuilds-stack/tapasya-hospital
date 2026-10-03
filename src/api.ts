import type {
  BusinessProfile,
  ServiceItem,
  DoctorProfile,
  Appointment,
  BlockedPeriod,
  BusinessSettings,
  AvailableTimeSlot,
  ReviewItem
} from './types';

export interface BusinessDataResponse {
  business: BusinessProfile;
  settings: BusinessSettings;
  reviews: ReviewItem[];
}

export interface AvailabilityResponse {
  date: string;
  dayOfWeek: number;
  isClosed: boolean;
  reason?: string;
  doctor?: string;
  slots: AvailableTimeSlot[];
}

export interface BookingPayload {
  serviceId: string;
  doctorId?: string;
  date: string;
  timeSlot: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: 'male' | 'female' | 'other';
  notes?: string;
  urgency?: 'routine' | 'urgent' | 'emergency';
}

export interface BookingResponse {
  success: boolean;
  message: string;
  appointment: Appointment;
}

export interface AdminStatsResponse {
  todayCount: number;
  upcomingCount: number;
  pendingCount: number;
  completedCount: number;
  cancelledCount: number;
  confirmedCount: number;
  totalCount: number;
  inquiryCount: number;
  todayDate: string;
  timeZone: string;
}

export const api = {
  // Public
  async getBusiness(): Promise<BusinessDataResponse> {
    const res = await fetch('/api/business');
    if (!res.ok) throw new Error('Failed to load business profile');
    return res.json();
  },

  async getServices(): Promise<ServiceItem[]> {
    const res = await fetch('/api/services');
    if (!res.ok) throw new Error('Failed to load services catalogue');
    return res.json();
  },

  async getDoctors(): Promise<DoctorProfile[]> {
    const res = await fetch('/api/doctors');
    if (!res.ok) throw new Error('Failed to load doctors');
    return res.json();
  },

  async getAvailability(date: string, serviceId?: string, doctorId?: string): Promise<AvailabilityResponse> {
    const params = new URLSearchParams({ date });
    if (serviceId) params.append('serviceId', serviceId);
    if (doctorId) params.append('doctorId', doctorId);
    const res = await fetch(`/api/availability?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to check availability');
    }
    return res.json();
  },

  async createAppointment(payload: BookingPayload): Promise<BookingResponse> {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit appointment');
    }
    return data;
  },

  async lookupAppointment(ref: string, phone: string): Promise<Appointment> {
    const params = new URLSearchParams({ ref, phone });
    const res = await fetch(`/api/appointments/lookup?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Appointment not found');
    }
    return data;
  },

  async cancelAppointment(id: string, phone: string, reason?: string): Promise<{ success: boolean; appointment: Appointment }> {
    const res = await fetch(`/api/appointments/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, reason })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to cancel appointment');
    }
    return data;
  },

  async sendContact(payload: {
    name: string;
    phone: string;
    email?: string;
    department?: string;
    message: string;
    isEmergencyCallback?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send inquiry');
    }
    return data;
  },

  // Admin
  async adminLogin(password: string): Promise<{ token: string; user: { role: string; name: string } }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async adminGetAppointments(token: string, filters?: { date?: string; status?: string; search?: string }): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    const res = await fetch(`/api/admin/appointments?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to load appointments');
    }
    return data;
  },

  async adminUpdateAppointmentStatus(token: string, id: string, status: string, note?: string, referenceNumber?: string): Promise<Appointment> {
    const res = await fetch(`/api/admin/appointments/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status, note, referenceNumber })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update appointment status in database.');
    }
    return data.appointment;
  },

  async adminCreateManualAppointment(token: string, payload: any): Promise<Appointment> {
    const res = await fetch('/api/admin/appointments/manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to create manual appointment');
    return data;
  },

  async adminGetStats(token: string): Promise<AdminStatsResponse> {
    const res = await fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to load admin stats');
    return data;
  },

  async adminGetBlocked(token: string): Promise<BlockedPeriod[]> {
    const res = await fetch('/api/admin/blocked-periods', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load blocked periods');
    return res.json();
  },

  async adminAddBlocked(token: string, payload: any): Promise<BlockedPeriod> {
    const res = await fetch('/api/admin/blocked-periods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to add blocked period');
    return res.json();
  },

  async adminDeleteBlocked(token: string, id: string): Promise<void> {
    const res = await fetch(`/api/admin/blocked-periods/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to remove blocked period');
  },

  async adminUpdateService(token: string, id: string, payload: Partial<ServiceItem>): Promise<ServiceItem> {
    const res = await fetch(`/api/services/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update service');
    return res.json();
  },

  async adminAddService(token: string, payload: Partial<ServiceItem>): Promise<ServiceItem> {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to add service');
    return res.json();
  },

  async adminUpdateSettings(token: string, settings: any, business?: any): Promise<any> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ settings, business })
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async adminGetSupabaseStatus(token: string): Promise<any> {
    const res = await fetch('/api/admin/supabase/status', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to get Supabase status');
    return res.json();
  },

  async adminSyncSupabase(token: string): Promise<any> {
    const res = await fetch('/api/admin/supabase/sync', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to sync to Supabase');
    return res.json();
  },

  // Admin Doctor Directory Management
  async adminGetDoctors(token: string): Promise<DoctorProfile[]> {
    const res = await fetch('/api/admin/doctors', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load doctor directory');
    return res.json();
  },

  async adminAddDoctor(token: string, payload: Partial<DoctorProfile>): Promise<DoctorProfile> {
    const res = await fetch('/api/admin/doctors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add doctor');
    return data;
  },

  async adminUpdateDoctor(token: string, id: string, payload: Partial<DoctorProfile>): Promise<DoctorProfile> {
    const res = await fetch(`/api/admin/doctors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update doctor');
    return data;
  },

  async adminDeleteDoctor(token: string, id: string): Promise<void> {
    const res = await fetch(`/api/admin/doctors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete doctor profile');
  }
};
