import React from 'react';
import { Calendar, Phone, MapPin, Star, ShieldCheck, HeartPulse, Clock, Sparkles } from 'lucide-react';
import type { BusinessProfile } from '../types';

interface HeroProps {
  business: BusinessProfile | null;
  onBookClick: () => void;
  onExploreServices: () => void;
  onContactClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  business,
  onBookClick,
  onExploreServices
}) => {
  const phone = business?.contact.phone || '+91 98807 62646';

  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Decorative background grid and lighting */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute -top-40 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            {/* Verified Trust Strip */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
              <span className="flex items-center text-amber-400">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="ml-1 font-bold text-white">5.0</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-medium">52+ Verified Reviews</span>
              <span className="text-slate-500">•</span>
              <span className="text-teal-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Hospital
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                Dedicated Multi-Speciality Care &amp;{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-200 to-emerald-400">
                  24/7 Advanced Support
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Tapasya Multi-Speciality Hospital provides patient-first healthcare in Laggere, Bengaluru, Karnataka. Featuring our renowned Hemodialysis Unit under Dr. Pramod, round-the-clock emergency casualty, laparoscopic surgery, and compassionate outpatient care.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onBookClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-lg shadow-teal-700/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Calendar className="w-4 h-4" />
                <span>Book OPD Appointment</span>
              </button>

              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-rose-200 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 rounded-xl transition-all"
              >
                <Phone className="w-4 h-4 text-rose-400" />
                <span>Emergency: {phone}</span>
              </a>

              <button
                onClick={onExploreServices}
                className="inline-flex items-center justify-center px-4 py-3.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
              >
                Explore Services &rarr;
              </button>
            </div>

            {/* Verified Location & Quick Facts */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">50 Feet Main Road</div>
                  <div className="text-slate-400">Next to Grace Public School, Laggere</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">24/7 Operations</div>
                  <div className="text-slate-400">Casualty, Pharmacy &amp; Dialysis</div>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-start gap-2">
                <HeartPulse className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Ethical Healthcare</div>
                  <div className="text-slate-400">Patient-centered medical advice</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-800 group">
              <img
                src="/images/hospital_exterior.jpg"
                alt="Modern Hospital Building Facility"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/images/placeholder_facility.svg') {
                    target.src = '/images/placeholder_facility.svg';
                  }
                }}
                className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              {/* Bottom Image Overlay Card */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Walk-ins &amp; Appointments Open
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Bengaluru 560058</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-100 flex items-center justify-between">
                  <span>Tapasya Multi-Speciality Hospital</span>
                  <a
                    href="https://maps.app.goo.gl/EcYFQsPjZDsa5Ymj9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-400 hover:text-teal-300 underline font-normal"
                  >
                    Open in Maps &rarr;
                  </a>
                </div>
              </div>
            </div>

            {/* Dialysis Highlight Floating Badge */}
            <div className="hidden sm:flex absolute -bottom-5 -left-6 items-center gap-3 p-3.5 rounded-xl bg-slate-800/95 border border-slate-700 shadow-xl backdrop-blur-md text-white max-w-xs">
              <div className="w-10 h-10 rounded-lg bg-teal-900/60 text-teal-300 flex items-center justify-center shrink-0 border border-teal-700/50">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-100">Nephrology &amp; Dialysis Unit</div>
                <div className="text-slate-400">Specialist care led by Dr. Pramod</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
