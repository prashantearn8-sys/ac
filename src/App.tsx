/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  Phone,
  Mail,
  Check,
  ArrowRight,
  ShieldCheck,
  Clock,
  Menu,
  X,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  Send,
} from 'lucide-react';
import {
  AcType,
  BookingRecord,
  MaintenanceReminderRecord,
  MessageSubject,
  OperationType,
  ServiceType,
  TimeSlotType,
  TonnageType,
  VALIDATION_RULES,
  auth,
  createBookingInFirestore,
  createCustomerMessageInFirestore,
  createReminderInFirestore,
  db,
  handleFirestoreError,
  signInWithGoogle,
  signOutUser,
} from './firebase';
import {
  CASE_STUDY_PROOFS,
  PROTOCOL_STEPS,
  SERVICE_PACKAGES,
  calculateServicePricing,
} from './data/acServices';
import { CustomerDashboard } from './components/CustomerDashboard';

const WHATSAPP_NUMBER = '919560415262';
const OWNER_EMAIL = 'coolbrosacservice@gmail.com';

export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

interface EmailNotificationPayload {
  type: 'Direct App Message' | 'New Service Booking';
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  subject: string;
  message: string;
  bookingDetails?: {
    serviceType: string;
    acType: string;
    tonnage: string;
    unitCount: number;
    scheduledDate: string;
    timeSlot: string;
    serviceAddress: string;
    estimatedTotal: number;
  };
}

async function dispatchEmailToOwner(payload: EmailNotificationPayload): Promise<void> {
  // 1. Trigger server-side /api/send-email endpoint
  let serverRelayed = false;
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.method === 'smtp' || data.method === 'formsubmit-relay') {
        serverRelayed = true;
      }
    }
  } catch {
    // Proceed to browser relay fallback
  }

  // 2. If server didn't complete external relay, dispatch directly via FormSubmit AJAX to coolbrosacservice@gmail.com
  if (!serverRelayed) {
    try {
      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(OWNER_EMAIL)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `[Cool Bros AC App] ${payload.subject} - ${payload.senderName} (${payload.senderPhone})`,
          _template: 'table',
          Notification_Type: payload.type,
          Customer_Name: payload.senderName,
          Customer_Phone: payload.senderPhone,
          Customer_Email: payload.senderEmail,
          Subject: payload.subject,
          Message: payload.message,
          ...(payload.bookingDetails
            ? {
                Service_Package: payload.bookingDetails.serviceType,
                Equipment: `${payload.bookingDetails.acType} (${payload.bookingDetails.tonnage}) x ${payload.bookingDetails.unitCount}`,
                Preferred_Slot: `${payload.bookingDetails.scheduledDate} (${payload.bookingDetails.timeSlot})`,
                Address: payload.bookingDetails.serviceAddress,
                Estimated_Total: `INR ${payload.bookingDetails.estimatedTotal}`,
              }
            : {}),
        }),
      });
    } catch {
      // Non-blocking fallback
    }
  }
}

