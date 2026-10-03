import React, { useState } from 'react';
import { MapPin, Phone, Clock, ExternalLink, Send, CheckCircle2, AlertCircle } from 'lucide-react';
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

  return (
    <section id="contact" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-bold tracking-widest text-teal-700 uppercase">
            Location &amp; 24/7 Access
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
            Visit Tapasya Multi-Speciality Hospital in Laggere
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Centrally situated on 50 Feet Main Road next to Grace Public School, Laggere, Bengaluru, Karnataka with dedicated ambulance drop-off, casualty triage, and wheelchair-accessible facilities.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Hospital Contact Details & Timings */}
          <div className="lg:col-span-6 space-y-6">
            {/* Address Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
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
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 underline"
                    >
                      <span>Open Live Route on Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Hours Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
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
                      <span className="text-slate-600">OPD Consultations (Mon - Sat):</span>
                      <span className="font-bold text-teal-800">08:00 AM – 08:30 PM</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-600">OPD Consultations (Sunday):</span>
                      <span className="font-bold text-teal-800">08:30 AM – 04:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Phone Assistance */}
            <div className="bg-teal-900 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-semibold text-teal-300">24/7 Helpline</span>
                <div className="text-xl font-extrabold mt-0.5">{phoneNum}</div>
                <p className="text-xs text-teal-200 mt-1">Reception, Dialysis &amp; Casualty Ambulance</p>
              </div>
              <a
                href={`tel:${phoneNum.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
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
              Have questions about dialysis slots, surgery consultations, or health services? Send a message to our reception team.
            </p>

            {successMsg && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Anand Murthy"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="98807 62646"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
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
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                >
                  <option value="General Inquiry / Reception">General Inquiry / Reception</option>
                  <option value="Dialysis & Nephrology Unit">Dialysis &amp; Nephrology Unit (Dr. Pramod)</option>
                  <option value="General & Laparoscopic Surgery">General &amp; Laparoscopic Surgery</option>
                  <option value="Male Breast Reduction (Gynecomastia)">Male Breast Reduction (Gynecomastia)</option>
                  <option value="Obstetrics & Gynaecology">Obstetrics &amp; Gynaecology</option>
                  <option value="Paediatrics & Child Health">Paediatrics &amp; Child Health</option>
                  <option value="Specialized Blood Disorders (Fanconi / Platelets)">Specialized Blood Disorders (Fanconi / Platelets)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Message or Medical Question <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your inquiry or question..."
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <input
                  type="checkbox"
                  id="urgent-cb"
                  checked={isEmergencyCallback}
                  onChange={e => setIsEmergencyCallback(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="urgent-cb" className="cursor-pointer text-[11px] font-medium text-slate-700">
                  Request urgent telephone callback from duty doctor
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Inquiry...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
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
