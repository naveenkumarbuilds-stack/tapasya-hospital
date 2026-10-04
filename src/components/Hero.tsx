import React from 'react';
import { Calendar, Phone, MapPin, Star, ShieldCheck, HeartPulse, Clock, Siren, Stethoscope } from 'lucide-react';
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
  onContactClick
}) => {
  const phone = business?.contact.phone || '+91 98807 62646';
  const phoneClean = phone.replace(/\s+/g, '');

  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute -top-40 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-emergency-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 lg:pt-20 lg:pb-28">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Trust Strip */}
            <div className="inline-flex flex-wrap items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs backdrop-blur-sm">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-white">4.5</span>
                <span className="text-primary-100">Google Rated</span>
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1 text-primary-100 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-secondary-300" />
                Verified Hospital
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1 text-secondary-300 font-medium">
                <Clock className="w-3.5 h-3.5" />
                24/7 Open
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                Trusted Multi-Speciality Care in Laggere
              </h1>
              <p className="text-lg sm:text-xl font-semibold text-secondary-300">
                24/7 Emergency & Advanced Dialysis
              </p>
              <p className="text-sm sm:text-base text-primary-100 max-w-2xl leading-relaxed">
                Tapasya Hospital provides patient-first multi-speciality healthcare on 50 Feet Main Road,
                next to Grace Public School, Laggere, Bengaluru. Featuring our renowned Nephrology &
                Hemodialysis Unit led by Dr. Pramod, round-the-clock emergency casualty, and modern
                outpatient care across 15+ specialties.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onBookClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-primary-600 bg-white hover:bg-primary-50 rounded-xl shadow-lg shadow-primary-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
              >
                <Calendar className="w-4 h-4" />
                Book Appointment
              </button>
              <a
                href={`tel:${phoneClean}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-bold text-white bg-emergency-500 hover:bg-emergency-600 rounded-xl shadow-lg shadow-emergency-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px]"
              >
                <Siren className="w-4 h-4" />
                Call Emergency
              </a>
              <button
                onClick={onContactClick}
                className="inline-flex items-center justify-center px-4 py-3.5 text-sm font-medium text-primary-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                Get Directions
              </button>
            </div>

            {/* Quick Facts */}
            <div className="pt-5 border-t border-white/15 grid grid-cols-3 gap-4 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-secondary-300 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Laggere, Bengaluru</div>
                  <div className="text-primary-200">Next to Grace Public School</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-secondary-300 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">24/7 Operations</div>
                  <div className="text-primary-200">Emergency & Dialysis</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <HeartPulse className="w-4 h-4 text-secondary-300 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Dr. Pramod</div>
                  <div className="text-primary-200">Nephrology & Dialysis</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-primary-800 group">
              <img
                src="/images/hospital_exterior.jpg"
                alt="Tapasya Multi-Speciality Hospital Building"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/images/placeholder_facility.svg') {
                    target.src = '/images/placeholder_facility.svg';
                  }
                }}
                className="w-full h-72 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-950 via-primary-950/20 to-transparent" />

              {/* Bottom Card */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-primary-950/90 backdrop-blur-md border border-white/10 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Walk-ins & Appointments Open
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm font-semibold text-white flex items-center justify-between">
                  <span>Tapasya Multi-Speciality Hospital</span>
                  <a
                    href="https://maps.app.goo.gl/EcYFQsPjZDsa5Ymj9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-secondary-300 hover:text-secondary-200 underline font-normal"
                  >
                    Open in Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Floating Dialysis Badge */}
            <div className="hidden sm:flex absolute -bottom-5 -left-6 items-center gap-3 p-3.5 rounded-xl bg-white shadow-xl text-slate-900 max-w-xs">
              <div className="w-10 h-10 rounded-lg bg-secondary-50 text-secondary-600 flex items-center justify-center shrink-0 border border-secondary-100">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900">Nephrology & Dialysis Unit</div>
                <div className="text-slate-500">Specialist care led by Dr. Pramod</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
