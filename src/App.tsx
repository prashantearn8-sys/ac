/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  Phone,
  Mail,
  ArrowUpRight,
  LogOut,
  MapPin,
  MessageCircle,
  Plus,
  Minus,
  Star,
  Trash2,
  ShieldCheck,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  CustomerReviewRecord,
  MessageSubject,
  OperationType,
  ServiceItemRecord,
  ServiceType,
  auth,
  createCustomerMessageInFirestore,
  createReviewInFirestore,
  db,
  deleteReviewInFirestore,
  handleFirestoreError,
  isAdminEmail,
  signInWithGoogle,
  signOutUser,
} from './firebase';
import {
  AREA_LIST,
  AreaSlug,
  buildWhatsAppUrl,
  COMPATIBLE_AC_BRANDS,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  FAQ_ITEMS,
  INSPECTION_AND_PARTS_RATES,
  OPERATING_HOURS,
  OWNER_EMAIL,
  PROTOCOL_STEPS,
  SERVICE_AREAS,
  SERVICE_PACKAGES,
} from './data/acServices';
import {
  CoolBrosLogo,
  HeroCoolingIllustration,
  ServiceCardIllustration,
} from './components/AcGraphics';
import { BRAND_LIST, BrandLogoSvg } from './components/BrandLogos';
import type { DisplayServiceItem } from './components/AdminPage';
import { LEGAL_PAGE_TABS, LegalPageSlug } from './components/LegalPages';

const AdminPage = React.lazy(() =>
  import('./components/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const LegalPageView = React.lazy(() =>
  import('./components/LegalPages').then((m) => ({ default: m.LegalPageView }))
);

interface EmailNotificationPayload {
  type: 'Direct App Message' | 'New Service Booking';
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  subject: string;
  message: string;
  _gotcha?: string;
}

async function dispatchEmailToOwner(payload: EmailNotificationPayload): Promise<boolean> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ok && (data.method === 'smtp' || data.method === 'formsubmit-relay')) {
        return true;
      }
    }
  } catch {
    // Proceed to browser relay fallback
  }

  try {
    const fallbackRes = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(OWNER_EMAIL)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `[Cool Bros AC App] ${payload.subject} - ${payload.senderName}`,
          _template: 'table',
          Notification_Type: payload.type,
          Customer_Name: payload.senderName,
          Contact_Channel: payload.senderPhone,
          Customer_Email: payload.senderEmail,
          Subject: payload.subject,
          Message: payload.message,
        }),
      }
    );
    return fallbackRes.ok;
  } catch {
    return false;
  }
}

const INITIAL_FEATURED_REVIEWS: CustomerReviewRecord[] = [
  {
    id: 'featured-rev-1',
    authorId: 'verified-client-1',
    authorName: 'Rohan Malhotra',
    isVerifiedUser: true,
    approved: true,
    rating: 5,
    serviceUsed: 'Foam Power Jet Service',
    locality: 'Dwarka Sector 10, Delhi',
    reviewText:
      'The technician used a 360-degree waterproof jacket and a 140 PSI hydro-jet gun. Our bedroom wall stayed clean and dry, and the AC cooling improved noticeably within 20 minutes.',
  },
  {
    id: 'featured-rev-2',
    authorId: 'verified-client-2',
    authorName: 'Priya Sharma',
    isVerifiedUser: true,
    approved: true,
    rating: 5,
    serviceUsed: 'Gas Charging & Leak Fix',
    locality: 'DLF Phase 4, Gurugram',
    reviewText:
      'Other local mechanics kept topping up gas every summer. Cool Bros pressure-tested with nitrogen, brazed the flare leak, pulled a 500-micron vacuum, and recharged R32 by weight. Super professional!',
  },
  {
    id: 'featured-rev-3',
    authorId: 'guest',
    authorName: 'Vikramaditya Khanna',
    isVerifiedUser: false,
    approved: true,
    rating: 5,
    serviceUsed: 'Anti-Rust Deep Chemical Wash',
    locality: 'Vasant Kunj, Delhi',
    reviewText:
      'Booked via WhatsApp and the engineer arrived within 50 minutes. The anti-rust coil coating and outdoor condenser wash made our 4-year-old inverter AC run smoothly again.',
  },
];

