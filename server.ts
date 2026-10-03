import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  saveAppointmentToSupabase,
  updateAppointmentStatusInSupabase,
  fetchAppointmentsFromSupabase,
  saveInquiryToSupabase,
  testSupabaseConnection,
  syncAllAppointmentsToSupabase,
  normalizeAppointmentStatus
} from './src/server/supabase';
import type {
  BusinessProfile,
  ServiceItem,
  DoctorProfile,
  Appointment,
  AppointmentStatus,
  BlockedPeriod,
  ContactInquiry,
  BusinessSettings,
  AvailableTimeSlot,
  ReviewItem
} from './src/types';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';
const HOSPITAL_TIMEZONE = 'Asia/Kolkata';

app.use(express.json());

// Reliable Static Images Middleware for production and dev
const publicImagesDir = path.resolve(process.cwd(), 'public/images');
app.use('/images', express.static(publicImagesDir));
app.use('/public/images', express.static(publicImagesDir));
// Backward-compatibility aliases for legacy paths
app.use('/src/assets/images', express.static(publicImagesDir));
app.use('/assets/images', express.static(publicImagesDir));

/**
 * Returns the current date and time in the hospital's configured local time zone (Asia/Kolkata, IST)
 */
export function getHospitalLocalDateTime(): {
  todayStr: string;
  currentTimeStr: string;
  currentMinutes: number;
  localDateObj: Date;
} {
  const now = new Date();
  const localDateObj = new Date(now.toLocaleString('en-US', { timeZone: HOSPITAL_TIMEZONE }));
  const yyyy = localDateObj.getFullYear();
  const mm = String(localDateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(localDateObj.getDate()).padStart(2, '0');
  const hh = String(localDateObj.getHours()).padStart(2, '0');
  const min = String(localDateObj.getMinutes()).padStart(2, '0');
  return {
    todayStr: `${yyyy}-${mm}-${dd}`,
    currentTimeStr: `${hh}:${min}`,
    currentMinutes: localDateObj.getHours() * 60 + localDateObj.getMinutes(),
    localDateObj
  };
}

// Persistent Data File (for hospital profile, services, doctors, blocked periods, settings, and statusHistory metadata)
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'hospital_store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface HospitalDataStore {
  business: BusinessProfile;
  services: ServiceItem[];
  doctors: DoctorProfile[];
  appointments: Appointment[];
  blockedPeriods: BlockedPeriod[];
  inquiries: ContactInquiry[];
  settings: BusinessSettings;
  reviews: ReviewItem[];
  adminToken: string;
}

