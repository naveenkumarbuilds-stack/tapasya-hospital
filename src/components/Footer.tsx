import React from 'react';
import { HeartPulse, Phone, MapPin, Clock, Star, ExternalLink, Shield } from 'lucide-react';
import type { BusinessProfile } from '../types';

interface FooterProps {
  business: BusinessProfile | null;
  onNavigate: (sectionId: string) => void;
  onOpenLookup: () => void;
  onOpenAdmin: () => void;
  onOpenBooking: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  business,
  onNavigate,
  onOpenLookup,
  onOpenAdmin,
  onOpenBooking
}) => {
  const phone = business?.contact.phone || '+91 98807 62646';

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      {/* Emergency Strip */}
      <div className="bg-teal-950 border-b border-teal-900/60 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-teal-300">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="font-semibold text-xs sm:text-sm">
              24/7 Emergency Casualty &amp; Hemodialysis Unit Always Operational
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 hidden md:inline">50 Feet Main Road, Laggere</span>
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call: {phone}</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-white block">
                  TAPASYA MULTI-SPECIALITY HOSPITAL
                </span>
                <span className="text-[11px] text-teal-400">Laggere, Bengaluru, Karnataka</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Dedicated multi-speciality hospital in Laggere, Bengaluru providing advanced hemodialysis under Dr. Pramod, 24/7 casualty trauma care, laparoscopic surgery, and dependable outpatient clinical consultations.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>5.0</span>
              </div>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">52+ Verified Reviews</span>
              <span className="text-slate-600">•</span>
              <a
                href="https://maps.app.goo.gl/EcYFQsPjZDsa5Ymj9"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 underline flex items-center gap-1"
              >
                <span>Google Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Clinical Services Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Key Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  Hemodialysis &amp; Nephrology
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  24/7 Emergency &amp; Casualty
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  General &amp; Laparoscopy Surgery
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  Gynecomastia Reduction
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  Internal Medicine &amp; Fevers
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  Obstetrics &amp; Paediatrics
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Patient Actions
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={onOpenBooking} className="hover:text-white transition-colors text-teal-400 font-semibold">
                  Book OPD Appointment
                </button>
              </li>
              <li>
                <button onClick={onOpenLookup} className="hover:text-white transition-colors">
                  Manage / Cancel Booking
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('doctors')} className="hover:text-white transition-colors">
                  Doctors &amp; Consultants
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('reviews')} className="hover:text-white transition-colors">
                  Verifiable Reviews
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">
                  Hospital Directions &amp; Hours
                </button>
              </li>
              <li>
                <button onClick={onOpenAdmin} className="hover:text-white transition-colors flex items-center gap-1 text-slate-500">
                  <Shield className="w-3 h-3" />
                  <span>Hospital Staff Portal</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Hospital Location
            </h4>
            <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <p className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  No. 2, Suggappa Layout, Next to Grace Public School, 50 Feet Main Road, Laggere, Bengaluru 560058
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>+91 98807 62646</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>OPD: 8:00 AM – 8:30 PM (24/7 Casualty)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Tapasya Multi-Speciality Hospital Bengaluru. All rights reserved.</p>
          <p className="max-w-xl text-center md:text-right">
            Medical notice: If you are experiencing a life-threatening trauma or medical emergency, proceed immediately to the Tapasya Multi-Speciality Hospital 24/7 Casualty triage desk or call +91 98807 62646 directly.
          </p>
        </div>
      </div>
    </footer>
  );
};
