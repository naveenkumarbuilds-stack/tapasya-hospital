export interface BusinessProfile {
  name: string;
  tagline: string;
  category: string;
  address: {
    line1: string;
    landmark: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    googleMapsUrl: string;
  };
  contact: {
    phone: string;
    emergencyPhone: string;
    whatsapp: string;
    email: string;
  };
  hours: {
    emergency: string;
    opd: {
      weekdays: string;
      sundays: string;
    };
    pharmacy: string;
    dialysis: string;
  };
  stats: {
    rating: number;
    reviewCount: number;
    establishedYear: number;
  };
  highlights: string[];
}

export interface ServiceItem {
  id: string;
  name: string;
  category: 'Dialysis & Nephrology' | 'General & Laparoscopic Surgery' | 'Emergency & Trauma' | 'Internal Medicine' | 'Obstetrics & Gynaecology' | 'Paediatrics' | 'Diagnostics & Pharmacy';
  description: string;
  durationMinutes: number;
  consultationFee?: number; // Only displayed if verified by hospital
  feeVerified: boolean;
  priceNote?: string;
  department: string;
  image?: string;
  isActive: boolean;
  isPopular?: boolean;
}

export interface DoctorProfile {
  id: string;
  name: string;
  department: string;
  specialty: string;
  status: 'confirmed' | 'awaiting_confirmation';
  source?: string;
  notes?: string;
  title?: string;
  qualifications?: string;
  experienceYears?: number;
  opdSchedule?: string;
  availableDays?: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  consultationFee?: number;
  feeVerified?: boolean;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface StatusHistoryEntry {
  status: AppointmentStatus;
  timestamp: string;
  note?: string;
  by: 'customer' | 'admin' | 'system';
}

export interface Appointment {
  id: string;
  referenceNumber: string; // e.g. TAP-2026-XXXX
  serviceId: string;
  serviceName: string;
  doctorId?: string;
  doctorName?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  endTimeSlot: string; // HH:MM
  durationMinutes: number;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: 'male' | 'female' | 'other';
  notes?: string;
  status: AppointmentStatus;
  urgency: 'routine' | 'urgent' | 'emergency';
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryEntry[];
}

export interface BlockedPeriod {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:MM (if partial day)
  endTime?: string; // HH:MM
  doctorId?: string; // specific doctor or all
  reason: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  department?: string;
  message: string;
  isEmergencyCallback: boolean;
  createdAt: string;
  resolved: boolean;
}

export interface BusinessSettings {
  advanceBookingDays: number; // e.g. 14 days
  bufferMinutes: number; // e.g. 10 mins
  autoConfirmRoutine: boolean;
  cancellationCutoffHours: number; // e.g. 2 hours
  emergencyNotice: string;
  noticeBanner: {
    enabled: boolean;
    text: string;
  };
}

export interface AvailableTimeSlot {
  time: string; // "09:00"
  formatted: string; // "09:00 AM"
  available: boolean;
  reason?: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  source: 'Google Maps' | 'Justdial' | 'Verified Patient';
  tag?: string;
}
