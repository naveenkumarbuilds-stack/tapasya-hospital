import { createClient } from '@supabase/supabase-js';
import type { Appointment, AppointmentStatus, ContactInquiry } from '../types';

export const SUPABASE_PROJECT_ID = 'wpvbfbcsnxuqwqdgrdeq';
export const SUPABASE_URL = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_hUh1LMQ8lgo61MNCNYz9Ng_5Ob3jQ8B';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SupabaseSyncResult {
  success: boolean;
  tableMissing?: boolean;
  message?: string;
  error?: string;
  appointment?: Appointment;
}

/**
 * Normalizes any status string from database or client into a canonical AppointmentStatus
 */
export function normalizeAppointmentStatus(raw: unknown): AppointmentStatus {
  const s = String(raw ?? 'confirmed').trim().toLowerCase();
  if (s === 'confirmed' || s === 'confirm' || s === 'approved') return 'confirmed';
  if (s === 'pending' || s === 'awaiting' || s === 'pending_review' || s === 'review') return 'pending';
  if (s === 'completed' || s === 'complete' || s === 'done' || s === 'mark_done' || s === 'marked_done') return 'completed';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancel') return 'cancelled';
  if (s === 'no_show' || s === 'noshow') return 'no_show';
  return 'confirmed';
}

function computeEndTimeSlot(timeSlot: string, durationMinutes: number): string {
  const parts = String(timeSlot || '10:00').split(':').map(Number);
  const hh = Number.isFinite(parts[0]) ? parts[0] : 10;
  const mm = Number.isFinite(parts[1]) ? parts[1] : 0;
  const totalMins = hh * 60 + mm + (Number(durationMinutes) || 30);
  const endH = String(Math.floor(totalMins / 60) % 24).padStart(2, '0');
  const endM = String(totalMins % 60).padStart(2, '0');
  return `${endH}:${endM}`;
}

/**
 * Maps an internal Appointment object to the Supabase database schema
 */
export function mapAppointmentToSupabase(apt: Appointment) {
  const cleanStatus = normalizeAppointmentStatus(apt.status);
  const payload: Record<string, any> = {
    reference_number: String(apt.referenceNumber).trim(),
    patient_name: String(apt.patientName).trim(),
    patient_phone: String(apt.patientPhone).trim(),
    patient_email: apt.patientEmail ? String(apt.patientEmail).trim() : null,
    patient_age: apt.patientAge !== undefined && apt.patientAge !== null ? Number(apt.patientAge) : null,
    patient_gender: apt.patientGender || null,
    service_id: apt.serviceId,
    service_name: apt.serviceName,
    doctor_id: apt.doctorId || null,
    doctor_name: apt.doctorName || null,
    appointment_date: String(apt.date).trim(),
    time_slot: String(apt.timeSlot).trim(),
    duration_minutes: Number(apt.durationMinutes) || 30,
    status: cleanStatus,
    urgency: apt.urgency || 'routine',
    notes: apt.notes ? String(apt.notes).trim() : null,
    created_at: apt.createdAt || new Date().toISOString(),
    updated_at: apt.updatedAt || new Date().toISOString()
  };

  if (apt.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apt.id)) {
    payload.id = apt.id;
  }

  return payload;
}

/**
 * Maps a row from Supabase appointments table to internal Appointment model
 */