function parseRouteFromPathname(pathname: string): {
  admin: boolean;
  legal: LegalPageSlug | null;
  area: AreaSlug | null;
} {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/admin') {
    return { admin: true, legal: null, area: null };
  }
  if (
    clean === '/terms' ||
    clean === '/privacy' ||
    clean === '/return-policy' ||
    clean === '/refund-policy'
  ) {
    return { admin: false, legal: clean.slice(1) as LegalPageSlug, area: null };
  }
  const maybeArea = clean.slice(1) as AreaSlug;
  if (maybeArea in SERVICE_AREAS) {
    return { admin: false, legal: null, area: maybeArea };
  }
  return { admin: false, legal: null, area: null };
}

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const isAdmin = isAdminEmail(user?.email);

  // URL-synced View State (supports browser Back/Forward buttons and direct links)
  const initialRoute =
    typeof window !== 'undefined'
      ? parseRouteFromPathname(window.location.pathname)
      : { admin: false, legal: null, area: null };

  const [activeAdminPage, setActiveAdminPage] = useState<boolean>(initialRoute.admin);
  const [activeLegalPage, setActiveLegalPage] = useState<LegalPageSlug | null>(
    initialRoute.legal
  );
  const [activeAreaSlug, setActiveAreaSlug] = useState<AreaSlug | null>(initialRoute.area);

  // Live Firestore Services State (Admin Pricing & Custom Services)
  const [firestoreServices, setFirestoreServices] = useState<ServiceItemRecord[]>([]);

  // Live Approved Firestore Reviews State (Capped at limit(20) to prevent read quota exhaustion)
  const [firestoreReviews, setFirestoreReviews] = useState<CustomerReviewRecord[]>([]);
  const [reviewFilterRating, setReviewFilterRating] = useState<number | 'all'>('all');
  const [reviewPage, setReviewPage] = useState<number>(1);
  const REVIEWS_PER_PAGE = 3;

  // Review Form State
  const [revName, setRevName] = useState('');
  const [revLocality, setRevLocality] = useState('');
  const [revService, setRevService] = useState<ServiceType>('Foam Power Jet Service');
  const [revRating, setRevRating] = useState<number>(5);
  const [revHoverRating, setRevHoverRating] = useState<number | null>(null);
  const [revText, setRevText] = useState('');
  const [revSubmitting, setRevSubmitting] = useState(false);
  const [revFeedback, setRevFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState<string | null>(null);

  // Profile Popover & Interactive Accordion State
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [openStepIndex, setOpenStepIndex] = useState<number>(-1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);

  // Direct Message Form State (WhatsApp + Background Dispatch)
  const [msgName, setMsgName] = useState('');
  const [msgSubject, setMsgSubject] = useState<MessageSubject>('General AC Inquiry');
  const [msgAcDetails, setMsgAcDetails] = useState('Split AC (1 Unit)');
  const [msgLocation, setMsgLocation] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgHoneypot, setMsgHoneypot] = useState('');

  // Sync with browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRouteFromPathname(window.location.pathname);
      setActiveAdminPage(parsed.admin);
      setActiveLegalPage(parsed.legal);
      setActiveAreaSlug(parsed.area);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const pushPath = (path: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  const openLegalPage = (slug: LegalPageSlug) => {
    setActiveAdminPage(false);
    setActiveAreaSlug(null);
    setActiveLegalPage(slug);
    pushPath(`/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAdminDashboard = () => {
    setActiveLegalPage(null);
    setActiveAreaSlug(null);
    setActiveAdminPage(true);
    setProfileMenuOpen(false);
    pushPath('/admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAreaPage = (slug: AreaSlug) => {
    setActiveAdminPage(false);
    setActiveLegalPage(null);
    setActiveAreaSlug(slug);
    setMsgLocation(SERVICE_AREAS[slug].shortName);
    pushPath(`/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateHomeSection = (sectionId?: string) => {
    setActiveAdminPage(false);
    setActiveLegalPage(null);
    if (!sectionId) {
      setActiveAreaSlug(null);
      pushPath('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (activeAdminPage || activeLegalPage) {
      pushPath('/');
    }
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 40);
  };

  // Desktop Escape key handler for menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAvatarImgError(false);
      setProfileMenuOpen(false);
      if (currentUser?.displayName) {
        setMsgName((prev) => prev || currentUser.displayName || '');
        setRevName((prev) => prev || currentUser.displayName || '');
      }
    });
    return () => unsubAuth();
  }, []);

  // Listen to Public Services in Firestore (Admin pricing & newly added services)
  useEffect(() => {
    const servicesQuery = query(collection(db, 'services'), limit(30));
    const unsubServices = onSnapshot(
      servicesQuery,
      (snapshot) => {
        const rows: ServiceItemRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ServiceItemRecord, 'id'>),
        }));
        setFirestoreServices(rows);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'services');
      }
    );
    return () => unsubServices();
  }, []);

  // Listen to Approved Public Customer Reviews in Firestore (Capped at limit(20) + ordered by createdAt)
  useEffect(() => {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('approved', '==', true),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubReviews = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const rows: CustomerReviewRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CustomerReviewRecord, 'id'>),
        }));
        setFirestoreReviews(rows);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reviews');
      }
    );
    return () => unsubReviews();
  }, []);

  // Merge default SERVICE_PACKAGES with Firestore overrides and custom added services
  const displayServices: DisplayServiceItem[] = [
    ...SERVICE_PACKAGES.map((pkg, idx) => {
      const fsMatch = firestoreServices.find((f) => f.id === pkg.id);
      return {
        id: pkg.id,
        name: fsMatch ? fsMatch.name : pkg.name,
        tagline: fsMatch && fsMatch.tagline ? fsMatch.tagline : pkg.tagline,
        priceInr: fsMatch ? fsMatch.priceInr : pkg.basePriceInr,
        unitLabel: pkg.unitLabel,
        warrantyLabel: pkg.warrantyLabel,
        iconIndex: fsMatch ? fsMatch.iconIndex : idx % 6,
        isDefault: true,
        existsInFirestore: Boolean(fsMatch),
      };
    }),
    ...firestoreServices
      .filter((f) => !SERVICE_PACKAGES.some((p) => p.id === f.id))
      .map((f) => ({
        id: f.id,
        name: f.name,
        tagline: f.tagline || 'Complete doorstep AC servicing & checkup per AC unit',
        priceInr: f.priceInr,
        unitLabel: 'per AC · incl. taxes',
        warrantyLabel: '30-Day Service Warranty',
        iconIndex: f.iconIndex ?? 0,
        isDefault: false,
        existsInFirestore: true,
      })),
  ];

  const foamJetService = displayServices.find((s) => s.id === 'foam-jet') || displayServices[0];
  const foamJetPriceFormatted = foamJetService
    ? foamJetService.priceInr.toLocaleString('en-IN')
    : '599';

  const allReviews = [...firestoreReviews, ...INITIAL_FEATURED_REVIEWS];
  const filteredReviews =
    reviewFilterRating === 'all'
      ? allReviews
      : allReviews.filter((r) => r.rating === reviewFilterRating);

  const totalReviewPages = Math.max(
    1,
    Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE)
  );
  const currentReviewPage = Math.min(reviewPage, totalReviewPages);
  const reviewStartIdx = (currentReviewPage - 1) * REVIEWS_PER_PAGE;
  const paginatedReviews = filteredReviews.slice(
    reviewStartIdx,
    reviewStartIdx + REVIEWS_PER_PAGE
  );

  const getVisiblePageNumbers = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    if (totalReviewPages <= 5) {
      return Array.from({ length: totalReviewPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [1];
    const start = Math.max(2, currentReviewPage - 1);
    const end = Math.min(totalReviewPages - 1, currentReviewPage + 1);
    if (start > 2) pages.push('ellipsis-start');
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    if (end < totalReviewPages - 1) pages.push('ellipsis-end');
    pages.push(totalReviewPages);
    return pages;
  };

  const averageRating =
    allReviews.length > 0
      ? (
          allReviews.reduce((acc, item) => acc + item.rating, 0) / allReviews.length
        ).toFixed(1)
      : '5.0';

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setAuthError(null);
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google Sign-In could not be completed.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevFeedback(null);
    setRevSubmitting(true);

    try {
      const reviewerName =
        revName.trim() || user?.displayName || user?.email?.split('@')[0] || '';
      const result = await createReviewInFirestore({
        authorName: reviewerName,
        rating: revRating,
        serviceUsed: revService,
        locality: revLocality.trim() || 'Delhi / Gurugram',
        reviewText: revText.trim(),
      });

      setRevFeedback({
        type: 'success',
        text: result.approved
          ? 'Thank you! Your review has been published live.'
          : 'Thank you! Your review has been submitted and will appear publicly once approved by our moderation team.',
      });
      setRevText('');
      setRevRating(5);
      setReviewFilterRating('all');
      setReviewPage(1);
    } catch (err) {
      let friendlyMsg =
        err instanceof Error ? err.message : 'Could not submit review.';
      try {
        const parsed = JSON.parse(friendlyMsg);
        if (parsed && parsed.error) {
          friendlyMsg = parsed.error;
        }
      } catch {
        // Use raw message
      }
      setRevFeedback({
        type: 'error',
        text: friendlyMsg,
      });
    } finally {
      setRevSubmitting(false);
    }
  };

  const handleDeleteOwnReview = async (reviewId: string) => {
    setConfirmDeleteReviewId(null);
    try {
      await deleteReviewInFirestore(reviewId);
    } catch {
      // Ignore if not owner
    }
  };

  const formattedWhatsAppMessage = [
    '*Cool Bros AC Service — Direct Inquiry*',
    `• *Customer:* ${msgName.trim() || 'Not specified'}`,
    `• *Topic:* ${msgSubject}`,
    ...(msgAcDetails.trim() ? [`• *AC Unit:* ${msgAcDetails.trim()}`] : []),
    ...(msgLocation.trim() ? [`• *Location:* ${msgLocation.trim()}`] : []),
    `• *Requirement:* ${
      msgBody.trim() || 'Please share slot availability and service details.'
    }`,
  ].join('\n');

  const currentMessageWhatsAppUrl = buildWhatsAppUrl(formattedWhatsAppMessage);

  const handleQuickTemplateSelect = (
    topic: MessageSubject,
    templateText: string,
    defaultUnit?: string
  ) => {
    setMsgSubject(topic);
    setMsgBody(templateText);
    if (defaultUnit) {
      setMsgAcDetails(defaultUnit);
    }
  };

  const handleWhatsAppFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (msgHoneypot.trim().length > 0) {
      return;
    }

    const cleanName = msgName.trim();
    const cleanBody = msgBody.trim();
    if (cleanName.length < 2 || cleanBody.length < 5) {
      return;
    }

    const fullMessageText = [
      msgAcDetails.trim() ? `AC Unit: ${msgAcDetails.trim()}` : '',
      msgLocation.trim() ? `Location: ${msgLocation.trim()}` : '',
      cleanBody,
    ]
      .filter(Boolean)
      .join(' | ');

    if (user && user.emailVerified) {
      createCustomerMessageInFirestore({
        senderName: cleanName,
        locality: msgLocation.trim(),
        acDetails: msgAcDetails.trim(),
        subject: msgSubject,
        messageText: cleanBody,
      }).catch(() => {});
    }

    dispatchEmailToOwner({
      type: 'Direct App Message',
      senderName: cleanName,
      senderPhone: 'WhatsApp Dispatch',
      senderEmail: user?.email || 'Not provided',
      subject: `${msgSubject} (WhatsApp Dispatch)`,
      message: fullMessageText,
      _gotcha: msgHoneypot,
    }).catch(() => {});

    window.location.href = currentMessageWhatsAppUrl;
  };

  const activeArea = activeAreaSlug ? SERVICE_AREAS[activeAreaSlug] : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-white text-[#191A23] selection:bg-[#7DD3FC] selection:text-[#191A23]">
        {/* Accessibility Skip Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2.5 focus:bg-[#191A23] focus:text-[#7DD3FC] focus:font-mono focus:text-xs focus:font-bold focus:rounded-xl"
        >
          Skip to main content
        </a>

        {/* FIXED COMPACT FULL-BLEED HEADER: Touches top, left, and right edges, slim height, never hides on scroll */}
        <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#191A23]/15">
          <div className="w-full flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 lg:px-6 h-13 sm:h-15 phone-landscape-header">
            {/* Zone 1: Brand Snowflake Emblem + Wordmark */}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigateHomeSection();
              }}
              className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base lg:text-lg font-display font-bold tracking-tight text-[#191A23] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23] rounded-lg"
            >
              <CoolBrosLogo className="w-7 h-7 sm:w-8 sm:h-8 text-[#191A23]" />
              <span className="hidden sm:inline">Cool Bros AC Service</span>
              <span className="sm:hidden">Cool Bros AC</span>
            </a>

            {/* Zone 2: Clean Single-Line Navigation Links (Desktop lg+) */}
            <nav
              aria-label="Primary Navigation"
              className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs xl:text-sm font-medium text-[#191A23]"
            >
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault();
                  navigateHomeSection('services');
                }}
                className="py-1 hover:underline decoration-[#7DD3FC] decoration-2 underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23] rounded"
              >
                Services &amp; Rates
              </a>
              <a
                href="#protocol"
                onClick={(e) => {
                  e.preventDefault();
                  navigateHomeSection('protocol');
                }}
                className="py-1 hover:underline decoration-[#7DD3FC] decoration-2 underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23] rounded"
              >
                Working Process
              </a>
              <a
                href="#faq"
                onClick={(e) => {
                  e.preventDefault();
                  navigateHomeSection('faq');
                }}
                className="py-1 hover:underline decoration-[#7DD3FC] decoration-2 underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23] rounded"
              >
                FAQ
              </a>
              <a
                href="#reviews"
                onClick={(e) => {
                  e.preventDefault();
                  navigateHomeSection('reviews');
                }}
                className="py-1 hover:underline decoration-[#7DD3FC] decoration-2 underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23] rounded"
              >
                Reviews
              </a>
              <a
                href="#send-message"
                onClick={(e) => {
                  e.preventDefault();
                  navigateHomeSection('send-message');
                }}
                className="py-1 hover:underline decoration-[#7DD3FC] decoration-2 underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23] rounded"
              >
                Contact Us
              </a>
              {isAdmin && (
                <button
                  type="button"
                  onClick={openAdminDashboard}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border border-[#191A23] transition-colors cursor-pointer ${
                    activeAdminPage
                      ? 'bg-[#191A23] text-[#7DD3FC]'
                      : 'bg-[#7DD3FC] text-[#191A23] hover:bg-[#38BDF8]'
                  }`}
                >
                  Admin Page
                </button>
              )}
            </nav>

            {/* Zone 3: Call Button + WhatsApp Button + User Account / Sign In */}
            <div className="relative flex items-center gap-1.5 sm:gap-2 shrink-0">
              <a
                href={CONTACT_PHONE_HREF}
                className="inline-flex items-center justify-center p-2 min-w-[36px] sm:min-w-[38px] min-h-[36px] sm:min-h-[38px] text-xs font-bold text-white bg-[#191A23] border border-[#191A23] rounded-xl hover:bg-[#0369A1] transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                title={`Call ${CONTACT_PHONE_DISPLAY}`}
                aria-label={`Call ${CONTACT_PHONE_DISPLAY}`}
              >
                <Phone className="w-4 h-4 text-[#7DD3FC] shrink-0" aria-hidden="true" />
              </a>

              <a
                href={buildWhatsAppUrl(
                  'Hi Cool Bros AC Service, I would like to book an AC service / inquiry.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center p-2 min-w-[36px] sm:min-w-[38px] min-h-[36px] sm:min-h-[38px] text-xs font-bold text-[#191A23] bg-[#86EFAC] border border-[#191A23] rounded-xl hover:bg-[#4ADE80] transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                title={`WhatsApp ${CONTACT_PHONE_DISPLAY}`}
                aria-label={`WhatsApp ${CONTACT_PHONE_DISPLAY}`}
              >
                <svg
                  className="w-4 h-4 fill-current shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.459 3.474 1.332 4.988L2 22l5.182-1.359c1.466.8 3.116 1.222 4.849 1.222 5.515 0 9.969-4.453 9.969-9.969S17.546 2 12.031 2zm0 18.212c-1.491 0-2.953-.4-4.231-1.158l-.303-.18-3.144.825.839-3.063-.197-.314a8.21 8.21 0 0 1-1.277-4.384c0-4.544 3.697-8.241 8.242-8.241 4.544 0 8.241 3.697 8.241 8.241 0 4.545-3.626 8.274-8.17 8.274zm4.52-6.168c-.248-.124-1.466-.723-1.693-.806-.227-.083-.392-.124-.558.124-.165.248-.64.806-.785.971-.144.165-.289.186-.537.062-.248-.124-1.046-.386-1.993-1.23-.737-.657-1.234-1.468-1.379-1.716-.144-.248-.015-.382.109-.505.111-.111.248-.289.372-.434.124-.144.165-.248.248-.413.083-.165.041-.31-.021-.434-.062-.124-.558-1.343-.764-1.839-.201-.483-.405-.418-.558-.426l-.475-.008c-.165 0-.434.062-.661.31-.227.248-.868.847-.868 2.066s.888 2.397 1.012 2.562c.124.165 1.748 2.669 4.235 3.742.591.255 1.053.408 1.413.522.594.189 1.135.162 1.562.098.476-.071 1.466-.599 1.673-1.178.206-.578.206-1.074.144-1.178-.062-.103-.227-.165-.475-.289z" />
                </svg>
              </a>

              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    aria-expanded={profileMenuOpen}
                    aria-haspopup="true"
                    title={user.displayName || user.email || 'Account'}
                    aria-label="User account menu"
                    className="group inline-flex items-center justify-center p-1 min-w-[36px] sm:min-w-[38px] min-h-[36px] sm:min-h-[38px] text-xs font-semibold text-[#191A23] bg-white border border-[#191A23] rounded-xl hover:bg-[#7DD3FC] transition-all duration-150 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                  >
                    {user.photoURL && !avatarImgError ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || user.email || 'User profile'}
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarImgError(true)}
                        className="w-6 h-6 rounded-full object-cover border border-[#191A23] shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#191A23] text-[#7DD3FC] flex items-center justify-center text-xs font-bold uppercase shrink-0">
                        {(user.displayName || user.email || 'U').charAt(0)}
                      </div>
                    )}
                  </button>

                  {profileMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2.5 w-64 bg-white border border-[#191A23] rounded-2xl p-3.5 z-50 space-y-2.5">
                        <div className="flex items-center gap-3 px-2 py-1.5 border-b border-[#191A23]/15">
                          {user.photoURL && !avatarImgError ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName || user.email || 'User profile'}
                              referrerPolicy="no-referrer"
                              onError={() => setAvatarImgError(true)}
                              className="w-9 h-9 rounded-full object-cover border border-[#191A23] shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#191A23] text-[#7DD3FC] flex items-center justify-center text-sm font-bold uppercase shrink-0">
                              {(user.displayName || user.email || 'U').charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#191A23] truncate">
                              {isAdmin
                                ? 'Admin Account'
                                : user.displayName || 'Verified Customer'}
                            </p>
                            <p className="text-xs font-mono text-[#191A23]/75 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={openAdminDashboard}
                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 min-h-[40px] text-xs font-bold text-[#191A23] bg-[#7DD3FC] border border-[#191A23] hover:bg-[#38BDF8] rounded-xl transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Open Admin Page</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            signOutUser();
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 min-h-[42px] text-xs font-bold text-white bg-[#191A23] hover:bg-red-600 rounded-xl transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
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
                  disabled={isSigningIn}
                  className="group inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 min-h-[36px] sm:min-h-[38px] text-xs font-semibold text-[#191A23] bg-white border border-[#191A23] rounded-xl hover:bg-[#7DD3FC] disabled:opacity-60 transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                >
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
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
                  <span>{isSigningIn ? 'Signing In...' : 'Sign In'}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Auth Error Alert */}
        {authError && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-13 sm:mt-15 bg-[#7DD3FC] border-b border-[#191A23] px-4 py-2.5 text-center text-xs font-semibold text-[#191A23]"
          >
            <span>{authError}</span>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="ml-3 underline font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <main id="main-content" className="flex-1 pt-13 sm:pt-15 phone-landscape-main">
          <Suspense
            fallback={
              <div className="py-20 text-center text-sm font-mono text-[#191A23]">
                Loading view...
              </div>
            }
          >
            {activeAdminPage ? (
              <AdminPage
                user={user}
                services={displayServices}
                onSignIn={handleGoogleSignIn}
                onBackToHome={() => navigateHomeSection()}
              />
            ) : activeLegalPage ? (
              <LegalPageView
                activeSlug={activeLegalPage}
                onSelectSlug={(slug) => openLegalPage(slug)}
                onBackHome={() => navigateHomeSection()}
                whatsappUrl={buildWhatsAppUrl(
                  `Hi Cool Bros AC Service, I have a question regarding your ${activeLegalPage.replace('-', ' ')}.`
                )}
              />
            ) : (
              <>
                {/* DEDICATED LOCAL AREA LANDING BANNER WHEN AN AREA ROUTE IS ACTIVE */}
                {activeArea && (
                  <div className="bg-[#191A23] text-white border-b-2 border-[#191A23] py-6 sm:py-8">
                    <div className="w-full px-3 sm:px-4 lg:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-[#7DD3FC] text-[#191A23] text-xs font-mono font-bold">
                            {activeArea.city.toUpperCase()} · {activeArea.etaText.toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={() => navigateHomeSection()}
                            className="text-xs font-mono text-[#7DD3FC] underline cursor-pointer"
                          >
                            View All Delhi &amp; Gurugram Areas
                          </button>
                        </div>
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-white">
                          {activeArea.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                          {activeArea.description}
                        </p>
                        <p className="text-xs font-mono text-[#7DD3FC]">
                          Key Localities: {activeArea.sectorsCovered}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <a
                          href={buildWhatsAppUrl(
                            `Hi Cool Bros AC Service, I need AC servicing / repair in ${activeArea.shortName}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-3 rounded-xl bg-[#86EFAC] text-[#191A23] font-bold text-xs sm:text-sm border border-[#191A23]"
                        >
                          Book in {activeArea.shortName}
                        </a>
                        <a
                          href={CONTACT_PHONE_HREF}
                          className="px-5 py-3 rounded-xl bg-white text-[#191A23] font-mono font-bold text-xs sm:text-sm"
                        >
                          Call {CONTACT_PHONE_DISPLAY}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* SPLIT HERO SECTION */}
                <section className="pt-2 pb-10 sm:pt-3 sm:pb-12 lg:pt-3 lg:pb-14 phone-landscape-hero-section">
                  <div className="w-full px-3 sm:px-4 lg:px-6">
                    <div className="grid grid-cols-1 landscape:grid-cols-12 md:grid-cols-12 gap-5 sm:gap-8 lg:gap-10 items-center phone-landscape-hero-grid">
                      {/* Left Column (Mobile Landscape, Tablet & Desktop) / Bottom (Mobile Portrait): Editorial Headline, Copy, & Primary CTAs */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="order-2 landscape:order-1 md:order-1 landscape:col-span-7 md:col-span-6 space-y-4 landscape:space-y-2 sm:space-y-6 text-left phone-landscape-hero-text"
                      >
                        <h1
                          className="font-display font-bold text-[#191A23] tracking-tight text-balance text-2xl sm:text-4xl lg:text-5xl landscape:text-xl phone-landscape-hero-title"
                          style={{ fontSize: 'clamp(1.35rem, 3.2vw, 3.8rem)', lineHeight: 1.1 }}
                        >
                          {activeArea
                            ? activeArea.title
                            : 'Expert AC Service & Repair at Your Doorstep'}
                        </h1>

                        <p className="text-sm sm:text-lg text-[#191A23]/85 leading-relaxed landscape:text-xs landscape:leading-snug max-w-[52ch] phone-landscape-hero-desc">
                          Fast, reliable 140 PSI foam jet cleaning, R32/R410A gas charging, and
                          inverter PCB repair across{' '}
                          <strong className="font-semibold text-[#191A23]">
                            Delhi &amp; Gurugram
                          </strong>{' '}
                          ({OPERATING_HOURS}).
                        </p>

                        <div className="pt-1 sm:pt-2 grid grid-cols-1 landscape:flex landscape:flex-row sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-4 phone-landscape-hero-cta-wrap">
                          <a
                            href="#send-message"
                            className="inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3 sm:py-4 min-h-[42px] sm:min-h-[50px] text-xs sm:text-sm font-semibold text-white bg-[#191A23] border border-[#191A23] rounded-2xl hover:bg-[#191A23]/90 active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23] phone-landscape-hero-btn"
                          >
                            <span>Book AC Service</span>
                          </a>

                          <a
                            href={buildWhatsAppUrl(
                              'Hi Cool Bros AC Service, I would like to book an AC service / inquiry.'
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-4 min-h-[42px] sm:min-h-[50px] text-xs sm:text-sm font-bold text-[#191A23] bg-[#86EFAC] border border-[#191A23] rounded-2xl hover:bg-[#4ADE80] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23] phone-landscape-hero-btn"
                          >
                            <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>WhatsApp Us</span>
                          </a>
                        </div>

                        {/* Direct Contact Trust Strip */}
                        <div className="pt-0.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs sm:text-sm font-medium text-[#191A23]/85 phone-landscape-hero-trust">
                          <a
                            href={CONTACT_PHONE_HREF}
                            className="inline-flex items-center gap-1.5 py-0.5 font-mono font-bold text-[#191A23] hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{CONTACT_PHONE_DISPLAY}</span>
                          </a>
                          <span aria-hidden="true">·</span>
                          <a
                            href={`mailto:${OWNER_EMAIL}`}
                            className="inline-flex items-center gap-1.5 py-0.5 font-mono hover:underline break-all sm:break-normal"
                          >
                            <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{OWNER_EMAIL}</span>
                          </a>
                        </div>
                      </motion.div>

                      {/* Right Column (Mobile Landscape, Tablet & Desktop) / Top (Mobile Portrait): Animated HVAC Vector Art Illustration */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        className="order-1 landscape:order-2 md:order-2 landscape:col-span-5 md:col-span-6 flex justify-center landscape:justify-end md:justify-end items-center phone-landscape-hero-illustration"
                      >
                        <HeroCoolingIllustration />
                      </motion.div>
                    </div>

                    {/* MULTI-BRAND LOGOS SHOWCASE STRIP (B&W by default, colourful on hover) */}
                    <div className="mt-6 sm:mt-12 pt-4 sm:pt-6 border-t border-[#191A23]/15 space-y-3 phone-landscape-brands-strip">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="text-[11px] sm:text-xs font-mono font-bold text-[#191A23] uppercase tracking-wider">
                          We service all major AC brands:
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-mono text-[#191A23]/60">
                          Hover logo to view brand colors
                        </span>
                      </div>

                      {/* Brand Logo Grid: Clean borderless logos, B&W by default, Colourful on cursor hover */}
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-x-4 gap-y-3 sm:gap-x-6 sm:gap-y-4 items-center">
                        {BRAND_LIST.map((brand) => (
                          <div
                            key={brand.id}
                            className="group flex items-center justify-center py-1 transition-all duration-300 cursor-pointer"
                            title={`We service and repair ${brand.name} Air Conditioners`}
                            aria-label={`${brand.name} AC Service & Repair`}
                          >
                            <div className="filter grayscale contrast-125 opacity-55 group-hover:grayscale-0 group-hover:contrast-100 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 ease-out flex items-center justify-center">
                              <BrandLogoSvg brandId={brand.id} className="h-5 sm:h-6 w-auto max-w-[105px] select-none" />
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] sm:text-xs text-[#191A23]/75">
                        Independent multi-brand AC repair &amp; maintenance provider. We service all major brands; brand names and trademarks belong to their respective owners and are displayed strictly to indicate compatibility.
                      </p>
                    </div>
                  </div>
                </section>

                {/* SECTION 01: SERVICES & TRANSPARENT RATE CARD */}
                <section
                  id="services"
                  className="scroll-mt-16 py-12 sm:py-16 lg:py-24 bg-[#F8FAFC] border-y border-[#191A23]/10"
                >
                  <div className="w-full px-3 sm:px-4 lg:px-6 space-y-12">
                    {/* "Services" Heading */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="space-y-2.5">
                        <span className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#0369A1]">
                          <span className="w-2 h-2 rounded-full bg-[#0369A1]" />
                          <span>OUR AC SERVICES &amp; UPFRONT PRICING</span>
                        </span>
                        <div className="space-y-2">
                          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-[#191A23]">
                            Services
                          </h2>
                          <div className="h-1.5 w-20 rounded-full bg-[#0369A1]" />
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={openAdminDashboard}
                          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#191A23] text-[#7DD3FC] text-xs font-mono font-bold hover:bg-[#0369A1] hover:text-white transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                          <span>Edit Prices / Add Services</span>
                        </button>
                      )}
                    </div>

                    {/* Service Cards Grid: Service Image + Name + Included Tagline + Clear Per-AC Price + Contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                      {displayServices.map((item, idx) => (
                        <motion.article
                          key={item.id}
                          initial={{ opacity: 0, y: 18 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-30px' }}
                          transition={{
                            duration: 0.35,
                            delay: idx * 0.05,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          whileHover={{ y: -4 }}
                          className="bg-white border-2 border-[#191A23] rounded-3xl overflow-hidden flex flex-col justify-between transition-all"
                        >
                          {/* 1. Service Image */}
                          <div className="bg-[#F8FAFC] border-b border-[#191A23]/15 p-6 flex items-center justify-center h-48">
                            <ServiceCardIllustration index={item.iconIndex} />
                          </div>

                          {/* 2. Service Name, Included Deliverables Tagline, & Price + 3. Contact */}
                          <div className="p-6 flex flex-col justify-between flex-1 gap-4">
                            <div className="space-y-2.5">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="font-display font-bold text-lg sm:text-xl text-[#191A23] leading-snug">
                                  {item.name}
                                </h3>
                                <div className="shrink-0 text-right">
                                  <span className="inline-block px-3 py-1 rounded-xl bg-[#7DD3FC] border border-[#191A23] font-mono font-bold text-lg sm:text-xl text-[#191A23] tabular-nums">
                                    ₹{item.priceInr.toLocaleString('en-IN')}
                                  </span>
                                  <span className="block text-xs font-mono font-semibold text-[#191A23]/80 mt-1">
                                    {item.unitLabel}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs sm:text-sm text-[#191A23]/85 leading-relaxed">
                                {item.tagline}
                              </p>

                              <span className="inline-block text-xs font-mono font-semibold text-[#0369A1]">
                                ✓ {item.warrantyLabel}
                              </span>
                            </div>

                            {/* Contact Actions: WhatsApp + Icon-Only Call Button */}
                            <div className="flex items-center gap-2.5 pt-1">
                              <a
                                href={buildWhatsAppUrl(
                                  `Hi Cool Bros AC Service, I want to book ${item.name} (₹${item.priceInr.toLocaleString('en-IN')} ${item.unitLabel}).`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-3 min-h-[44px] text-xs sm:text-sm font-bold text-[#191A23] bg-[#86EFAC] border border-[#191A23] rounded-xl hover:bg-[#4ADE80] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                              >
                                <svg
                                  className="w-4 h-4 fill-current shrink-0"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.459 3.474 1.332 4.988L2 22l5.182-1.359c1.466.8 3.116 1.222 4.849 1.222 5.515 0 9.969-4.453 9.969-9.969S17.546 2 12.031 2zm0 18.212c-1.491 0-2.953-.4-4.231-1.158l-.303-.18-3.144.825.839-3.063-.197-.314a8.21 8.21 0 0 1-1.277-4.384c0-4.544 3.697-8.241 8.242-8.241 4.544 0 8.241 3.697 8.241 8.241 0 4.545-3.626 8.274-8.17 8.274zm4.52-6.168c-.248-.124-1.466-.723-1.693-.806-.227-.083-.392-.124-.558.124-.165.248-.64.806-.785.971-.144.165-.289.186-.537.062-.248-.124-1.046-.386-1.993-1.23-.737-.657-1.234-1.468-1.379-1.716-.144-.248-.015-.382.109-.505.111-.111.248-.289.372-.434.124-.144.165-.248.248-.413.083-.165.041-.31-.021-.434-.062-.124-.558-1.343-.764-1.839-.201-.483-.405-.418-.558-.426l-.475-.008c-.165 0-.434.062-.661.31-.227.248-.868.847-.868 2.066s.888 2.397 1.012 2.562c.124.165 1.748 2.669 4.235 3.742.591.255 1.053.408 1.413.522.594.189 1.135.162 1.562.098.476-.071 1.466-.599 1.673-1.178.206-.578.206-1.074.144-1.178-.062-.103-.227-.165-.475-.289z" />
                                </svg>
                                <span>WhatsApp</span>
                              </a>

                              <a
                                href={CONTACT_PHONE_HREF}
                                title={`Call ${CONTACT_PHONE_DISPLAY}`}
                                aria-label={`Call to book ${item.name}`}
                                className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-3 text-white bg-[#191A23] border border-[#191A23] rounded-xl hover:bg-[#0369A1] transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                              >
                                <Phone className="w-4 h-4 text-[#7DD3FC] shrink-0" aria-hidden="true" />
                              </a>
                            </div>
                          </div>
                        </motion.article>
                      ))}
                    </div>

                    {/* PUBLISHED INSPECTION FEE & SPARE PARTS RATE CARD */}
                    <div
                      id="rates"
                      className="scroll-mt-16 bg-white border-2 border-[#191A23] rounded-3xl p-5 sm:p-8 space-y-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#191A23]/15 pb-4">
                        <div>
                          <span className="text-xs font-mono font-bold text-[#0369A1] uppercase tracking-wider">
                            NO HIDDEN CHARGES · PRE-APPROVED RATE CARD
                          </span>
                          <h3 className="text-xl sm:text-2xl font-display font-bold text-[#191A23] mt-1">
                            Inspection Fee &amp; Standard Spare Parts Rate Card
                          </h3>
                        </div>
                        <span className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-[#E0F2FE] border border-[#191A23] text-xs font-mono font-bold text-[#191A23]">
                          ₹0 Visit Fee With Any Service
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {INSPECTION_AND_PARTS_RATES.map((rate) => (
                          <div
                            key={rate.item}
                            className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#191A23]/25 flex flex-col justify-between gap-2.5"
                          >
                            <div className="space-y-1">
                              <h4 className="font-display font-bold text-sm sm:text-base text-[#191A23]">
                                {rate.item}
                              </h4>
                              <p className="text-xs text-[#191A23]/80 leading-relaxed">
                                {rate.specification}
                              </p>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#191A23]/10 text-xs font-mono">
                              <span className="font-bold text-[#191A23] bg-[#7DD3FC] px-2.5 py-0.5 rounded border border-[#191A23]">
                                {rate.priceDisplay}
                              </span>
                              <span className="text-[#191A23]/80 font-semibold">
                                Warranty: {rate.warranty}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 02: COMPACT "OUR WORKING PROCESS" */}
                <section id="protocol" className="scroll-mt-16 py-10 sm:py-14">
                  <div className="w-full px-3 sm:px-4 lg:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 sm:pb-6">
                      <div className="space-y-1.5">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight text-[#191A23]">
                          Our Working Process
                        </h2>
                        <div className="h-1 w-16 rounded-full bg-[#0369A1]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 items-start">
                      {PROTOCOL_STEPS.map((st, index) => {
                        const isOpen = openStepIndex === index;
                        const panelId = `protocol-panel-${st.step}`;
                        return (
                          <motion.div
                            key={st.step}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.25, delay: index * 0.03 }}
                            className={`border-2 border-[#191A23] rounded-2xl overflow-hidden transition-colors duration-200 ${
                              isOpen ? 'bg-[#E0F2FE]' : 'bg-white'
                            }`}
                          >
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              aria-controls={panelId}
                              onClick={() => setOpenStepIndex(isOpen ? -1 : index)}
                              className="w-full px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between gap-2.5 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="px-2.5 py-1 rounded-lg bg-[#7DD3FC] border border-[#191A23] text-xs sm:text-sm font-mono font-bold text-[#191A23] tabular-nums shrink-0">
                                  {st.step}
                                </span>
                                <div className="min-w-0">
                                  <h3 className="text-sm sm:text-base font-display font-bold text-[#191A23] leading-snug truncate">
                                    {st.title}
                                  </h3>
                                  <span className="block text-xs font-mono text-[#0369A1] font-semibold">
                                    {st.metric}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`w-8 h-8 rounded-lg border border-[#191A23] flex items-center justify-center shrink-0 transition-colors ${
                                  isOpen ? 'bg-[#191A23] text-white' : 'bg-[#F8FAFC] text-[#191A23]'
                                }`}
                              >
                                {isOpen ? (
                                  <Minus className="w-4 h-4" aria-hidden="true" />
                                ) : (
                                  <Plus className="w-4 h-4" aria-hidden="true" />
                                )}
                              </span>
                            </button>

                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  id={panelId}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 sm:px-5 pb-3.5 pt-2.5 border-t border-[#191A23]/15 bg-white text-xs sm:text-sm text-[#191A23] leading-relaxed">
                                    {st.description}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* SECTION 03: FREQUENTLY ASKED QUESTIONS (FAQ) & SERVICE AREAS */}
                <section
                  id="faq"
                  className="scroll-mt-16 py-10 sm:py-14 bg-white border-t border-[#191A23]/10"
                >
                  <div className="w-full px-3 sm:px-4 lg:px-6 space-y-10">
                    <div className="space-y-1.5">
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight text-[#191A23]">
                        Frequently Asked Questions
                      </h2>
                      <div className="h-1 w-16 rounded-full bg-[#0369A1]" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
                      {FAQ_ITEMS.map((faq, idx) => {
                        const isOpen = openFaqIndex === idx;
                        const faqPanelId = `faq-panel-${idx}`;
                        return (
                          <div
                            key={faq.question}
                            className={`border-2 border-[#191A23] rounded-2xl overflow-hidden ${
                              isOpen ? 'bg-[#E0F2FE]' : 'bg-[#F8FAFC]'
                            }`}
                          >
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              aria-controls={faqPanelId}
                              onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                              className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                            >
                              <h3 className="text-sm sm:text-base font-display font-bold text-[#191A23] leading-snug">
                                {faq.question}
                              </h3>
                              <span
                                className={`w-8 h-8 rounded-lg border border-[#191A23] flex items-center justify-center shrink-0 ${
                                  isOpen ? 'bg-[#191A23] text-white' : 'bg-white text-[#191A23]'
                                }`}
                              >
                                {isOpen ? (
                                  <Minus className="w-4 h-4" aria-hidden="true" />
                                ) : (
                                  <Plus className="w-4 h-4" aria-hidden="true" />
                                )}
                              </span>
                            </button>
                            {isOpen && (
                              <div
                                id={faqPanelId}
                                className="px-4 sm:px-5 pb-4 pt-2.5 border-t border-[#191A23]/15 bg-white text-xs sm:text-sm text-[#191A23] leading-relaxed"
                              >
                                {faq.answer}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Dedicated Local Area Landing Links (SEO & Quick Dispatch) */}
                    <div className="bg-[#F8FAFC] border-2 border-[#191A23] rounded-3xl p-5 sm:p-6 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-display font-bold text-[#191A23]">
                          Dedicated Doorstep AC Service Hubs Across Delhi &amp; Gurugram
                        </h3>
                        <span className="text-xs font-mono font-semibold text-[#0369A1]">
                          45–60 Min Dispatch · {OPERATING_HOURS}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {AREA_LIST.map((area) => {
                          const isCurrent = activeAreaSlug === area.slug;
                          return (
                            <a
                              key={area.slug}
                              href={`/${area.slug}`}
                              onClick={(e) => {
                                e.preventDefault();
                                openAreaPage(area.slug);
                              }}
                              className={`px-3.5 py-2 rounded-xl border border-[#191A23] text-xs font-bold transition-colors ${
                                isCurrent
                                  ? 'bg-[#191A23] text-[#7DD3FC]'
                                  : 'bg-white text-[#191A23] hover:bg-[#7DD3FC]'
                              }`}
                            >
                              {area.shortName} ({area.city})
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 04: CUSTOMER REVIEWS & RATINGS */}
                <section
                  id="reviews"
                  className="scroll-mt-16 py-12 sm:py-16 lg:py-24 bg-[#F8FAFC] border-y border-[#191A23]/10"
                >
                  <div className="w-full px-3 sm:px-4 lg:px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 pb-8 sm:pb-10">
                      <div className="space-y-2.5">
                        <div className="space-y-2">
                          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-[#191A23]">
                            Reviews &amp; Ratings
                          </h2>
                          <div className="h-1.5 w-20 rounded-full bg-[#0369A1]" />
                        </div>
                      </div>

                      {/* Aggregate Rating Summary */}
                      <div className="bg-[#191A23] text-white border-2 border-[#191A23] rounded-2xl px-5 py-3.5 flex items-center gap-4 self-start md:self-auto shrink-0">
                        <div>
                          <p className="text-xl sm:text-2xl font-mono font-bold text-[#EAB308] tabular-nums leading-none">
                            {averageRating} / 5.0
                          </p>
                          <p className="text-xs font-mono text-white/80 mt-1">
                            {allReviews.length} Verified &amp; Moderated Reviews
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[#EAB308]" aria-hidden="true">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className="w-4 h-4 fill-[#EAB308] text-[#EAB308]"
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
                      {/* Left 5 Columns: Write a Review Form */}
                      <div className="lg:col-span-5 lg:sticky lg:top-20 bg-white border-2 border-[#191A23] rounded-3xl p-5 sm:p-8 space-y-5">
                        <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#191A23]/15">
                          <div>
                            <h3 className="text-lg sm:text-xl font-display font-bold text-[#191A23]">
                              Write a Customer Review
                            </h3>
                            <p className="text-xs text-[#191A23]/80 mt-0.5">
                              {user
                                ? `Posting as Verified Google User (${user.displayName || user.email})`
                                : 'Posting as Guest Customer (Moderated before publishing)'}
                            </p>
                          </div>
                          {!user && (
                            <button
                              type="button"
                              onClick={handleGoogleSignIn}
                              className="px-3 py-2 min-h-[38px] text-xs font-bold text-[#191A23] bg-[#F8FAFC] hover:bg-[#7DD3FC] border border-[#191A23] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                            >
                              Or Sign In
                            </button>
                          )}
                        </div>

                        {revFeedback && (
                          <div
                            role={revFeedback.type === 'error' ? 'alert' : 'status'}
                            aria-live="polite"
                            className={`p-3.5 rounded-2xl border border-[#191A23] text-xs font-semibold ${
                              revFeedback.type === 'success'
                                ? 'bg-[#7DD3FC] text-[#191A23]'
                                : 'bg-red-100 text-red-950'
                            }`}
                          >
                            {revFeedback.text}
                          </div>
                        )}

                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                          {/* Accessible 1-5 Star Rating */}
                          <div className="space-y-2">
                            <span
                              id="star-rating-label"
                              className="block text-xs font-bold text-[#191A23]"
                            >
                              Your Star Rating * ({revRating} / 5)
                            </span>

                            <svg
                              width="0"
                              height="0"
                              className="absolute pointer-events-none"
                              aria-hidden="true"
                            >
                              <defs>
                                <linearGradient id="star-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#DC2626" />
                                  <stop offset="100%" stopColor="#EF4444" />
                                </linearGradient>
                                <linearGradient id="star-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#EF4444" />
                                  <stop offset="100%" stopColor="#F97316" />
                                </linearGradient>
                                <linearGradient id="star-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#F97316" />
                                  <stop offset="100%" stopColor="#F59E0B" />
                                </linearGradient>
                                <linearGradient id="star-grad-4" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#F59E0B" />
                                  <stop offset="100%" stopColor="#EAB308" />
                                </linearGradient>
                                <linearGradient id="star-grad-5" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#EAB308" />
                                  <stop offset="100%" stopColor="#CA8A04" />
                                </linearGradient>
                              </defs>
                            </svg>

                            <div
                              role="radiogroup"
                              aria-labelledby="star-rating-label"
                              className="flex items-center gap-2"
                            >
                              {[1, 2, 3, 4, 5].map((starVal) => {
                                const currentRating = revHoverRating ?? revRating;
                                const active = currentRating >= starVal;
                                const strokeColors: Record<number, string> = {
                                  1: '#DC2626',
                                  2: '#EA580C',
                                  3: '#D97706',
                                  4: '#CA8A04',
                                  5: '#CA8A04',
                                };
                                return (
                                  <button
                                    key={starVal}
                                    type="button"
                                    role="radio"
                                    aria-checked={revRating === starVal}
                                    onClick={() => setRevRating(starVal)}
                                    onMouseEnter={() => setRevHoverRating(starVal)}
                                    onMouseLeave={() => setRevHoverRating(null)}
                                    className="p-1 rounded-lg transition-transform duration-150 hover:scale-110 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                                    aria-label={`Rate ${starVal} out of 5 stars`}
                                  >
                                    <Star
                                      aria-hidden="true"
                                      className="w-7 h-7 sm:w-8 sm:h-8 transition-all duration-150"
                                      style={
                                        active
                                          ? {
                                              fill: `url(#star-grad-${starVal})`,
                                              stroke: strokeColors[starVal],
                                            }
                                          : {
                                              fill: 'transparent',
                                              stroke: 'rgba(25, 26, 35, 0.35)',
                                            }
                                      }
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label
                                htmlFor="rev-name-input"
                                className="block text-xs font-bold text-[#191A23] mb-1"
                              >
                                Your Name *
                              </label>
                              <input
                                id="rev-name-input"
                                type="text"
                                required
                                minLength={2}
                                maxLength={80}
                                value={revName}
                                onChange={(e) => setRevName(e.target.value)}
                                placeholder="e.g., Amit Verma"
                                className="w-full px-3.5 py-2.5 min-h-[46px] text-base sm:text-sm bg-[#F8FAFC] border border-[#191A23] rounded-xl placeholder:text-[#191A23]/60 focus:outline-2 focus:outline-offset-1 focus:outline-[#191A23]"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="rev-locality-input"
                                className="block text-xs font-bold text-[#191A23] mb-1"
                              >
                                Locality (Delhi / Gurugram) *
                              </label>
                              <input
                                id="rev-locality-input"
                                type="text"
                                required
                                minLength={2}
                                maxLength={80}
                                value={revLocality}
                                onChange={(e) => setRevLocality(e.target.value)}
                                placeholder="e.g., Dwarka Sec 12 / DLF Phase 3"
                                className="w-full px-3.5 py-2.5 min-h-[46px] text-base sm:text-sm bg-[#F8FAFC] border border-[#191A23] rounded-xl placeholder:text-[#191A23]/60 focus:outline-2 focus:outline-offset-1 focus:outline-[#191A23]"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="rev-service-select"
                              className="block text-xs font-bold text-[#191A23] mb-1"
                            >
                              Service Package Used
                            </label>
                            <select
                              id="rev-service-select"
                              value={revService}
                              onChange={(e) => setRevService(e.target.value)}
                              className="w-full px-3.5 py-2.5 min-h-[46px] text-base sm:text-sm bg-[#F8FAFC] border border-[#191A23] rounded-xl focus:outline-2 focus:outline-offset-1 focus:outline-[#191A23]"
                            >
                              {displayServices.map((st) => (
                                <option key={st.id} value={st.name}>
                                  {st.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor="rev-text-input"
                              className="block text-xs font-bold text-[#191A23] mb-1"
                            >
                              Your Review *
                            </label>
                            <textarea
                              id="rev-text-input"
                              rows={3}
                              required
                              minLength={5}
                              maxLength={600}
                              value={revText}
                              onChange={(e) => setRevText(e.target.value)}
                              placeholder="Share how our technician performed, cooling improvement, or punctuality..."
                              className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-[#F8FAFC] border border-[#191A23] rounded-xl placeholder:text-[#191A23]/60 focus:outline-2 focus:outline-offset-1 focus:outline-[#191A23]"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={revSubmitting}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] text-sm font-bold text-[#191A23] bg-[#7DD3FC] border border-[#191A23] rounded-2xl hover:bg-[#38BDF8] active:translate-y-0.5 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                          >
                            <span>
                              {revSubmitting
                                ? 'Submitting Review...'
                                : user
                                ? 'Submit Verified Review'
                                : 'Submit Guest Review'}
                            </span>
                            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </form>
                      </div>

                      {/* Right 7 Columns: Filter Bar + Paginated & Bounded Customer Reviews Feed */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white border-2 border-[#191A23] rounded-2xl p-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(['all', 5, 4, 3, 2, 1] as const).map((flt) => (
                              <button
                                key={String(flt)}
                                type="button"
                                onClick={() => {
                                  setReviewFilterRating(flt);
                                  setReviewPage(1);
                                }}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] text-xs font-bold rounded-xl border border-[#191A23] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23] ${
                                  reviewFilterRating === flt
                                    ? 'bg-[#191A23] text-white'
                                    : 'bg-[#F8FAFC] text-[#191A23] hover:bg-[#FEF9C3]'
                                }`}
                              >
                                {flt === 'all' ? (
                                  <span>All ({allReviews.length})</span>
                                ) : (
                                  <>
                                    <span>{flt}</span>
                                    <Star
                                      aria-hidden="true"
                                      className={`w-3.5 h-3.5 ${
                                        flt === 1
                                          ? 'fill-[#EF4444] text-[#DC2626]'
                                          : 'fill-[#EAB308] text-[#EAB308]'
                                      }`}
                                    />
                                  </>
                                )}
                              </button>
                            ))}
                          </div>

                          <span className="text-xs font-mono font-bold text-[#191A23]/80 px-1">
                            {filteredReviews.length === 0
                              ? '0 reviews'
                              : `Showing ${reviewStartIdx + 1}–${Math.min(
                                  reviewStartIdx + REVIEWS_PER_PAGE,
                                  filteredReviews.length
                                )} of ${filteredReviews.length}`}
                          </span>
                        </div>

                        {paginatedReviews.length === 0 ? (
                          <div className="p-8 rounded-3xl border-2 border-[#191A23] bg-white text-center space-y-2">
                            <p className="text-sm font-display font-bold text-[#191A23]">
                              No {reviewFilterRating}-star reviews yet
                            </p>
                            <p className="text-xs text-[#191A23]/75">
                              Select &ldquo;All&rdquo; above to view all customer reviews.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3.5 max-h-[560px] overflow-y-auto pr-1">
                            {paginatedReviews.map((rev, idx) => {
                              const globalIdx = reviewStartIdx + idx;
                              const isDarkCard = globalIdx % 3 === 1;
                              const canDelete =
                                user &&
                                (isAdmin ||
                                  (rev.authorId !== 'guest' &&
                                    rev.authorId === user.uid &&
                                    !rev.id.startsWith('featured-')));
                              const isConfirmingRevDel = confirmDeleteReviewId === rev.id;

                              return (
                                <motion.div
                                  key={rev.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className={`p-5 sm:p-6 rounded-3xl border-2 border-[#191A23] space-y-3 ${
                                    isDarkCard
                                      ? 'bg-[#191A23] text-white'
                                      : 'bg-white text-[#191A23]'
                                  }`}
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="font-display font-bold text-base sm:text-lg">
                                          {rev.authorName}
                                        </h4>
                                        <span
                                          className={`inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded border border-[#191A23] ${
                                            rev.isVerifiedUser
                                              ? 'bg-[#7DD3FC] text-[#191A23]'
                                              : isDarkCard
                                              ? 'bg-white/15 text-white border-white/30'
                                              : 'bg-[#F3F3F3] text-[#191A23]'
                                          }`}
                                        >
                                          {rev.isVerifiedUser ? (
                                            <>
                                              <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                                              <span>Verified Google User</span>
                                            </>
                                          ) : (
                                            <>
                                              <UserCheck className="w-3 h-3" aria-hidden="true" />
                                              <span>Moderated Guest</span>
                                            </>
                                          )}
                                        </span>
                                      </div>
                                      <p
                                        className={`text-xs font-mono mt-1 ${
                                          isDarkCard ? 'text-white/75' : 'text-[#191A23]/75'
                                        }`}
                                      >
                                        {rev.serviceUsed} · {rev.locality}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <div
                                        className="flex items-center gap-0.5"
                                        aria-label={`Rated ${rev.rating} out of 5 stars`}
                                      >
                                        {[1, 2, 3, 4, 5].map((s) => (
                                          <Star
                                            key={s}
                                            aria-hidden="true"
                                            className={`w-4 h-4 ${
                                              s <= rev.rating
                                                ? rev.rating === 1
                                                  ? 'fill-[#EF4444] text-[#DC2626]'
                                                  : 'fill-[#EAB308] text-[#EAB308]'
                                                : isDarkCard
                                                ? 'text-white/25'
                                                : 'text-[#191A23]/20'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      {canDelete && !isConfirmingRevDel && (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteReviewId(rev.id)}
                                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                          title="Delete review"
                                          aria-label={`Delete review by ${rev.authorName}`}
                                        >
                                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                      )}
                                      {canDelete && isConfirmingRevDel && (
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteOwnReview(rev.id)}
                                            className="px-2 py-1 rounded bg-red-600 text-white text-xs font-bold cursor-pointer"
                                          >
                                            Delete
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmDeleteReviewId(null)}
                                            className="px-2 py-1 rounded bg-white text-[#191A23] border border-[#191A23] text-xs font-semibold cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <p
                                    className={`text-sm sm:text-base leading-relaxed line-clamp-4 ${
                                      isDarkCard ? 'text-white/90' : 'text-[#191A23]/90'
                                    }`}
                                  >
                                    &ldquo;{rev.reviewText}&rdquo;
                                  </p>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}

                        {filteredReviews.length > 0 && (
                          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border-2 border-[#191A23] rounded-2xl px-4 py-3">
                            <span className="text-xs font-mono font-bold text-[#191A23]">
                              Page {currentReviewPage} of {totalReviewPages}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={currentReviewPage <= 1}
                                onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] text-xs font-bold rounded-xl border border-[#191A23] bg-[#F8FAFC] text-[#191A23] hover:bg-[#7DD3FC] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                                aria-label="Previous reviews page"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Prev</span>
                              </button>

                              {getVisiblePageNumbers().map((item) =>
                                typeof item === 'number' ? (
                                  <button
                                    key={item}
                                    type="button"
                                    onClick={() => setReviewPage(item)}
                                    className={`min-w-[34px] h-[34px] px-2 text-xs font-mono font-bold rounded-xl border border-[#191A23] transition-colors cursor-pointer ${
                                      currentReviewPage === item
                                        ? 'bg-[#191A23] text-white'
                                        : 'bg-white text-[#191A23] hover:bg-[#7DD3FC]'
                                    }`}
                                  >
                                    {item}
                                  </button>
                                ) : (
                                  <span
                                    key={item}
                                    className="px-1 text-xs font-mono font-bold text-[#191A23]/70 select-none"
                                  >
                                    …
                                  </span>
                                )
                              )}

                              <button
                                type="button"
                                disabled={currentReviewPage >= totalReviewPages}
                                onClick={() =>
                                  setReviewPage((p) => Math.min(totalReviewPages, p + 1))
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] text-xs font-bold rounded-xl border border-[#191A23] bg-[#F8FAFC] text-[#191A23] hover:bg-[#7DD3FC] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                                aria-label="Next reviews page"
                              >
                                <span>Next</span>
                                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 05: CONTACT US */}
                <section id="send-message" className="scroll-mt-16 py-12 sm:py-16 lg:py-24">
                  <div className="w-full px-3 sm:px-4 lg:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 sm:pb-10">
                      <div className="space-y-2.5">
                        <div className="space-y-2">
                          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-[#191A23]">
                            Contact Us
                          </h2>
                          <div className="h-1.5 w-20 rounded-full bg-[#0369A1]" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start">
                      {/* Left 7 Columns: Direct WhatsApp Inquiry Card */}
                      <div className="lg:col-span-7 bg-white border-2 border-[#191A23] rounded-3xl overflow-hidden">
                        <div className="p-5 sm:p-8 space-y-6">
                          {/* Quick-Fill WhatsApp Templates (Dynamic Price Synced) */}
                          <div className="space-y-2.5">
                            <p className="text-xs font-mono font-bold text-[#0369A1] uppercase tracking-wider">
                              Quick-Select Service Requirement:
                            </p>
                            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickTemplateSelect(
                                    'General AC Inquiry',
                                    `I need Foam Power Jet Servicing (₹${foamJetPriceFormatted}/AC) for my AC. Please share today/tomorrow slot availability.`,
                                    'Split AC (1 Unit)'
                                  )
                                }
                                className="px-3.5 py-2.5 min-h-[42px] text-xs font-bold text-[#191A23] bg-[#F8FAFC] hover:bg-[#7DD3FC] border border-[#191A23] rounded-xl transition-colors cursor-pointer text-left sm:text-center whitespace-nowrap"
                              >
                                Foam Jet Service (₹{foamJetPriceFormatted})
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickTemplateSelect(
                                    'Emergency Breakdown Support',
                                    'My AC is running but not cooling properly. Need technician inspection & gas pressure check.',
                                    'Split AC (1.5 Ton)'
                                  )
                                }
                                className="px-3.5 py-2.5 min-h-[42px] text-xs font-bold text-[#191A23] bg-[#F8FAFC] hover:bg-[#7DD3FC] border border-[#191A23] rounded-xl transition-colors cursor-pointer text-left sm:text-center whitespace-nowrap"
                              >
                                Not Cooling / Gas Check
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickTemplateSelect(
                                    'Installation / Uninstallation Quote',
                                    'Need AC installation / uninstallation with copper pipe & vacuum testing.',
                                    'Split AC (1 Unit)'
                                  )
                                }
                                className="px-3.5 py-2.5 min-h-[42px] text-xs font-bold text-[#191A23] bg-[#F8FAFC] hover:bg-[#7DD3FC] border border-[#191A23] rounded-xl transition-colors cursor-pointer text-left sm:text-center whitespace-nowrap"
                              >
                                AC Install / Uninstall
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickTemplateSelect(
                                    'Commercial / AMC Quote',
                                    'We need an Annual Maintenance Contract (AMC) / bulk servicing quote for multiple AC units.',
                                    'Multiple AC Units (3+)'
                                  )
                                }
                                className="px-3.5 py-2.5 min-h-[42px] text-xs font-bold text-[#191A23] bg-[#F8FAFC] hover:bg-[#7DD3FC] border border-[#191A23] rounded-xl transition-colors cursor-pointer text-left sm:text-center whitespace-nowrap"
                              >
                                Multi-Unit / AMC Quote
                              </button>
                            </div>
                          </div>

                          <form onSubmit={handleWhatsAppFormSubmit} className="space-y-4">
                            {/* Anti-Bot Honeypot Field (Hidden from real users) */}
                            <div className="hidden" aria-hidden="true">
                              <label htmlFor="contact-gotcha-field">Do not fill this field</label>
                              <input
                                id="contact-gotcha-field"
                                type="text"
                                name="_gotcha"
                                tabIndex={-1}
                                autoComplete="off"
                                value={msgHoneypot}
                                onChange={(e) => setMsgHoneypot(e.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label
                                  htmlFor="msg-name-input"
                                  className="block text-xs font-bold text-[#191A23] mb-1.5"
                                >
                                  Your Name *
                                </label>
                                <input
                                  id="msg-name-input"
                                  type="text"
                                  required
                                  minLength={2}
                                  maxLength={100}
                                  value={msgName}
                                  onChange={(e) => setMsgName(e.target.value)}
                                  placeholder="Full Name"
                                  className="w-full px-4 py-3 min-h-[48px] text-base sm:text-sm bg-[#F8FAFC] border border-[#191A23] rounded-xl placeholder:text-[#191A23]/60 focus:outline-2 focus:outline-offset-1 focus:outline-[#191A23]"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor="msg-location-input"
                                  className="block text-xs font-bold text-[#191A23] mb-1.5"
                                >
                                  Your Locality (Delhi / Gurugram)
                                </label>
                                <input
                                  id="msg-location-input"
                                  type="text"
                                  maxLength={200}
                                  value={msgLocation}
                                  onChange={(e) => setMsgLocation(e.target.value)}
                                  placeholder="e.g., Dwarka, Vasant Kunj, or Gurugram Sector 56"
                                  className="w-full px-4 py-3 min-h-[48px] text-base sm:text-sm bg-[#F8FAFC] border border-[#191A23] rounded-xl placeholder:text-[#191A23]/60 focus:outline-2 focus:outline-offset-1 focus:outline-[#191A23]"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label
                                  htmlFor="msg-ac-select"
                                  className="block text-xs font-bold text-[#191A23] mb-1.5"
                                >
                                  AC Type &amp; Quantity
                                </label>
                                <select
                                  id="msg-ac-select"
                                  value={msgAcDetails}
                                  onChange={(e) => setMsgAcDetails(e.target.value)}
                                  className="w-full px-4 py-3 min-h-[48px] text-base sm:text-sm bg-[#F8FAFC] border border-[#191A23] rounded-xl focus:outline-2 focus:outline-offset-1 focus:outline-[#191A23]"
                                >
                                  <option value="Split AC (1 Unit)">Split AC (1 Unit)</option>
                                  <option value="Split AC (2 Units)">Split AC (2 Units)</option>
                                  <option value="Window AC (1 Unit)">Window AC (1 Unit)</option>
                                  <option value="Inverter Split AC">Inverter Split AC</option>
                                  <option value="Cassette / Commercial AC">
                                    Cassette / Commercial AC
                                  </option>
                                  <option value="Multiple AC Units (3+)">
                                    Multiple AC Units (3+)
                                  </option>
                                </select>
                              </div>

                              <div>
                                <label
                                  htmlFor="msg-subject-select"
                                  className="block text-xs font-bold text-[#191A23] mb-1.5"
                                >
                                  Inquiry Topic
                                </label>
                                <select
                                  id="msg-subject-select"
                                  value={msgSubject}
                                  onChange={(e) =>
                                    setMsgSubject(e.target.value as MessageSubject)
                                  }
                                  className="w-full px-4 py-3 min-h-[48px] text-base sm:text-sm bg-[#F8FAFC] border border-[#191A23] rounded-xl focus:outline-2 focus:outline-offset-1 focus:outline-[#191A23]"
                                >
                                  <option value="General AC Inquiry">General AC Inquiry</option>
                                  <option value="Emergency Breakdown Support">
                                    Emergency Breakdown Support
                                  </option>
                                  <option value="Installation / Uninstallation Quote">
                                    Installation / Uninstallation Quote
                                  </option>
                                  <option value="Commercial / AMC Quote">
                                    Commercial / AMC Quote
                                  </option>
                                  <option value="Service Feedback">Service Feedback</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor="msg-body-textarea"
                                className="block text-xs font-bold text-[#191A23] mb-1.5"
                              >
                                Message / Issue Details *
                              </label>
                              <textarea
                                id="msg-body-textarea"
                                rows={3}
                                required
                                minLength={5}
                                maxLength={1000}
                                value={msgBody}
                                onChange={(e) => setMsgBody(e.target.value)}
                                placeholder="Describe your AC issue, model, or preferred visit time..."
                                className="w-full px-4 py-3 text-base sm:text-sm bg-[#F8FAFC] border border-[#191A23] rounded-xl placeholder:text-[#191A23]/60 focus:outline-2 focus:outline-offset-1 focus:outline-[#191A23]"
                              />
                            </div>

                            <div className="pt-2">
                              <button
                                type="submit"
                                className="w-full inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-4 min-h-[50px] text-sm font-bold text-[#191A23] bg-[#86EFAC] border border-[#191A23] rounded-xl hover:bg-[#4ADE80] active:translate-y-0.5 transition-all whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                              >
                                <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span>Send on WhatsApp</span>
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>

                      {/* Right 5 Columns: Direct Engineer Helpline Card */}
                      <div className="lg:col-span-5 lg:sticky lg:top-20">
                        <div className="bg-white border-2 border-[#191A23] rounded-3xl overflow-hidden">
                          <div className="bg-[#E0F2FE] border-b border-[#191A23]/15 px-5 sm:px-7 py-4 flex items-center justify-between gap-2">
                            <span className="text-xs font-mono font-bold text-[#0369A1]">
                              {OPERATING_HOURS}
                            </span>
                          </div>

                          <div className="p-5 sm:p-7 space-y-5">
                            <h3 className="text-lg sm:text-xl font-display font-bold text-[#191A23]">
                              Instant Call, WhatsApp &amp; Email Channels
                            </h3>

                            <div className="space-y-3">
                              {/* WhatsApp Direct Button */}
                              <a
                                href={buildWhatsAppUrl(
                                  'Hi Cool Bros AC Service, I need assistance with AC servicing / repair.'
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-4 border border-[#191A23] bg-[#86EFAC] rounded-2xl flex items-center justify-between hover:bg-[#4ADE80] transition-all group"
                              >
                                <div className="flex items-center gap-3.5">
                                  <div className="w-10 h-10 rounded-xl bg-[#191A23] text-[#86EFAC] flex items-center justify-center shrink-0">
                                    <MessageCircle className="w-5 h-5" aria-hidden="true" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-[#191A23]/85 font-semibold">
                                      Message on WhatsApp
                                    </p>
                                    <p className="text-base font-mono font-bold text-[#191A23]">
                                      {CONTACT_PHONE_DISPLAY}
                                    </p>
                                  </div>
                                </div>
                                <ArrowUpRight
                                  className="w-5 h-5 text-[#191A23] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                                  aria-hidden="true"
                                />
                              </a>

                              {/* Phone Call Direct Button */}
                              <a
                                href={CONTACT_PHONE_HREF}
                                className="p-4 border border-[#191A23] bg-[#F8FAFC] rounded-2xl flex items-center justify-between hover:bg-[#E0F2FE] transition-colors group"
                              >
                                <div className="flex items-center gap-3.5">
                                  <div className="w-10 h-10 rounded-xl bg-[#191A23] text-white flex items-center justify-center shrink-0">
                                    <Phone className="w-5 h-5" aria-hidden="true" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-[#191A23]/80 font-medium">
                                      Daily 08:00 AM – 09:00 PM Dispatch Line
                                    </p>
                                    <p className="text-base font-mono font-bold text-[#191A23]">
                                      {CONTACT_PHONE_DISPLAY}
                                    </p>
                                  </div>
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-[#191A23]" aria-hidden="true" />
                              </a>

                              {/* Email Direct Button */}
                              <a
                                href={`mailto:${OWNER_EMAIL}`}
                                className="p-4 border border-[#191A23] bg-[#191A23] text-white rounded-2xl flex items-center justify-between hover:bg-[#0369A1] transition-colors group"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-[#7DD3FC] text-[#191A23] flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5" aria-hidden="true" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs text-white/80">
                                      Official Service &amp; AMC Desk
                                    </p>
                                    <p className="text-xs sm:text-sm font-mono font-semibold text-white truncate">
                                      {OWNER_EMAIL}
                                    </p>
                                  </div>
                                </div>
                                <ArrowUpRight
                                  className="w-5 h-5 text-[#7DD3FC] shrink-0 ml-2"
                                  aria-hidden="true"
                                />
                              </a>
                            </div>

                            <div className="pt-4 border-t border-[#191A23]/15 space-y-2 text-xs text-[#191A23]/85">
                              <div className="flex items-center gap-2 font-semibold text-[#191A23]">
                                <MapPin className="w-4 h-4 text-[#0369A1] shrink-0" aria-hidden="true" />
                                <span>Dedicated Coverage: Delhi &amp; Gurugram</span>
                              </div>
                              <p className="text-xs font-mono text-[#191A23]/80 leading-relaxed">
                                Delhi: Dwarka, Vasant Kunj, Janakpuri, South Delhi, Rohini,
                                Connaught Place · Gurugram: DLF Phases 1–5, Cyber City, Sohna Rd,
                                Golf Course Rd &amp; All Sectors
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}
          </Suspense>
        </main>

        {/* COMPACT ARCHITECTURAL FOOTER */}
        <footer className="bg-[#191A23] text-white border-t-2 border-[#191A23] mt-6">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 pb-5 border-b border-white/15 items-start">
              {/* Column 1 (4 cols): Brand Identity + Rating Badge */}
              <div className="lg:col-span-4 space-y-2.5">
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateHomeSection();
                  }}
                  className="inline-flex items-center gap-2.5 text-lg sm:text-xl font-display font-bold text-white"
                >
                  <CoolBrosLogo className="w-7 h-7 text-[#7DD3FC]" />
                  <span>Cool Bros AC Service</span>
                </a>

                <p className="text-xs text-white/80 leading-relaxed max-w-xs">
                  Independent doorstep AC jet servicing, gas charging, PCB repair &amp; installation
                  across Delhi &amp; Gurugram.
                </p>

                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/15">
                  <div className="flex items-center gap-0.5" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-[#EAB308] text-[#EAB308]" />
                    ))}
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {averageRating} / 5.0 Rated
                  </span>
                </div>
              </div>

              {/* Column 2 (2 cols): Quick Links */}
              <div className="lg:col-span-2 space-y-2">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#7DD3FC]">
                  Navigation
                </p>
                <ul className="space-y-1.5 text-xs text-white/85">
                  <li>
                    <a
                      href="#services"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateHomeSection('services');
                      }}
                      className="hover:text-[#7DD3FC] transition-colors"
                    >
                      Services &amp; Rate Card
                    </a>
                  </li>
                  <li>
                    <a
                      href="#protocol"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateHomeSection('protocol');
                      }}
                      className="hover:text-[#7DD3FC] transition-colors"
                    >
                      Working Process
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateHomeSection('faq');
                      }}
                      className="hover:text-[#7DD3FC] transition-colors"
                    >
                      FAQs
                    </a>
                  </li>
                  <li>
                    <a
                      href="#reviews"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateHomeSection('reviews');
                      }}
                      className="hover:text-[#7DD3FC] transition-colors"
                    >
                      Reviews &amp; Ratings
                    </a>
                  </li>
                  <li>
                    <a
                      href="#send-message"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateHomeSection('send-message');
                      }}
                      className="hover:text-[#7DD3FC] transition-colors"
                    >
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a
                      href="/admin"
                      onClick={(e) => {
                        e.preventDefault();
                        openAdminDashboard();
                      }}
                      className="text-[#7DD3FC] font-mono font-bold hover:underline"
                    >
                      Admin Login
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 3 (3 cols): Legal & Policies (Real Crawl-Friendly Links) */}
              <div className="lg:col-span-3 space-y-2">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#7DD3FC]">
                  Legal &amp; Policies
                </p>
                <ul className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 text-xs text-white/85">
                  {LEGAL_PAGE_TABS.map((item) => (
                    <li key={item.slug}>
                      <a
                        href={`/${item.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          openLegalPage(item.slug);
                        }}
                        className={`transition-colors hover:text-[#7DD3FC] ${
                          activeLegalPage === item.slug
                            ? 'text-[#7DD3FC] font-bold underline underline-offset-4'
                            : 'text-white/85'
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 4 (3 cols): Direct Dispatch & Helpline */}
              <div className="lg:col-span-3 space-y-2">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#7DD3FC]">
                  Direct Dispatch
                </p>

                <div className="space-y-1.5 text-xs text-white/85">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#7DD3FC] shrink-0" aria-hidden="true" />
                    <a href={CONTACT_PHONE_HREF} className="font-mono font-bold hover:text-[#7DD3FC]">
                      {CONTACT_PHONE_DISPLAY}
                    </a>
                  </p>
                  <p className="flex items-center gap-2 break-all">
                    <Mail className="w-3.5 h-3.5 text-[#7DD3FC] shrink-0" aria-hidden="true" />
                    <a
                      href={`mailto:${OWNER_EMAIL}`}
                      className="font-mono hover:text-[#7DD3FC]"
                    >
                      {OWNER_EMAIL}
                    </a>
                  </p>
                  <p className="flex items-center gap-2 text-white/80">
                    <MapPin className="w-3.5 h-3.5 text-[#7DD3FC] shrink-0" aria-hidden="true" />
                    <span>Delhi &amp; Gurugram ({OPERATING_HOURS})</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Slim Bottom Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-white/70">
              <p>© {new Date().getFullYear()} Cool Bros AC Service. All Rights Reserved.</p>
              <p className="font-mono text-white/70">
                Independent Multi-Brand AC Service · New Delhi &amp; Gurugram
              </p>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