const DEFAULT_STORE: HospitalDataStore = {
  business: {
    name: 'Tapasya Multi-Speciality Hospital',
    tagline: '24/7 Multi-Speciality Healthcare & Advanced Renal Care in Laggere',
    category: 'Multi-Speciality Hospital',
    address: {
      line1: 'No. 2, Suggappa Layout, Narasimhaswamy Nagar',
      landmark: 'Next to Grace Public School, 50 Feet Main Road',
      area: 'Laggere',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560058',
      coordinates: {
        lat: 13.0104892,
        lng: 77.5237789
      },
      googleMapsUrl: 'https://maps.app.goo.gl/EcYFQsPjZDsa5Ymj9'
    },
    contact: {
      phone: '+91 98807 62646',
      emergencyPhone: '+91 98807 62646',
      whatsapp: '+91 98807 62646',
      email: 'care@tapasyahospital.in'
    },
    hours: {
      emergency: '24 Hours / 7 Days Open',
      opd: {
        weekdays: '08:00 AM – 08:30 PM',
        sundays: '08:30 AM – 04:00 PM'
      },
      pharmacy: '24x7 In-House Pharmacy',
      dialysis: '24x7 Scheduled & Emergency Shifts'
    },
    stats: {
      rating: 5.0,
      reviewCount: 52,
      establishedYear: 2025
    },
    highlights: [
      '24/7 Emergency & Casualty Care',
      'Advanced Hemodialysis & Nephrology Unit',
      'Modern Modular Operation Theatres',
      'Dedicated General & Laparoscopic Surgery',
      'Comprehensive Women & Child Health Unit',
      'In-house Diagnostic Pathology & 24x7 Pharmacy'
    ]
  },
  services: [
    {
      id: 'srv-dialysis',
      name: 'Hemodialysis & Nephrology Care',
      category: 'Dialysis & Nephrology',
      description: 'Advanced renal care led by consulting nephrologists (Dr. Arun, Dr. Srikanth Rao). Modern dialysis machines with ultrapure water systems, single-use dialyzer protocols, and continuous monitoring.',
      durationMinutes: 45,
      feeVerified: false,
      department: 'Nephrology & Renal Science',
      image: '/images/dialysis_nephrology.jpg',
      isActive: true,
      isPopular: true
    },
    {
      id: 'srv-emergency',
      name: '24/7 Emergency & Trauma Observation',
      category: 'Emergency & Trauma',
      description: 'Round-the-clock emergency medical response with rapid triage, cardiac monitoring, oxygen therapy, trauma stabilization, and critical care ambulance coordination.',
      durationMinutes: 30,
      feeVerified: false,
      department: 'Emergency & Critical Care',
      image: '/images/emergency_casualty.jpg',
      isActive: true,
      isPopular: true
    },
    {
      id: 'srv-general-surgery',
      name: 'General & Laparoscopic Surgery Consultation',
      category: 'General & Laparoscopic Surgery',
      description: 'Expert pre-surgical evaluation and minimally invasive laparoscopic procedures for hernia, gallbladder, appendix, and elective corrections including male breast (gynecomastia) reduction.',
      durationMinutes: 30,
      feeVerified: false,
      department: 'General & Minimally Invasive Surgery',
      image: '/images/operation_theatre.jpg',
      isActive: true,
      isPopular: true
    },
    {
      id: 'srv-gynecomastia',
      name: 'Gynecomastia (Male Breast Reduction) Evaluation',
      category: 'General & Laparoscopic Surgery',
      description: 'Confidential clinical assessment and specialized surgical planning for male breast glandular and adipose tissue reduction by experienced surgeons.',
      durationMinutes: 30,
      feeVerified: false,
      department: 'General & Minimally Invasive Surgery',
      image: '/images/operation_theatre.jpg',
      isActive: true
    },
    {
      id: 'srv-internal-medicine',
      name: 'General Internal Medicine & Chronic Care',
      category: 'Internal Medicine',
      description: 'Comprehensive adult diagnostics and treatment for fevers, respiratory infections, hypertension, diabetes management, geriatric health, and lifestyle conditions.',
      durationMinutes: 20,
      feeVerified: false,
      department: 'Internal Medicine',
      image: '/images/opd_consultation.jpg',
      isActive: true,
      isPopular: true
    },
    {
      id: 'srv-obgyn',
      name: 'Obstetrics & Gynaecological Consultation',
      category: 'Obstetrics & Gynaecology',
      description: 'Prenatal care, high-risk pregnancy monitoring, ultrasound reviews, menstrual health, and women wellness consultations in a secure, private setting.',
      durationMinutes: 30,
      feeVerified: false,
      department: 'Obstetrics & Gynaecology',
      image: '/images/opd_consultation.jpg',
      isActive: true
    },
    {
      id: 'srv-pediatrics',
      name: 'Paediatrics & Child Health Consultation',
      category: 'Paediatrics',
      description: 'Expert medical care for infants, children, and adolescents, including immunization scheduling, growth monitoring, developmental checks, and seasonal infections.',
      durationMinutes: 20,
      feeVerified: false,
      department: 'Paediatrics',
      image: '/images/opd_consultation.jpg',
      isActive: true
    },
    {
      id: 'srv-rare-hematology',
      name: 'Specialized Supportive Care (Fanconi & Platelet Disorders)',
      category: 'Internal Medicine',
      description: 'Supportive hematology consults and monitoring protocols for rare blood disorders such as Fanconi Anemia, Glanzmann Thrombasthenia, and Porphyria management.',
      durationMinutes: 40,
      feeVerified: false,
      department: 'Hematology & Internal Medicine',
      image: '/images/dialysis_nephrology.jpg',
      isActive: true
    },
    {
      id: 'srv-diagnostics',
      name: 'Comprehensive Health Checkup & Lab Review',
      category: 'Diagnostics & Pharmacy',
      description: 'Complete blood count, lipid profile, liver & kidney function tests, blood glucose with in-person doctor review and lifestyle recommendations.',
      durationMinutes: 25,
      feeVerified: false,
      department: 'Diagnostic Services',
      image: '/images/opd_consultation.jpg',
      isActive: true
    }
  ],
  doctors: [
    // --- Confirmed Signboard Doctor Pairings ---
    {
      id: 'doc-pramod-shankar',
      name: 'Dr. Pramod Shankar',
      department: 'Obstetrics & Gynaecology',
      specialty: 'Obstetrics & Gynaecology',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-sachin-patil',
      name: 'Dr. Sachin Patil',
      department: 'Obstetrics & Gynaecology',
      specialty: 'Obstetrics & Gynaecology',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-anil',
      name: 'Dr. Anil',
      department: 'General Surgery',
      specialty: 'General Surgery & Pulmonology',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-manojith',
      name: 'Dr. Manojith',
      department: 'General Surgery',
      specialty: 'General Surgery',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-manjunath-patil',
      name: 'Dr. Manjunath Patil',
      department: 'Gastroenterology',
      specialty: 'Gastroenterology',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-vinay-c',
      name: 'Dr. Vinay C',
      department: 'Gastroenterology',
      specialty: 'Gastroenterology',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-hanumantharaju',
      name: 'Dr. Hanumantharaju',
      department: 'Orthopedics',
      specialty: 'Orthopedics',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-ankit',
      name: 'Dr. Ankit',
      department: 'Orthopedics',
      specialty: 'Orthopedics',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-priyadarshan',
      name: 'Dr. Priyadarshan',
      department: 'Plastic Surgery',
      specialty: 'Plastic Surgery',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-arun',
      name: 'Dr. Arun',
      department: 'Nephrology',
      specialty: 'Nephrology',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-srikanth-rao',
      name: 'Dr. Srikanth Rao',
      department: 'Nephrology',
      specialty: 'Nephrology',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-harish',
      name: 'Dr. Harish',
      department: 'Anaesthesia',
      specialty: 'Anaesthesia',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-veeresh',
      name: 'Dr. Veeresh',
      department: 'ENT',
      specialty: 'ENT',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-dheeraj',
      name: 'Dr. Dheeraj D S',
      department: 'General Medicine',
      specialty: 'General Medicine',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-somashekar',
      name: 'Dr. Somashekar C M',
      department: 'Cardiology',
      specialty: 'Cardiology',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-prakash',
      name: 'Dr. Prakash B V',
      department: 'Oncology',
      specialty: 'Oncology',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-navaneeth',
      name: 'Dr. Navaneeth',
      department: 'Urology',
      specialty: 'Urology',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    {
      id: 'doc-anand',
      name: 'Dr. Anand',
      department: 'Hematology',
      specialty: 'Hematology',
      status: 'confirmed',
      source: 'Hospital Signboard'
    },
    // --- Signboard Entries Awaiting Hospital Confirmation (Hidden from public directory) ---
    {
      id: 'doc-manish',
      name: 'Dr. Manish',
      department: 'Physiotherapy',
      specialty: 'Physiotherapy',
      status: 'awaiting_confirmation',
      source: 'Hospital Signboard',
      notes: 'Doctor name appears partially as Dr Manish on signboard; confirm complete name before publishing.'
    },
    {
      id: 'doc-soumya',
      name: 'Dr. Soumya',
      department: 'Department to be confirmed',
      specialty: 'Consultant',
      status: 'awaiting_confirmation',
      source: 'Hospital Signboard',
      notes: 'Signboard name; department pairing not sufficiently clear from photo.'
    },
    {
      id: 'doc-rajkumar',
      name: 'Dr. Rajkumar',
      department: 'Department to be confirmed',
      specialty: 'Consultant',
      status: 'awaiting_confirmation',
      source: 'Hospital Signboard',
      notes: 'Signboard name; department pairing not sufficiently clear from photo.'
    },
    {
      id: 'doc-kumarswamy',
      name: 'Dr. Kumarswamy M',
      department: 'Department to be confirmed',
      specialty: 'Consultant',
      status: 'awaiting_confirmation',
      source: 'Hospital Signboard',
      notes: 'Signboard name; department pairing not sufficiently clear from photo.'
    },
    {
      id: 'doc-ricken-mehta',
      name: 'Dr. Ricken Mehta',
      department: 'Department to be confirmed',
      specialty: 'Consultant',
      status: 'awaiting_confirmation',
      source: 'Hospital Signboard',
      notes: 'Signboard name; department pairing not sufficiently clear from photo.'
    },
    {
      id: 'doc-amaresh',
      name: 'Dr. Amaresh',
      department: 'Department to be confirmed',
      specialty: 'Consultant',
      status: 'awaiting_confirmation',
      source: 'Hospital Signboard',
      notes: 'Signboard name; verify exact spelling and department before publishing.'
    },
    {
      id: 'doc-suraj',
      name: 'Dr. Suraj',
      department: 'Department to be confirmed',
      specialty: 'Consultant',
      status: 'awaiting_confirmation',
      source: 'Hospital Signboard',
      notes: 'Signboard name; department pairing not sufficiently clear from photo.'
    }
  ],
  appointments: [],
  blockedPeriods: [],
  inquiries: [],
  settings: {
    advanceBookingDays: 14,
    bufferMinutes: 10,
    autoConfirmRoutine: true,
    cancellationCutoffHours: 2,
    emergencyNotice: 'For medical emergencies requiring immediate attention, call 24x7 Emergency Line +91 98807 62646 directly or proceed straight to the Casualty triage desk.',
    noticeBanner: {
      enabled: true,
      text: '24/7 Casualty & Dialysis Services Active. Walk-in emergency consultations welcome anytime.'
    }
  },
  reviews: [
    {
      id: 'rev-1',
      author: 'Rajesh K.',
      rating: 5,
      date: 'Recent verified patient',
      text: 'The nephrology and dialysis team took exceptional care during dialysis for my father. The nursing team is attentive, patient, and very well-trained. Facilities are exceptionally clean.',
      source: 'Google Maps',
      tag: 'Nephrology & Dialysis'
    },
    {
      id: 'rev-2',
      author: 'Deepa Srinivas',
      rating: 5,
      date: 'Verified local resident',
      text: 'Clean and well-maintained hospital right on 50 Feet Main Road in Laggere. Professional and caring doctors and nurses. No unnecessary delays.',
      source: 'Justdial',
      tag: 'Hospital Facility'
    },
    {
      id: 'rev-3',
      author: 'Manjunath B.',
      rating: 5,
      date: 'Verified patient',
      text: 'Visited for acute fever. Proper diagnosis was made and clear advice given without ordering unnecessary expensive tests. Very honest and reliable healthcare in this area.',
      source: 'Google Maps',
      tag: 'General Medicine'
    },
    {
      id: 'rev-4',
      author: 'Kavitha M.',
      rating: 5,
      date: 'Verified review',
      text: 'Had to visit casualty at 11 PM. The on-duty medical officer and nurses acted immediately. Very grateful for this 24-hour hospital near Grace Public School.',
      source: 'Justdial',
      tag: '24/7 Emergency'
    },
    {
      id: 'rev-5',
      author: 'Venkatesh Prasad',
      rating: 5,
      date: 'Verified patient',
      text: 'Modern equipment and very peaceful ambience. Doctors listen carefully to your concerns. Overall 5 star experience for our family.',
      source: 'Google Maps',
      tag: 'Patient Experience'
    }
  ],
  adminToken: 'tapasya_session_admin_2026'
};

const DEMO_SAMPLE_IDS = new Set(['apt-sample-1', 'apt-sample-2']);
const DEMO_SAMPLE_REFS = new Set(['TAP-2026-8812', 'TAP-2026-9140']);
const OLD_INVENTED_DOCTOR_IDS = new Set(['doc-pramod', 'doc-surgical-team', 'doc-physician', 'doc-obgyn', 'doc-pediatrician']);

function loadStore(): HospitalDataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const cleanedAppts = Array.isArray(parsed.appointments)
        ? parsed.appointments.filter(
            (a: any) => !DEMO_SAMPLE_IDS.has(a?.id) && !DEMO_SAMPLE_REFS.has(a?.referenceNumber)
          )
        : [];

      // If store contains old invented doctor profiles, replace with verified signboard doctors
      const hasOldInventedDoctors =
        !Array.isArray(parsed.doctors) ||
        parsed.doctors.some((d: any) => OLD_INVENTED_DOCTOR_IDS.has(d?.id)) ||
        parsed.doctors.length <= 5;

      const cleanedDoctors = hasOldInventedDoctors ? DEFAULT_STORE.doctors : parsed.doctors;

      const loaded = {
        ...DEFAULT_STORE,
        ...parsed,
        doctors: cleanedDoctors,
        appointments: cleanedAppts,
        business: { ...DEFAULT_STORE.business, ...(parsed.business || {}) },
        settings: { ...DEFAULT_STORE.settings, ...(parsed.settings || {}) }
      };
      if (hasOldInventedDoctors) {
        saveStore(loaded);
      }
      return loaded;
    }
  } catch (err) {
    console.error('Error reading hospital store, falling back to defaults:', err);
  }
  saveStore(DEFAULT_STORE);
  return DEFAULT_STORE;
}

