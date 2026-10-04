import React from 'react';
import { HeartPulse, Phone, MapPin, Clock, Star, ExternalLink, Shield, Siren } from 'lucide-react';
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
    <footer className="bg-primary-800 text-slate-300 text-xs">
      {/* Emergency Strip */}
      <div className="bg-emergency-500 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-white">
            <Siren className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm sm:text-base">
              24/7 Emergency Casualty &amp; Hemodialysis Unit Always Operational
            </span>
          </div>
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-emergency-600 font-bold text-sm transition-colors min-h-[44px]"
          >
            <Phone className="w-4 h-4" />
            <span>Call: {phone}</span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-secondary-500 text-white flex items-center justify-center font-bold">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold tracking-tight text-white block">
                  TAPASYA MULTI-SPECIALITY HOSPITAL
                </span>
                <span className="text-[11px] text-secondary-400">Laggere, Bengaluru, Karnataka</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Dedicated multi-speciality hospital in Laggere, Bengaluru providing advanced hemodialysis led
              by Dr. Pramod, 24/7 casualty trauma care, laparoscopic surgery, and dependable outpatient
              clinical consultations.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>4.5</span>
              </div>
              <span className="text-primary-600">•</span>
              <span className="text-slate-400">50+ Verified Reviews</span>
              <span className="text-primary-600">•</span>
              <a
                href="https://maps.app.goo.gl/EcYFQsPjZDsa5Ymj9"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-400 hover:text-secondary-300 underline flex items-center gap-1"
              >
                <span>Google Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Clinical Services Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Key Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate('services')} className="hover:text-secondary-400 transition-colors">Hemodialysis &amp; Nephrology</button></li>
              <li><button onClick={() => onNavigate('services')} className="hover:text-secondary-400 transition-colors">24/7 Emergency &amp; Casualty</button></li>
              <li><button onClick={() => onNavigate('services')} className="hover:text-secondary-400 transition-colors">General &amp; Laparoscopy Surgery</button></li>
              <li><button onClick={() => onNavigate('services')} className="hover:text-secondary-400 transition-colors">Internal Medicine &amp; Fevers</button></li>
              <li><button onClick={() => onNavigate('services')} className="hover:text-secondary-400 transition-colors">Obstetrics &amp; Gynaecology</button></li>
              <li><button onClick={() => onNavigate('services')} className="hover:text-secondary-400 transition-colors">Insurance &amp; Cashless</button></li>
            </ul>
          </div>

          {/* Quick Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Patient Actions
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={onOpenBooking} className="hover:text-secondary-400 transition-colors text-secondary-400 font-semibold">Book OPD Appointment</button></li>
              <li><button onClick={onOpenLookup} className="hover:text-secondary-400 transition-colors">Manage / Cancel Booking</button></li>
              <li><button onClick={() => onNavigate('doctors')} className="hover:text-secondary-400 transition-colors">Doctors &amp; Consultants</button></li>
              <li><button onClick={() => onNavigate('reviews')} className="hover:text-secondary-400 transition-colors">Verifiable Reviews</button></li>
              <li><button onClick={() => onNavigate('contact')} className="hover:text-secondary-400 transition-colors">Directions &amp; Hours</button></li>
              <li><button onClick={onOpenAdmin} className="hover:text-secondary-400 transition-colors flex items-center gap-1 text-slate-500"><Shield className="w-3 h-3" /><span>Staff Portal</span></button></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Hospital Location
            </h4>
            <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <p className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-secondary-400 shrink-0 mt-0.5" />
                <span>No. 2, Suggappa Layout, Next to Grace Public School, 50 Feet Main Road, Laggere, Bengaluru 560058</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-secondary-400 shrink-0" />
                <span>{phone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-secondary-400 shrink-0" />
                <span>OPD: 8 AM – 8:30 PM | 24/7 Casualty</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="mt-12 pt-6 border-t border-primary-700 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Tapasya Multi-Speciality Hospital Bengaluru. All rights reserved.</p>
          <p className="max-w-xl text-center md:text-right">
            Medical notice: If you are experiencing a life-threatening trauma or medical emergency, proceed
            immediately to the Tapasya Multi-Speciality Hospital 24/7 Casualty triage desk or call {phone} directly.
          </p>
        </div>
      </div>
    </footer>
  );
};
