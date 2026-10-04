import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Copy, Check,
  MapPin, ShieldCheck, Stethoscope, Calendar, Search, Sun, Cloud, Moon,
  MessageCircle, ExternalLink, ArrowRight, Siren, Star
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

function getISTDateString(offsetDays = 0): string {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  istTime.setDate(istTime.getDate() + offsetDays);
  const yyyy = istTime.getFullYear();
  const mm = String(istTime.getMonth() + 1).padStart(2, '0');
  const dd = String(istTime.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getDoctorsForService(
  service: ServiceItem | undefined,
  doctors: DoctorProfile[]
): DoctorProfile[] {
  if (!service) return [];
  const confirmedDocs = doctors.filter(d => d.status === 'confirmed');
  const sDept = (service.department || '').toLowerCase();
  const sCat = (service.category || '').toLowerCase();
  const sName = (service.name || '').toLowerCase();
  const sId = (service.id || '').toLowerCase();

  return confirmedDocs.filter(doc => {
    const dDept = (doc.department || '').toLowerCase();
    const dSpec = (doc.specialty || '').toLowerCase();
    if (sDept.includes(dDept) || dDept.includes(sDept)) return true;
    if (sCat.includes(dDept) || dDept.includes(sCat)) return true;
    if ((sId.includes('dialysis') || sCat.includes('dialysis') || sDept.includes('nephrology')) && dDept.includes('nephrology')) return true;
    if ((sId.includes('surgery') || sCat.includes('surgery')) && dDept.includes('surgery')) return true;
    if (sId.includes('gynecomastia') && (dDept.includes('surgery') || dDept.includes('plastic'))) return true;
    if ((sId.includes('obgyn') || sCat.includes('obstetrics') || sDept.includes('gynaec')) && (dDept.includes('obstetrics') || dDept.includes('gynaec'))) return true;
    if ((sId.includes('hematology') || sName.includes('platelet') || sName.includes('fanconi')) && (dDept.includes('hematology') || dDept.includes('general medicine'))) return true;
    if ((sId.includes('internal-medicine') || sCat.includes('internal medicine')) && (dDept.includes('general medicine') || dDept.includes('cardiology'))) return true;
    if (sId.includes('emergency') && (dDept.includes('medicine') || dDept.includes('surgery') || dDept.includes('anaesthesia'))) return true;
    if (sId.includes('diagnostics') && dDept.includes('general medicine')) return true;
    return dSpec.includes(sDept) || sName.includes(dDept);
  });
}

function getDoctorInitials(name: string): string {
  const clean = name.replace(/^Dr\.?\s+/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type SlotPeriod = 'all' | 'morning' | 'afternoon' | 'evening';

function getSlotPeriod(time: string): 'morning' | 'afternoon' | 'evening' {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) return 'morning';
  if (hour < 15) return 'afternoon';
  return 'evening';
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  services, doctors, initialServiceId, initialDoctorId, triggerTimestamp,
  onBookingComplete, onOpenLookup
}) => {
  const activeServices = useMemo(() => services.filter(s => s.isActive !== false), [services]);

  const [step, setStep] = useState<number>(() => (initialServiceId ? 2 : 1));
  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => {
    if (initialServiceId && activeServices.some(s => s.id === initialServiceId)) return initialServiceId;
    return activeServices[0]?.id || '';
  });
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || '');
  const [selectedDate, setSelectedDate] = useState<string>(() => getISTDateString(1));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [slotPeriod, setSlotPeriod] = useState<SlotPeriod>('all');
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([]);
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('');
  const [smartSearch, setSmartSearch] = useState<string>('');

  // Patient details
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [patientAge, setPatientAge] = useState<string>('');
  const [patientGender, setPatientGender] = useState<'male' | 'female' | 'other'>('male');
  const [notes, setNotes] = useState<string>('');
  const [agreedToPolicy, setAgreedToPolicy] = useState<boolean>(true);
  const [whatsappConfirmation, setWhatsappConfirmation] = useState<boolean>(true);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  useEffect(() => {
    if (triggerTimestamp && initialServiceId) {
      const match = activeServices.find(s => s.id === initialServiceId);
      if (match) {
        setSelectedServiceId(initialServiceId);
        setSelectedDoctorId(initialDoctorId || '');
        setSelectedTimeSlot('');
        setSubmitError('');
        setStep(2);
      }
    } else if (triggerTimestamp && !initialServiceId) {
      setStep(1);
    }
  }, [triggerTimestamp, initialServiceId, initialDoctorId, activeServices]);

  useEffect(() => {
    if (!selectedServiceId && activeServices.length > 0) {
      setSelectedServiceId(activeServices[0].id);
    }
  }, [selectedServiceId, activeServices]);

  const selectedService = useMemo(() => {
    return activeServices.find(s => s.id === selectedServiceId) || activeServices[0];
  }, [activeServices, selectedServiceId]);

  const associatedDoctors = useMemo(() => getDoctorsForService(selectedService, doctors), [selectedService, doctors]);
  const selectedDoctor = useMemo(() => doctors.find(d => d.id === selectedDoctorId), [doctors, selectedDoctorId]);

  // Smart search: filter services by symptom or specialty
  const searchFilteredServices = useMemo(() => {
    if (!smartSearch.trim()) return activeServices;
    const q = smartSearch.toLowerCase();
    return activeServices.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }, [activeServices, smartSearch]);

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
          if (res.slots.length === 0) setAvailabilityMessage('No available OPD slots for this date/doctor.');
        }
      })
      .catch(err => {
        if (!isMounted) return;
        setAvailabilityMessage(err.message || 'Unable to check time slots.');
        setAvailableSlots([]);
      })
      .finally(() => { if (isMounted) setSlotsLoading(false); });

    return () => { isMounted = false; };
  }, [selectedDate, selectedService?.id, selectedDoctorId]);

  const filteredSlots = useMemo(() => {
    if (slotPeriod === 'all') return availableSlots;
    return availableSlots.filter(s => getSlotPeriod(s.time) === slotPeriod);
  }, [availableSlots, slotPeriod]);

  const handleSubmitBooking = async () => {
    setSubmitError('');
    if (!patientName.trim()) { setSubmitError("Please enter the patient's full name."); return; }
    const cleanPhone = patientPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) { setSubmitError('Please enter a valid 10-digit mobile number.'); return; }
    if (!selectedTimeSlot) { setSubmitError('Please select a time slot.'); return; }
    if (!agreedToPolicy) { setSubmitError('Please accept the hospital appointment & cancellation policy.'); return; }

    setSubmitting(true);
    try {
      const check = await api.getAvailability(selectedDate, selectedService?.id, selectedDoctorId || undefined);
      if (check.isClosed) throw new Error(check.reason || 'The OPD clinic is closed on this date.');
      const targetSlot = check.slots?.find(s => s.time === selectedTimeSlot);
      if (!targetSlot || !targetSlot.available) throw new Error(`The selected time slot (${selectedTimeSlot}) was just reserved. Please choose another slot.`);

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
      setStep(6);
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

  const getGoogleCalendarLink = (apt: Appointment) => {
    const startDate = new Date(`${apt.date}T${apt.timeSlot}:00+05:30`);
    const endDate = new Date(startDate.getTime() + apt.durationMinutes * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const text = encodeURIComponent(`Hospital Appointment - ${apt.serviceName}`);
    const details = encodeURIComponent(`Booking Ref: ${apt.referenceNumber}\nPatient: ${apt.patientName}\nDoctor: ${apt.doctorName || 'Assigned on arrival'}\nDuration: ${apt.durationMinutes} mins`);
    const location = encodeURIComponent('Tapasya Multi-Speciality Hospital, 50 Feet Main Road, Laggere, Bengaluru 560058');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${details}&location=${location}`;
  };

  const dateOptions = useMemo(() => {
    const opts: { dateStr: string; dayName: string; dayNum: number; month: string; isSunday: boolean; isToday: boolean }[] = [];
    const baseIst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    for (let i = 0; i < 14; i++) {
      const d = new Date(baseIst);
      d.setDate(baseIst.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      opts.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        isSunday: d.getDay() === 0,
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
    { num: 5, label: 'Review' }
  ];

  const periodPills: { key: SlotPeriod; label: string; icon: typeof Sun }[] = [
    { key: 'all', label: 'All', icon: Clock },
    { key: 'morning', label: 'Morning', icon: Sun },
    { key: 'afternoon', label: 'Afternoon', icon: Cloud },
    { key: 'evening', label: 'Evening', icon: Moon },
  ];

  return (
    <section id="booking-section" className="py-16 bg-white border-b border-slate-200 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-600">Online OPD Scheduling</p>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">Book an Appointment</h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Real-time OPD slots at Tapasya Multi-Speciality Hospital in Laggere. Instant reservation with
            strict double-booking prevention. Book in under 60 seconds.
          </p>
        </div>

        {/* Progress Indicator */}
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
                      onClick={() => { if (isPassed) setStep(s.num); }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive ? 'bg-primary-500 text-white shadow-md shadow-primary-600/30 ring-2 ring-primary-500/20'
                        : isPassed ? 'bg-primary-100 text-primary-800 hover:bg-primary-200 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </button>
                    <span className={`hidden sm:inline ${isActive ? 'font-bold text-slate-900' : isPassed ? 'text-primary-900 font-medium' : ''}`}>
                      {s.label}
                    </span>
                    {idx < progressSteps.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden md:inline ml-2" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Wizard Card */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* STEP 1: Select Service with Smart Search */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Step 1 — Select a Service</h3>
                  <p className="text-xs text-slate-500 mt-1">Search by symptom or specialty, then choose your consultation.</p>
                </div>
              </div>

              {/* Smart Search */}
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={smartSearch}
                  onChange={e => setSmartSearch(e.target.value)}
                  placeholder="Search by symptom (e.g. kidney, fever, surgery, pregnancy)..."
                  className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 placeholder:text-slate-400 shadow-sm"
                />
              </div>

              {searchFilteredServices.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">No services match your search.</p>
                  <p className="mt-1">Try "dialysis", "surgery", or "fever".</p>
                  <button onClick={() => setSmartSearch('')} className="mt-3 px-4 py-2 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100">Clear Search</button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3.5">
                  {searchFilteredServices.map(svc => {
                    const isSelected = selectedServiceId === svc.id;
                    return (
                      <button
                        type="button"
                        key={svc.id}
                        onClick={() => setSelectedServiceId(svc.id)}
                        className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isSelected ? 'bg-primary-50/80 border-primary-500 ring-2 ring-primary-500/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span className="font-medium text-primary-600">{svc.department}</span>
                            <span className="flex items-center gap-1 text-[11px]"><Clock className="w-3 h-3 text-slate-400" />{svc.durationMinutes}m</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">{svc.name}</h4>
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{svc.description}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          {svc.feeVerified && svc.consultationFee ? (
                            <span className="text-xs font-semibold text-slate-800">₹{svc.consultationFee} <span className="text-[11px] font-normal text-slate-500">fee</span></span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-500">Fee at hospital</span>
                          )}
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-primary-500 bg-primary-500 text-white' : 'border-slate-300'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 flex justify-end border-t border-slate-200/80">
                <button type="button" disabled={!selectedServiceId} onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 rounded-xl transition-all shadow-sm min-h-[44px]">
                  <span>Continue to Doctor</span><ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Doctor */}
          {step === 2 && selectedService && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-primary-50/90 border border-primary-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-primary-700 uppercase tracking-wider">Selected Service</div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedService.name}</span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="text-xs text-slate-600 font-medium">{selectedService.department} ({selectedService.durationMinutes} mins)</span>
                  </div>
                </div>
                <button type="button" onClick={() => setStep(1)}
                  className="self-start sm:self-center px-3 py-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800 bg-white hover:bg-primary-100/60 rounded-xl border border-primary-300 transition-colors">
                  Change Service
                </button>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Step 2 — Select a Doctor</h3>
                <p className="text-xs text-slate-500 mt-1">Verified doctors associated with {selectedService.department}.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                <button type="button" onClick={() => setSelectedDoctorId('')}
                  className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    selectedDoctorId === '' ? 'bg-primary-50/80 border-primary-500 ring-2 ring-primary-500/20 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary-600">First Available</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedDoctorId === '' ? 'border-primary-500 bg-primary-500 text-white' : 'border-slate-300'}`}>
                        {selectedDoctorId === '' && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-2">Any Available Doctor</h4>
                    <p className="text-xs text-slate-500 mt-1">Our triage desk coordinates the on-duty consultant for your slot.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">Recommended for fastest scheduling</div>
                </button>

                {associatedDoctors.map(doc => {
                  const isSelected = selectedDoctorId === doc.id;
                  const initials = getDoctorInitials(doc.name);
                  return (
                    <button type="button" key={doc.id} onClick={() => setSelectedDoctorId(doc.id)}
                      className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected ? 'bg-primary-50/80 border-primary-500 ring-2 ring-primary-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">{doc.department}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-primary-500 bg-primary-500 text-white' : 'border-slate-300'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 mt-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{initials}</div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                            {doc.qualifications && <p className="text-[10px] text-primary-600 font-medium">{doc.qualifications}</p>}
                          </div>
                        </div>
                        {doc.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-[11px] font-bold text-slate-700">{doc.rating}</span>
                            {doc.experienceYears && <span className="text-[10px] text-slate-400">• {doc.experienceYears}y exp</span>}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {associatedDoctors.length === 0 && (
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Named consultant for this department is awaiting verification.</p>
                  <p className="mt-1">Select "Any Available Doctor" to book with our qualified on-duty specialist.</p>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between border-t border-slate-200/80">
                <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl min-h-[44px]">
                  <ChevronLeft className="w-4 h-4" /><span>Back</span>
                </button>
                <button type="button" onClick={() => setStep(3)} className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-all shadow-sm min-h-[44px]">
                  <span>Select Date &amp; Time</span><ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Date & Time with Period Pills */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Step 3 — Choose Date &amp; Time</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Service: <span className="font-semibold text-slate-800">{selectedService?.name}</span> • Doctor: <span className="font-semibold text-slate-800">{selectedDoctor ? selectedDoctor.name : 'First Available'}</span>
                </p>
              </div>

              {/* Date Strip */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Select Date (Next 14 Days)</label>
                <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                  {dateOptions.map(opt => {
                    const isSelected = selectedDate === opt.dateStr;
                    return (
                      <button type="button" key={opt.dateStr} onClick={() => setSelectedDate(opt.dateStr)}
                        className={`shrink-0 w-[72px] py-3 px-2 rounded-2xl border text-center transition-all min-h-[80px] ${
                          isSelected ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-600/30'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}>
                        <div className={`text-[10px] uppercase font-bold ${isSelected ? 'text-primary-100' : 'text-slate-400'}`}>{opt.dayName}</div>
                        <div className="text-lg font-extrabold my-0.5">{opt.dayNum}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-primary-100' : 'text-slate-500'}`}>{opt.month}</div>
                        {opt.isSunday && <div className={`text-[9px] mt-1 font-semibold ${isSelected ? 'text-amber-200' : 'text-amber-600'}`}>Sunday</div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Period Pills */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-slate-700">Available Time Slots</label>
                  <div className="flex gap-1.5 p-1 bg-slate-200/80 rounded-xl">
                    {periodPills.map(pill => {
                      const isActive = slotPeriod === pill.key;
                      return (
                        <button key={pill.key} type="button" onClick={() => setSlotPeriod(pill.key)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
                            isActive ? 'bg-white text-primary-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'
                          }`}>
                          <pill.icon className="w-3 h-3" />
                          {pill.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {slotsLoading ? (
                  <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <span>Checking live availability...</span>
                  </div>
                ) : availabilityMessage ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">{availabilityMessage}</p>
                      <p className="mt-1 text-slate-600">For emergency care, call <a href="tel:+919880762646" className="font-bold underline text-amber-900">+91 98807 62646</a>.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {filteredSlots.map(slot => {
                      const isSelected = selectedTimeSlot === slot.time;
                      return (
                        <button type="button" key={slot.time} disabled={!slot.available}
                          onClick={() => setSelectedTimeSlot(slot.time)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-medium text-center transition-all min-h-[44px] ${
                            isSelected ? 'bg-primary-500 text-white font-bold shadow-md shadow-primary-600/25 ring-2 ring-primary-500/30'
                            : slot.available ? 'bg-white border border-slate-200 text-slate-800 hover:border-primary-400 hover:text-primary-600'
                            : 'bg-slate-100 text-slate-300 border border-slate-200/60 cursor-not-allowed line-through'
                          }`}
                          title={!slot.available ? slot.reason || 'Slot Booked' : 'Available'}>
                          {slot.formatted}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                <button type="button" onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl min-h-[44px]">
                  <ChevronLeft className="w-4 h-4" /><span>Back</span>
                </button>
                <button type="button" disabled={!selectedTimeSlot} onClick={() => setStep(4)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 rounded-xl transition-all shadow-sm min-h-[44px]">
                  <span>Patient Details</span><ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Patient Info with WhatsApp checkbox */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Step 4 — Patient Information</h3>
                <p className="text-xs text-slate-500 mt-1">Enter patient details for medical records and confirmation.</p>
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-emergency-50 border border-emergency-200 text-emergency-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-emergency-600" /><span>{submitError}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name <span className="text-emergency-500">*</span></label>
                  <input type="text" required value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. Ramesh Gowda"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number <span className="text-emergency-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">+91</span>
                    <input type="tel" required maxLength={10} value={patientPhone} onChange={e => setPatientPhone(e.target.value.replace(/\D/g, ''))} placeholder="98807 62646"
                      className="w-full pl-12 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900" />
                  </div>
                  <span className="text-[10px] text-slate-400">10-digit mobile number</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <input type="email" value={patientEmail} onChange={e => setPatientEmail(e.target.value)} placeholder="patient@example.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Age <span className="text-slate-400 font-normal">(Years)</span></label>
                    <input type="number" min={0} max={120} value={patientAge} onChange={e => setPatientAge(e.target.value)} placeholder="45"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                    <select value={patientGender} onChange={e => setPatientGender(e.target.value as any)}
                      className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900">
                      <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Concern <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Kidney checkup, fever since 2 days..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900" />
                </div>
              </div>

              {/* WhatsApp Confirmation Checkbox */}
              <div className="p-3.5 bg-secondary-50 rounded-xl text-xs flex items-start gap-2.5 border border-secondary-100">
                <input type="checkbox" id="whatsapp-cb" checked={whatsappConfirmation} onChange={e => setWhatsappConfirmation(e.target.checked)}
                  className="mt-0.5 rounded text-secondary-500 focus:ring-secondary-500" />
                <label htmlFor="whatsapp-cb" className="cursor-pointer text-[11px] leading-relaxed text-slate-700 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-secondary-500" />
                  Send me booking confirmation and reminders via WhatsApp on +91 {patientPhone || 'XXXXXXXXXX'}
                </label>
              </div>

              <div className="p-3.5 bg-slate-100/80 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                <input type="checkbox" id="agree-check" checked={agreedToPolicy} onChange={e => setAgreedToPolicy(e.target.checked)}
                  className="mt-0.5 rounded text-primary-500 focus:ring-primary-500" />
                <label htmlFor="agree-check" className="cursor-pointer text-[11px] leading-relaxed">
                  I agree to Tapasya Hospital's booking and cancellation policy. Appointments can be cancelled online up to 2 hours prior. Consultation fees are paid at reception.
                </label>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                <button type="button" onClick={() => setStep(3)} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl min-h-[44px]">
                  <ChevronLeft className="w-4 h-4" /><span>Back</span>
                </button>
                <button type="button" onClick={() => {
                  if (!patientName.trim()) { setSubmitError("Please enter the patient's full name."); return; }
                  if (patientPhone.replace(/\D/g, '').length < 10) { setSubmitError('Please enter a 10-digit mobile number.'); return; }
                  setSubmitError(''); setStep(5);
                }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-all shadow-sm min-h-[44px]">
                  <span>Review Booking</span><ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Confirm */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Step 5 — Review &amp; Confirm</h3>
                <p className="text-xs text-slate-500 mt-1">Verify your appointment before final confirmation.</p>
              </div>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-emergency-50 border border-emergency-200 text-emergency-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-emergency-600" /><span>{submitError}</span>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Service</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedService?.name}</span>
                    <span className="text-slate-500 block">{selectedService?.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Doctor</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedDoctor ? selectedDoctor.name : 'First Available'}</span>
                    <span className="text-slate-500 block">{selectedDoctor ? selectedDoctor.specialty : 'Duty Specialist'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100 text-xs">
                  <div><span className="text-slate-400 block mb-0.5">Date</span><span className="font-bold text-slate-900">{selectedDate}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">Time</span><span className="font-bold text-primary-600">{selectedTimeSlot} ({selectedService?.durationMinutes || 30}m)</span></div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Fee</span>
                    {selectedService?.feeVerified && selectedService?.consultationFee ? (
                      <><span className="font-bold text-slate-900 text-sm">₹{selectedService.consultationFee}</span><span className="text-[10px] text-slate-400 block">Pay at reception</span></>
                    ) : <span className="text-xs text-slate-700 font-medium block">Contact hospital</span>}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Patient</span>
                    <span className="font-bold text-slate-900">{patientName}</span>
                    <span className="text-slate-500 block">+91 {patientPhone} {patientAge ? `• ${patientAge} yrs` : ''} • {patientGender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Location</span>
                    <span className="font-medium text-slate-800 block">Tapasya Multi-Speciality Hospital</span>
                    <span className="text-slate-500 block text-[11px]">50 Feet Main Road, Laggere, Bengaluru</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 bg-primary-50/50 p-3 rounded-xl border border-primary-100">
                <ShieldCheck className="w-4 h-4 text-primary-600 shrink-0" />
                <span>Slot availability verified live. Double bookings are strictly prevented.</span>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                <button type="button" onClick={() => setStep(4)} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl min-h-[44px]">
                  <ChevronLeft className="w-4 h-4" /><span>Edit Info</span>
                </button>
                <button type="button" onClick={handleSubmitBooking} disabled={submitting}
                  className="inline-flex items-center gap-2 px-7 py-3 text-sm font-bold text-white bg-secondary-500 hover:bg-secondary-600 disabled:opacity-60 rounded-xl transition-all shadow-md shadow-secondary-600/30 min-h-[44px]">
                  {submitting ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Reserving...</span></>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5" /><span>Confirm &amp; Book</span></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Confirmation with Google Calendar + Directions */}
          {step === 6 && confirmedBooking && (
            <div className="space-y-6 text-center py-4 animate-fade-in">
              <div className="w-16 h-16 bg-secondary-50 text-secondary-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
              </div>

              <div>
                <span className="text-xs font-bold text-secondary-600 uppercase tracking-widest">Appointment Confirmed</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">You're Booked at Tapasya Hospital!</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-2">
                  Your appointment is confirmed. Please present this reference at reception on arrival.
                </p>
              </div>

              {/* Reference Number */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-white border border-secondary-200 shadow-sm flex items-center justify-between">
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Booking ID</div>
                  <div className="text-xl font-mono font-extrabold text-slate-900 tracking-wider">{confirmedBooking.referenceNumber}</div>
                </div>
                <button type="button" onClick={handleCopyReference}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors border border-primary-200">
                  {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRef ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Details */}
              <div className="max-w-md mx-auto text-left bg-white p-5 rounded-2xl border border-slate-200 text-xs space-y-3">
                <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500">Patient:</span><span className="font-bold text-slate-900">{confirmedBooking.patientName}</span></div>
                <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500">Service:</span><span className="font-semibold text-slate-900">{confirmedBooking.serviceName}</span></div>
                <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500">Doctor:</span><span className="font-semibold text-slate-900">{confirmedBooking.doctorName}</span></div>
                <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500">Date &amp; Time:</span><span className="font-bold text-primary-600">{confirmedBooking.date} at {confirmedBooking.timeSlot}</span></div>
                <div className="flex justify-between py-1.5"><span className="text-slate-500">Location:</span><span className="font-medium text-slate-800 text-right">50 Feet Main Road, Laggere, Bengaluru</span></div>
              </div>

              {/* Action Buttons: Google Calendar + Directions + Manage */}
              <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 pt-2">
                <a href={getGoogleCalendarLink(confirmedBooking)} target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors min-h-[44px]">
                  <Calendar className="w-3.5 h-3.5" /><span>Add to Calendar</span>
                </a>
                <a href="https://maps.app.goo.gl/EcYFQsPjZDsa5Ymj9" target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-secondary-500 hover:bg-secondary-600 rounded-xl transition-colors min-h-[44px]">
                  <MapPin className="w-3.5 h-3.5" /><span>Get Directions</span>
                </a>
                <button type="button" onClick={() => onOpenLookup?.(confirmedBooking.referenceNumber, confirmedBooking.patientPhone)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors min-h-[44px]">
                  <span>Manage Booking</span>
                </button>
              </div>

              <div className="pt-4">
                <button type="button" onClick={() => {
                  setStep(1); setConfirmedBooking(null); setPatientName(''); setPatientPhone(''); setNotes(''); setSelectedTimeSlot('');
                }}
                  className="text-xs text-primary-600 hover:underline font-medium inline-flex items-center gap-1">
                  <span>Book another appointment</span><ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