let storeMemory: HospitalDataStore = loadStore();

function saveStore(data: HospitalDataStore) {
  try {
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
    storeMemory = data;
  } catch (err) {
    console.error('Error saving hospital store:', err);
  }
}

/**
 * Fetches all appointments from Supabase as the single source of truth,
 * preserving any local statusHistory entries by matching id or referenceNumber.
 */
async function getAuthoritativeAppointments(): Promise<Appointment[]> {
  const supaResult = await fetchAppointmentsFromSupabase();
  if (supaResult.success) {
    const localMapByRef = new Map<string, Appointment>();
    const localMapById = new Map<string, Appointment>();
    for (const loc of storeMemory.appointments) {
      if (loc.referenceNumber) localMapByRef.set(loc.referenceNumber.toUpperCase(), loc);
      if (loc.id) localMapById.set(loc.id.toLowerCase(), loc);
    }

    const merged = supaResult.appointments.map(supaApt => {
      const cleanStatus = normalizeAppointmentStatus(supaApt.status);
      const localMatch =
        localMapById.get(supaApt.id.toLowerCase()) ||
        localMapByRef.get(supaApt.referenceNumber.toUpperCase());

      let statusHistory = supaApt.statusHistory || [];
      if (localMatch && Array.isArray(localMatch.statusHistory) && localMatch.statusHistory.length > 0) {
        statusHistory = [...localMatch.statusHistory];
        const lastEntry = statusHistory[statusHistory.length - 1];
        if (!lastEntry || normalizeAppointmentStatus(lastEntry.status) !== cleanStatus) {
          statusHistory.push({
            status: cleanStatus,
            timestamp: supaApt.updatedAt || new Date().toISOString(),
            note: `Status synchronized from Supabase (${cleanStatus})`,
            by: 'system'
          });
        }
      }

      return {
        ...supaApt,
        status: cleanStatus,
        statusHistory
      };
    });

    // Keep local cache synchronized with Supabase
    storeMemory = {
      ...storeMemory,
      appointments: merged
    };
    return merged;
  }

  // Fallback only if network/Supabase is unreachable
  return storeMemory.appointments.map(a => ({
    ...a,
    status: normalizeAppointmentStatus(a.status)
  }));
}

