import React, { useState } from 'react';
import { Phone, Calendar, Search, Shield, Menu, X, Clock, MapPin, HeartPulse } from 'lucide-react';
import type { BusinessProfile } from '../types';

interface NavbarProps {
  business: BusinessProfile | null;
  onNavigate: (sectionId: string) => void;
  onOpenLookup: () => void;
  onOpenAdmin: () => void;
  onOpenBooking: (serviceId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  business,
  onNavigate,
  onOpenLookup,
  onOpenAdmin,
  onOpenBooking
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const phone = business?.contact.phone || '+91 98807 62646';

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      {/* Top Emergency & Info Banner */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-teal-400 font-semibold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              24/7 Casualty &amp; Dialysis Active
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              50 Feet Main Road, Laggere, Bengaluru
            </span>
            <span className="hidden lg:inline-flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              OPD Hours: 8:00 AM – 8:30 PM
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="flex items-center gap-1.5 text-white hover:text-teal-300 font-medium transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-rose-400" />
              <span>Emergency / Help: {phone}</span>
            </a>
            <button
              onClick={onOpenAdmin}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-xs transition-colors pl-2 border-l border-slate-700"
              title="Hospital Staff Portal"
            >
              <Shield className="w-3 h-3 text-slate-400" />
              <span className="hidden sm:inline">Staff Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <button
          onClick={() => handleNavClick('hero')}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-700/20 group-hover:bg-teal-700 transition-colors">
            <HeartPulse className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                TAPASYA
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                Multi-Speciality Hospital
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Laggere, Bengaluru, Karnataka</p>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => handleNavClick('services')}
            className="hover:text-teal-700 transition-colors"
          >
            Services &amp; Specialties
          </button>
          <button
            onClick={() => handleNavClick('doctors')}
            className="hover:text-teal-700 transition-colors"
          >
            Doctors &amp; Care
          </button>
          <button
            onClick={() => handleNavClick('facilities')}
            className="hover:text-teal-700 transition-colors"
          >
            Facilities &amp; Dialysis
          </button>
          <button
            onClick={() => handleNavClick('reviews')}
            className="hover:text-teal-700 transition-colors"
          >
            Reviews &amp; Rating
          </button>
          <button
            onClick={() => handleNavClick('contact')}
            className="hover:text-teal-700 transition-colors"
          >
            Location &amp; Contact
          </button>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={onOpenLookup}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Manage Booking</span>
          </button>
          <button
            onClick={() => onOpenBooking()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm shadow-teal-600/30 transition-all hover:scale-[1.02]"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => onOpenBooking()}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg"
          >
            Book
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="grid gap-2 text-sm font-medium text-slate-700">
            <button
              onClick={() => handleNavClick('services')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Services &amp; Specialties
            </button>
            <button
              onClick={() => handleNavClick('doctors')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Doctors &amp; Medical Team
            </button>
            <button
              onClick={() => handleNavClick('facilities')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Facilities &amp; Dialysis Unit
            </button>
            <button
              onClick={() => handleNavClick('reviews')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Reviews (5.0 ★)
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Address &amp; Contact
            </button>
          </div>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLookup();
              }}
              className="w-full text-center py-2.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg"
            >
              Find / Cancel Appointment
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full text-center py-2.5 text-xs font-semibold text-white bg-teal-600 rounded-lg shadow-sm"
            >
              Book OPD Appointment
            </button>
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="w-full text-center py-2 text-xs font-medium text-rose-600 bg-rose-50 rounded-lg border border-rose-100 flex items-center justify-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              Call Emergency: {phone}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
