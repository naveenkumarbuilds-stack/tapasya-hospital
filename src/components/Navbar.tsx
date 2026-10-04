import React, { useState, useEffect } from 'react';
import { Phone, Calendar, Search, Shield, Menu, X, Clock, MapPin, HeartPulse, Star, BadgeCheck, Siren } from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);

  const phone = business?.contact.phone || '+91 98807 62646';
  const phoneClean = phone.replace(/\s+/g, '');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white transition-all duration-300">
      {/* Trust Bar */}
      <div className="bg-primary-500 text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="flex items-center gap-1.5 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold">4.5</span>
              <span className="hidden sm:inline text-primary-100">Google Rated</span>
            </span>
            <span className="flex items-center gap-1.5 text-primary-100 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">24/7 Emergency & Dialysis</span>
              <span className="sm:hidden">24/7 Open</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-primary-100 font-medium">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Verified Hospital</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden lg:flex items-center gap-1 text-primary-100">
              <MapPin className="w-3.5 h-3.5" />
              Laggere, Bengaluru
            </span>
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 text-primary-200 hover:text-white transition-colors"
              title="Hospital Staff Portal"
            >
              <Shield className="w-3 h-3" />
              <span className="hidden sm:inline">Staff</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className={`border-b transition-all duration-300 ${scrolled ? 'border-slate-200 shadow-sm' : 'border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('hero')}
            className="flex items-center gap-2.5 text-left focus:outline-none group shrink-0"
          >
            <div className="w-11 h-11 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-md shadow-primary-600/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
                  TAPASYA
                </span>
                <span className="hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded bg-primary-50 text-primary-600 border border-primary-100">
                  Multi-Speciality
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">Hospital | Laggere, Bengaluru</p>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button onClick={() => handleNavClick('why-choose')} className="hover:text-primary-600 transition-colors">Why Us</button>
            <button onClick={() => handleNavClick('services')} className="hover:text-primary-600 transition-colors">Services</button>
            <button onClick={() => handleNavClick('doctors')} className="hover:text-primary-600 transition-colors">Doctors</button>
            <button onClick={() => handleNavClick('facilities')} className="hover:text-primary-600 transition-colors">Facilities</button>
            <button onClick={() => handleNavClick('reviews')} className="hover:text-primary-600 transition-colors">Reviews</button>
            <button onClick={() => handleNavClick('contact')} className="hover:text-primary-600 transition-colors">Contact</button>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={onOpenLookup}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Manage</span>
            </button>
            <a
              href={`tel:${phoneClean}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emergency-500 hover:bg-emergency-600 rounded-lg shadow-sm shadow-emergency-600/20 transition-all hover:scale-[1.02] min-h-[44px]"
            >
              <Siren className="w-3.5 h-3.5" />
              <span>Emergency Call</span>
            </a>
            <button
              onClick={() => onOpenBooking()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-secondary-500 hover:bg-secondary-600 rounded-lg shadow-sm shadow-secondary-600/20 transition-all hover:scale-[1.02] min-h-[44px]"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>
          </div>

          {/* Mobile Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <a
              href={`tel:${phoneClean}`}
              className="inline-flex items-center justify-center w-10 h-10 text-white bg-emergency-500 rounded-lg shadow-sm"
              title="Emergency Call"
            >
              <Siren className="w-4 h-4" />
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-slate-700 rounded-lg border border-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1 animate-fade-in">
          <div className="grid gap-0.5 text-sm font-medium text-slate-700">
            {[
              { id: 'why-choose', label: 'Why Choose Tapasya' },
              { id: 'services', label: 'Services & Specialties' },
              { id: 'doctors', label: 'Our Doctors' },
              { id: 'facilities', label: 'Facilities & Dialysis' },
              { id: 'reviews', label: 'Reviews' },
              { id: 'contact', label: 'Location & Contact' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="text-left px-3 py-2.5 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenBooking(); }}
              className="w-full py-3 text-sm font-bold text-white bg-secondary-500 rounded-xl shadow-sm min-h-[44px] flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Book Appointment
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenLookup(); }}
              className="w-full py-2.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg"
            >
              Find / Cancel Appointment
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