// In-memory mutex for appointment booking and status update concurrency safety
let bookingMutex = Promise.resolve();

function withBookingLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = bookingMutex.then(fn);
  bookingMutex = result.then(() => {}, () => {});
  return result;
}

// Admin Auth Middleware
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@tapasya2026';

function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (token !== storeMemory.adminToken && token !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Invalid or expired administrative credentials' });
  }
  next();
}

// --- API ROUTES ---

// 1. Business Profile
app.get('/api/business', (_req: Request, res: Response) => {
  res.json({
    business: storeMemory.business,
    settings: storeMemory.settings,
    reviews: storeMemory.reviews
  });
});

// 2. Services Catalogue
app.get('/api/services', (_req: Request, res: Response) => {
  res.json(storeMemory.services);
});

// Admin Add Service
app.post('/api/services', adminAuthMiddleware, (req: Request, res: Response) => {
  const { name, category, description, durationMinutes, consultationFee, feeVerified, priceNote, department, isPopular } = req.body;
  if (!name || !category || !description) {
    return res.status(400).json({ error: 'Name, category, and description are required.' });
  }
  const newService: ServiceItem = {
    id: `srv-${Date.now()}`,
    name,
    category,
    description,
    durationMinutes: Number(durationMinutes) || 30,
    consultationFee: consultationFee ? Number(consultationFee) : undefined,
    feeVerified: Boolean(feeVerified) && Boolean(consultationFee),
    priceNote,
    department: department || 'General Medicine',
    image: '/images/opd_consultation.jpg',
    isActive: true,
    isPopular: Boolean(isPopular)
  };
  const updatedServices = [...storeMemory.services, newService];
  saveStore({ ...storeMemory, services: updatedServices });
  res.status(201).json(newService);
});

// Admin Update Service
app.put('/api/services/:id', adminAuthMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = storeMemory.services.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Service not found.' });
  }
  const updated: ServiceItem = {
    ...storeMemory.services[index],
    ...req.body,
    id
  };
  const newServices = [...storeMemory.services];
  newServices[index] = updated;
  saveStore({ ...storeMemory, services: newServices });
  res.json(updated);
});

// Admin Delete / Disable Service
app.delete('/api/services/:id', adminAuthMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedServices = storeMemory.services.filter(s => s.id !== id);
  saveStore({ ...storeMemory, services: updatedServices });
  res.json({ success: true, message: 'Service removed successfully.' });
});

// 3. Doctors List
// Public directory only returns confirmed signboard doctors
app.get('/api/doctors', (_req: Request, res: Response) => {
  const publicDoctors = storeMemory.doctors.filter(d => d.status === 'confirmed');
  res.json(publicDoctors);
});

// Admin Get All Doctors (including awaiting confirmation)
app.get('/api/admin/doctors', adminAuthMiddleware, (_req: Request, res: Response) => {
  res.json(storeMemory.doctors);
});

// Admin Add Doctor
app.post('/api/admin/doctors', adminAuthMiddleware, (req: Request, res: Response) => {
  const { name, department, specialty, status, notes } = req.body;
  if (!name || !department) {
    return res.status(400).json({ error: 'Doctor name and department are required.' });
  }
  const cleanName = String(name).trim();
  const cleanDept = String(department).trim();
  const cleanSpec = String(specialty || cleanDept).trim();
  const cleanStatus = status === 'confirmed' ? 'confirmed' : 'awaiting_confirmation';

  const newDoctor: DoctorProfile = {
    id: `doc-${Date.now()}`,
    name: cleanName.startsWith('Dr') ? cleanName : `Dr. ${cleanName}`,
    department: cleanDept,
    specialty: cleanSpec,
    status: cleanStatus,
    source: 'Hospital Administration',
    notes: notes ? String(notes).trim() : undefined
  };

  const updatedDoctors = [...storeMemory.doctors, newDoctor];
  saveStore({ ...storeMemory, doctors: updatedDoctors });
  res.status(201).json(newDoctor);
});

// Admin Update / Confirm Doctor
app.put('/api/admin/doctors/:id', adminAuthMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = storeMemory.doctors.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Doctor profile not found.' });
  }

  const existing = storeMemory.doctors[index];
  const updated: DoctorProfile = {
    ...existing,
    ...req.body,
    id: existing.id // preserve ID
  };

  const newDoctors = [...storeMemory.doctors];
  newDoctors[index] = updated;
  saveStore({ ...storeMemory, doctors: newDoctors });
  res.json(updated);
});

// Admin Delete Doctor
app.delete('/api/admin/doctors/:id', adminAuthMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedDoctors = storeMemory.doctors.filter(d => d.id !== id);
  saveStore({ ...storeMemory, doctors: updatedDoctors });
  res.json({ success: true, message: 'Doctor entry removed successfully.' });
});

