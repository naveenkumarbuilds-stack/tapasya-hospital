import React, { useState, useMemo } from 'react';
import { ArrowRight, ShieldCheck, Stethoscope, AlertCircle, Info, Check } from 'lucide-react';
import type { DoctorProfile } from '../types';

interface AboutAndDoctorsProps {
  doctors: DoctorProfile[];
  onSelectDoctor: (doctorId: string) => void;
}

function getDoctorInitials(name: string): string {
  const clean = name.replace(/^Dr\.?\s+/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const AboutAndDoctors: React.FC<AboutAndDoctorsProps> = ({
  doctors,
  onSelectDoctor
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');

  // Filter public doctors: only confirmed doctors
  const confirmedDoctors = useMemo(() => {
    return doctors.filter(doc => doc.status !== 'awaiting_confirmation');
  }, [doctors]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    confirmedDoctors.forEach(d => {
      if (d.department) set.add(d.department);
    });
    return ['All', ...Array.from(set).sort()];
  }, [confirmedDoctors]);

  const filteredDoctors = useMemo(() => {
    if (selectedDepartment === 'All') return confirmedDoctors;
    return confirmedDoctors.filter(d => d.department === selectedDepartment);
  }, [confirmedDoctors, selectedDepartment]);

  return (
    <section id="doctors" className="py-16 sm:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* About Intro Section */}
        <div className="grid lg:grid-cols-12 gap-12 items-center mb-20">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-bold tracking-widest text-teal-700 uppercase">
              About Tapasya Multi-Speciality Hospital
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Compassionate, Modern &amp; Transparent Healthcare in Laggere
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Located on 50 Feet Main Road near Grace Public School in Bengaluru, Tapasya Multi-Speciality Hospital was founded with a singular mission: to provide dependable multi-speciality medical attention, specialized nephrology care, and emergency trauma management within our local community.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our clinical departments combine experienced medical specialists across Obstetrics &amp; Gynaecology, General Surgery, Gastroenterology, Orthopedics, Nephrology, Cardiology, and allied disciplines with modern diagnostic facilities, clean surgical suites, and dedicated nursing support.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-2xl font-extrabold text-teal-700">24/7</div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">Emergency &amp; Pharmacy</div>
                <p className="text-[11px] text-slate-500 mt-1">Always open for walk-ins and ambulance arrivals.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-2xl font-extrabold text-teal-700">5.0 ★</div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">Patient Satisfaction</div>
                <p className="text-[11px] text-slate-500 mt-1">52+ verified community reviews across Google &amp; Justdial.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900">
                  <img
                    src="/images/dialysis_nephrology.jpg"
                    alt="Clinical Hemodialysis and Nephrology Care Facility"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/images/placeholder_facility.svg') {
                        target.src = '/images/placeholder_facility.svg';
                      }
                    }}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="p-3 bg-white text-xs">
                    <span className="font-bold text-slate-900 block">Hemodialysis Center</span>
                    <span className="text-slate-500 text-[11px]">Specialist renal care</span>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900">
                  <img
                    src="/images/emergency_casualty.jpg"
                    alt="24/7 Hospital Emergency and Casualty Facility"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/images/placeholder_facility.svg') {
                        target.src = '/images/placeholder_facility.svg';
                      }
                    }}
                    className="w-full h-36 object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="p-3 bg-white text-xs">
                    <span className="font-bold text-slate-900 block">24/7 Casualty &amp; Triage</span>
                    <span className="text-slate-500 text-[11px]">Immediate emergency care</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4 pt-6">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900">
                  <img
                    src="/images/operation_theatre.jpg"
                    alt="Sterile Modular Operation Theatre Facility"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/images/placeholder_facility.svg') {
                        target.src = '/images/placeholder_facility.svg';
                      }
                    }}
                    className="w-full h-36 object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="p-3 bg-white text-xs">
                    <span className="font-bold text-slate-900 block">Modular Surgery Suite</span>
                    <span className="text-slate-500 text-[11px]">Laparoscopy &amp; day-care</span>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900">
                  <img
                    src="/images/opd_consultation.jpg"
                    alt="Modern Outpatient Consultation Suite"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/images/placeholder_facility.svg') {
                        target.src = '/images/placeholder_facility.svg';
                      }
                    }}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="p-3 bg-white text-xs">
                    <span className="font-bold text-slate-900 block">OPD Consultation Suites</span>
                    <span className="text-slate-500 text-[11px]">Comfortable patient rooms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctors Section */}
        <div id="facilities" className="pt-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Hospital Signboard Verified Directory</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Consulting Doctors &amp; Department Specialists
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Doctor names and department pairings are directly transcribed from the official Tapasya Hospital signboard. Individual qualifications, visiting hours, and consultation fees are verified directly with the hospital desk on arrival.
            </p>
          </div>

          {/* Department Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center gap-1.5 pb-2">
            {departments.map(dept => (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDepartment(dept)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectedDepartment === dept
                    ? 'bg-teal-700 text-white font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Doctors Grid */}
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDoctors.map(doc => {
              const initials = getDoctorInitials(doc.name);
              return (
                <div
                  key={doc.id}
                  className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-teal-300 hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Top Avatar & Department Badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-700 to-teal-900 text-white font-bold text-sm flex items-center justify-center shadow-inner tracking-wider shrink-0">
                        {initials}
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white text-teal-800 border border-slate-200/80 text-right leading-tight">
                        {doc.department}
                      </span>
                    </div>

                    {/* Doctor Name & Speciality */}
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {doc.name}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      <span className="text-slate-400">Speciality:</span> {doc.specialty || doc.department}
                    </p>

                    {/* Neutral Verification Metadata */}
                    <div className="mt-3.5 pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center gap-1.5 text-teal-700 font-medium">
                        <Check className="w-3 h-3 text-teal-600 shrink-0" />
                        <span>Signboard verified department pairing</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Visiting hours &amp; consultation fees confirmed at hospital reception desk.
                      </div>
                    </div>
                  </div>

                  {/* Booking Action */}
                  <div className="mt-4 pt-3.5 border-t border-slate-200/70 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      OPD Consultation
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectDoctor(doc.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors"
                    >
                      <span>Book Consultation</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Signboard Department Transparency Box */}
          <div className="mt-10 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-slate-600 leading-relaxed">
                <h5 className="font-bold text-slate-900">
                  Hospital Signboard Department Notes &amp; Verification Notice
                </h5>
                <p>
                  To uphold complete medical honesty, doctor entries are restricted strictly to legible department pairings on the hospital signboard:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600 mt-1">
                  <li>
                    <strong>Paediatrics &amp; Neurosurgery:</strong> Both departments are actively listed on the hospital signboard; individual consulting doctor names in these rows were not legible in the supplied photo and await hospital confirmation before publishing.
                  </li>
                  <li>
                    <strong>Pulmonology:</strong> Dr. Anil is listed; the doctor name below this department is awaiting verification.
                  </li>
                  <li>
                    <strong>Physiotherapy:</strong> Partially legible as Dr. Manish on the signboard; full name will be published once confirmed by hospital administration.
                  </li>
                  <li>
                    <strong>Medico-Legal Cases (MLC):</strong> Listed as a 24/7 casualty administrative protocol, not an individual doctor profile.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
