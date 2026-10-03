import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  LogOut,
  RefreshCw,
  Check,
  Layers,
  Database,
  ExternalLink,
  Copy,
  Stethoscope,
  UserCheck,
  Users,
  Search
} from 'lucide-react';
import type { Appointment, AppointmentStatus, ServiceItem, BlockedPeriod, DoctorProfile } from '../types';
import { api, type AdminStatsResponse } from '../api';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshPublicData?: () => void;
}

function normalizeStatusClient(raw: unknown): AppointmentStatus {
  const s = String(raw ?? 'confirmed').trim().toLowerCase();
  if (s === 'confirmed' || s === 'confirm' || s === 'approved') return 'confirmed';
  if (s === 'pending' || s === 'awaiting' || s === 'pending_review' || s === 'review') return 'pending';
  if (s === 'completed' || s === 'complete' || s === 'done' || s === 'mark_done' || s === 'marked_done') return 'completed';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancel') return 'cancelled';
  if (s === 'no_show' || s === 'noshow') return 'no_show';
  return 'confirmed';
}

function getHospitalLocalTodayAndSlot(): { todayStr: string; defaultFutureSlot: string } {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const yyyy = ist.getFullYear();
  const mm = String(ist.getMonth() + 1).padStart(2, '0');
  const dd = String(ist.getDate()).padStart(2, '0');

  // Default walk-in time to 1 hour ahead (rounded to 30m) or 10:00 if earlier
  let nextHour = ist.getHours() + 1;
  if (nextHour < 9) nextHour = 10;
  if (nextHour > 23) nextHour = 23;
  const slotHH = String(nextHour).padStart(2, '0');
  return {
    todayStr: `${yyyy}-${mm}-${dd}`,
    defaultFutureSlot: `${slotHH}:00`
  };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onRefreshPublicData
}) => {
  const [token, setToken] = useState<string>(() => localStorage.getItem('tapasya_admin_token') || '');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loggingIn, setLoggingIn] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'appointments' | 'manual-booking' | 'doctors' | 'services' | 'blocked' | 'supabase'>('appointments');

  // Supabase Integration State
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [checkingSupabase, setCheckingSupabase] = useState<boolean>(false);
  const [syncingSupabase, setSyncingSupabase] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Doctors Directory State
  const [doctorsList, setDoctorsList] = useState<DoctorProfile[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState<boolean>(false);
  const [doctorStatusFilter, setDoctorStatusFilter] = useState<'all' | 'confirmed' | 'awaiting_confirmation'>('all');
  const [doctorSearchQuery, setDoctorSearchQuery] = useState<string>('');
  const [editingDoctor, setEditingDoctor] = useState<DoctorProfile | null>(null);
  const [isAddingDoctor, setIsAddingDoctor] = useState<boolean>(false);
  const [newDocName, setNewDocName] = useState<string>('');
  const [newDocDept, setNewDocDept] = useState<string>('');
  const [newDocSpecialty, setNewDocSpecialty] = useState<string>('');
  const [newDocStatus, setNewDocStatus] = useState<'confirmed' | 'awaiting_confirmation'>('awaiting_confirmation');
  const [newDocNotes, setNewDocNotes] = useState<string>('');
  const [doctorActionMsg, setDoctorActionMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Appointments & Filtering State
  // Default to 'active' so the main active appointment list displays confirmed & pending appointments,
  // excluding completed and cancelled records.
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptsLoading, setApptsLoading] = useState<boolean>(false);
  const [apptsError, setApptsError] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});

  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Stats State (independent of selected status filter)
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);

  // Services State
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editFee, setEditFee] = useState<string>('');
  const [editFeeVerified, setEditFeeVerified] = useState<boolean>(false);
  const [editDuration, setEditDuration] = useState<number>(30);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  // Blocked Periods State
  const [blockedList, setBlockedList] = useState<BlockedPeriod[]>([]);
  const [blockTitle, setBlockTitle] = useState<string>('');
  const [blockDate, setBlockDate] = useState<string>('');
  const [blockReason, setBlockReason] = useState<string>('');

  // Manual Booking Form State
  const [manualName, setManualName] = useState<string>('');
  const [manualPhone, setManualPhone] = useState<string>('');
  const [manualServiceId, setManualServiceId] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(() => getHospitalLocalTodayAndSlot().todayStr);
  const [manualTime, setManualTime] = useState<string>(() => getHospitalLocalTodayAndSlot().defaultFutureSlot);
  const [manualStatus, setManualStatus] = useState<'confirmed' | 'pending'>('confirmed');
  const [manualNotes, setManualNotes] = useState<string>('Walk-in reception registration');
  const [manualSuccess, setManualSuccess] = useState<string>('');
  const [manualError, setManualError] = useState<string>('');
  const [manualSubmitting, setManualSubmitting] = useState<boolean>(false);

  const fetchSeqRef = useRef<number>(0);

  // Load initial admin metadata when authenticated or modal opens
  useEffect(() => {
    if (token && isOpen) {
      loadInitialAdminResources();
    }
  }, [token, isOpen]);

  // Immediately reload appointments whenever statusFilter or dateFilter changes
  useEffect(() => {
    if (token && isOpen) {
      fetchFilteredAppointments(statusFilter, dateFilter);
    }
  }, [token, isOpen, statusFilter, dateFilter]);

  const loadInitialAdminResources = async () => {
    try {
      const [statsData, blockedData, servicesData, doctorsData] = await Promise.all([
        api.adminGetStats(token),
        api.adminGetBlocked(token),
        api.getServices(),
        api.adminGetDoctors(token).catch(() => [])
      ]);
      setStats(statsData);
      setBlockedList(blockedData);
      setServices(servicesData);
      setDoctorsList(doctorsData);
      if (!manualServiceId && servicesData.length > 0) {
        setManualServiceId(servicesData[0].id);
      }
      checkSupabaseStatus();
    } catch (err: any) {
      console.error('Error loading admin metadata:', err);
      if (err.message?.includes('credentials') || err.message?.includes('Authorization')) {
        handleLogout();
      }
    }
  };

  const fetchFilteredAppointments = async (targetStatus = statusFilter, targetDate = dateFilter) => {
    const seq = ++fetchSeqRef.current;
    setApptsLoading(true);
    setApptsError('');
    try {
      const [apptsData, statsData] = await Promise.all([
        api.adminGetAppointments(token, {
          status: targetStatus,
          date: targetDate || undefined
        }),
        api.adminGetStats(token)
      ]);
      if (seq !== fetchSeqRef.current) return; // Prevent stale response race condition
      setAppointments(apptsData);
      setStats(statsData);
    } catch (err: any) {
      if (seq !== fetchSeqRef.current) return;
      console.error('Error loading appointments:', err);
      setApptsError(err.message || 'Failed to load appointments from Supabase.');
      if (err.message?.includes('credentials') || err.message?.includes('Authorization')) {
        handleLogout();
      }
    } finally {
      if (seq === fetchSeqRef.current) {
        setApptsLoading(false);
      }
    }
  };

  const loadAllAdminData = async () => {
    await Promise.all([
      fetchFilteredAppointments(statusFilter, dateFilter),
      loadInitialAdminResources()
    ]);
  };

  // Derive visible appointments with normalized status, date, and search filters
  const visibleAppointments = useMemo(() => {
    const cleanFilter = statusFilter.trim().toLowerCase();
    const cleanDate = dateFilter.trim();
    const cleanSearch = searchFilter.trim().toLowerCase();

    return appointments.filter(apt => {
      const st = normalizeStatusClient(apt.status);

      // 1. Status filter
      if (cleanFilter === 'active') {
        if (st !== 'confirmed' && st !== 'pending') return false;
      } else if (cleanFilter !== 'all') {
        if (st !== cleanFilter) return false;
      }

      // 2. Date filter
      if (cleanDate && apt.date !== cleanDate) {
        return false;
      }

      // 3. Search filter
      if (cleanSearch) {
        const matches =
          apt.patientName.toLowerCase().includes(cleanSearch) ||
          apt.patientPhone.toLowerCase().includes(cleanSearch) ||
          apt.referenceNumber.toLowerCase().includes(cleanSearch) ||
          apt.serviceName.toLowerCase().includes(cleanSearch) ||
          (apt.doctorName && apt.doctorName.toLowerCase().includes(cleanSearch));
        if (!matches) return false;
      }

      return true;
    });
  }, [appointments, statusFilter, dateFilter, searchFilter]);

  const checkSupabaseStatus = async () => {
    setCheckingSupabase(true);
    try {
      const res = await api.adminGetSupabaseStatus(token);
      setSupabaseStatus(res);
    } catch (err: any) {
      console.error('Failed to get Supabase status:', err);
    } finally {
      setCheckingSupabase(false);
    }
  };

  const triggerSupabaseSync = async () => {
    setSyncingSupabase(true);
    setSyncResult(null);
    try {
      const res = await api.adminSyncSupabase(token);
      setSyncResult(res);
      checkSupabaseStatus();
      await fetchFilteredAppointments(statusFilter, dateFilter);
    } catch (err: any) {
      setSyncResult({ error: err.message });
    } finally {
      setSyncingSupabase(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await api.adminLogin(passwordInput);
      setToken(res.token);
      localStorage.setItem('tapasya_admin_token', res.token);
      setPasswordInput('');
    } catch (err: any) {
      setLoginError(err.message || 'Incorrect password.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('tapasya_admin_token');
  };

  const handleStatusUpdate = async (apt: Appointment, newStatus: AppointmentStatus) => {
    // Prevent duplicate clicks while update is processing
    if (updatingIds[apt.id]) return;

    setUpdatingIds(prev => ({ ...prev, [apt.id]: true }));
    setActionFeedback(null);
    setApptsError('');

    try {
      const updatedApt = await api.adminUpdateAppointmentStatus(
        token,
        apt.id,
        newStatus,
        `Status updated to ${newStatus} by administrator`,
        apt.referenceNumber
      );

      // Update local state immediately after database update succeeds
      const cleanNewStatus = normalizeStatusClient(updatedApt.status);
      setAppointments(prev =>
        prev.map(item =>
          item.id === apt.id || item.referenceNumber === apt.referenceNumber
            ? { ...item, ...updatedApt, status: cleanNewStatus }
            : item
        )
      );

      setActionFeedback({
        type: 'success',
        message: `Appointment ${apt.referenceNumber} (${apt.patientName}) marked as ${cleanNewStatus.toUpperCase()}.`
      });

      // Refresh authoritative list & dashboard statistics from Supabase
      await fetchFilteredAppointments(statusFilter, dateFilter);
      if (onRefreshPublicData) onRefreshPublicData();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || `Failed to update appointment ${apt.referenceNumber}. Please try again.`
      });
    } finally {
      setUpdatingIds(prev => {
        const next = { ...prev };
        delete next[apt.id];
        return next;
      });
    }
  };

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSubmitting) return;
    setManualError('');
    setManualSuccess('');
    setManualSubmitting(true);
    try {
      const newApt = await api.adminCreateManualAppointment(token, {
        serviceId: manualServiceId,
        date: manualDate,
        timeSlot: manualTime,
        patientName: manualName,
        patientPhone: manualPhone,
        notes: manualNotes,
        status: manualStatus
      });
      setManualSuccess(`Appointment registered in Supabase! Reference: ${newApt.referenceNumber}`);
      setManualName('');
      setManualPhone('');
      await fetchFilteredAppointments(statusFilter, dateFilter);
      if (onRefreshPublicData) onRefreshPublicData();
    } catch (err: any) {
      setManualError(err.message || 'Failed to create manual appointment.');
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleAddBlockedPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTitle || !blockDate) return;
    try {
      await api.adminAddBlocked(token, {
        title: blockTitle,
        date: blockDate,
        reason: blockReason || blockTitle
      });
      setBlockTitle('');
      setBlockDate('');
      setBlockReason('');
      await loadInitialAdminResources();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to add blocked period' });
    }
  };

  const handleDeleteBlockedPeriod = async (id: string) => {
    try {
      await api.adminDeleteBlocked(token, id);
      await loadInitialAdminResources();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to delete blocked date' });
    }
  };

  const handleSaveServiceEdit = async (svc: ServiceItem) => {
    try {
      const parsedFee = editFee.trim() ? Number(editFee) : undefined;
      const isVerified = Boolean(parsedFee && parsedFee > 0 && editFeeVerified);
      await api.adminUpdateService(token, svc.id, {
        consultationFee: isVerified ? parsedFee : undefined,
        feeVerified: isVerified,
        durationMinutes: editDuration,
        isActive: editIsActive
      });
      setEditingServiceId(null);
      await loadInitialAdminResources();
      if (onRefreshPublicData) onRefreshPublicData();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to update service' });
    }
  };

  const fetchDoctors = async () => {
    if (!token) return;
    setDoctorsLoading(true);
    try {
      const data = await api.adminGetDoctors(token);
      setDoctorsList(data);
    } catch (err: any) {
      console.error('Error fetching admin doctors:', err);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const handleConfirmDoctor = async (doc: DoctorProfile) => {
    try {
      await api.adminUpdateDoctor(token, doc.id, { status: 'confirmed' });
      setDoctorActionMsg({
        type: 'success',
        message: `${doc.name} confirmed and published to the public directory.`
      });
      await fetchDoctors();
      if (onRefreshPublicData) onRefreshPublicData();
    } catch (err: any) {
      setDoctorActionMsg({ type: 'error', message: err.message || 'Failed to confirm doctor.' });
    }
  };

  const handleSaveDoctorEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    try {
      await api.adminUpdateDoctor(token, editingDoctor.id, {
        name: editingDoctor.name.trim(),
        department: editingDoctor.department.trim(),
        specialty: editingDoctor.specialty.trim() || editingDoctor.department.trim(),
        status: editingDoctor.status,
        notes: editingDoctor.notes?.trim()
      });
      setDoctorActionMsg({ type: 'success', message: `${editingDoctor.name} updated successfully.` });
      setEditingDoctor(null);
      await fetchDoctors();
      if (onRefreshPublicData) onRefreshPublicData();
    } catch (err: any) {
      setDoctorActionMsg({ type: 'error', message: err.message || 'Failed to update doctor.' });
    }
  };

  const handleDeleteDoctor = async (doc: DoctorProfile) => {
    if (!window.confirm(`Are you sure you want to remove ${doc.name} from the directory?`)) return;
    try {
      await api.adminDeleteDoctor(token, doc.id);
      setDoctorActionMsg({ type: 'success', message: `${doc.name} removed from directory.` });
      await fetchDoctors();
      if (onRefreshPublicData) onRefreshPublicData();
    } catch (err: any) {
      setDoctorActionMsg({ type: 'error', message: err.message || 'Failed to delete doctor.' });
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocDept.trim()) return;
    try {
      await api.adminAddDoctor(token, {
        name: newDocName.trim(),
        department: newDocDept.trim(),
        specialty: newDocSpecialty.trim() || newDocDept.trim(),
        status: newDocStatus,
        notes: newDocNotes.trim()
      });
      setDoctorActionMsg({ type: 'success', message: `${newDocName} added to directory.` });
      setIsAddingDoctor(false);
      setNewDocName('');
      setNewDocDept('');
      setNewDocSpecialty('');
      setNewDocStatus('awaiting_confirmation');
      setNewDocNotes('');
      await fetchDoctors();
      if (onRefreshPublicData) onRefreshPublicData();
    } catch (err: any) {
      setDoctorActionMsg({ type: 'error', message: err.message || 'Failed to add doctor.' });
    }
  };

  const awaitingConfirmationCount = useMemo(() => {
    return doctorsList.filter(d => d.status === 'awaiting_confirmation').length;
  }, [doctorsList]);

  const filteredDoctorsList = useMemo(() => {
    let result = doctorsList;
    if (doctorStatusFilter === 'confirmed') {
      result = result.filter(d => d.status === 'confirmed');
    } else if (doctorStatusFilter === 'awaiting_confirmation') {
      result = result.filter(d => d.status === 'awaiting_confirmation');
    }

    if (doctorSearchQuery.trim()) {
      const q = doctorSearchQuery.trim().toLowerCase();
      result = result.filter(
        d =>
          d.name.toLowerCase().includes(q) ||
          d.department.toLowerCase().includes(q) ||
          (d.specialty && d.specialty.toLowerCase().includes(q)) ||
          (d.notes && d.notes.toLowerCase().includes(q))
      );
    }
    return result;
  }, [doctorsList, doctorStatusFilter, doctorSearchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden relative">
        {/* Top Navbar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Tapasya Multi-Speciality Hospital</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-900/80 text-teal-300 border border-teal-700/60 font-semibold">
                  Admin Console
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Outpatient Scheduling &amp; Clinical Operations • Laggere, Bengaluru</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {token && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-xs text-slate-400 hover:text-white flex items-center gap-1.5 rounded-lg hover:bg-slate-800"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Not Authenticated: Password Screen */}
        {!token && (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-900">
            <div className="max-w-sm w-full bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-teal-950 text-teal-400 flex items-center justify-center mx-auto mb-3 border border-teal-800">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Hospital Staff Authentication</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter administrative key to manage patient appointments and schedules.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Staff Key / Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Default key: <code className="text-teal-400 font-mono">admin@tapasya2026</code>
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-all shadow-md shadow-teal-700/20"
                >
                  {loggingIn ? 'Authenticating...' : 'Enter Admin Console'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Authenticated Dashboard View */}
        {token && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-900">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-56 bg-slate-950 border-r border-slate-800 p-3 space-y-1 shrink-0 overflow-x-auto md:overflow-visible flex md:flex-col">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`flex-1 md:flex-none flex items-center gap-2 px-3 py-2 text-xs rounded-xl transition-colors font-medium ${
                  activeTab === 'appointments'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Appointments</span>
              </button>
              <button
                onClick={() => setActiveTab('manual-booking')}
                className={`flex-1 md:flex-none flex items-center gap-2 px-3 py-2 text-xs rounded-xl transition-colors font-medium ${
                  activeTab === 'manual-booking'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Walk-in / Phone</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('doctors');
                  fetchDoctors();
                }}
                className={`flex-1 md:flex-none flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors font-medium ${
                  activeTab === 'doctors'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  <span>Doctor Directory</span>
                </div>
                {awaitingConfirmationCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                    {awaitingConfirmationCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex-1 md:flex-none flex items-center gap-2 px-3 py-2 text-xs rounded-xl transition-colors font-medium ${
                  activeTab === 'services'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Services &amp; Fees</span>
              </button>
              <button
                onClick={() => setActiveTab('blocked')}
                className={`flex-1 md:flex-none flex items-center gap-2 px-3 py-2 text-xs rounded-xl transition-colors font-medium ${
                  activeTab === 'blocked'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Blocked Dates</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('supabase');
                  checkSupabaseStatus();
                }}
                className={`flex-1 md:flex-none flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors font-medium ${
                  activeTab === 'supabase'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Supabase Backend</span>
                </div>
                {supabaseStatus?.tableExists ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected & Ready" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400" title="Setup Required" />
                )}
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 bg-slate-900">
              {/* Top Operational Stats (Calculated from actual Supabase database in Asia/Kolkata timezone) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Today's Appointments</span>
                  <div className="text-2xl font-extrabold text-teal-400 mt-0.5" data-testid="stat-today">
                    {stats ? stats.todayCount : 0}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Scheduled today ({stats?.todayDate || getHospitalLocalTodayAndSlot().todayStr})
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Upcoming Active</span>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-0.5" data-testid="stat-upcoming">
                    {stats ? stats.upcomingCount : 0}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Future confirmed &amp; pending
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pending Review</span>
                  <div className="text-2xl font-extrabold text-amber-400 mt-0.5" data-testid="stat-pending">
                    {stats ? stats.pendingCount : 0}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Awaiting approval
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Bookings</span>
                  <div className="text-2xl font-extrabold text-slate-200 mt-0.5" data-testid="stat-total">
                    {stats ? stats.totalCount : 0}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    All retained records
                  </span>
                </div>
              </div>

              {/* TAB 1: Appointments List */}
              {activeTab === 'appointments' && (
                <div className="space-y-4">
                  {/* Filter Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={statusFilter}
                        onChange={e => {
                          setActionFeedback(null);
                          setStatusFilter(e.target.value);
                        }}
                        aria-label="Appointment Status Filter"
                        data-testid="status-filter-select"
                        className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="active">Active (Confirmed &amp; Pending)</option>
                        <option value="all">All Statuses</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <input
                          type="date"
                          value={dateFilter}
                          onChange={e => setDateFilter(e.target.value)}
                          aria-label="Filter by appointment date"
                          className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        {dateFilter && (
                          <button
                            type="button"
                            onClick={() => setDateFilter('')}
                            className="px-2 py-1.5 text-[11px] text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl"
                            title="Clear date filter"
                          >
                            Clear Date
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search patient, phone, ref..."
                        value={searchFilter}
                        onChange={e => setSearchFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-56"
                      />
                      <button
                        type="button"
                        onClick={loadAllAdminData}
                        disabled={apptsLoading}
                        className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl"
                        title="Refresh appointments and stats"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${apptsLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Status Feedback / Error Banner */}
                  {actionFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
                        actionFeedback.type === 'error'
                          ? 'bg-rose-950/70 border border-rose-800 text-rose-300'
                          : 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {actionFeedback.type === 'error' ? (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        )}
                        <span>{actionFeedback.message}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActionFeedback(null)}
                        className="text-[11px] opacity-75 hover:opacity-100"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {apptsError && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{apptsError}</span>
                    </div>
                  )}

                  {/* Appointments List Content */}
                  {apptsLoading ? (
                    <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading appointments...</span>
                    </div>
                  ) : visibleAppointments.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 bg-slate-950 rounded-2xl border border-slate-800">
                      No appointments found for this status.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visibleAppointments.map(apt => {
                        const cleanStatus = normalizeStatusClient(apt.status);
                        const isUpdating = Boolean(updatingIds[apt.id]);

                        return (
                          <div
                            key={apt.id}
                            data-testid={`appointment-card-${apt.referenceNumber}`}
                            className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-teal-400">
                                  {apt.referenceNumber}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                    cleanStatus === 'confirmed'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : cleanStatus === 'cancelled'
                                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                      : cleanStatus === 'completed'
                                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                                  }`}
                                >
                                  {cleanStatus}
                                </span>
                              </div>
                              <div className="text-sm font-bold text-white flex items-center gap-3">
                                <span>{apt.patientName}</span>
                                <span className="text-xs font-mono text-slate-400">+91 {apt.patientPhone}</span>
                              </div>
                              <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                                <span>{apt.serviceName}</span>
                                <span>•</span>
                                <span>{apt.doctorName}</span>
                                <span>•</span>
                                <span className="text-teal-300 font-semibold">{apt.date} at {apt.timeSlot}</span>
                              </div>
                              {apt.notes && (
                                <p className="text-[11px] text-slate-400 italic">"{apt.notes}"</p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                              {cleanStatus === 'pending' && (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleStatusUpdate(apt, 'confirmed')}
                                  className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                                >
                                  {isUpdating ? 'Updating...' : 'Confirm'}
                                </button>
                              )}
                              {(cleanStatus === 'confirmed' || cleanStatus === 'pending') && (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleStatusUpdate(apt, 'completed')}
                                  data-testid={`mark-done-${apt.referenceNumber}`}
                                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg transition-colors border border-slate-700"
                                >
                                  {isUpdating ? 'Saving...' : 'Mark Done'}
                                </button>
                              )}
                              {cleanStatus !== 'cancelled' && cleanStatus !== 'completed' && (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleStatusUpdate(apt, 'cancelled')}
                                  className="px-2 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 disabled:opacity-50 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Walk-in / Phone Booking */}
              {activeTab === 'manual-booking' && (
                <div className="max-w-xl mx-auto w-full bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="text-base font-bold text-white">Manual Walk-in / Phone Reservation</h4>
                  <p className="text-xs text-slate-400">
                    Directly reserve a slot in the hospital outpatient registry for arriving patients.
                  </p>

                  {manualSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs">
                      {manualSuccess}
                    </div>
                  )}
                  {manualError && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                      {manualError}
                    </div>
                  )}

                  <form onSubmit={handleCreateManualBooking} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Patient Name</label>
                      <input
                        type="text"
                        required
                        value={manualName}
                        onChange={e => setManualName(e.target.value)}
                        placeholder="Patient Full Name"
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        value={manualPhone}
                        onChange={e => setManualPhone(e.target.value)}
                        placeholder="10-digit phone"
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Service</label>
                        <select
                          value={manualServiceId}
                          onChange={e => setManualServiceId(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                        >
                          {services.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.feeVerified && s.consultationFee ? `(₹${s.consultationFee})` : '(Fee: Contact hospital / Unverified)'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Status</label>
                        <select
                          value={manualStatus}
                          onChange={e => setManualStatus(e.target.value as 'confirmed' | 'pending')}
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="pending">Pending Review</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                        <input
                          type="date"
                          required
                          value={manualDate}
                          onChange={e => setManualDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Time Slot (HH:MM)</label>
                        <input
                          type="text"
                          required
                          value={manualTime}
                          onChange={e => setManualTime(e.target.value)}
                          placeholder="10:30"
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Walk-in Details</label>
                      <textarea
                        rows={2}
                        value={manualNotes}
                        onChange={e => setManualNotes(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={manualSubmitting}
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded-xl transition-all"
                    >
                      {manualSubmitting ? 'Scheduling...' : 'Schedule Walk-in Appointment'}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB: Doctor Directory */}
              {activeTab === 'doctors' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-teal-400" />
                        <span>Doctor Directory &amp; Hospital Signboard Verification</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Manage doctor records. Entries marked as "Awaiting hospital confirmation" remain hidden from the public website until confirmed.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={fetchDoctors}
                        disabled={doctorsLoading}
                        className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${doctorsLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingDoctor(true);
                          setEditingDoctor(null);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Doctor</span>
                      </button>
                    </div>
                  </div>

                  {doctorActionMsg && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        doctorActionMsg.type === 'success'
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/60 border-rose-800 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {doctorActionMsg.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        )}
                        <span>{doctorActionMsg.message}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDoctorActionMsg(null)}
                        className="text-slate-400 hover:text-white text-xs ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDoctorStatusFilter('all')}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors font-medium ${
                          doctorStatusFilter === 'all'
                            ? 'bg-teal-600 text-white font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        All Doctors ({doctorsList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDoctorStatusFilter('confirmed')}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors font-medium ${
                          doctorStatusFilter === 'confirmed'
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        Confirmed &amp; Public ({doctorsList.filter(d => d.status === 'confirmed').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDoctorStatusFilter('awaiting_confirmation')}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors font-medium flex items-center gap-1.5 ${
                          doctorStatusFilter === 'awaiting_confirmation'
                            ? 'bg-amber-600 text-white font-bold'
                            : 'bg-slate-900 text-amber-400 hover:text-amber-300'
                        }`}
                      >
                        <span>Awaiting Confirmation</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                          {awaitingConfirmationCount}
                        </span>
                      </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search doctor or dept..."
                        value={doctorSearchQuery}
                        onChange={e => setDoctorSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Add Doctor Form */}
                  {isAddingDoctor && (
                    <div className="bg-slate-950 p-5 rounded-2xl border border-teal-500/40 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-teal-400">
                          Add Doctor to Hospital Directory
                        </h5>
                        <button
                          type="button"
                          onClick={() => setIsAddingDoctor(false)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                      <form onSubmit={handleCreateDoctor} className="space-y-3">
                        <div className="grid sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Doctor Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Dr. Pramod Shankar"
                              value={newDocName}
                              onChange={e => setNewDocName(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Department *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Obstetrics & Gynaecology"
                              value={newDocDept}
                              onChange={e => setNewDocDept(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Specialty Label
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Obstetrics & Gynaecology"
                              value={newDocSpecialty}
                              onChange={e => setNewDocSpecialty(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Status
                            </label>
                            <select
                              value={newDocStatus}
                              onChange={e => setNewDocStatus(e.target.value as any)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                            >
                              <option value="awaiting_confirmation">
                                Awaiting hospital confirmation (Hidden from public directory)
                              </option>
                              <option value="confirmed">
                                Confirmed &amp; Published (Visible on website)
                              </option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Notes / Source Reference
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Hospital signboard row 4"
                              value={newDocNotes}
                              onChange={e => setNewDocNotes(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsAddingDoctor(false)}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl"
                          >
                            Save Doctor Entry
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Edit Doctor Form */}
                  {editingDoctor && (
                    <div className="bg-slate-950 p-5 rounded-2xl border border-teal-500/40 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-teal-400">
                          Edit Doctor: {editingDoctor.name}
                        </h5>
                        <button
                          type="button"
                          onClick={() => setEditingDoctor(null)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                      <form onSubmit={handleSaveDoctorEdit} className="space-y-3">
                        <div className="grid sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Doctor Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={editingDoctor.name}
                              onChange={e => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Department *
                            </label>
                            <input
                              type="text"
                              required
                              value={editingDoctor.department}
                              onChange={e => setEditingDoctor({ ...editingDoctor, department: e.target.value })}
                              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Specialty Label
                            </label>
                            <input
                              type="text"
                              value={editingDoctor.specialty || ''}
                              onChange={e => setEditingDoctor({ ...editingDoctor, specialty: e.target.value })}
                              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Publication Status
                            </label>
                            <select
                              value={editingDoctor.status}
                              onChange={e => setEditingDoctor({ ...editingDoctor, status: e.target.value as any })}
                              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                            >
                              <option value="awaiting_confirmation">
                                Awaiting hospital confirmation (Hidden from public directory)
                              </option>
                              <option value="confirmed">
                                Confirmed &amp; Published (Visible on website)
                              </option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Notes / Source Reference
                            </label>
                            <input
                              type="text"
                              value={editingDoctor.notes || ''}
                              onChange={e => setEditingDoctor({ ...editingDoctor, notes: e.target.value })}
                              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingDoctor(null)}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl"
                          >
                            Update Doctor Entry
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Doctor List Cards */}
                  <div className="space-y-3">
                    {doctorsLoading ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        <span className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle" />
                        Loading doctor directory...
                      </div>
                    ) : filteredDoctorsList.length === 0 ? (
                      <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                        No doctors match the selected filter or search term.
                      </div>
                    ) : (
                      filteredDoctorsList.map(doc => {
                        const isConfirmed = doc.status === 'confirmed';
                        return (
                          <div
                            key={doc.id}
                            className={`p-4 rounded-2xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              isConfirmed
                                ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                : 'bg-slate-950 border-amber-900/40 hover:border-amber-700/60'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-white text-sm">{doc.name}</span>
                                {isConfirmed ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 border border-emerald-800 text-emerald-400">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Confirmed &amp; Public</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 border border-amber-800 text-amber-400">
                                    <AlertCircle className="w-3 h-3 text-amber-400" />
                                    <span>Awaiting hospital confirmation (Hidden)</span>
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500 font-mono">
                                  ID: {doc.id}
                                </span>
                              </div>

                              <div className="text-xs text-slate-400">
                                <span className="text-slate-500 font-medium">Department:</span>{' '}
                                <span className="text-teal-300 font-medium">{doc.department}</span>
                                {doc.specialty && doc.specialty !== doc.department && (
                                  <>
                                    <span className="text-slate-600 mx-1.5">•</span>
                                    <span className="text-slate-500 font-medium">Speciality:</span>{' '}
                                    <span className="text-slate-300">{doc.specialty}</span>
                                  </>
                                )}
                              </div>

                              {doc.notes && (
                                <p className="text-[11px] text-amber-300/80 bg-amber-950/30 px-2.5 py-1 rounded-lg border border-amber-900/40 inline-block">
                                  {doc.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {!isConfirmed && (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmDoctor(doc)}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                                  title="Confirm and publish to public website"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Confirm &amp; Publish</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDoctor(doc);
                                  setIsAddingDoctor(false);
                                }}
                                className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
                                title="Edit doctor details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDoctor(doc)}
                                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 bg-slate-900 rounded-lg border border-slate-800 transition-colors"
                                title="Remove doctor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Services & Durations */}
              {activeTab === 'services' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white">Hospital Services Catalogue &amp; Durations</h4>
                  <p className="text-xs text-slate-400">
                    Manage service durations and optional hospital-approved fees. Unverified fees are never displayed publicly.
                  </p>
                  <div className="space-y-3">
                    {services.map(svc => (
                      <div
                        key={svc.id}
                        className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-teal-400 font-semibold">{svc.category}</span>
                            {svc.isActive !== false ? (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                                Active
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80">
                                Disabled / Not Bookable
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-bold text-white mt-0.5">{svc.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{svc.description}</div>
                        </div>

                        {editingServiceId === svc.id ? (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 bg-slate-900/90 p-3.5 rounded-xl border border-slate-700">
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">Approved Fee (₹ Optional)</span>
                              <input
                                type="number"
                                placeholder="Unverified"
                                value={editFee}
                                onChange={e => setEditFee(e.target.value)}
                                className="w-24 px-2 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 pt-2 sm:pt-4">
                              <input
                                type="checkbox"
                                id={`verify-${svc.id}`}
                                checked={editFeeVerified}
                                onChange={e => setEditFeeVerified(e.target.checked)}
                                className="rounded text-teal-600 focus:ring-teal-500"
                              />
                              <label htmlFor={`verify-${svc.id}`} className="text-[11px] text-slate-300 cursor-pointer">
                                Verified by Admin
                              </label>
                            </div>
                            <div className="flex items-center gap-1.5 pt-2 sm:pt-4">
                              <input
                                type="checkbox"
                                id={`active-${svc.id}`}
                                checked={editIsActive}
                                onChange={e => setEditIsActive(e.target.checked)}
                                className="rounded text-teal-600 focus:ring-teal-500"
                              />
                              <label htmlFor={`active-${svc.id}`} className="text-[11px] text-slate-300 cursor-pointer">
                                Active &amp; Bookable
                              </label>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">Duration (mins)</span>
                              <input
                                type="number"
                                value={editDuration}
                                onChange={e => setEditDuration(Number(e.target.value))}
                                className="w-16 px-2 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-2 sm:pt-3">
                              <button
                                onClick={() => handleSaveServiceEdit(svc)}
                                className="px-3 py-1.5 text-xs bg-teal-600 text-white font-bold rounded-lg"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingServiceId(null)}
                                className="px-2 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              {svc.feeVerified && svc.consultationFee ? (
                                <div className="text-sm font-extrabold text-white">
                                  ₹{svc.consultationFee} <span className="text-[10px] text-teal-400 font-normal">Verified</span>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-400 font-medium">
                                  Fee: <span className="text-amber-400">Unverified (contact hospital)</span>
                                </div>
                              )}
                              <div className="text-[11px] text-slate-500">{svc.durationMinutes} mins slot</div>
                            </div>
                            <button
                              onClick={() => {
                                setEditingServiceId(svc.id);
                                setEditFee(svc.consultationFee ? String(svc.consultationFee) : '');
                                setEditFeeVerified(Boolean(svc.feeVerified));
                                setEditDuration(svc.durationMinutes);
                                setEditIsActive(svc.isActive !== false);
                              }}
                              className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800"
                              title="Edit service details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: Blocked Dates */}
              {activeTab === 'blocked' && (
                <div className="space-y-5">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Block a Date / Hospital Closure
                    </h4>
                    <form onSubmit={handleAddBlockedPeriod} className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Title / Reason (e.g. Festival Closure)"
                          value={blockTitle}
                          onChange={e => setBlockTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          required
                          value={blockDate}
                          onChange={e => setBlockDate(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white"
                        />
                      </div>
                      <div>
                        <button
                          type="submit"
                          className="w-full py-1.5 px-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl"
                        >
                          Block Date
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-slate-400">Current Blocked Dates</h5>
                    {blockedList.length === 0 ? (
                      <p className="text-xs text-slate-500">No blocked periods configured.</p>
                    ) : (
                      blockedList.map(b => (
                        <div
                          key={b.id}
                          className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white">{b.title}</span>
                            <span className="text-slate-400 ml-2">Date: {b.date}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteBlockedPeriod(b.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: Supabase Database Integration */}
              {activeTab === 'supabase' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-emerald-400" />
                      <span>Supabase PostgreSQL Backend Integration</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Connected to project <code className="text-emerald-300 font-mono">wpvbfbcsnxuqwqdgrdeq</code>. Every appointment booked on the website automatically persists to your Supabase database in real-time.
                    </p>
                  </div>

                  {/* Status Banner */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Connection Status</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {checkingSupabase ? (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span className="w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                              <span>Pinging Supabase backend...</span>
                            </div>
                          ) : supabaseStatus?.tableExists ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Connected &amp; Ready (Table public.appointments Active)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                              <AlertCircle className="w-4 h-4 text-amber-400" />
                              <span>API Connected — Table 'appointments' needs setup</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={checkSupabaseStatus}
                          disabled={checkingSupabase}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${checkingSupabase ? 'animate-spin' : ''}`} />
                          <span>Test Connection</span>
                        </button>
                        <button
                          type="button"
                          onClick={triggerSupabaseSync}
                          disabled={syncingSupabase}
                          className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm flex items-center gap-1.5"
                        >
                          {syncingSupabase ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Syncing...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Sync All Bookings</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Project Configuration Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Project ID</span>
                        <span className="font-mono font-bold text-slate-200">wpvbfbcsnxuqwqdgrdeq</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Endpoint</span>
                        <span className="font-mono text-slate-300 truncate block">https://wpvbfbcsnxuqwqdgrdeq.supabase.co</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Supabase Dashboard</span>
                        <a
                          href="https://supabase.com/dashboard/project/wpvbfbcsnxuqwqdgrdeq/editor"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Open Table Editor</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Sync Result Banner */}
                    {syncResult && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                          syncResult.errors?.length || syncResult.error
                            ? 'bg-rose-950/70 border border-rose-800 text-rose-300'
                            : 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                        }`}
                      >
                        {syncResult.errors?.length || syncResult.error ? (
                          <>
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>
                              {syncResult.tableMissing
                                ? "Table 'public.appointments' does not exist in Supabase yet. Please execute the SQL below in your Supabase SQL Editor first."
                                : syncResult.error || syncResult.errors?.[0] || 'Sync failed.'}
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>
                              Successfully synced {syncResult.synced} appointment(s) directly to your Supabase table!
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* SQL Schema Script Box */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                          Database Setup Script (SQL)
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Run this once in your Supabase SQL Editor to initialize the appointments &amp; inquiries tables with Row Level Security:
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const sqlScript = `-- Create appointments table in Supabase
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  patient_age INTEGER,
  patient_gender TEXT,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  doctor_id TEXT,
  doctor_name TEXT,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'confirmed',
  urgency TEXT DEFAULT 'routine',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public booking inserts"
  ON public.appointments FOR INSERT TO public, anon WITH CHECK (true);

CREATE POLICY "Allow public select on appointments"
  ON public.appointments FOR SELECT TO public, anon USING (true);

CREATE POLICY "Allow public update on appointments"
  ON public.appointments FOR UPDATE TO public, anon USING (true) WITH CHECK (true);`;
                          navigator.clipboard.writeText(sqlScript);
                          setCopiedSql(true);
                          setTimeout(() => setCopiedSql(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded-lg transition-colors"
                      >
                        {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
                      </button>
                    </div>

                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56">
                      <pre>{`-- 1. Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  patient_age INTEGER,
  patient_gender TEXT,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  doctor_id TEXT,
  doctor_name TEXT,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'confirmed',
  urgency TEXT DEFAULT 'routine',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security & Public Booking Policies
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts into appointments"
  ON public.appointments FOR INSERT TO public, anon WITH CHECK (true);

CREATE POLICY "Allow public select on appointments"
  ON public.appointments FOR SELECT TO public, anon USING (true);

CREATE POLICY "Allow public update on appointments"
  ON public.appointments FOR UPDATE TO public, anon USING (true) WITH CHECK (true);`}</pre>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-1 gap-2">
                      <span className="text-slate-400">
                        1. Copy SQL &rarr; 2. Open SQL Editor &rarr; 3. Click 'Run' &rarr; 4. Click 'Sync All Bookings'
                      </span>
                      <a
                        href="https://supabase.com/dashboard/project/wpvbfbcsnxuqwqdgrdeq/sql/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1"
                      >
                        <span>Open Supabase SQL Editor</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