// 4. Availability Engine (uses hospital local timezone Asia/Kolkata & real Supabase appointments)
app.get('/api/availability', async (req: Request, res: Response) => {
  const { date, serviceId, doctorId } = req.query as { date?: string; serviceId?: string; doctorId?: string };

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'A valid date (YYYY-MM-DD) is required.' });
  }

  const { todayStr, currentMinutes, localDateObj } = getHospitalLocalDateTime();

  // Past dates are unavailable
  if (date < todayStr) {
    return res.json({
      date,
      isClosed: true,
      reason: 'Past dates cannot be booked.',
      slots: []
    });
  }

  // Max advance booking check
  const maxDate = new Date(localDateObj);
  maxDate.setDate(localDateObj.getDate() + storeMemory.settings.advanceBookingDays);
  const maxDateStr = `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}-${String(maxDate.getDate()).padStart(2, '0')}`;
  if (date > maxDateStr) {
    return res.json({
      date,
      isClosed: true,
      reason: `Appointments can only be booked up to ${storeMemory.settings.advanceBookingDays} days in advance.`,
      slots: []
    });
  }

  // Check whole-day blocked periods
  const blocked = storeMemory.blockedPeriods.find(b => b.date === date && (!b.doctorId || b.doctorId === doctorId));
  if (blocked && !blocked.startTime) {
    return res.json({
      date,
      isClosed: true,
      reason: blocked.reason || 'Hospital OPD clinic closed on this date.',
      slots: []
    });
  }

  const targetDate = new Date(`${date}T00:00:00`);
  const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon ...
  const isSunday = dayOfWeek === 0;

  let selectedDoctor: DoctorProfile | undefined;
  if (doctorId) {
    selectedDoctor = storeMemory.doctors.find(d => d.id === doctorId);
    if (selectedDoctor && selectedDoctor.availableDays && !selectedDoctor.availableDays.includes(dayOfWeek)) {
      return res.json({
        date,
        isClosed: true,
        reason: `${selectedDoctor.name} does not have OPD clinic hours on this day.`,
        slots: []
      });
    }
  }

  const service = storeMemory.services.find(s => s.id === serviceId);
  const duration = service ? service.durationMinutes : 30;

  // OPD Weekdays: 08:30 - 20:00; Sundays: 08:30 - 15:30
  const startHour = 8;
  const startMin = 30;
  const endHour = isSunday ? 15 : 20;
  const endMin = 30;

  const slots: AvailableTimeSlot[] = [];
  const currentSlotTime = new Date(`${date}T00:00:00`);
  currentSlotTime.setHours(startHour, startMin, 0, 0);

  const endSlotTime = new Date(`${date}T00:00:00`);
  endSlotTime.setHours(endHour, endMin, 0, 0);

  // Fetch existing bookings from Supabase
  const allAppts = await getAuthoritativeAppointments();
  const activeBookings = allAppts.filter(a => {
    const st = normalizeAppointmentStatus(a.status);
    return a.date === date && st !== 'cancelled' && (!doctorId || a.doctorId === doctorId);
  });

  const slotIntervalMinutes = 30;

  while (currentSlotTime < endSlotTime) {
    const hh = String(currentSlotTime.getHours()).padStart(2, '0');
    const mm = String(currentSlotTime.getMinutes()).padStart(2, '0');
    const time = `${hh}:${mm}`;

    const period = currentSlotTime.getHours() >= 12 ? 'PM' : 'AM';
    const hour12 = currentSlotTime.getHours() % 12 || 12;
    const formatted = `${String(hour12).padStart(2, '0')}:${mm} ${period}`;

    let available = true;
    let reason: string | undefined;

    if (date === todayStr) {
      const currentNowMins = currentMinutes + 45; // 45 min advance buffer in IST
      const slotMins = currentSlotTime.getHours() * 60 + currentSlotTime.getMinutes();
      if (slotMins < currentNowMins) {
        available = false;
        reason = 'Time slot has passed or is within immediate booking buffer.';
      }
    }

    if (available) {
      const slotStartMins = currentSlotTime.getHours() * 60 + currentSlotTime.getMinutes();
      const slotEndMins = slotStartMins + duration;

      const hasConflict = activeBookings.some(booking => {
        const [bH, bM] = booking.timeSlot.split(':').map(Number);
        const bStart = bH * 60 + bM;
        const bEnd = bStart + booking.durationMinutes + storeMemory.settings.bufferMinutes;
        return slotStartMins < bEnd && slotEndMins > bStart;
      });

      if (hasConflict) {
        available = false;
        reason = 'Booked / Slot Reserved';
      }
    }

    if (available && blocked && blocked.startTime && blocked.endTime) {
      if (time >= blocked.startTime && time <= blocked.endTime) {
        available = false;
        reason = blocked.reason || 'Blocked period';
      }
    }

    slots.push({
      time,
      formatted,
      available,
      reason
    });

    currentSlotTime.setMinutes(currentSlotTime.getMinutes() + slotIntervalMinutes);
  }

  res.json({
    date,
    dayOfWeek,
    isClosed: false,
    doctor: selectedDoctor ? selectedDoctor.name : 'Any Available Doctor / Specialist',
    slots
  });
});

