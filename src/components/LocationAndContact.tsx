import React, { useState } from 'react';
import { MapPin, Phone, Clock, ExternalLink, Send, CheckCircle2, AlertCircle, ShieldCheck, CreditCard, Building2 } from 'lucide-react';
import type { BusinessProfile } from '../types';
import { api } from '../api';

interface LocationAndContactProps {
  business: BusinessProfile | null;
}

export const LocationAndContact: React.FC<LocationAndContactProps> = ({ business }) => {
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [department, setDepartment] = useState<string>('General Inquiry / Reception');
  const [message, setMessage] = useState<string>('');
  const [isEmergencyCallback, setIsEmergencyCallback] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const phoneNum = business?.contact.phone || '+91 98807 62646';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!name.trim() || !phone.trim() || !message.trim()) {
      setErrorMsg('Please fill in your name, mobile number, and inquiry message.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.sendContact({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        department,
        message: message.trim(),
        isEmergencyCallback
      });
      setSuccessMsg(res.message);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
      setIsEmergencyCallback(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const insuranceProviders = [
    'CGHS', 'ESIS', 'Star Health', 'ICICI Lombard', 'HDFC ERGO',
    'Bajaj Allianz', 'New India Assurance', 'National Insurance',
    'United India Insurance', 'Reliance General', 'Tata AIG', 'Cashless Facility Available'
  ];

  return (
    <section id="contact" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-bold tracking-widest text-secondary-600 uppercase">
            Location &amp; 24/7 Access
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
            Visit Tapasya Multi-Speciality Hospital in Laggere
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Centrally situated on 50 Feet Main Road next to Grace Public School, Laggere, Bengaluru, Karnataka
            with dedicated ambulance drop-off, casualty triage, and wheelchair-accessible facilities.
          </p>
        </div>

        {/* Insurance / Cashless Section */}
        <div className="mb-12 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary-50 text-secondary-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Insurance &amp; Cashless Facility</h3>
              <p className="text-xs text-slate-500">We accept major health insurance providers with cashless treatment options.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {insuranceProviders.map((provider, i) => (
              <span
                key={i}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                  provider === 'Cashless Facility Available'
                    ? 'bg-secondary-50 text-secondary-700 border-secondary-200 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {provider === 'Cashless Facility Available' && <ShieldCheck className="w-3 h-3 inline mr-1" />}
                {provider}
              </span>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            For insurance and TPA queries, please contact our reception desk at {phoneNum}.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Hospital Contact Details & Timings */}
          <div className="lg:col-span-6 space-y-6">
            {/* Address Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">Hospital Address</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    No. 2, Suggappa Layout, Narasimhaswamy Nagar,
                    <br />
                    Next to Grace Public School, 50 Feet Main Road,
                    <br />
                    Laggere, Bengaluru, Karnataka 560058
                  </p>
                  <p className="text-[11px] text-slate-400">
                    GPS Coordinates: 13.0104892° N, 77.5237789° E
                  </p>
                  <div className="pt-3">
                    <a
                      href="https://maps.app.goo.gl/EcYFQsPjZDsa5Ymj9"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 underline"
                    >
                      <span>Open Live Route on Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Map Embed */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-64">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.0!2d77.5237789!3d13.0104892!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDA2JzM3LjgiTiA3NcKwMzEnMjUuNiJF!5e0!3m2!1sen!2sin!4v1700000000000"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Tapasya Hospital Location Map"
              />
            </div>

            {/* Operating Hours Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Operating Hours</h4>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Open 24/7 (Emergency)
                    </span>
                  </div>
                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Casualty &amp; Emergency:</span>
                      <span className="font-bold text-slate-900">24 Hours / 7 Days</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-600">Dialysis Unit:</span>
                      <span className="font-bold text-slate-900">24 Hours (Scheduled &amp; Emergency)</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-600">In-house Pharmacy:</span>
                      <span className="font-bold text-slate-900">24x7 Open</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-600">OPD (Mon - Sat):</span>
                      <span className="font-bold text-primary-700">08:00 AM – 08:30 PM</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-600">OPD (Sunday):</span>
                      <span className="font-bold text-primary-700">08:30 AM – 04:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Phone Assistance */}
            <div className="bg-primary-500 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-semibold text-primary-200">24/7 Helpline</span>
                <div className="text-xl font-extrabold mt-0.5">{phoneNum}</div>
                <p className="text-xs text-primary-100 mt-1">Reception, Dialysis &amp; Casualty Ambulance</p>
              </div>
              <a
                href={`tel:${phoneNum.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary-500 hover:bg-secondary-400 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 min-h-[44px]"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>
            </div>
          </div>

          {/* Right Column: Contact & Callback Form */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h4 className="text-lg font-bold text-slate-900">Send an Inquiry or Request Callback</h4>
            <p className="text-xs text-slate-500 mt-1">
              Have questions about dialysis slots, surgery consultations, or health services? Send a message
              to our reception team.
            </p>

            {successMsg && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 p-3.5 rounded-xl bg-emergency-50 border border-emergency-200 text-emergency-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-emergency-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-emergency-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Anand Murthy"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone <span className="text-emergency-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="98807 62646"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department / Subject
                </label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
                >
                  <option value="General Inquiry / Reception">General Inquiry / Reception</option>
                  <option value="Dialysis & Nephrology Unit">Dialysis &amp; Nephrology Unit (Dr. Pramod)</option>
                  <option value="General & Laparoscopic Surgery">General &amp; Laparoscopic Surgery</option>
                  <option value="Obstetrics & Gynaecology">Obstetrics &amp; Gynaecology</option>
                  <option value="Insurance & TPA Query">Insurance &amp; TPA Query</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Message or Medical Question <span className="text-emergency-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your inquiry or question..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <input
                  type="checkbox"
                  id="urgent-cb"
                  checked={isEmergencyCallback}
                  onChange={e => setIsEmergencyCallback(e.target.checked)}
                  className="rounded text-emergency-500 focus:ring-emergency-500"
                />
                <label htmlFor="urgent-cb" className="cursor-pointer text-[11px] font-medium text-slate-700">
                  Request urgent telephone callback from duty doctor
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Inquiry...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Inquiry to Hospital</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