export function mapSupabaseRowToAppointment(row: any): Appointment {
  const cleanStatus = normalizeAppointmentStatus(row.status);
  const timeSlot = String(row.time_slot || '10:00').trim().slice(0, 5);
  const durationMinutes = Number(row.duration_minutes) || 30;
  return {
    id: row.id ? String(row.id) : `apt-${row.reference_number}`,
    referenceNumber: String(row.reference_number || '').trim(),
    serviceId: String(row.service_id || 'srv-consultation'),
    serviceName: String(row.service_name || 'Clinical Consultation'),
    doctorId: row.doctor_id ? String(row.doctor_id) : undefined,
    doctorName: row.doctor_name ? String(row.doctor_name) : 'Duty Specialist',
    date: String(row.appointment_date || '').trim(),
    timeSlot,
    endTimeSlot: computeEndTimeSlot(timeSlot, durationMinutes),
    durationMinutes,
    patientName: String(row.patient_name || 'Patient').trim(),
    patientPhone: String(row.patient_phone || '').trim(),
    patientEmail: row.patient_email ? String(row.patient_email).trim() : undefined,
    patientAge: row.patient_age !== null && row.patient_age !== undefined ? Number(row.patient_age) : undefined,
    patientGender: row.patient_gender ? (String(row.patient_gender).toLowerCase().trim() as any) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    status: cleanStatus,
    urgency: (row.urgency ? String(row.urgency).toLowerCase().trim() : 'routine') as any,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    statusHistory: [
      {
        status: cleanStatus,
        timestamp: row.updated_at || row.created_at || new Date().toISOString(),
        note: `Database status: ${cleanStatus}`,
        by: 'system'
      }
    ]
  };
}

/**
 * Saves or updates an appointment in Supabase database and returns the persisted row
 */