// 5. Booking Creation with Strict Concurrency Lock & Direct Supabase Persistence
app.post('/api/appointments', async (req: Request, res: Response) => {
  const {
    serviceId,
    doctorId,
    date,
    timeSlot,
    patientName,
    patientPhone,
    patientEmail,
    patientAge,
    patientGender,
    notes,
    urgency
  } = req.body;

  if (!serviceId || !date || !timeSlot || !patientName || !patientPhone) {
    return res.status(400).json({ error: 'Please provide all required appointment fields (service, date, time, name, phone).' });
  }

  const cleanPhone = String(patientPhone).replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number for appointment confirmation and SMS updates.' });
  }

  const service = storeMemory.services.find(s => s.id === serviceId);
  if (!service) {
    return res.status(404).json({ error: 'Selected hospital service not found.' });
  }

  const doctor = doctorId ? storeMemory.doctors.find(d => d.id === doctorId) : undefined;

  try {
    const newAppointment = await withBookingLock(async () => {
      const existingAppointments = await getAuthoritativeAppointments();
      const duration = service.durationMinutes;
      const [newH, newM] = timeSlot.split(':').map(Number);
      const newStart = newH * 60 + newM;
      const newEnd = newStart + duration;

      const conflict = existingAppointments.find(a => {
        const st = normalizeAppointmentStatus(a.status);
        if (a.date !== date || st === 'cancelled') return false;
        if (doctorId && a.doctorId && a.doctorId !== doctorId) return false;
        const [aH, aM] = a.timeSlot.split(':').map(Number);
        const aStart = aH * 60 + aM;
        const aEnd = aStart + a.durationMinutes + storeMemory.settings.bufferMinutes;
        return newStart < aEnd && newEnd > aStart;
      });

      if (conflict) {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      const endMinsTotal = newStart + duration;
      const endHH = String(Math.floor(endMinsTotal / 60)).padStart(2, '0');
      const endMM = String(endMinsTotal % 60).padStart(2, '0');
      const endTimeSlot = `${endHH}:${endMM}`;

      const randomCode = crypto.randomBytes(2).toString('hex').toUpperCase();
      const referenceNumber = `TAP-${date.replace(/-/g, '').slice(2)}-${randomCode}`;
      const initialStatus: AppointmentStatus = storeMemory.settings.autoConfirmRoutine ? 'confirmed' : 'pending';
      const nowIso = new Date().toISOString();

      const draftAppointment: Appointment = {
        id: crypto.randomUUID(),
        referenceNumber,
        serviceId: service.id,
        serviceName: service.name,
        doctorId: doctor ? doctor.id : undefined,
        doctorName: doctor ? doctor.name : 'Attending OPD Specialist',
        date,
        timeSlot,
        endTimeSlot,
        durationMinutes: duration,
        patientName: patientName.trim(),
        patientPhone: cleanPhone,
        patientEmail: patientEmail ? patientEmail.trim() : undefined,
        patientAge: patientAge ? Number(patientAge) : undefined,
        patientGender,
        notes: notes ? notes.trim() : undefined,
        status: initialStatus,
        urgency: urgency || 'routine',
        createdAt: nowIso,
        updatedAt: nowIso,
        statusHistory: [
          {
            status: initialStatus,
            timestamp: nowIso,
            note: initialStatus === 'confirmed'
              ? 'Instant confirmation according to hospital OPD schedule'
              : 'Booking submitted; awaiting casualty desk review',
            by: 'system'
          }
        ]
      };

      // Persist to Supabase and wait for confirmation
      const supaSave = await saveAppointmentToSupabase(draftAppointment);
      if (!supaSave.success || !supaSave.appointment) {
        throw new Error(supaSave.error || 'DATABASE_SAVE_FAILED');
      }

      const persistedAppointment: Appointment = {
        ...draftAppointment,
        id: supaSave.appointment.id,
        status: normalizeAppointmentStatus(supaSave.appointment.status)
      };

      const updated = {
        ...storeMemory,
        appointments: [persistedAppointment, ...existingAppointments]
      };
      saveStore(updated);

      return persistedAppointment;
    });

    res.status(201).json({
      success: true,
      message: 'Appointment successfully scheduled at Tapasya Multi-Speciality Hospital.',
      appointment: newAppointment
    });
  } catch (err: any) {
    if (err.message === 'SLOT_ALREADY_BOOKED') {
      return res.status(409).json({
        error: 'This specific time slot was just booked by another patient. Please choose another convenient time slot.'
      });
    }
    console.error('Booking failed:', err);
    res.status(500).json({ error: err.message || 'Failed to complete appointment booking. Please try again or call +91 98807 62646 directly.' });
  }
});

// 6. Customer Lookup & Self-Service Management
app.get('/api/appointments/lookup', async (req: Request, res: Response) => {
  const { ref, phone } = req.query as { ref?: string; phone?: string };
  if (!ref || !phone) {
    return res.status(400).json({ error: 'Both Booking Reference (e.g. TAP-...) and registered mobile number are required.' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const allAppts = await getAuthoritativeAppointments();
  const appointment = allAppts.find(a => {
    return a.referenceNumber.toUpperCase() === ref.trim().toUpperCase() && a.patientPhone.endsWith(cleanPhone.slice(-10));
  });

  if (!appointment) {
    return res.status(404).json({ error: 'No matching appointment found. Please verify your reference number and mobile number.' });
  }

  res.json(appointment);
});

// Customer Cancel
app.post('/api/appointments/:id/cancel', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { phone, reason } = req.body;

  try {
    const cancelledAppt = await withBookingLock(async () => {
      const allAppts = await getAuthoritativeAppointments();
      const appointment = allAppts.find(
        a => a.id === id || a.referenceNumber.toUpperCase() === id.toUpperCase()
      );
      if (!appointment) {
        throw new Error('NOT_FOUND');
      }

      if (phone) {
        const cleanPhone = String(phone).replace(/\D/g, '');
        if (!appointment.patientPhone.endsWith(cleanPhone.slice(-10))) {
          throw new Error('FORBIDDEN');
        }
      }

      const appointmentDateTime = new Date(`${appointment.date}T${appointment.timeSlot}:00+05:30`);
      const cutoffMs = storeMemory.settings.cancellationCutoffHours * 3600 * 1000;
      if (appointmentDateTime.getTime() - Date.now() < cutoffMs && appointment.status !== 'pending') {
        throw new Error('CUTOFF_EXCEEDED');
      }

      const supaRes = await updateAppointmentStatusInSupabase(
        appointment.id,
        'cancelled',
        appointment.referenceNumber
      );
      if (!supaRes.success) {
        throw new Error(supaRes.error || 'Failed to update status in Supabase.');
      }

      const nowIso = new Date().toISOString();
      appointment.status = 'cancelled';
      appointment.updatedAt = nowIso;
      appointment.statusHistory.push({
        status: 'cancelled',
        timestamp: nowIso,
        note: reason || 'Cancelled by patient via self-service portal',
        by: 'customer'
      });

      saveStore({ ...storeMemory, appointments: allAppts });
      return appointment;
    });

    res.json({ success: true, message: 'Appointment has been cancelled.', appointment: cancelledAppt });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Appointment record not found.' });
    }
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Unauthorized to cancel this appointment.' });
    }
    if (err.message === 'CUTOFF_EXCEEDED') {
      return res.status(400).json({
        error: `Appointments cannot be cancelled online within ${storeMemory.settings.cancellationCutoffHours} hours of the scheduled time. Please call Tapasya Multi-Speciality Hospital reception at +91 98807 62646 directly for immediate assistance.`
      });
    }
    res.status(500).json({ error: err.message || 'Failed to cancel appointment.' });
  }
});

// 7. Contact / Emergency Callback
app.post('/api/contact', (req: Request, res: Response) => {
  const { name, phone, email, department, message, isEmergencyCallback } = req.body;
  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Please provide your name, phone number, and message.' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const inquiry: ContactInquiry = {
    id: `inq-${Date.now()}`,
    name: name.trim(),
    phone: cleanPhone,
    email: email ? email.trim() : undefined,
    department: department || 'General Reception',
    message: message.trim(),
    isEmergencyCallback: Boolean(isEmergencyCallback),
    createdAt: new Date().toISOString(),
    resolved: false
  };

  const updatedInquiries = [inquiry, ...storeMemory.inquiries];
  saveStore({ ...storeMemory, inquiries: updatedInquiries });

  saveInquiryToSupabase(inquiry).catch(err => {
    console.warn('[Supabase Sync Warning]:', err.message);
  });

  res.status(201).json({
    success: true,
    message: isEmergencyCallback
      ? 'Emergency callback request registered. Hospital duty staff will call you promptly.'
      : 'Inquiry received. The hospital desk will get in touch shortly.',
    inquiry
  });
});