export default function App() {
  // Auth & Firestore Live State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [reminders, setReminders] = useState<MaintenanceReminderRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Mobile Menu & Profile Popover State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);

  // Booking Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [bookAcType, setBookAcType] = useState<AcType>('Split AC');
  const [bookServiceType, setBookServiceType] = useState<ServiceType>('Foam Power Jet Service');
  const [bookTonnage, setBookTonnage] = useState<TonnageType>('1.5 Ton');
  const [bookUnits, setBookUnits] = useState<number>(1);
  const [bookDate, setBookDate] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [bookSlot, setBookSlot] = useState<TimeSlotType>('09:00 AM - 11:00 AM');
  const [bookNotes, setBookNotes] = useState('');
  const [autoTrackReminder, setAutoTrackReminder] = useState(true);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingStatusMsg, setBookingStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
    whatsappText?: string;
  } | null>(null);

  // Direct Message Form State (Sends Email to coolbrosacservice@gmail.com)
  const [msgName, setMsgName] = useState('');
  const [msgPhone, setMsgPhone] = useState('');
  const [msgEmail, setMsgEmail] = useState('');
  const [msgSubject, setMsgSubject] = useState('General AC Inquiry');
  const [msgBody, setMsgBody] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgFeedback, setMsgFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
    mailtoHref?: string;
  } | null>(null);

  // Scroll Progress Bar Animation (Compositor-only scaleX)
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      setAvatarImgError(false);
      setProfileMenuOpen(false);
      if (currentUser?.displayName) {
        setCustomerName((prev) => prev || currentUser.displayName || '');
        setMsgName((prev) => prev || currentUser.displayName || '');
      }
      if (currentUser?.email) {
        setMsgEmail((prev) => prev || currentUser.email || '');
      }
    });
    return () => unsubAuth();
  }, []);

  // Attach Firestore listeners only when auth is ready and user is signed in
  useEffect(() => {
    if (!authReady || !user) {
      setBookings([]);
      setReminders([]);
      return;
    }

    setLoadingData(true);

    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid)
    );
    const unsubBookings = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const rows: BookingRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BookingRecord, 'id'>),
        }));
        rows.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
        setBookings(rows);
        setLoadingData(false);
      },
      (error) => {
        setLoadingData(false);
        handleFirestoreError(error, OperationType.LIST, 'bookings');
      }
    );

    const remindersQuery = query(
      collection(db, 'reminders'),
      where('userId', '==', user.uid)
    );
    const unsubReminders = onSnapshot(
      remindersQuery,
      (snapshot) => {
        const rows: MaintenanceReminderRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<MaintenanceReminderRecord, 'id'>),
        }));
        rows.sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
        setReminders(rows);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reminders');
      }
    );

    return () => {
      unsubBookings();
      unsubReminders();
    };
  }, [authReady, user]);

  // Computed Pricing for Booking Form
  const bookingEstimateResult = calculateServicePricing(
    bookServiceType,
    bookAcType,
    bookTonnage,
    bookUnits,
    []
  );

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google Sign-In could not be completed.'
      );
    }
  };

  const handleSelectPackageForBooking = (serviceName: ServiceType) => {
    setBookServiceType(serviceName);
    const el = document.getElementById('book-now');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickBookFromReminder = (acType: AcType, unitLabel: string) => {
    setBookAcType(acType);
    setBookServiceType('Foam Power Jet Service');
    setBookNotes(`Preventive maintenance for: ${unitLabel}`);
    const el = document.getElementById('book-now');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStatusMsg(null);

    if (!user) {
      try {
        await signInWithGoogle();
      } catch {
        setBookingStatusMsg({
          type: 'error',
          text: 'Please sign in with Google first to confirm your service booking.',
        });
        return;
      }
    }

    setBookingSubmitting(true);
    try {
      const bookingId = await createBookingInFirestore({
        customerName,
        customerPhone,
        serviceAddress,
        acType: bookAcType,
        serviceType: bookServiceType,
        unitCount: bookUnits,
        tonnage: bookTonnage,
        scheduledDate: bookDate,
        timeSlot: bookSlot,
        estimatedTotal: bookingEstimateResult.finalTotal,
        notes: bookNotes,
      });

      if (autoTrackReminder) {
        const selectedPkg = SERVICE_PACKAGES.find((p) => p.name === bookServiceType);
        const intervalMonths = selectedPkg?.recommendedIntervalMonths || 6;
        await createReminderInFirestore({
          unitLabel: `${bookAcType} (${bookTonnage})`,
          acType: bookAcType,
          brandModel: `${bookServiceType} Cohort`,
          lastServicedDate: bookDate,
          intervalMonths,
        });
      }

      // Send email notification to coolbrosacservice@gmail.com
      await dispatchEmailToOwner({
        type: 'New Service Booking',
        senderName: customerName,
        senderPhone: customerPhone,
        senderEmail: user?.email || msgEmail || 'Not provided',
        subject: `New AC Booking: ${bookServiceType} (${bookDate})`,
        message: bookNotes || 'Online booking confirmed via Cool Bros App.',
        bookingDetails: {
          serviceType: bookServiceType,
          acType: bookAcType,
          tonnage: bookTonnage,
          unitCount: bookUnits,
          scheduledDate: bookDate,
          timeSlot: bookSlot,
          serviceAddress,
          estimatedTotal: bookingEstimateResult.finalTotal,
        },
      });

      const waSummary = `Hi Cool Bros AC Service, I just booked an appointment (Ref: ${bookingId.slice(
        0,
        10
      )}):\n• Name: ${customerName}\n• Phone: ${customerPhone}\n• Service: ${bookServiceType}\n• Equipment: ${bookAcType} (${bookTonnage}) x ${bookUnits}\n• Slot: ${bookDate}, ${bookSlot}\n• Address: ${serviceAddress}\n• Estimate: ₹${bookingEstimateResult.finalTotal}`;

      setBookingStatusMsg({
        type: 'success',
        text: `Booking confirmed (Ref: ${bookingId.slice(
          0,
          12
        )}) and email notification sent to ${OWNER_EMAIL}.`,
        whatsappText: waSummary,
      });
      setBookNotes('');
    } catch (err) {
      let friendlyMsg =
        err instanceof Error ? err.message : 'Could not complete booking.';
      try {
        const parsed = JSON.parse(friendlyMsg);
        if (parsed && parsed.error) {
          friendlyMsg = parsed.error;
        }
      } catch {
        // Use raw message
      }
      setBookingStatusMsg({
        type: 'error',
        text: friendlyMsg,
      });
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgFeedback(null);
    setMsgSending(true);

    try {
      if (user) {
        await createCustomerMessageInFirestore({
          senderName: msgName.trim(),
          senderPhone: msgPhone.trim(),
          senderEmail: msgEmail.trim() || user.email || '',
          subject: msgSubject as MessageSubject,
          messageText: msgBody.trim(),
        });
      }

      await dispatchEmailToOwner({
        type: 'Direct App Message',
        senderName: msgName.trim(),
        senderPhone: msgPhone.trim(),
        senderEmail: msgEmail.trim() || user?.email || 'Not provided',
        subject: msgSubject,
        message: msgBody.trim(),
      });

      const mailtoSubject = `[Cool Bros Inquiry] ${msgSubject} - ${msgName.trim()}`;
      const mailtoBody = `Name: ${msgName.trim()}\nPhone: ${msgPhone.trim()}\nEmail: ${
        msgEmail.trim() || 'N/A'
      }\n\nMessage:\n${msgBody.trim()}`;

      setMsgFeedback({
        type: 'success',
        text: `Your message has been sent to ${OWNER_EMAIL}. Our team will respond shortly.`,
        mailtoHref: `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(
          mailtoSubject
        )}&body=${encodeURIComponent(mailtoBody)}`,
      });
      setMsgBody('');
    } catch (err) {
      setMsgFeedback({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Could not send message. Please use the WhatsApp button below.',
      });
    } finally {
      setMsgSending(false);
    }
  };

  const currentMessageWhatsAppUrl = buildWhatsAppUrl(
    msgBody.trim()
      ? `Hi Cool Bros AC Service,\n• Name: ${msgName || 'Customer'}\n• Topic: ${msgSubject}\n• Message: ${msgBody.trim()}`
      : `Hi Cool Bros AC Service, I have an inquiry regarding AC servicing & maintenance.`
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-sky-500 selection:text-white">
      {/* Scroll Progress Bar (Compositor-Only transform: scaleX) */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-0.5 bg-sky-500 origin-left z-50 pointer-events-none"
      />

      {/* TOP BAR CONTRACT: Strictly 3 Zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
          {/* Zone 1: Single Text Element Wordmark */}
          <a
            href="#"
            className="text-lg sm:text-xl font-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Cool Bros AC Service
          </a>

          {/* Zone 2: 5 Concise Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#services"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Services
            </a>
            <a
              href="#protocol"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Protocol
            </a>
            <a
              href="#dashboard"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Dashboard
            </a>
            <a
              href="#book-now"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Book Now
            </a>
            <a
              href="#send-message"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Message Us
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action (+ Mobile Drawer Toggle) */}
          <div className="relative flex items-center gap-3 shrink-0">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                  className="group inline-flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200/90 rounded-full shadow-xs hover:border-sky-300 hover:bg-sky-50/40 active:scale-[0.98] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {user.photoURL && !avatarImgError ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || user.email || 'User profile'}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarImgError(true)}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-sky-500/20 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                      {(user.displayName || user.email || 'U').charAt(0)}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate tracking-tight">
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Account'}
                  </span>
                </button>

                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-lg p-3 z-50 space-y-2.5">
                      <div className="flex items-center gap-3 px-2 py-1.5 border-b border-slate-100">
                        {user.photoURL && !avatarImgError ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || user.email || 'User profile'}
                            referrerPolicy="no-referrer"
                            onError={() => setAvatarImgError(true)}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-sky-600 text-white flex items-center justify-center text-sm font-bold uppercase shrink-0">
                            {(user.displayName || user.email || 'U').charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {user.displayName || 'Verified Customer'}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <a
                        href="#dashboard"
                        onClick={() => setProfileMenuOpen(false)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <span>My Service Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          signOutUser();
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="group inline-flex items-center gap-2.5 pl-3 pr-4 py-2 text-xs font-semibold text-white bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700/80 rounded-xl shadow-sm hover:from-sky-600 hover:to-sky-700 hover:border-sky-500 hover:shadow-md hover:shadow-sky-500/20 active:scale-[0.98] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <svg
                  className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5 shadow-2xs group-hover:scale-105 transition-transform duration-150"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.54-5.17 3.54-8.97z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span className="tracking-tight">Sign In with Google</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Responsive Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm font-medium text-slate-700">
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-100 whitespace-nowrap"
              >
                Services
              </a>
              <a
                href="#protocol"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-100 whitespace-nowrap"
              >
                6-Stage Protocol
              </a>
              <a
                href="#dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-100 whitespace-nowrap"
              >
                User Dashboard
              </a>
              <a
                href="#send-message"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-100 whitespace-nowrap"
              >
                Send Message
              </a>
              <a
                href="#book-now"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 font-semibold bg-sky-600 text-white rounded-lg text-center whitespace-nowrap"
              >
                Book Service
              </a>
              <a
                href={buildWhatsAppUrl(
                  'Hi Cool Bros AC Service, I would like to book an AC service visit.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 font-semibold bg-emerald-600 text-white rounded-lg text-center whitespace-nowrap"
              >
                WhatsApp Us
              </a>
            </div>
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <a href="tel:+919560415262" className="font-mono font-semibold text-slate-800">
                Call: +91 9560415262
              </a>
              <a href="mailto:coolbrosacservice@gmail.com" className="truncate">
                coolbrosacservice@gmail.com
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Auth Error Alert */}
      {authError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-center text-xs text-red-800">
          <span>{authError}</span>
          <button
            type="button"
            onClick={() => setAuthError(null)}
            className="ml-3 underline font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl"
            >
              {/* Clean Unboxed Metadata with Typographic Separators */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-sky-700">
                <span>ISO-GRADE HVAC DIAGNOSTICS</span>
                <span aria-hidden="true">·</span>
                <span>140 PSI HYDRO-JET</span>
                <span aria-hidden="true">·</span>
                <span>60-MIN RAPID DISPATCH</span>
              </div>

              <h1
                className="font-display font-bold text-slate-900 tracking-tight mt-4 text-balance"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.75rem)', lineHeight: 1.08 }}
              >
                Precision AC Servicing & Thermal Calibration Built for Peak Summers.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 mt-5 leading-relaxed max-w-[65ch]">
                Stop paying for superficial filter rinses. Cool Bros engineers restore
                factory cooling efficiency using 140 PSI alkaline foam hydro-jet cleaning,
                500-micron vacuum dehydration, and digital subcooling verification.
              </p>

              <div className="mt-8 pt-6 border-t border-slate-200 space-y-5">
                <div className="flex flex-wrap items-center gap-3.5">
                  <a
                    href="#book-now"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Schedule Service Visit</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <a
                    href={buildWhatsAppUrl(
                      'Hi Cool Bros AC Service, I would like to book an AC service / inquiry.'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp +91 9560415262</span>
                  </a>

                  <a
                    href="#dashboard"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Track Service History & Reminders</span>
                  </a>
                </div>

                {/* Direct Contact Trust Bar */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <a
                    href="tel:+919560415262"
                    className="inline-flex items-center gap-1.5 font-mono font-semibold text-slate-900 hover:text-sky-700"
                  >
                    <Phone className="w-3.5 h-3.5 text-sky-600" />
                    <span>+91 9560415262</span>
                  </a>
                  <span aria-hidden="true">·</span>
                  <a
                    href="mailto:coolbrosacservice@gmail.com"
                    className="inline-flex items-center gap-1.5 hover:text-sky-700"
                  >
                    <Mail className="w-3.5 h-3.5 text-sky-600" />
                    <span>coolbrosacservice@gmail.com</span>
                  </a>
                  <span aria-hidden="true">·</span>
                  <span>All Inverter & VRF Brands Supported</span>
                </div>
              </div>
            </motion.div>

            {/* Full-Width 4-Column Quantitative KPI Strip Below Hero */}
            <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50/70">
              <div className="p-5 sm:p-6">
                <p className="text-xs font-mono text-slate-500">COOLING RECOVERY</p>
                <p className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 tabular-nums mt-1">
                  +28% CFM
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Restored evaporator airflow after 140 PSI hydro-jet descaling
                </p>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-xs font-mono text-slate-500">POWER REDUCTION</p>
                <p className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 tabular-nums mt-1">
                  -24.6% kWh
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Average compressor amp draw drop across 1,400+ serviced units
                </p>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-xs font-mono text-slate-500">VACUUM DEHYDRATION</p>
                <p className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 tabular-nums mt-1">
                  500 Microns
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Deep rotary vacuum standard before every R32 / R410A gas recharge
                </p>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-xs font-mono text-slate-500">SERVICE GUARANTEE</p>
                <p className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 tabular-nums mt-1">
                  90 Days
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  No-questions-asked re-visit warranty on gas charging & repairs
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 01: ASYMMETRIC BENTO SERVICE CATALOG */}
        <section id="services" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-mono text-sky-700 tracking-wide">
                01. ENGINEERED SERVICE CAPABILITIES
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1 text-balance">
                Transparent AC Maintenance & Repair Packages
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                Every service includes a 50-point electrical and thermal inspection, digital
                amperage verification, and automatic reminder syncing to your dashboard.
              </p>
            </div>

            {/* Asymmetric 12-Column Bento Grid */}
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {SERVICE_PACKAGES.map((pkg, i) => (
                <motion.article
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`${pkg.colSpan} bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between`}
                >
                  <div>
                    {/* Clean Unboxed Metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                        <span className="font-semibold text-sky-700">{pkg.index}.</span>
                        <span>{pkg.pressurePsi}</span>
                        <span aria-hidden="true">·</span>
                        <span>{pkg.durationMinutes} Mins</span>
                        <span aria-hidden="true">·</span>
                        <span>{pkg.warrantyDays}-Day Warranty</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-emerald-700">
                        {pkg.expectedCoolingGain}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                      <h3 className="text-xl font-display font-bold text-slate-900">
                        {pkg.name}
                      </h3>
                      <div className="sm:text-right shrink-0">
                        <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                          ₹{pkg.basePriceInr.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">/ unit base</span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mt-1.5">{pkg.tagline}</p>

                    <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
                      {pkg.deliverables.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-7 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Recommended cycle: Every {pkg.recommendedIntervalMonths} months
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={buildWhatsAppUrl(
                          `Hi Cool Bros AC Service, I want to inquire about ${pkg.name} (₹${pkg.basePriceInr}/unit).`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleSelectPackageForBooking(pkg.name)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>Book Package</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            {/* CLAIM-TO-PROOF ADJACENCY: Quantified Case Studies */}
            <div className="mt-16 pt-14 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-mono text-sky-700">
                    VERIFIED FIELD OUTCOMES · DELHI NCR
                  </p>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 mt-1">
                    Measured Cooling & Energy Performance Proofs
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Documented via pre- and post-service digital clamp meter & anemometer logs
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {CASE_STUDY_PROOFS.map((proof) => (
                  <div
                    key={proof.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5"
                  >
                    <div>
                      <p className="text-xl font-mono font-bold text-sky-700 tabular-nums">
                        {proof.headlineMetric}
                      </p>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        {proof.secondaryMetric}
                      </p>

                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600 leading-relaxed">
                        <p>
                          <strong className="text-slate-900">Before:</strong> {proof.beforeState}
                        </p>
                        <p>
                          <strong className="text-slate-900">Intervention:</strong>{' '}
                          {proof.intervention}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-700 italic leading-relaxed">
                        "{proof.outcomeQuote}"
                      </p>
                      <div className="mt-3 text-xs">
                        <p className="font-semibold text-slate-900">{proof.client}</p>
                        <p className="text-slate-500">
                          {proof.roleAndOrg} · {proof.location}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SCROLL-ANIMATED 6-STAGE ENGINEERING PROTOCOL */}
        <section id="protocol" className="py-20 bg-slate-950 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-mono text-sky-400 tracking-wide">
                02. 6-STAGE ZERO-MESS WORKFLOW
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1 text-balance">
                How Cool Bros Restores Factory-Spec Cooling
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-2">
                Every technician follows our standardized 6-stage checklist with digital
                instrument verification at the start and end of your appointment.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PROTOCOL_STEPS.map((st, index) => (
                <motion.div
                  key={st.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono pb-4 border-b border-slate-800">
                      <span className="text-sky-400 font-bold">STAGE {st.step}</span>
                      <span className="text-slate-400">{st.metric}</span>
                    </div>
                    <h3 className="text-lg font-display font-semibold text-white mt-4 tracking-wide">
                      {st.title}
                    </h3>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      {st.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 03: USER DASHBOARD (SERVICE HISTORY & REMINDERS) */}
        <CustomerDashboard
          user={user}
          authReady={authReady}
          bookings={bookings}
          reminders={reminders}
          loadingData={loadingData}
          onSignIn={handleGoogleSignIn}
          onQuickBookUnit={handleQuickBookFromReminder}
        />

        {/* SECTION 04: ONLINE BOOKING SYSTEM, DIRECT MESSAGE TO EMAIL, & WHATSAPP */}
        <section id="book-now" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left 7 Columns: Online Booking Form */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
                <div className="pb-6 border-b border-slate-200">
                  <p className="text-xs font-mono text-sky-700">
                    04. INSTANT ONLINE DISPATCH BOOKING
                  </p>
                  <h2 className="text-2xl font-display font-bold text-slate-900 mt-1">
                    Schedule Your AC Technician Visit
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Confirm your preferred slot below. Your booking automatically alerts{' '}
                    <span className="font-mono text-slate-800">{OWNER_EMAIL}</span> and syncs to
                    your Customer Dashboard.
                  </p>
                </div>

                {bookingStatusMsg && (
                  <div
                    className={`mt-6 p-4 rounded-lg border text-sm ${
                      bookingStatusMsg.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    <p className="font-medium">{bookingStatusMsg.text}</p>
                    {bookingStatusMsg.type === 'success' && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <a
                          href="#dashboard"
                          className="text-xs font-semibold underline"
                        >
                          View in Customer Dashboard →
                        </a>
                        {bookingStatusMsg.whatsappText && (
                          <a
                            href={buildWhatsAppUrl(bookingStatusMsg.whatsappText)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Send Booking on WhatsApp (+91 9560415262)</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleBookingSubmit} className="mt-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={100}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g., Rohan Kapoor"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Mobile Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        minLength={10}
                        maxLength={20}
                        pattern="^[0-9+\-\s()]{10,20}$"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g., +91 9876543210"
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Complete Service Address & Landmark *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={5}
                      maxLength={300}
                      value={serviceAddress}
                      onChange={(e) => setServiceAddress(e.target.value)}
                      placeholder="House/Flat No., Building, Sector/Locality, City"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        AC Type
                      </label>
                      <select
                        value={bookAcType}
                        onChange={(e) => setBookAcType(e.target.value as AcType)}
                        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
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
                        Tonnage
                      </label>
                      <select
                        value={bookTonnage}
                        onChange={(e) => setBookTonnage(e.target.value as TonnageType)}
                        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                      >
                        {VALIDATION_RULES.TONNAGES.map((ton) => (
                          <option key={ton} value={ton}>
                            {ton}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Number of Units
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        required
                        value={bookUnits}
                        onChange={(e) =>
                          setBookUnits(Math.max(1, Math.min(20, Number(e.target.value))))
                        }
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Service Package
                    </label>
                    <select
                      value={bookServiceType}
                      onChange={(e) => setBookServiceType(e.target.value as ServiceType)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                    >
                      {VALIDATION_RULES.SERVICE_TYPES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={bookDate}
                        onChange={(e) => setBookDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Preferred Arrival Slot *
                      </label>
                      <select
                        value={bookSlot}
                        onChange={(e) => setBookSlot(e.target.value as TimeSlotType)}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                      >
                        {VALIDATION_RULES.TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Cooling Issue or Special Instructions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      maxLength={500}
                      value={bookNotes}
                      onChange={(e) => setBookNotes(e.target.value)}
                      placeholder="e.g., Indoor unit making vibration sound, or bring 12ft ladder for outdoor unit"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                    />
                  </div>

                  {/* Checkbox to sync with Maintenance Reminder Tracker */}
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoTrackReminder}
                      onChange={(e) => setAutoTrackReminder(e.target.checked)}
                      className="mt-0.5 accent-sky-600"
                    />
                    <span>
                      Automatically add this AC unit to my{' '}
                      <strong className="text-slate-900">Upcoming Maintenance Reminder Tracker</strong>{' '}
                      after booking
                    </span>
                  </label>

                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-500">Estimated Total Payable</span>
                      <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                        ₹{bookingEstimateResult.finalTotal.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={bookingSubmitting}
                      className="px-6 py-3.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {bookingSubmitting
                        ? 'Confirming Dispatch...'
                        : user
                        ? 'Confirm Online Booking'
                        : 'Sign In with Google & Book'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right 5 Columns: Direct Message Form (Emails coolbrosacservice@gmail.com) + WhatsApp + Helpline */}
              <div id="send-message" className="lg:col-span-5 space-y-6">
                {/* Direct Message Card that sends an email to coolbrosacservice@gmail.com */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
                  <div>
                    <p className="text-xs font-mono text-sky-700">
                      INSTANT EMAIL & WHATSAPP DISPATCH DESK
                    </p>
                    <h3 className="text-xl font-display font-bold text-slate-900 mt-1">
                      Send Us a Direct Message
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Every message submitted here is immediately emailed to{' '}
                      <span className="font-mono font-semibold text-slate-800">
                        {OWNER_EMAIL}
                      </span>{' '}
                      or can be sent directly via WhatsApp to{' '}
                      <span className="font-mono font-semibold text-slate-800">
                        +91 9560415262
                      </span>
                      .
                    </p>
                  </div>

                  {msgFeedback && (
                    <div
                      className={`p-3.5 rounded-lg border text-xs ${
                        msgFeedback.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-red-50 border-red-200 text-red-900'
                      }`}
                    >
                      <p className="font-medium">{msgFeedback.text}</p>
                      {msgFeedback.mailtoHref && (
                        <a
                          href={msgFeedback.mailtoHref}
                          className="inline-block mt-1.5 font-semibold underline"
                        >
                          Also open in your email client →
                        </a>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleSendMessageSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          minLength={2}
                          maxLength={100}
                          value={msgName}
                          onChange={(e) => setMsgName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          minLength={10}
                          maxLength={20}
                          value={msgPhone}
                          onChange={(e) => setMsgPhone(e.target.value)}
                          placeholder="+91 9876543210"
                          className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Your Email
                        </label>
                        <input
                          type="email"
                          maxLength={120}
                          value={msgEmail}
                          onChange={(e) => setMsgEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Inquiry Topic
                        </label>
                        <select
                          value={msgSubject}
                          onChange={(e) => setMsgSubject(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                        >
                          <option value="General AC Inquiry">General AC Inquiry</option>
                          <option value="Emergency Breakdown Support">
                            Emergency Breakdown Support
                          </option>
                          <option value="Commercial / AMC Quote">Commercial / AMC Quote</option>
                          <option value="Callback Request">Callback Request</option>
                          <option value="Service Feedback">Service Feedback</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Message *
                      </label>
                      <textarea
                        rows={3}
                        required
                        minLength={5}
                        maxLength={1000}
                        value={msgBody}
                        onChange={(e) => setMsgBody(e.target.value)}
                        placeholder="Describe your AC issue, model, or preferred callback time..."
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-600"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                      <button
                        type="submit"
                        disabled={msgSending}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {msgSending ? 'Sending Email...' : 'Send Message (Email Alert)'}
                        </span>
                      </button>

                      <a
                        href={currentMessageWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send on WhatsApp</span>
                      </a>
                    </div>
                  </form>
                </div>

                {/* Direct Contact Channels Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
                  <div>
                    <p className="text-xs font-mono text-sky-700">
                      DIRECT ENGINEER HELPLINE
                    </p>
                    <h3 className="text-lg font-display font-bold text-slate-900 mt-1">
                      Instant Call, WhatsApp & Email Channels
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {/* WhatsApp Direct Button */}
                    <a
                      href={buildWhatsAppUrl(
                        'Hi Cool Bros AC Service, I need assistance with AC servicing / repair.'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-xl flex items-center justify-between hover:border-emerald-500 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-emerald-800 font-medium">
                            Message on WhatsApp
                          </p>
                          <p className="text-base font-mono font-bold text-slate-900 group-hover:text-emerald-700">
                            +91 9560415262
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
                        Chat Now →
                      </span>
                    </a>

                    {/* Phone Call Direct Button */}
                    <a
                      href="tel:+919560415262"
                      className="p-4 border border-slate-200 rounded-xl flex items-center justify-between hover:border-sky-600 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">24/7 Dispatch & Booking Line</p>
                          <p className="text-base font-mono font-bold text-slate-900 group-hover:text-sky-700">
                            +91 9560415262
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-sky-700 whitespace-nowrap">
                        Call Now →
                      </span>
                    </a>

                    {/* Email Direct Button */}
                    <a
                      href="mailto:coolbrosacservice@gmail.com"
                      className="p-4 border border-slate-200 rounded-xl flex items-center justify-between hover:border-sky-600 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">Official Service & AMC Desk</p>
                          <p className="text-sm font-mono font-semibold text-slate-900 truncate group-hover:text-sky-700">
                            coolbrosacservice@gmail.com
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-sky-700 whitespace-nowrap ml-2">
                        Email →
                      </span>
                    </a>
                  </div>

                  <div className="pt-4 border-t border-slate-200 space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Background-verified, factory-trained HVAC technicians</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Operating Hours: 08:00 AM – 09:00 PM (7 Days a Week)</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Rapid Service Coverage Across All Residential & Commercial Sectors</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* QUIET FOOTER */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-slate-800">
            <div>
              <p className="text-lg font-display font-bold text-white">
                Cool Bros AC Service
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Precision Hydro-Jet AC Servicing, Refrigerant Charging & Preventive Maintenance
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-300">
              <a href="#services" className="hover:text-white transition-colors">
                Services
              </a>
              <a href="#protocol" className="hover:text-white transition-colors">
                6-Stage Protocol
              </a>
              <a href="#dashboard" className="hover:text-white transition-colors">
                Customer Dashboard
              </a>
              <a href="#book-now" className="hover:text-white transition-colors">
                Book Online
              </a>
              <a href="#send-message" className="hover:text-white transition-colors">
                Send Message
              </a>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={buildWhatsAppUrl(
                  'Hi Cool Bros AC Service, I would like to inquire about AC servicing.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-emerald-400 hover:text-emerald-300"
              >
                WhatsApp: +91 9560415262
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="tel:+919560415262"
                className="font-mono text-slate-200 hover:text-sky-400"
              >
                Phone: +91 9560415262
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="mailto:coolbrosacservice@gmail.com"
                className="font-mono text-slate-200 hover:text-sky-400"
              >
                Email: coolbrosacservice@gmail.com
              </a>
            </div>
            <p className="text-slate-500">
              © {new Date().getFullYear()} Cool Bros AC Service. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
