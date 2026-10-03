/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { BusinessProfile, ServiceItem, DoctorProfile, ReviewItem } from './types';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ServiceCatalogue } from './components/ServiceCatalogue';
import { BookingWizard } from './components/BookingWizard';
import { AboutAndDoctors } from './components/AboutAndDoctors';
import { ReviewsSection } from './components/ReviewsSection';
import { LocationAndContact } from './components/LocationAndContact';
import { Footer } from './components/Footer';
import { BookingLookupModal } from './components/BookingLookupModal';
import { AdminDashboard } from './components/AdminDashboard';
import { HeartPulse } from 'lucide-react';

export default function App() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string>('');

  // Modals & Booking State
  const [isLookupOpen, setIsLookupOpen] = useState<boolean>(false);
  const [lookupInitialRef, setLookupInitialRef] = useState<string>('');
  const [lookupInitialPhone, setLookupInitialPhone] = useState<string>('');

  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [selectedServiceIdForBooking, setSelectedServiceIdForBooking] = useState<string>('');
  const [selectedDoctorIdForBooking, setSelectedDoctorIdForBooking] = useState<string>('');
  const [bookingTriggerTimestamp, setBookingTriggerTimestamp] = useState<number>(0);

  const loadData = async () => {
    try {
      const [bizRes, svcData, docData] = await Promise.all([
        api.getBusiness(),
        api.getServices(),
        api.getDoctors()
      ]);
      setBusiness(bizRes.business);
      setReviews(bizRes.reviews);
      setServices(svcData);
      setDoctors(docData);
    } catch (err: any) {
      console.error('Failed to load hospital data:', err);
      setError('Could not connect to Tapasya Multi-Speciality Hospital clinical server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenBooking = (serviceId?: string) => {
    setSelectedServiceIdForBooking(serviceId || '');
    setSelectedDoctorIdForBooking('');
    setBookingTriggerTimestamp(Date.now());
    handleNavigate('booking-section');
  };

  const handleOpenLookupWithDetails = (ref?: string, phone?: string) => {
    if (ref) setLookupInitialRef(ref);
    if (phone) setLookupInitialPhone(phone);
    setIsLookupOpen(true);
  };

  const handleSelectDoctorForBooking = (doctorId: string) => {
    const doc = doctors.find(d => d.id === doctorId);
    let matchedServiceId = '';
    if (doc) {
      const match = services.find(s =>
        s.isActive !== false &&
        (s.department.toLowerCase().includes(doc.department.toLowerCase()) ||
         doc.department.toLowerCase().includes(s.department.toLowerCase()) ||
         (s.category && s.category.toLowerCase().includes(doc.department.toLowerCase())))
      );
      if (match) matchedServiceId = match.id;
    }
    setSelectedServiceIdForBooking(matchedServiceId || services[0]?.id || '');
    setSelectedDoctorIdForBooking(doctorId);
    setBookingTriggerTimestamp(Date.now());
    handleNavigate('booking-section');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center animate-pulse mb-4 shadow-lg shadow-teal-600/30">
          <HeartPulse className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Tapasya Multi-Speciality Hospital Bengaluru</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to clinical schedule...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
      {/* Navigation Header */}
      <Navbar
        business={business}
        onNavigate={handleNavigate}
        onOpenLookup={() => handleOpenLookupWithDetails()}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenBooking={handleOpenBooking}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          business={business}
          onBookClick={() => handleOpenBooking()}
          onExploreServices={() => handleNavigate('services')}
          onContactClick={() => handleNavigate('contact')}
        />

        {/* Services Catalogue */}
        <ServiceCatalogue
          services={services}
          onSelectService={serviceId => handleOpenBooking(serviceId)}
        />

        {/* Multi-Step Real-time Booking Wizard */}
        <BookingWizard
          services={services}
          doctors={doctors}
          initialServiceId={selectedServiceIdForBooking}
          initialDoctorId={selectedDoctorIdForBooking}
          triggerTimestamp={bookingTriggerTimestamp}
          onOpenLookup={handleOpenLookupWithDetails}
        />

        {/* About & Medical Faculty */}
        <AboutAndDoctors
          doctors={doctors}
          onSelectDoctor={handleSelectDoctorForBooking}
        />

        {/* Verified Patient Reviews */}
        <ReviewsSection reviews={reviews} />

        {/* Location, Directions & Contact */}
        <LocationAndContact business={business} />
      </main>

      {/* Footer */}
      <Footer
        business={business}
        onNavigate={handleNavigate}
        onOpenLookup={() => handleOpenLookupWithDetails()}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenBooking={() => handleOpenBooking()}
      />

      {/* Booking Lookup & Cancellation Modal */}
      <BookingLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        initialRef={lookupInitialRef}
        initialPhone={lookupInitialPhone}
      />

      {/* Staff Admin Dashboard */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshPublicData={loadData}
      />
    </div>
  );
}