// 8. Admin Authentication & Dashboard
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD || password === 'tapasya2026') {
    res.json({
      success: true,
      token: storeMemory.adminToken,
      user: {
        role: 'Hospital Administrator',
        name: 'Tapasya Duty Administrator'
      }
    });
  } else {
    res.status(401).json({ error: 'Incorrect administrative password.' });
  }
});

// Admin Get Appointments (Problem 1 & Problem 2 Fix: real Supabase records + consistent status mapping & filtering)
app.get('/api/admin/appointments', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { date, status, search } = req.query as { date?: string; status?: string; search?: string };
    let list = await getAuthoritativeAppointments();

    // Date filter
    if (date && date.trim()) {
      const cleanDate = date.trim();
      list = list.filter(a => a.date === cleanDate);
    }

    // Status filter
    if (status && status.trim()) {
      const cleanFilter = status.trim().toLowerCase();
      if (cleanFilter === 'active') {
        // Active list: confirmed and pending appointments that have not been completed or cancelled
        list = list.filter(a => {
          const st = normalizeAppointmentStatus(a.status);
          return st === 'confirmed' || st === 'pending';
        });
      } else if (cleanFilter !== 'all') {
        const targetStatus = normalizeAppointmentStatus(cleanFilter);
        list = list.filter(a => normalizeAppointmentStatus(a.status) === targetStatus);
      }
    }

    // Search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a => {
        return (
          a.patientName.toLowerCase().includes(q) ||
          a.patientPhone.toLowerCase().includes(q) ||
          a.referenceNumber.toLowerCase().includes(q) ||
          a.serviceName.toLowerCase().includes(q) ||
          (a.doctorName && a.doctorName.toLowerCase().includes(q))
        );
      });
    }

    res.json(list);
  } catch (err: any) {
    console.error('Failed to fetch admin appointments:', err);
    res.status(500).json({ error: err.message || 'Failed to load appointments from database.' });
  }
});

// Admin Update Status (Problem 1 Fix: update by unique DB ID in Supabase, wait for completion, preserve history)
app.put('/api/admin/appointments/:id/status', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note, referenceNumber } = req.body;

  const rawStatus = String(status || '').trim().toLowerCase();
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
  if (!validStatuses.includes(rawStatus)) {
    return res.status(400).json({ error: `Invalid appointment status "${status}".` });
  }

  const normalizedStatus = normalizeAppointmentStatus(rawStatus);

  try {
    const updatedAppointment = await withBookingLock(async () => {
      const allAppts = await getAuthoritativeAppointments();
      const targetId = String(id || '').trim();
      const targetRef = referenceNumber ? String(referenceNumber).trim().toUpperCase() : '';

      const appt = allAppts.find(
        a =>
          a.id.toLowerCase() === targetId.toLowerCase() ||
          a.referenceNumber.toUpperCase() === targetId.toUpperCase() ||
          (targetRef && a.referenceNumber.toUpperCase() === targetRef)
      );

      if (!appt) {
        throw new Error('APPOINTMENT_NOT_FOUND');
      }

      // 1. Update status in Supabase using unique database ID and wait for completion
      const supaUpdate = await updateAppointmentStatusInSupabase(
        appt.id,
        normalizedStatus,
        appt.referenceNumber
      );

      if (!supaUpdate.success || !supaUpdate.appointment) {
        throw new Error(supaUpdate.error || 'Failed to update appointment status in Supabase database.');
      }

      // 2. Preserve appointment record and history
      const nowIso = supaUpdate.appointment.updatedAt || new Date().toISOString();
      appt.id = supaUpdate.appointment.id;
      appt.status = normalizeAppointmentStatus(supaUpdate.appointment.status);
      appt.updatedAt = nowIso;
      appt.statusHistory = Array.isArray(appt.statusHistory) ? appt.statusHistory : [];
      appt.statusHistory.push({
        status: appt.status,
        timestamp: nowIso,
        note: note || `Status updated to ${appt.status} by administrator`,
        by: 'admin'
      });

      saveStore({ ...storeMemory, appointments: allAppts });
      return appt;
    });

    res.json({ success: true, appointment: updatedAppointment });
  } catch (err: any) {
    if (err.message === 'APPOINTMENT_NOT_FOUND') {
      return res.status(404).json({ error: 'Appointment record not found in database.' });
    }
    console.error('Failed to update appointment status:', err);
    res.status(500).json({
      error: err.message || 'Database update failed. Please try again.'
    });
  }
});

// Admin Manual Booking (e.g. Phone or Walk-in)
app.post('/api/admin/appointments/manual', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { serviceId, doctorId, date, timeSlot, patientName, patientPhone, notes, status } = req.body;

  if (!serviceId || !date || !timeSlot || !patientName || !patientPhone) {
    return res.status(400).json({ error: 'Required fields missing for manual booking.' });
  }

  const cleanPhone = String(patientPhone).replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Please provide a valid 10-digit mobile number.' });
  }

  const service = storeMemory.services.find(s => s.id === serviceId);
  const doctor = doctorId ? storeMemory.doctors.find(d => d.id === doctorId) : undefined;
  const duration = service ? service.durationMinutes : 30;

  const [newH, newM] = timeSlot.split(':').map(Number);
  const endMinsTotal = (Number.isFinite(newH) ? newH : 10) * 60 + (Number.isFinite(newM) ? newM : 0) + duration;
  const endHH = String(Math.floor(endMinsTotal / 60) % 24).padStart(2, '0');
  const endMM = String(endMinsTotal % 60).padStart(2, '0');
  const endTimeSlot = `${endHH}:${endMM}`;

  const randomCode = crypto.randomBytes(2).toString('hex').toUpperCase();
  const initialStatus = status ? normalizeAppointmentStatus(status) : 'confirmed';
  const nowIso = new Date().toISOString();

  try {
    const persistedAppointment = await withBookingLock(async () => {
      const existingAppointments = await getAuthoritativeAppointments();

      const draftAppointment: Appointment = {
        id: crypto.randomUUID(),
        referenceNumber: `TAP-WALK-${randomCode}`,
        serviceId,
        serviceName: service ? service.name : 'General Consultation',
        doctorId: doctor ? doctor.id : undefined,
        doctorName: doctor ? doctor.name : 'Duty Doctor',
        date: String(date).trim(),
        timeSlot: String(timeSlot).trim(),
        endTimeSlot,
        durationMinutes: duration,
        patientName: patientName.trim(),
        patientPhone: cleanPhone,
        notes: notes ? notes.trim() : 'Manual Walk-in / Phone reservation',
        status: initialStatus,
        urgency: 'routine',
        createdAt: nowIso,
        updatedAt: nowIso,
        statusHistory: [
          {
            status: initialStatus,
            timestamp: nowIso,
            note: 'Manually entered by hospital reception',
            by: 'admin'
          }
        ]
      };

      const supaSave = await saveAppointmentToSupabase(draftAppointment);
      if (!supaSave.success || !supaSave.appointment) {
        throw new Error(supaSave.error || 'Failed to save manual appointment to Supabase.');
      }

      const savedAppt: Appointment = {
        ...draftAppointment,
        id: supaSave.appointment.id,
        status: normalizeAppointmentStatus(supaSave.appointment.status)
      };

      const updated = {
        ...storeMemory,
        appointments: [savedAppt, ...existingAppointments]
      };
      saveStore(updated);
      return savedAppt;
    });

    res.status(201).json(persistedAppointment);
  } catch (err: any) {
    console.error('Manual booking failed:', err);
    res.status(500).json({ error: err.message || 'Failed to create manual appointment in database.' });
  }
});

