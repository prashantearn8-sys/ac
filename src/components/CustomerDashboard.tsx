import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  FileText,
  Search,
  Wrench,
  LogIn,
  X,
  ArrowUpRight,
} from 'lucide-react';
import {
  AcType,
  BookingRecord,
  BookingStatus,
  MaintenanceReminderRecord,
  TimeSlotType,
  VALIDATION_RULES,
  createReminderInFirestore,
  deleteBookingInFirestore,
  deleteReminderInFirestore,
  markReminderServicedTodayInFirestore,
  rescheduleBookingInFirestore,
  updateBookingStatusInFirestore,
} from '../firebase';

interface CustomerDashboardProps {
  user: User | null;
  authReady: boolean;
  bookings: BookingRecord[];
  reminders: MaintenanceReminderRecord[];
  loadingData: boolean;
  onSignIn: () => void;
  onQuickBookUnit: (acType: AcType, unitLabel: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  user,
  authReady,
  bookings,
  reminders,
  loadingData,
  onSignIn,
  onQuickBookUnit,
}) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'reminders'>('bookings');
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reschedule modal state
  const [editingBooking, setEditingBooking] = useState<BookingRecord | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState<TimeSlotType>('09:00 AM - 11:00 AM');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  // Job sheet modal state
  const [selectedJobSheet, setSelectedJobSheet] = useState<BookingRecord | null>(null);

  // New Reminder Form state
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [unitLabel, setUnitLabel] = useState('');
  const [unitAcType, setUnitAcType] = useState<AcType>('Split AC');
  const [brandModel, setBrandModel] = useState('');
  const [lastServicedDate, setLastServicedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [intervalMonths, setIntervalMonths] = useState<number>(6);

  const notify = (type: 'ok' | 'err', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      b.serviceType.toLowerCase().includes(q) ||
      b.acType.toLowerCase().includes(q) ||
      b.serviceAddress.toLowerCase().includes(q) ||
      b.technicianName.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const handleOpenReschedule = (booking: BookingRecord) => {
    setEditingBooking(booking);
    setRescheduleDate(booking.scheduledDate);
    setRescheduleSlot(booking.timeSlot);
    setRescheduleNotes(booking.notes || '');
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    setActionBusy(true);
    try {
      await rescheduleBookingInFirestore(
        editingBooking.id,
        rescheduleDate,
        rescheduleSlot,
        rescheduleNotes
      );
      setEditingBooking(null);
      notify('ok', 'Appointment schedule updated.');
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Could not reschedule.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleStatusChange = async (booking: BookingRecord, newStatus: BookingStatus) => {
    setActionBusy(true);
    try {
      await updateBookingStatusInFirestore(booking.id, newStatus);
      notify(
        'ok',
        newStatus === 'completed'
          ? 'Service marked completed. You can also log this unit in your Maintenance Tracker.'
          : `Booking marked ${newStatus}.`
      );
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Status update failed.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    setActionBusy(true);
    try {
      await deleteBookingInFirestore(bookingId);
      notify('ok', 'Booking record removed.');
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionBusy(true);
    try {
      await createReminderInFirestore({
        unitLabel,
        acType: unitAcType,
        brandModel,
        lastServicedDate,
        intervalMonths,
      });
      setUnitLabel('');
      setBrandModel('');
      setShowAddReminder(false);
      notify('ok', 'AC unit added to your preventive maintenance tracker.');
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Failed to add unit reminder.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleSeedSampleReminders = async () => {
    setActionBusy(true);
    try {
      const today = new Date();
      const fiveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 18)
        .toISOString()
        .split('T')[0];
      const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 10)
        .toISOString()
        .split('T')[0];

      await createReminderInFirestore({
        unitLabel: 'Master Bedroom Split AC',
        acType: 'Split AC',
        brandModel: 'Daikin 1.5T 5-Star Inverter',
        lastServicedDate: fiveMonthsAgo,
        intervalMonths: 6,
      });
      await createReminderInFirestore({
        unitLabel: 'Living Room Lounge AC',
        acType: 'Split AC',
        brandModel: 'Mitsubishi Heavy 2.0T SRK',
        lastServicedDate: twoMonthsAgo,
        intervalMonths: 6,
      });
      notify('ok', 'Added 2 sample home AC units to your maintenance tracker.');
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Could not add sample units.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleMarkUnitServicedToday = async (reminder: MaintenanceReminderRecord) => {
    setActionBusy(true);
    try {
      await markReminderServicedTodayInFirestore(reminder.id, reminder.intervalMonths);
      notify('ok', `${reminder.unitLabel} marked serviced today. Next due date updated.`);
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Could not update reminder.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    setActionBusy(true);
    try {
      await deleteReminderInFirestore(reminderId);
      notify('ok', 'Equipment reminder removed.');
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Could not remove reminder.');
    } finally {
      setActionBusy(false);
    }
  };

  // Summary metrics
  const activeBookingsCount = bookings.filter(
    (b) => b.status === 'scheduled' || b.status === 'in-progress'
  ).length;
  const completedBookingsCount = bookings.filter((b) => b.status === 'completed').length;
  const dueOrOverdueCount = reminders.filter(
    (r) => r.healthStatus === 'due-soon' || r.healthStatus === 'overdue'
  ).length;

  return (
    <section id="dashboard" className="py-20 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <p className="text-xs font-mono text-sky-700 tracking-wide">
              03. CUSTOMER PORTAL & LIFECYCLE TELEMETRY
            </p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1 text-balance">
              Service History & Preventive Maintenance Tracker
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl">
              Track live technician dispatches, download digital service job sheets, and monitor
              coil-cleaning intervals across every air conditioner in your home or office.
            </p>
          </div>

          {/* Interactive Workspace Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Service History ({bookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reminders')}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'reminders'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Maintenance Reminders ({reminders.length})
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`mt-6 px-4 py-3 rounded-lg border text-sm flex items-center justify-between ${
              feedbackMsg.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-xs underline ml-4 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Unauthenticated Gate */}
        {!authReady ? (
          <div className="mt-8 p-12 border border-slate-200 rounded-xl bg-slate-50 text-center">
            <p className="text-sm font-mono text-slate-500">
              Verifying authentication session...
            </p>
          </div>
        ) : !user ? (
          <div className="mt-8 p-8 sm:p-12 border border-slate-200 rounded-xl bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <h3 className="text-xl font-display font-semibold text-slate-900">
                Sign in with Google to access your live AC service dashboard
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Your bookings, digital pressure/amperage job sheets, and multi-room AC maintenance
                countdowns are securely tied to your verified Google account.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-4">
                <span>Real-time Firestore Sync</span>
                <span aria-hidden="true">·</span>
                <span>Automated 4-to-6 Month Coil Alerts</span>
                <span aria-hidden="true">·</span>
                <span>Instant Rescheduling</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center gap-2.5 px-5 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Google</span>
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {/* Top Summary Metric Strip (Tabular Numerals, Single-Elevation Border) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50/60">
              <div className="p-5">
                <p className="text-xs text-slate-500">Signed-In Account</p>
                <p className="text-sm font-semibold text-slate-900 truncate mt-1">
                  {user.displayName || user.email}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-500">Upcoming Appointments</p>
                <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums mt-1">
                  {activeBookingsCount}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Scheduled dispatches</p>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-500">Completed Services</p>
                <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums mt-1">
                  {completedBookingsCount}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Verified job sheets</p>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-500">Units Due for Service</p>
                <p
                  className={`text-2xl font-mono font-bold tabular-nums mt-1 ${
                    dueOrOverdueCount > 0 ? 'text-amber-600' : 'text-emerald-700'
                  }`}
                >
                  {dueOrOverdueCount} / {reminders.length}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Tracked AC equipment</p>
              </div>
            </div>

            {/* TAB 1: SERVICE HISTORY & ACTIVE BOOKINGS */}
            {activeTab === 'bookings' && (
              <div className="space-y-5">
                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                    {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          statusFilter === st
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter by service, AC type, address..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                    />
                  </div>
                </div>

                {/* Bookings Table / List */}
                {loadingData ? (
                  <div className="p-10 border border-slate-200 rounded-xl text-center">
                    <p className="text-sm font-mono text-slate-500">
                      Loading service records...
                    </p>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="p-10 border border-slate-200 rounded-xl bg-slate-50 text-center">
                    <Wrench className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                    <h3 className="text-base font-display font-semibold text-slate-900">
                      No matching service appointments found
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                      Use the online booking form below to schedule your first AC service visit.
                    </p>
                    <a
                      href="#book-now"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Schedule First AC Service</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                            <th className="py-3.5 px-4">Service & Equipment</th>
                            <th className="py-3.5 px-4">Schedule & Dispatch</th>
                            <th className="py-3.5 px-4">Technician & Location</th>
                            <th className="py-3.5 px-4 text-right">Estimate</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-sm">
                          {filteredBookings.map((bk) => (
                            <tr
                              key={bk.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="py-4 px-4 align-top">
                                <p className="font-semibold text-slate-900">
                                  {bk.serviceType}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-1">
                                  <span>{bk.acType}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{bk.tonnage}</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono tabular-nums">
                                    {bk.unitCount} {bk.unitCount === 1 ? 'Unit' : 'Units'}
                                  </span>
                                </div>
                              </td>

                              <td className="py-4 px-4 align-top">
                                <p className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                                  {bk.scheduledDate}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {bk.timeSlot}
                                </p>
                              </td>

                              <td className="py-4 px-4 align-top max-w-xs">
                                <p className="text-xs font-medium text-slate-800">
                                  {bk.technicianName}
                                </p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                  {bk.serviceAddress}
                                </p>
                              </td>

                              <td className="py-4 px-4 align-top text-right font-mono font-semibold text-slate-900 tabular-nums">
                                ₹{bk.estimatedTotal.toLocaleString('en-IN')}
                              </td>

                              <td className="py-4 px-4 align-top">
                                <span
                                  className={`inline-flex items-center gap-1 text-xs font-medium capitalize ${
                                    bk.status === 'completed'
                                      ? 'text-emerald-700'
                                      : bk.status === 'cancelled'
                                      ? 'text-red-600'
                                      : 'text-sky-700'
                                  }`}
                                >
                                  {bk.status === 'completed' && (
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  )}
                                  {bk.status === 'scheduled' && (
                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                  )}
                                  <span>{bk.status}</span>
                                </span>
                              </td>

                              <td className="py-4 px-4 align-top text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedJobSheet(bk)}
                                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                    title="View Digital Job Sheet"
                                  >
                                    Job Sheet
                                  </button>

                                  {bk.status === 'scheduled' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenReschedule(bk)}
                                        disabled={actionBusy}
                                        className="px-2.5 py-1.5 text-xs font-medium text-sky-700 border border-sky-200 rounded-md hover:bg-sky-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                      >
                                        Reschedule
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStatusChange(bk, 'completed')
                                        }
                                        disabled={actionBusy}
                                        className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                      >
                                        Complete
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleStatusChange(bk, 'cancelled')
                                        }
                                        disabled={actionBusy}
                                        className="px-2.5 py-1.5 text-xs font-medium text-amber-700 border border-amber-200 rounded-md hover:bg-amber-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBooking(bk.id)}
                                    disabled={actionBusy}
                                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                    aria-label="Delete booking record"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: EQUIPMENT & UPCOMING MAINTENANCE REMINDERS */}
            {activeTab === 'reminders' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-display font-semibold text-slate-900">
                      Registered AC Equipment & Coil Cleaning Countdown
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Preventive hydro-jet cleaning every 4–6 months prevents high head pressure
                      and reduces compressor electricity draw by up to 24%.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {reminders.length === 0 && (
                      <button
                        type="button"
                        onClick={handleSeedSampleReminders}
                        disabled={actionBusy}
                        className="px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Load Sample Home AC Fleet
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAddReminder((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add AC Unit to Tracker</span>
                    </button>
                  </div>
                </div>

                {/* Add Reminder Form */}
                {showAddReminder && (
                  <form
                    onSubmit={handleAddReminder}
                    className="p-6 border border-slate-200 rounded-xl bg-slate-50 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-display font-semibold text-slate-900">
                        Register Air Conditioner for Maintenance Reminders
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddReminder(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Room / Location Label
                        </label>
                        <input
                          type="text"
                          required
                          minLength={2}
                          maxLength={80}
                          value={unitLabel}
                          onChange={(e) => setUnitLabel(e.target.value)}
                          placeholder="e.g., Master Bedroom AC"
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Equipment Category
                        </label>
                        <select
                          value={unitAcType}
                          onChange={(e) => setUnitAcType(e.target.value as AcType)}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                        >
                          {VALIDATION_RULES.AC_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Brand & Model
                        </label>
                        <input
                          type="text"
                          required
                          minLength={2}
                          maxLength={80}
                          value={brandModel}
                          onChange={(e) => setBrandModel(e.target.value)}
                          placeholder="e.g., Daikin 1.5T Inverter"
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Last Serviced Date
                        </label>
                        <input
                          type="date"
                          required
                          value={lastServicedDate}
                          onChange={(e) => setLastServicedDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Reminder Cadence
                        </label>
                        <select
                          value={intervalMonths}
                          onChange={(e) => setIntervalMonths(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                        >
                          <option value={3}>Every 3 Months (Heavy Use)</option>
                          <option value={4}>Every 4 Months (Pre/Mid Season)</option>
                          <option value={6}>Every 6 Months (Standard Residential)</option>
                          <option value={12}>Every 12 Months (Annual)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={actionBusy}
                        className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Save Equipment Reminder
                      </button>
                    </div>
                  </form>
                )}

                {/* Reminders Grid */}
                {reminders.length === 0 ? (
                  <div className="p-10 border border-slate-200 rounded-xl bg-slate-50 text-center">
                    <Calendar className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                    <h4 className="text-base font-display font-semibold text-slate-900">
                      No AC units tracked yet
                    </h4>
                    <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                      Add your room air conditioners to receive automatic due-date calculations
                      and one-click service booking.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reminders.map((rm) => (
                      <div
                        key={rm.id}
                        className="p-6 border border-slate-200 rounded-xl bg-white flex flex-col justify-between gap-5"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-base font-display font-semibold text-slate-900">
                                {rm.unitLabel}
                              </h4>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                <span>{rm.acType}</span>
                                <span aria-hidden="true">·</span>
                                <span>{rm.brandModel}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteReminder(rm.id)}
                              disabled={actionBusy}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              aria-label="Delete unit reminder"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Status Indicator with Explicit Text Label + Icon */}
                          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-slate-500">Last Serviced</p>
                              <p className="text-sm font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                                {rm.lastServicedDate}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Next Due Date</p>
                              <p className="text-sm font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                                {rm.nextDueDate}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                              Cycle: Every {rm.intervalMonths} months
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${
                                rm.healthStatus === 'overdue'
                                  ? 'text-red-600'
                                  : rm.healthStatus === 'due-soon'
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {rm.healthStatus === 'optimal' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {rm.healthStatus === 'overdue'
                                  ? 'Service Overdue'
                                  : rm.healthStatus === 'due-soon'
                                  ? 'Due Within 21 Days'
                                  : 'Optimal Coil Health'}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleMarkUnitServicedToday(rm)}
                            disabled={actionBusy}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Serviced Today</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickBookUnit(rm.acType, rm.unitLabel)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <span>Book Service</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RESCHEDULE MODAL */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-display font-bold text-slate-900">
                  Reschedule AC Service Visit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingBooking.serviceType} · {editingBooking.acType}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Preferred Date
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Arrival Window
                </label>
                <select
                  value={rescheduleSlot}
                  onChange={(e) => setRescheduleSlot(e.target.value as TimeSlotType)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                >
                  {VALIDATION_RULES.TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Updated Technician Notes
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionBusy}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Save New Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIGITAL JOB SHEET MODAL */}
      {selectedJobSheet && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-mono text-sky-700">
                  COOL BROS AC SERVICE · DIGITAL JOB SHEET
                </p>
                <h3 className="text-lg font-display font-bold text-slate-900 mt-0.5">
                  {selectedJobSheet.serviceType}
                </h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  Job ID: {selectedJobSheet.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobSheet(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-4">
              <div>
                <p className="text-slate-500">Customer Name</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedJobSheet.customerName}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Registered Phone</p>
                <p className="font-mono font-semibold text-slate-900 mt-0.5">
                  {selectedJobSheet.customerPhone}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Equipment Details</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedJobSheet.acType} · {selectedJobSheet.tonnage} ({selectedJobSheet.unitCount}{' '}
                  {selectedJobSheet.unitCount === 1 ? 'Unit' : 'Units'})
                </p>
              </div>
              <div>
                <p className="text-slate-500">Assigned Engineer</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedJobSheet.technicianName}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500">Service Address</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedJobSheet.serviceAddress}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Slot</span>
                <span className="font-mono font-semibold text-slate-900">
                  {selectedJobSheet.scheduledDate} · {selectedJobSheet.timeSlot}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dispatch Status</span>
                <span className="font-semibold uppercase text-slate-900">
                  {selectedJobSheet.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Support Helpline</span>
                <span className="font-mono text-slate-900">
                  +91 9560415262 · coolbrosacservice@gmail.com
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200 text-sm">
                <span className="font-semibold text-slate-900">Total Approved Estimate</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  ₹{selectedJobSheet.estimatedTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Print Job Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedJobSheet(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
