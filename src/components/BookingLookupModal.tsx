import React, { useState, useEffect } from 'react';
import { X, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Appointment } from '../types';
import { api } from '../api';

interface BookingLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRef?: string;
  initialPhone?: string;
}

export const BookingLookupModal: React.FC<BookingLookupModalProps> = ({
  isOpen,
  onClose,
  initialRef = '',
  initialPhone = ''
}) => {
  const [ref, setRef] = useState<string>(initialRef);
  const [phone, setPhone] = useState<string>(initialPhone);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  // Cancellation State
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelSuccess, setCancelSuccess] = useState<string>('');
  const [showCancelPrompt, setShowCancelPrompt] = useState<boolean>(false);

  useEffect(() => {
    if (initialRef) setRef(initialRef);
    if (initialPhone) setPhone(initialPhone);
    if (initialRef && initialPhone) {
      handleSearch(initialRef, initialPhone);
    }
  }, [initialRef, initialPhone]);

  if (!isOpen) return null;

  const handleSearch = async (targetRef = ref, targetPhone = phone) => {
    setError('');
    setCancelSuccess('');
    if (!targetRef.trim() || !targetPhone.trim()) {
      setError('Please provide both the Booking Reference and registered phone number.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.lookupAppointment(targetRef.trim(), targetPhone.trim());
      setAppointment(data);
    } catch (err: any) {
      setError(err.message || 'Appointment not found.');
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.cancelAppointment(appointment.id, phone, cancelReason);
      setAppointment(res.appointment);
      setCancelSuccess('Your appointment has been successfully cancelled.');
      setShowCancelPrompt(false);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Manage Your Appointment</h3>
          <p className="text-xs text-slate-500 mt-1">
            Check live status, download appointment slip, or cancel your booking.
          </p>
        </div>

        {/* Lookup Form */}
        {!appointment && (
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSearch();
            }}
            className="space-y-4"
          >
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Booking Reference Number
              </label>
              <input
                type="text"
                required
                value={ref}
                onChange={e => setRef(e.target.value.toUpperCase())}
                placeholder="e.g. TAP-261002-8812"
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Mobile Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 9880762646"
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Looking up...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Find Appointment</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Appointment Found View */}
        {appointment && (
          <div className="space-y-5">
            {cancelSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{cancelSuccess}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Status Header */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Reference</span>
                <div className="text-base font-mono font-bold text-slate-900">{appointment.referenceNumber}</div>
              </div>
              <div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                    appointment.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : appointment.status === 'cancelled'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : appointment.status === 'completed'
                      ? 'bg-slate-200 text-slate-800'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {appointment.status}
                </span>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="text-xs space-y-2.5 border-t border-b border-slate-100 py-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{appointment.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold text-slate-900">{appointment.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor / Specialist:</span>
                <span className="font-semibold text-slate-900">{appointment.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date &amp; Slot:</span>
                <span className="font-bold text-teal-700">
                  {appointment.date} at {appointment.timeSlot}
                </span>
              </div>
            </div>

            {/* Cancellation Form / Confirmation */}
            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && !showCancelPrompt && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(true)}
                  className="flex-1 py-2 px-3 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200"
                >
                  Cancel Appointment
                </button>
                <button
                  type="button"
                  onClick={() => setAppointment(null)}
                  className="py-2 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
                >
                  Search Another
                </button>
              </div>
            )}

            {showCancelPrompt && appointment.status !== 'cancelled' && (
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
                <div className="text-xs text-rose-900 font-semibold">
                  Confirm Cancellation
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Appointments can be cancelled up to 2 hours before the scheduled time slot. Please provide a reason:
                </p>
                <input
                  type="text"
                  placeholder="Reason for cancellation (optional)"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-lg text-slate-900 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                  >
                    {loading ? 'Cancelling...' : 'Yes, Cancel Appointment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelPrompt(false)}
                    className="py-2 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Keep Booking
                  </button>
                </div>
              </div>
            )}

            {(appointment.status === 'cancelled' || appointment.status === 'completed') && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAppointment(null)}
                  className="text-xs text-teal-700 hover:underline font-semibold"
                >
                  Look up another appointment &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