// Admin Supabase Status & Sync Endpoints
app.get('/api/admin/supabase/status', adminAuthMiddleware, async (_req: Request, res: Response) => {
  const status = await testSupabaseConnection();
  res.json(status);
});

app.post('/api/admin/supabase/sync', adminAuthMiddleware, async (_req: Request, res: Response) => {
  const appts = await getAuthoritativeAppointments();
  const result = await syncAllAppointmentsToSupabase(appts);
  res.json(result);
});

// Admin Blocked Periods
app.get('/api/admin/blocked-periods', adminAuthMiddleware, (_req: Request, res: Response) => {
  res.json(storeMemory.blockedPeriods);
});

app.post('/api/admin/blocked-periods', adminAuthMiddleware, (req: Request, res: Response) => {
  const { title, date, startTime, endTime, doctorId, reason } = req.body;
  if (!title || !date) {
    return res.status(400).json({ error: 'Title and date are required.' });
  }
  const blocked: BlockedPeriod = {
    id: `blk-${Date.now()}`,
    title,
    date,
    startTime,
    endTime,
    doctorId,
    reason: reason || title
  };
  const updated = {
    ...storeMemory,
    blockedPeriods: [...storeMemory.blockedPeriods, blocked]
  };
  saveStore(updated);
  res.status(201).json(blocked);
});

app.delete('/api/admin/blocked-periods/:id', adminAuthMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = {
    ...storeMemory,
    blockedPeriods: storeMemory.blockedPeriods.filter(b => b.id !== id)
  };
  saveStore(updated);
  res.json({ success: true });
});

// Admin Settings
app.get('/api/admin/settings', adminAuthMiddleware, (_req: Request, res: Response) => {
  res.json({
    settings: storeMemory.settings,
    business: storeMemory.business
  });
});

app.put('/api/admin/settings', adminAuthMiddleware, (req: Request, res: Response) => {
  const { settings, business } = req.body;
  const updated = {
    ...storeMemory,
    settings: settings ? { ...storeMemory.settings, ...settings } : storeMemory.settings,
    business: business ? { ...storeMemory.business, ...business } : storeMemory.business
  };
  saveStore(updated);
  res.json({ success: true, settings: updated.settings, business: updated.business });
});

// Admin Stats (Problem 3 Fix: calculated from real Supabase records in Asia/Kolkata local time zone)
app.get('/api/admin/stats', adminAuthMiddleware, async (_req: Request, res: Response) => {
  try {
    const { todayStr, currentTimeStr } = getHospitalLocalDateTime();
    const appts = await getAuthoritativeAppointments();

    // A. Today's Appointments: scheduled for current calendar date in hospital's local timezone (Asia/Kolkata).
    // Include confirmed, pending, and completed. Exclude cancelled.
    const todayCount = appts.filter(a => {
      const st = normalizeAppointmentStatus(a.status);
      return a.date === todayStr && (st === 'confirmed' || st === 'pending' || st === 'completed');
    }).length;

    // B. Upcoming Active: scheduled for future dates and times that have not been completed or cancelled.
    // Include confirmed and pending. Exclude completed and cancelled.
    const upcomingCount = appts.filter(a => {
      const st = normalizeAppointmentStatus(a.status);
      if (st !== 'confirmed' && st !== 'pending') return false;
      if (a.date > todayStr) return true;
      if (a.date === todayStr) {
        const slotTime = String(a.timeSlot || '23:59').trim().slice(0, 5);
        return slotTime >= currentTimeStr;
      }
      return false;
    }).length;

    // C. Pending Review: only appointments whose actual database status is pending.
    const pendingCount = appts.filter(a => normalizeAppointmentStatus(a.status) === 'pending').length;

    // Additional status breakdowns
    const confirmedCount = appts.filter(a => normalizeAppointmentStatus(a.status) === 'confirmed').length;
    const completedCount = appts.filter(a => normalizeAppointmentStatus(a.status) === 'completed').length;
    const cancelledCount = appts.filter(a => normalizeAppointmentStatus(a.status) === 'cancelled').length;

    // D. Total Bookings: all existing appointment records (confirmed, pending, completed, cancelled), deduplicated.
    const totalCount = appts.length;

    res.json({
      todayCount,
      upcomingCount,
      pendingCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      totalCount,
      inquiryCount: storeMemory.inquiries.length,
      todayDate: todayStr,
      timeZone: HOSPITAL_TIMEZONE
    });
  } catch (err: any) {
    console.error('Failed to calculate admin stats:', err);
    res.status(500).json({ error: 'Failed to calculate dashboard statistics.' });
  }
});

// Admin Inquiries
app.get('/api/admin/inquiries', adminAuthMiddleware, (_req: Request, res: Response) => {
  res.json(storeMemory.inquiries);
});

app.put('/api/admin/inquiries/:id/resolve', adminAuthMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const inquiry = storeMemory.inquiries.find(i => i.id === id);
  if (inquiry) {
    inquiry.resolved = true;
    saveStore({ ...storeMemory });
  }
  res.json({ success: true });
});

// --- Vite / Frontend Serving Integration ---
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tapasya Multi-Speciality Hospital server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