export async function saveAppointmentToSupabase(apt: Appointment): Promise<SupabaseSyncResult> {
  try {
    const payload = mapAppointmentToSupabase(apt);
    const { data, error } = await supabase
      .from('appointments')
      .upsert([payload], { onConflict: 'reference_number' })
      .select('*');

    if (error) {
      const isTableMissing = error.code === 'PGRST205' || error.message.includes('schema cache');
      console.warn(`[Supabase Sync Warning] Could not save appointment ${apt.referenceNumber} to Supabase:`, error.message);
      return {
        success: false,
        tableMissing: isTableMissing,
        error: error.message
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Database did not return the saved appointment record.'
      };
    }

    const savedApt = mapSupabaseRowToAppointment(data[0]);
    return {
      success: true,
      appointment: savedApt
    };
  } catch (err: any) {
    console.error('[Supabase Sync Exception]:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetches all appointments stored in Supabase ordered by appointment_date and time_slot
 */
export async function fetchAppointmentsFromSupabase(): Promise<{
  success: boolean;
  appointments: Appointment[];
  tableMissing?: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      const isTableMissing = error.code === 'PGRST205' || error.message.includes('schema cache');
      return { success: false, appointments: [], tableMissing: isTableMissing, error: error.message };
    }

    // Deduplicate by database id and reference_number to prevent any duplicate counting
    const seenIds = new Set<string>();
    const seenRefs = new Set<string>();
    const appointments: Appointment[] = [];

    for (const row of data || []) {
      const mapped = mapSupabaseRowToAppointment(row);
      const idKey = mapped.id.toLowerCase();
      const refKey = mapped.referenceNumber.toUpperCase();
      if (seenIds.has(idKey) || (refKey && seenRefs.has(refKey))) {
        continue;
      }
      seenIds.add(idKey);
      if (refKey) seenRefs.add(refKey);
      appointments.push(mapped);
    }

    return { success: true, appointments };
  } catch (err: any) {
    return { success: false, appointments: [], error: err.message };
  }
}

/**
 * Updates appointment status in Supabase by unique database ID (UUID) or reference_number.
 * Verifies that the update actually modified a row in Supabase before returning success.
 */
export async function updateAppointmentStatusInSupabase(
  idOrRef: string,
  status: string,
  secondaryRefOrId?: string
): Promise<SupabaseSyncResult> {
  try {
    const cleanStatus = normalizeAppointmentStatus(status);
    const nowIso = new Date().toISOString();
    const target = String(idOrRef || '').trim();

    if (!target) {
      return { success: false, error: 'Missing appointment identifier.' };
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);

    let query = supabase.from('appointments').update({
      status: cleanStatus,
      updated_at: nowIso
    });

    if (isUUID) {
      query = query.eq('id', target);
    } else {
      query = query.eq('reference_number', target);
    }

    const { data, error } = await query.select('*');
    if (error) {
      return { success: false, error: error.message };
    }

    if (data && data.length > 0) {
      return {
        success: true,
        appointment: mapSupabaseRowToAppointment(data[0])
      };
    }

    // Fallback to secondary identifier if provided (e.g. reference_number when id wasn't UUID)
    if (secondaryRefOrId && String(secondaryRefOrId).trim() && String(secondaryRefOrId).trim() !== target) {
      const sec = String(secondaryRefOrId).trim();
      const isSecondaryUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sec);
      let query2 = supabase.from('appointments').update({
        status: cleanStatus,
        updated_at: nowIso
      });
      if (isSecondaryUUID) {
        query2 = query2.eq('id', sec);
      } else {
        query2 = query2.eq('reference_number', sec);
      }
      const res2 = await query2.select('*');
      if (res2.error) {
        return { success: false, error: res2.error.message };
      }
      if (res2.data && res2.data.length > 0) {
        return {
          success: true,
          appointment: mapSupabaseRowToAppointment(res2.data[0])
        };
      }
    }

    return {
      success: false,
      error: `Appointment (${target}) was not found in Supabase database.`
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Saves a contact/callback inquiry into Supabase
 */
export async function saveInquiryToSupabase(inquiry: ContactInquiry): Promise<SupabaseSyncResult> {
  try {
    const payload = {
      name: inquiry.name,
      phone: inquiry.phone,
      email: inquiry.email || null,
      department: inquiry.department || null,
      message: inquiry.message,
      is_emergency_callback: Boolean(inquiry.isEmergencyCallback),
      resolved: Boolean(inquiry.resolved),
      created_at: inquiry.createdAt || new Date().toISOString()
    };

    const { error } = await supabase.from('inquiries').insert([payload]);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Tests connection to Supabase and checks if tables exist
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  projectId: string;
  url: string;
  tableExists: boolean;
  appointmentCount?: number;
  message: string;
}> {
  try {
    const { error, count } = await supabase
      .from('appointments')
      .select('reference_number', { count: 'exact' })
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
        return {
          connected: true,
          projectId: SUPABASE_PROJECT_ID,
          url: SUPABASE_URL,
          tableExists: false,
          message: "Connected to Supabase project, but the 'appointments' table has not been created yet in the SQL Editor."
        };
      }
      return {
        connected: false,
        projectId: SUPABASE_PROJECT_ID,
        url: SUPABASE_URL,
        tableExists: false,
        message: `Supabase returned error: ${error.message}`
      };
    }

    return {
      connected: true,
      projectId: SUPABASE_PROJECT_ID,
      url: SUPABASE_URL,
      tableExists: true,
      appointmentCount: count ?? 0,
      message: "Successfully connected to Supabase! The 'appointments' table is ready and accepting records."
    };
  } catch (err: any) {
    return {
      connected: false,
      projectId: SUPABASE_PROJECT_ID,
      url: SUPABASE_URL,
      tableExists: false,
      message: `Failed to reach Supabase: ${err.message}`
    };
  }
}

/**
 * Batch syncs appointments to Supabase
 */
export async function syncAllAppointmentsToSupabase(appointments: Appointment[]): Promise<{
  total: number;
  synced: number;
  failed: number;
  tableMissing: boolean;
  errors: string[];
}> {
  if (appointments.length === 0) {
    return { total: 0, synced: 0, failed: 0, tableMissing: false, errors: [] };
  }

  const payloads = appointments.map(mapAppointmentToSupabase);
  const { error } = await supabase
    .from('appointments')
    .upsert(payloads, { onConflict: 'reference_number' });

  if (error) {
    const isTableMissing = error.code === 'PGRST205' || error.message.includes('schema cache');
    return {
      total: appointments.length,
      synced: 0,
      failed: appointments.length,
      tableMissing: isTableMissing,
      errors: [error.message]
    };
  }

  return {
    total: appointments.length,
    synced: appointments.length,
    failed: 0,
    tableMissing: false,
    errors: []
  };
}
