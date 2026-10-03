import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Copy,
  Check,
  MapPin,
  ShieldCheck,
  Stethoscope,
  Calendar,
  User,
  Phone,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import type { ServiceItem, DoctorProfile, Appointment, AvailableTimeSlot } from '../types';
import { api } from '../api';

interface BookingWizardProps {
  services: ServiceItem[];
  doctors: DoctorProfile[];
  initialServiceId?: string;
  initialDoctorId?: string;
  triggerTimestamp?: number;
  onBookingComplete?: (appointment: Appointment) => void;
  onOpenLookup?: (ref?: string, phone?: string) => void;
}

/**
 * Returns a date string formatted as YYYY-MM-DD in Asia/Kolkata timezone
 */
function getISTDateString(offsetDays = 0): string {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  istTime.setDate(istTime.getDate() + offsetDays);
  const yyyy = istTime.getFullYear();
  const mm = String(istTime.getMonth() + 1).padStart(2, '0');
  const dd = String(istTime.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Finds confirmed, verified doctors specifically associated with the selected clinical service.
 * Never invents doctor names, degrees, or profiles.
 */
export function getDoctorsForService(
  service: ServiceItem | undefined,
  doctors: DoctorProfile[]
): DoctorProfile[] {
  if (!service) return [];

  // Filter only confirmed/verified doctors from the hospital signboard
  const confirmedDocs = doctors.filter(d => d.status === 'confirmed');

  const sDept = (service.department || '').toLowerCase();
  const sCat = (service.category || '').toLowerCase();
  const sName = (service.name || '').toLowerCase();
  const sId = (service.id || '').toLowerCase();

  return confirmedDocs.filter(doc => {
    const dDept = (doc.department || '').toLowerCase();
    const dSpec = (doc.specialty || '').toLowerCase();

    // 1. Direct department match
    if (sDept.includes(dDept) || dDept.includes(sDept)) return true;
    if (sCat.includes(dDept) || dDept.includes(sCat)) return true;

    // 2. Clinical speciality mappings
    // Dialysis & Nephrology
    if (
      (sId.includes('dialysis') || sCat.includes('dialysis') || sDept.includes('nephrology')) &&
      dDept.includes('nephrology')
    ) {
      return true;
    }

    // General Surgery & Laparoscopic
    if (
      (sId.includes('surgery') || sCat.includes('surgery')) &&
      dDept.includes('surgery')
    ) {
      return true;
    }

    // Gynecomastia / Cosmetic Surgical Evaluation
    if (
      sId.includes('gynecomastia') &&
      (dDept.includes('surgery') || dDept.includes('plastic'))
    ) {
      return true;
    }

    // Obstetrics & Gynaecology
    if (
      (sId.includes('obgyn') || sCat.includes('obstetrics') || sDept.includes('gynaec')) &&
      (dDept.includes('obstetrics') || dDept.includes('gynaec'))
    ) {
      return true;
    }

    // Hematology & Rare Blood Disorders
    if (
      (sId.includes('hematology') || sName.includes('platelet') || sName.includes('fanconi')) &&
      (dDept.includes('hematology') || dDept.includes('general medicine'))
    ) {
      return true;
    }

    // Internal Medicine & Chronic Diseases
    if (
      (sId.includes('internal-medicine') || sCat.includes('internal medicine')) &&
      (dDept.includes('general medicine') || dDept.includes('cardiology'))
    ) {
      return true;
    }

    // 24/7 Emergency & Casualty
    if (
      sId.includes('emergency') &&
      (dDept.includes('medicine') || dDept.includes('surgery') || dDept.includes('anaesthesia'))
    ) {
      return true;
    }

    // Diagnostics & Health Checkups
    if (sId.includes('diagnostics') && dDept.includes('general medicine')) {
      return true;
    }

    return dSpec.includes(sDept) || sName.includes(dDept);
  });
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  services,
  doctors,
  initialServiceId,
  initialDoctorId,
  triggerTimestamp,
  onBookingComplete,
  onOpenLookup
}) => {
  // Filter active, bookable services only
  const activeServices = useMemo(() => {
    return services.filter(s => s.isActive !== false);
  }, [services]);

  // Steps:
  // 1: Select Service
  // 2: Select Doctor
  // 3: Select Date & Time
  // 4: Patient Info
  // 5: Review & Confirm
  // 6: Confirmation Receipt
  const [step, setStep] = useState<number>(() => (initialServiceId ? 2 : 1));

  // Step 1: Service Selection
  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => {
    if (initialServiceId && activeServices.some(s => s.id === initialServiceId)) {
      return initialServiceId;
    }
    return activeServices[0]?.id || '';
  });

  // Step 2: Doctor Selection
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || '');

  // Step 3: Date & Slot Selection
  const [selectedDate, setSelectedDate] = useState<string>(() => getISTDateString(1));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([]);
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('');

  // Step 4: Patient Details
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [patientAge, setPatientAge] = useState<string>('');
  const [patientGender, setPatientGender] = useState<'male' | 'female' | 'other'>('male');
  const [notes, setNotes] = useState<string>('');
  const [agreedToPolicy, setAgreedToPolicy] = useState<boolean>(true);

  // Step 5 & 6: Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Synchronize when coming from a service card or navbar click
  useEffect(() => {
    if (triggerTimestamp && initialServiceId) {
      const match = activeServices.find(s => s.id === initialServiceId);
      if (match) {
        setSelectedServiceId(initialServiceId);
        if (initialDoctorId) {
          setSelectedDoctorId(initialDoctorId);
        } else {
          setSelectedDoctorId('');
        }
        setSelectedTimeSlot('');
        setSubmitError('');
        // Skip Step 1 directly to Step 2 so patient is not asked to re-select
        setStep(2);
      }
    } else if (triggerTimestamp && !initialServiceId) {
      // Direct booking opened without a pre-selected service
      setStep(1);
    }
  }, [triggerTimestamp, initialServiceId, initialDoctorId, activeServices]);

  // Fallback if current selectedServiceId becomes invalid
  useEffect(() => {
    if (!selectedServiceId && activeServices.length > 0) {
      setSelectedServiceId(activeServices[0].id);
    }
  }, [selectedServiceId, activeServices]);

  const selectedService = useMemo(() => {
    return activeServices.find(s => s.id === selectedServiceId) || activeServices[0];
  }, [activeServices, selectedServiceId]);

  // Verified doctors associated with the selected service
  const associatedDoctors = useMemo(() => {
    return getDoctorsForService(selectedService, doctors);
  }, [selectedService, doctors]);

  const selectedDoctor = useMemo(() => {
    return doctors.find(d => d.id === selectedDoctorId);
  }, [doctors, selectedDoctorId]);

  // Fetch slots whenever date, service, or doctor changes
  useEffect(() => {
    if (!selectedDate || !selectedService?.id) return;
    let isMounted = true;
    setSlotsLoading(true);
    setAvailabilityMessage('');
    setSelectedTimeSlot('');

    api.getAvailability(selectedDate, selectedService.id, selectedDoctorId || undefined)
      .then(res => {
        if (!isMounted) return;
        if (res.isClosed) {
          setAvailableSlots([]);
          setAvailabilityMessage(res.reason || 'OPD clinic is closed on this date.');
        } else {
          setAvailableSlots(res.slots || []);
          if (res.slots.length === 0) {
            setAvailabilityMessage('No available OPD slots for this date/doctor.');
          }
        }
      })
      .catch(err => {
        if (!isMounted) return;
        setAvailabilityMessage(err.message || 'Unable to check time slots.');
        setAvailableSlots([]);
      })
      .finally(() => {
        if (isMounted) setSlotsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedService?.id, selectedDoctorId]);

  // Handle final submission with pre-flight slot re-check
  const handleSubmitBooking = async () => {
    setSubmitError('');

    if (!patientName.trim()) {
      setSubmitError("Please enter the patient's full name.");
      return;
    }

    const cleanPhone = patientPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setSubmitError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!selectedTimeSlot) {
      setSubmitError('Please select a time slot.');
      return;
    }

    if (!agreedToPolicy) {
      setSubmitError('Please accept the hospital appointment & cancellation policy.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Recheck slot availability immediately before confirming to prevent double booking
      const check = await api.getAvailability(selectedDate, selectedService?.id, selectedDoctorId || undefined);
      if (check.isClosed) {
        throw new Error(check.reason || 'The OPD clinic is closed on this date.');
      }
      const targetSlot = check.slots?.find(s => s.time === selectedTimeSlot);
      if (!targetSlot || !targetSlot.available) {
        throw new Error(
          `The selected time slot (${selectedTimeSlot}) was just reserved by another patient. Please choose an alternate slot.`
        );
      }

      // 2. Persist appointment to Supabase database
      const res = await api.createAppointment({
        serviceId: selectedService.id,
        doctorId: selectedDoctorId || undefined,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        patientName: patientName.trim(),
        patientPhone: cleanPhone,
        patientEmail: patientEmail.trim() || undefined,
        patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
        patientGender,
        notes: notes.trim() || undefined,
        urgency: 'routine'
      });

      setConfirmedBooking(res.appointment);
      setStep(6); // Advance to Confirmation Receipt
      if (onBookingComplete) onBookingComplete(res.appointment);
    } catch (err: any) {
      setSubmitError(err.message || 'Appointment booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyReference = () => {
    if (confirmedBooking?.referenceNumber) {
      navigator.clipboard.writeText(confirmedBooking.referenceNumber);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  // 14-day date picker strip
  const dateOptions = useMemo(() => {
    const opts = [];
    const baseIst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    for (let i = 0; i < 14; i++) {
      const d = new Date(baseIst);
      d.setDate(baseIst.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const isSunday = d.getDay() === 0;
      opts.push({
        dateStr,
        dayName,
        dayNum,
        month,
        isSunday,
        isToday: i === 0
      });
    }
    return opts;
  }, []);

  const progressSteps = [
    { num: 1, label: 'Service' },
    { num: 2, label: 'Doctor' },
    { num: 3, label: 'Date & Time' },
    { num: 4, label: 'Patient Info' },
    { num: 5, label: 'Review & Confirm' }
  ];

  return (
    <section id="booking-section" className="py-16 bg-white border-b border-slate-200 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Online OPD Scheduling</p>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Book an Appointment
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Real-time OPD slots at Tapasya Multi-Speciality Hospital in Laggere. Instant reservation with strict double-booking prevention.
          </p>
        </div>

        {/* 5-Step Progress Indicator */}
        {step <= 5 && (
          <div className="mt-8 mb-8">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 max-w-3xl mx-auto px-2">
              {progressSteps.map((s, idx) => {
                const isActive = step === s.num;
                const isPassed = step > s.num;

                return (
                  <div key={s.num} className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!isPassed}
                      onClick={() => {
                        if (isPassed) setStep(s.num);
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 ring-2 ring-teal-500/20'
                          : isPassed
                          ? 'bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      title={isPassed ? `Jump back to Step ${s.num}: ${s.label}` : s.label}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </button>
                    <span
                      className={`hidden sm:inline ${
                        isActive ? 'font-bold text-slate-900' : isPassed ? 'text-teal-900 font-medium' : ''
                      }`}
                    >
                      {s.label}
                    </span>
                    {idx < progressSteps.length - 1 && (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden md:inline ml-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Wizard Card Container */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* STEP 1: Select Service */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Step 1 — Select a Clinical Service</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose the primary clinical department or consultation needed.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-3 py-1 rounded-full self-start">
                  {activeServices.length} Active Services
                </span>
              </div>

              {activeServices.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">No clinical services currently available for booking.</p>
                  <p className="mt-1">Please contact hospital reception directly at +91 98807 62646.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3.5">
                  {activeServices.map(svc => {
                    const isSelected = selectedServiceId === svc.id;
                    return (
                      <button
                        type="button"
                        key={svc.id}
                        onClick={() => setSelectedServiceId(svc.id)}
                        className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-600/20 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span className="font-medium text-teal-700">{svc.department}</span>
                            <span className="flex items-center gap-1 text-[11px]">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {svc.durationMinutes}m slot
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">{svc.name}</h4>
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{svc.description}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          {svc.feeVerified && svc.consultationFee ? (
                            <span className="text-xs font-semibold text-slate-800">
                              ₹{svc.consultationFee} <span className="text-[11px] font-normal text-slate-500">OPD fee</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-500">
                              Consultation fee: Contact hospital on arrival
                            </span>
                          )}
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 flex justify-end border-t border-slate-200/80">
                <button
                  type="button"
                  disabled={!selectedServiceId}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl transition-all shadow-sm"
                >
                  <span>Continue to Doctor Selection</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Doctor (Associated with selected service) */}
          {step === 2 && selectedService && (
            <div className="space-y-6">
              {/* Selected Service Banner with Change button */}
              <div className="p-4 rounded-2xl bg-teal-50/90 border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                    Selected Service
                  </div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedService.name}</span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="text-xs text-slate-600 font-medium">
                      {selectedService.department} ({selectedService.durationMinutes} mins)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="self-start sm:self-center px-3 py-1.5 text-xs font-semibold text-teal-800 hover:text-teal-900 bg-white hover:bg-teal-100/60 rounded-xl border border-teal-300 transition-colors shadow-2xs"
                >
                  Change Service
                </button>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Step 2 — Select a Consulting Doctor</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Doctors verified from the official hospital signboard associated with {selectedService.department}.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                {/* Option 1: Any Available Specialist */}
                <button
                  type="button"
                  onClick={() => setSelectedDoctorId('')}
                  className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    selectedDoctorId === ''
                      ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-600/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-700">First Available Specialist</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedDoctorId === '' ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {selectedDoctorId === '' && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-2">Any Available Doctor</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Our triage desk coordinates the on-duty consultant in {selectedService.department} for your chosen slot.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    Recommended for fastest scheduling
                  </div>
                </button>

                {/* Specific Associated Doctors */}
                {associatedDoctors.map(doc => {
                  const isSelected = selectedDoctorId === doc.id;
                  const initials = doc.name.replace(/^Dr\.?\s+/i, '').slice(0, 2).toUpperCase();
                  return (
                    <button
                      type="button"
                      key={doc.id}
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-600/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                            {doc.department}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 mt-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Speciality: {doc.specialty || doc.department}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3.5 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Signboard Verified Specialist</span>
                        <span className="text-teal-700 font-medium">Select Doctor</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {associatedDoctors.length === 0 && (
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">
                    Named consultant for this department is awaiting hospital verification.
                  </p>
                  <p className="mt-1">
                    Select "Any Available Doctor" above to book your consultation with our qualified on-duty clinical specialist.
                  </p>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Services</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-sm"
                >
                  <span>Select Date &amp; Time</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Select Date & Available Time Slot */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Step 3 — Choose Date &amp; Time Slot</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Selected Service: <span className="font-semibold text-slate-800">{selectedService?.name}</span> • Specialist: <span className="font-semibold text-slate-800">{selectedDoctor ? selectedDoctor.name : 'First Available Doctor'}</span>
                </p>
              </div>

              {/* 14-Day Date Horizontal Strip */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Appointment Date (Next 14 Days)
                </label>
                <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                  {dateOptions.map(opt => {
                    const isSelected = selectedDate === opt.dateStr;
                    return (
                      <button
                        type="button"
                        key={opt.dateStr}
                        onClick={() => setSelectedDate(opt.dateStr)}
                        className={`shrink-0 w-18 py-3 px-2 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/30'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className={`text-[10px] uppercase font-bold ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                          {opt.dayName}
                        </div>
                        <div className="text-lg font-extrabold my-0.5">{opt.dayNum}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                          {opt.month}
                        </div>
                        {opt.isSunday && (
                          <div className={`text-[9px] mt-1 font-semibold ${isSelected ? 'text-amber-200' : 'text-amber-600'}`}>
                            Sunday
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Area */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Available OPD Slots ({selectedDate})
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {selectedService?.durationMinutes || 30}-minute slots • 24/7 Casualty always open
                  </span>
                </div>

                {slotsLoading ? (
                  <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <span>Checking live availability at Tapasya Multi-Speciality Hospital...</span>
                  </div>
                ) : availabilityMessage ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">{availabilityMessage}</p>
                      <p className="mt-1 text-slate-600">
                        For immediate emergency care or alternate scheduling, call reception directly at{' '}
                        <a href="tel:+919880762646" className="font-bold underline text-amber-900">
                          +91 98807 62646
                        </a>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {availableSlots.map(slot => {
                      const isSelected = selectedTimeSlot === slot.time;
                      return (
                        <button
                          type="button"
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setSelectedTimeSlot(slot.time)}
                          className={`py-2 px-2 rounded-xl text-xs font-medium text-center transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-600/25 ring-2 ring-teal-600/30'
                              : slot.available
                              ? 'bg-white border border-slate-200 text-slate-800 hover:border-teal-500 hover:text-teal-700'
                              : 'bg-slate-100 text-slate-300 border border-slate-200/60 cursor-not-allowed line-through'
                          }`}
                          title={!slot.available ? slot.reason || 'Slot Booked' : 'Available'}
                        >
                          {slot.formatted}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Doctor</span>
                </button>
                <button
                  type="button"
                  disabled={!selectedTimeSlot}
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl transition-all shadow-sm"
                >
                  <span>Enter Patient Details</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Patient Information */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Step 4 — Patient Information</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Provide patient details for medical records and SMS confirmation. Information is preserved if you navigate backwards.
                </p>
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Patient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Gowda"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={patientPhone}
                      onChange={e => setPatientPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98807 62646"
                      className="w-full pl-10 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">10-digit Indian mobile number</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={patientEmail}
                    onChange={e => setPatientEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Age <span className="text-slate-400 font-normal">(Years)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={patientAge}
                      onChange={e => setPatientAge(e.target.value)}
                      placeholder="45"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={patientGender}
                      onChange={e => setPatientGender(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medical Concern / Reason for Consultation <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Kidney checkup, fever since 2 days, surgical opinion..."
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-100/80 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="agree-check"
                  checked={agreedToPolicy}
                  onChange={e => setAgreedToPolicy(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="agree-check" className="cursor-pointer text-[11px] leading-relaxed">
                  I agree to Tapasya Multi-Speciality Hospital's booking and cancellation policy. Appointments can be cancelled or rescheduled online up to 2 hours prior to the slot. Applicable consultation fees are paid directly at the reception desk on arrival.
                </label>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Date &amp; Time</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!patientName.trim()) {
                      setSubmitError("Please enter the patient's full name.");
                      return;
                    }
                    if (patientPhone.replace(/\D/g, '').length < 10) {
                      setSubmitError('Please enter a 10-digit mobile number.');
                      return;
                    }
                    setSubmitError('');
                    setStep(5);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-sm"
                >
                  <span>Review Booking</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Confirm */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Step 5 — Review &amp; Confirm Appointment</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Verify the appointment summary before final reservation in the hospital registry.
                </p>
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                <div className="grid sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Service &amp; Department</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedService?.name}</span>
                    <span className="text-slate-500 block">{selectedService?.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Assigned Specialist</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedDoctor ? selectedDoctor.name : 'First Available Doctor / Specialist'}
                    </span>
                    <span className="text-slate-500 block">
                      {selectedDoctor ? selectedDoctor.specialty || selectedDoctor.department : 'Duty Clinical Specialist'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Appointment Date</span>
                    <span className="font-bold text-slate-900">{selectedDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Scheduled Slot</span>
                    <span className="font-bold text-teal-700">
                      {selectedTimeSlot} ({selectedService?.durationMinutes || 30} mins)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Consultation Fee</span>
                    {selectedService?.feeVerified && selectedService?.consultationFee ? (
                      <>
                        <span className="font-bold text-slate-900 text-sm">₹{selectedService.consultationFee}</span>
                        <span className="text-[10px] text-slate-400 block">Pay at reception desk</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-700 font-medium block">
                        Contact hospital on arrival <span className="text-amber-700 font-normal">(unverified)</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Patient Details</span>
                    <span className="font-bold text-slate-900">{patientName}</span>
                    <span className="text-slate-500 block">
                      +91 {patientPhone} {patientAge ? `• ${patientAge} yrs` : ''} • {patientGender}
                    </span>
                    {patientEmail && (
                      <span className="text-slate-400 block text-[11px]">{patientEmail}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Hospital Location</span>
                    <span className="font-medium text-slate-800 block">
                      Tapasya Multi-Speciality Hospital
                    </span>
                    <span className="text-slate-500 block text-[11px]">
                      No. 2, Suggappa Layout, Laggere, Bengaluru
                    </span>
                  </div>
                  {notes && (
                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block mb-0.5">Patient Notes / Concern</span>
                      <span className="text-slate-600 italic">"{notes}"</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Verified Trust Strip */}
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-teal-50/50 p-3 rounded-xl border border-teal-100">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  Slot availability is verified live. Double bookings are strictly prevented in the Supabase database.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Edit Patient Info</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmitBooking}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-7 py-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 rounded-xl transition-all shadow-md shadow-teal-600/30"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying slot &amp; reserving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm &amp; Book Appointment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Confirmation Receipt Screen */}
          {step === 6 && confirmedBooking && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
              </div>

              <div>
                <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">
                  Appointment Confirmed
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  You're Booked at Tapasya Multi-Speciality Hospital!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-2">
                  Your appointment has been registered in the hospital schedule. Please present this reference code at reception on arrival.
                </p>
              </div>

              {/* Reference Number Banner */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-white border border-teal-200 shadow-sm flex items-center justify-between">
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Booking Reference</div>
                  <div className="text-xl font-mono font-extrabold text-slate-900 tracking-wider">
                    {confirmedBooking.referenceNumber}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyReference}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
                >
                  {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRef ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Details Grid */}
              <div className="max-w-md mx-auto text-left bg-white p-5 rounded-2xl border border-slate-200 text-xs space-y-3">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold text-slate-900">{confirmedBooking.patientName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-semibold text-slate-900">{confirmedBooking.serviceName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Specialist:</span>
                  <span className="font-semibold text-slate-900">{confirmedBooking.doctorName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Date &amp; Slot:</span>
                  <span className="font-bold text-teal-700">
                    {confirmedBooking.date} at {confirmedBooking.timeSlot}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Database Status:</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Saved to Supabase</span>
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Hospital Location:</span>
                  <span className="font-medium text-slate-800 text-right">
                    50 Feet Main Road, Laggere, Bengaluru
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="https://maps.app.goo.gl/EcYFQsPjZDsa5Ymj9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>Get Driving Directions</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenLookup) {
                      onOpenLookup(confirmedBooking.referenceNumber, confirmedBooking.patientPhone);
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <span>Manage / Cancel Booking</span>
                </button>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setConfirmedBooking(null);
                    setPatientName('');
                    setPatientPhone('');
                    setNotes('');
                    setSelectedTimeSlot('');
                  }}
                  className="text-xs text-teal-700 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>Book another appointment</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
