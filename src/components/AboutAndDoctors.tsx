import React, { useState, useMemo } from 'react';
import { ArrowRight, ShieldCheck, Star, Award, Briefcase, IndianRupee, Stethoscope, MapPin } from 'lucide-react';
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

  // Sort: featured doctors first
  const sortedDoctors = useMemo(() => {
    return [...filteredDoctors].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }, [filteredDoctors]);

  return (
    <section id="doctors" className="py-16 sm:py-24 bg-white border-b border-slate-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* About Intro Section */}
        <div className="grid lg:grid-cols-12 gap-12 items-center mb-20">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-bold tracking-widest text-secondary-600 uppercase">
              About Tapasya Multi-Speciality Hospital
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Compassionate, Modern &amp; Transparent Healthcare in Laggere
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Located on 50 Feet Main Road near Grace Public School in Bengaluru, Tapasya Multi-Speciality Hospital
              was founded with a singular mission: to provide dependable multi-speciality medical attention,
              specialized nephrology care, and emergency trauma management within our local community.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our clinical departments combine experienced medical specialists across Obstetrics &amp; Gynaecology,
              General Surgery, Gastroenterology, Orthopedics, Nephrology, Cardiology, and allied disciplines with
              modern diagnostic facilities, clean surgical suites, and dedicated nursing support.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-primary-50 border border-primary-100">
                <div className="text-2xl font-extrabold text-primary-600">24/7</div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">Emergency &amp; Pharmacy</div>
                <p className="text-[11px] text-slate-500 mt-1">Always open for walk-ins and ambulance arrivals.</p>
              </div>
              <div className="p-4 rounded-2xl bg-secondary-50 border border-secondary-100">
                <div className="text-2xl font-extrabold text-secondary-600">4.5 ★</div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">Patient Satisfaction</div>
                <p className="text-[11px] text-slate-500 mt-1">50+ verified community reviews across Google &amp; Justdial.</p>
              </div>
            </div>
          </div>

          {/* Facilities Image Grid */}
          <div id="facilities" className="lg:col-span-6 relative scroll-mt-20">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                {[
                  { src: '/images/dialysis_nephrology.jpg', alt: 'Hemodialysis Center', label: 'Hemodialysis Center', sub: 'Specialist renal care', h: 'h-48' },
                  { src: '/images/emergency_casualty.jpg', alt: '24/7 Casualty & Triage', label: '24/7 Casualty & Triage', sub: 'Immediate emergency care', h: 'h-36' },
                ].map((img, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900">
                    <img
                      src={img.src}
                      alt={img.alt}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/images/placeholder_facility.svg') {
                          target.src = '/images/placeholder_facility.svg';
                        }
                      }}
                      className={`w-full ${img.h} object-cover hover:scale-105 transition-transform duration-500`}
                    />
                    <div className="p-3 bg-white text-xs">
                      <span className="font-bold text-slate-900 block">{img.label}</span>
                      <span className="text-slate-500 text-[11px]">{img.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-4 pt-6">
                {[
                  { src: '/images/operation_theatre.jpg', alt: 'Modular Surgery Suite', label: 'Modular Surgery Suite', sub: 'Laparoscopy & day-care', h: 'h-36' },
                  { src: '/images/opd_consultation.jpg', alt: 'OPD Consultation Suites', label: 'OPD Consultation Suites', sub: 'Comfortable patient rooms', h: 'h-48' },
                ].map((img, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900">
                    <img
                      src={img.src}
                      alt={img.alt}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/images/placeholder_facility.svg') {
                          target.src = '/images/placeholder_facility.svg';
                        }
                      }}
                      className={`w-full ${img.h} object-cover hover:scale-105 transition-transform duration-500`}
                    />
                    <div className="p-3 bg-white text-xs">
                      <span className="font-bold text-slate-900 block">{img.label}</span>
                      <span className="text-slate-500 text-[11px]">{img.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Doctors Section */}
        <div className="pt-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-50 border border-secondary-200 text-secondary-700 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary-600" />
              <span>Hospital Signboard Verified Directory</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Consulting Doctors &amp; Department Specialists
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Doctor names and department pairings are directly transcribed from the official Tapasya Hospital signboard.
              Individual qualifications, visiting hours, and consultation fees are verified directly with the hospital desk on arrival.
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
                    ? 'bg-primary-500 text-white font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Rich Doctor Cards Grid */}
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedDoctors.map(doc => {
              const initials = getDoctorInitials(doc.name);
              const isFeatured = doc.isFeatured;
              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-2xl border-2 flex flex-col justify-between hover:shadow-lg transition-all group ${
                    isFeatured ? 'border-secondary-300 shadow-md' : 'border-slate-200 hover:border-primary-300'
                  }`}
                >
                  {/* Featured Badge */}
                  {isFeatured && (
                    <div className="bg-gradient-to-r from-secondary-500 to-primary-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 flex items-center gap-1.5">
                      <Award className="w-3 h-3" />
                      Featured Specialist
                    </div>
                  )}

                  <div className={`p-5 ${isFeatured ? '' : ''}`}>
                    {/* Avatar & Department */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className={`w-14 h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center shadow-inner tracking-wider shrink-0 ${
                        isFeatured
                          ? 'bg-gradient-to-br from-secondary-500 to-primary-600'
                          : 'bg-gradient-to-br from-primary-500 to-primary-700'
                      }`}>
                        {initials}
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-primary-700 border border-slate-200 text-right leading-tight">
                        {doc.department}
                      </span>
                    </div>

                    {/* Name & Credentials */}
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                      {doc.name}
                    </h4>
                    {doc.qualifications && (
                      <p className="text-xs text-primary-600 font-semibold mt-0.5 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {doc.qualifications}
                      </p>
                    )}

                    {/* Specialty & Experience */}
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">{doc.specialty || doc.department}</span>
                      </div>
                      {doc.experienceYears && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{doc.experienceYears} Years Experience</span>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    {doc.bio && (
                      <p className="mt-3 text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                        {doc.bio}
                      </p>
                    )}

                    {/* Rating & Fee Row */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      {doc.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-bold text-slate-900">{doc.rating}</span>
                          {doc.reviewCount && (
                            <span className="text-[10px] text-slate-400">({doc.reviewCount})</span>
                          )}
                        </div>
                      )}
                      {doc.feeVerified && doc.consultationFee ? (
                        <div className="flex items-center gap-0.5">
                          <IndianRupee className="w-3.5 h-3.5 text-slate-700" />
                          <span className="text-sm font-bold text-slate-900">{doc.consultationFee}</span>
                          <span className="text-[10px] text-slate-400 ml-0.5">fee</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">Fee at hospital</span>
                      )}
                    </div>
                  </div>

                  {/* Booking Action */}
                  <div className="px-5 pb-5">
                    <button
                      type="button"
                      onClick={() => onSelectDoctor(doc.id)}
                      className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all min-h-[44px] ${
                        isFeatured
                          ? 'text-white bg-secondary-500 hover:bg-secondary-600 shadow-sm shadow-secondary-600/20'
                          : 'text-white bg-primary-500 hover:bg-primary-600 shadow-sm shadow-primary-600/20'
                      }`}
                    >
                      <span>Book Appointment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
