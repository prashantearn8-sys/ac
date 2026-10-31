/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import {
  Phone,
  Mail,
  Check,
  ArrowUpRight,
  Menu,
  X,
  LogOut,
  MapPin,
  MessageCircle,
  Send,
  Plus,
  Minus,
  Star,
  Trash2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  AcType,
  CustomerReviewRecord,
  MessageSubject,
  OperationType,
  ServiceType,
  VALIDATION_RULES,
  auth,
  createCustomerMessageInFirestore,
  createReviewInFirestore,
  db,
  deleteReviewInFirestore,
  handleFirestoreError,
  signInWithGoogle,
  signOutUser,
} from './firebase';
import {
  AC_TYPE_MULTIPLIERS,
  PROTOCOL_STEPS,
  SERVICE_PACKAGES,
  ServicePackageSpec,
} from './data/acServices';
import {
  AcBrandLogo,
  AcBrandName,
  CoolBrosLogo,
  DispatchDeskIllustration,
  HeroCoolingIllustration,
  ServiceCardIllustration,
} from './components/AcGraphics';
import {
  LEGAL_PAGE_TABS,
  LegalPageSlug,
  LegalPageView,
} from './components/LegalPages';

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
}

async function dispatchEmailToOwner(payload: EmailNotificationPayload): Promise<void> {
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
        }),
      });
    } catch {
      // Non-blocking fallback
    }
  }
}

const SUPPORTED_BRANDS: AcBrandName[] = [
  'DAIKIN',
  'MITSUBISHI',
  'VOLTAS',
  'BLUE STAR',
  'CARRIER',
  'HITACHI',
];

const INITIAL_FEATURED_REVIEWS: CustomerReviewRecord[] = [
  {
    id: 'featured-rev-1',
    authorId: 'verified-client-1',
    authorName: 'Rohan Malhotra',
    isVerifiedUser: true,
    rating: 5,
    serviceUsed: 'Foam Power Jet Service',
    locality: 'Dwarka Sector 10, Delhi',
    reviewText:
      'The technician used a 360-degree waterproof jacket and a 140 PSI hydro-jet gun. Not a single drop of water spilled on our bedroom wall, and the AC cooling dropped from 22°C to 11°C in 20 minutes.',
  },
  {
    id: 'featured-rev-2',
    authorId: 'verified-client-2',
    authorName: 'Priya Sharma',
    isVerifiedUser: true,
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
    rating: 5,
    serviceUsed: 'Anti-Rust Deep Chemical Wash',
    locality: 'Vasant Kunj, Delhi',
    reviewText:
      'Booked via WhatsApp and the engineer arrived within 50 minutes. The anti-rust coil coating and outdoor condenser wash made our 4-year-old Daikin inverter silent again.',
  },
];

type ServiceCategoryFilter = 'all' | 'cleaning' | 'repair' | 'amc';

const SERVICE_CATEGORY_MAP: Record<string, ServiceCategoryFilter> = {
  'foam-jet': 'cleaning',
  'anti-rust': 'cleaning',
  'gas-charging': 'repair',
  'diagnostic-pcb': 'repair',
  'annual-amc': 'amc',
  'install-uninstall': 'amc',
};

const SERVICE_HIGHLIGHT_BADGE: Record<string, string> = {
  'foam-jet': 'MOST BOOKED',
  'anti-rust': 'COIL SHIELD',
  'gas-charging': '500-MICRON VACUUM',
  'annual-amc': 'BEST VALUE · 365D',
  'diagnostic-pcb': 'WAIVED ON REPAIR',
  'install-uninstall': 'LASER-LEVELED',
};

/**
 * 6-Card Color Theme Mapping (Light Blue #7DD3FC, Gray #F3F3F3, Dark #191A23)
 */
function getServiceCardTheme(index: number) {
  const mod = index % 3;
  if (mod === 0) {
    return {
      cardBg: 'bg-white text-[#191A23]',
      headerStripBg: 'bg-[#F3F3F3] border-[#191A23]/15',
      labelBg: 'bg-[#7DD3FC] text-[#191A23]',
      badgeBg: 'bg-[#191A23] text-[#7DD3FC]',
      gainBadgeBg: 'bg-[#F3F3F3] text-[#191A23] border-[#191A23]/20',
      illustrationBox: 'bg-[#F3F3F3] border-[#191A23]/15',
      metricsBg: 'bg-[#F3F3F3] border-[#191A23]/20',
      checkCircle: 'bg-[#7DD3FC] text-[#191A23] border-[#191A23]',
      secondaryBtn:
        'bg-[#191A23] text-white hover:bg-[#191A23]/90 border-[#191A23]',
      learnText: 'text-[#191A23]',
      metaText: 'text-[#191A23]/75',
      priceText: 'text-[#191A23]',
    };
  }
  if (mod === 1) {
    return {
      cardBg: 'bg-[#F3F3F3] text-[#191A23]',
      headerStripBg: 'bg-white border-[#191A23]/15',
      labelBg: 'bg-[#7DD3FC] text-[#191A23]',
      badgeBg: 'bg-[#191A23] text-white',
      gainBadgeBg: 'bg-white text-[#191A23] border-[#191A23]/20',
      illustrationBox: 'bg-white border-[#191A23]/15',
      metricsBg: 'bg-white border-[#191A23]/20',
      checkCircle: 'bg-[#7DD3FC] text-[#191A23] border-[#191A23]',
      secondaryBtn:
        'bg-[#191A23] text-white hover:bg-[#191A23]/90 border-[#191A23]',
      learnText: 'text-[#191A23]',
      metaText: 'text-[#191A23]/75',
      priceText: 'text-[#191A23]',
    };
  }
  return {
    cardBg: 'bg-[#191A23] text-white',
    headerStripBg: 'bg-white/5 border-white/15',
    labelBg: 'bg-[#7DD3FC] text-[#191A23]',
    badgeBg: 'bg-[#7DD3FC] text-[#191A23]',
    gainBadgeBg: 'bg-white/10 text-[#7DD3FC] border-white/20',
    illustrationBox: 'bg-white/5 border-white/15',
    metricsBg: 'bg-white/5 border-white/15',
    checkCircle: 'bg-[#7DD3FC] text-[#191A23] border-[#7DD3FC]',
    secondaryBtn:
      'bg-white text-[#191A23] hover:bg-[#7DD3FC] border-white',
    learnText: 'text-white',
    metaText: 'text-white/75',
    priceText: 'text-[#7DD3FC]',
  };
}

function splitServiceTitle(name: string): [string, string] {
  const words = name.split(' ');
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Live Firestore Reviews State
  const [firestoreReviews, setFirestoreReviews] = useState<CustomerReviewRecord[]>([]);
  const [reviewFilterRating, setReviewFilterRating] = useState<number | 'all'>('all');

  // Review Form State (Works both with Sign-In and without Sign-In)
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

  // Mobile Menu, Profile Popover, & Interactive Accordion/Modal/Legal Page State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [openStepIndex, setOpenStepIndex] = useState<number>(0);
  const [selectedServiceModal, setSelectedServiceModal] =
    useState<ServicePackageSpec | null>(null);
  const [activeLegalPage, setActiveLegalPage] = useState<LegalPageSlug | null>(null);

  // Interactive Service Section Filter & Live Rate Configurator State
  const [serviceCategory, setServiceCategory] = useState<ServiceCategoryFilter>('all');
  const [selectedAcType, setSelectedAcType] = useState<AcType>('Split AC');
  const [selectedUnitCount, setSelectedUnitCount] = useState<number>(1);

  const openLegalPage = (slug: LegalPageSlug) => {
    setActiveLegalPage(slug);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateHomeSection = (sectionId?: string) => {
    setActiveLegalPage(null);
    setMobileMenuOpen(false);
    if (!sectionId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 40);
  };

  // Direct Message Form State (WhatsApp + Email to coolbrosacservice@gmail.com)
  const [msgName, setMsgName] = useState('');
  const [msgPhone, setMsgPhone] = useState('');
  const [msgEmail, setMsgEmail] = useState('');
  const [msgSubject, setMsgSubject] = useState('General AC Inquiry');
  const [msgAcDetails, setMsgAcDetails] = useState('Split AC (1 Unit)');
  const [msgLocation, setMsgLocation] = useState('');
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

  // Desktop Escape key handler for modals and menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedServiceModal(null);
        setProfileMenuOpen(false);
        setMobileMenuOpen(false);
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
      if (currentUser?.email) {
        setMsgEmail((prev) => prev || currentUser.email || '');
      }
    });
    return () => unsubAuth();
  }, []);

  // Listen to Public Customer Reviews in Firestore (works for both signed-in and guest visitors)
  useEffect(() => {
    const reviewsQuery = query(collection(db, 'reviews'));
    const unsubReviews = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const rows: CustomerReviewRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CustomerReviewRecord, 'id'>),
        }));
        rows.sort((a, b) => {
          const tA = a.createdAt?.toMillis?.() || 0;
          const tB = b.createdAt?.toMillis?.() || 0;
          return tB - tA;
        });
        setFirestoreReviews(rows);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reviews');
      }
    );
    return () => unsubReviews();
  }, []);

  const allReviews = [...firestoreReviews, ...INITIAL_FEATURED_REVIEWS];
  const filteredReviews =
    reviewFilterRating === 'all'
      ? allReviews
      : allReviews.filter((r) => r.rating === reviewFilterRating);

  const averageRating =
    allReviews.length > 0
      ? (
          allReviews.reduce((acc, item) => acc + item.rating, 0) / allReviews.length
        ).toFixed(1)
      : '5.0';

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

  const handleSelectPackageForBooking = (
    serviceName: ServiceType,
    customUnitSummary?: string,
    estimatedTotalInr?: number
  ) => {
    setSelectedServiceModal(null);
    setMsgSubject('General AC Inquiry');
    const unitLabel =
      customUnitSummary ||
      `${selectedAcType} (${selectedUnitCount} ${selectedUnitCount === 1 ? 'Unit' : 'Units'})`;
    setMsgAcDetails(unitLabel);
    setMsgBody(
      estimatedTotalInr
        ? `Hi Cool Bros AC Service, I would like to book ${serviceName} for ${unitLabel} (Est. ₹${estimatedTotalInr.toLocaleString('en-IN')}). Please share available technician slots.`
        : `Hi Cool Bros AC Service, I would like to book / inquire about ${serviceName} for ${unitLabel}.`
    );
    const el = document.getElementById('send-message');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevFeedback(null);
    setRevSubmitting(true);

    try {
      const reviewerName =
        revName.trim() || user?.displayName || user?.email?.split('@')[0] || '';
      await createReviewInFirestore({
        authorName: reviewerName,
        rating: revRating,
        serviceUsed: revService,
        locality: revLocality.trim() || 'Delhi / Gurugram',
        reviewText: revText.trim(),
      });

      setRevFeedback({
        type: 'success',
        text: user
          ? 'Thank you! Your verified review has been published live.'
          : 'Thank you! Your guest review has been published live.',
      });
      setRevText('');
      setRevRating(5);
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
    try {
      await deleteReviewInFirestore(reviewId);
    } catch {
      // Ignore if not owner
    }
  };

  const formattedWhatsAppMessage = [
    '*Cool Bros AC Service — Direct Inquiry*',
    `• *Customer:* ${msgName.trim() || 'Not specified'}`,
    `• *Phone:* ${msgPhone.trim() ? `+91 ${msgPhone.trim()}` : 'Not specified'}`,
    ...(msgEmail.trim() ? [`• *Email:* ${msgEmail.trim()}`] : []),
    `• *Topic:* ${msgSubject}`,
    ...(msgAcDetails.trim() ? [`• *AC Unit:* ${msgAcDetails.trim()}`] : []),
    ...(msgLocation.trim() ? [`• *Location:* ${msgLocation.trim()}`] : []),
    `• *Requirement:* ${
      msgBody.trim() || 'Please share slot availability and service details.'
    }`,
  ].join('\n');

  const currentMessageWhatsAppUrl = buildWhatsAppUrl(formattedWhatsAppMessage);

  const handleQuickTemplateSelect = (
    topic: string,
    templateText: string,
    defaultUnit?: string
  ) => {
    setMsgSubject(topic);
    setMsgBody(templateText);
    if (defaultUnit) {
      setMsgAcDetails(defaultUnit);
    }
  };

  const handleWhatsAppDirectClick = () => {
    if (msgName.trim().length >= 2 && msgPhone.trim().length >= 10) {
      const fullMessageText = [
        msgAcDetails.trim() ? `AC Unit: ${msgAcDetails.trim()}` : '',
        msgLocation.trim() ? `Location: ${msgLocation.trim()}` : '',
        msgBody.trim() || 'Sent via WhatsApp Direct Dispatch.',
      ]
        .filter(Boolean)
        .join(' | ');

      if (user && fullMessageText.length >= 5) {
        createCustomerMessageInFirestore({
          senderName: msgName.trim(),
          senderPhone: msgPhone.trim(),
          senderEmail: msgEmail.trim() || user.email || '',
          subject: msgSubject as MessageSubject,
          messageText: fullMessageText,
        }).catch(() => {});
      }

      dispatchEmailToOwner({
        type: 'Direct App Message',
        senderName: msgName.trim(),
        senderPhone: msgPhone.trim(),
        senderEmail: msgEmail.trim() || user?.email || 'Not provided',
        subject: `${msgSubject} (WhatsApp Dispatch)`,
        message: fullMessageText,
      }).catch(() => {});
    }
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgFeedback(null);
    setMsgSending(true);

    const combinedMessage = [
      msgAcDetails.trim() ? `AC Unit: ${msgAcDetails.trim()}` : '',
      msgLocation.trim() ? `Location: ${msgLocation.trim()}` : '',
      msgBody.trim(),
    ]
      .filter(Boolean)
      .join('\n');

    try {
      if (user) {
        await createCustomerMessageInFirestore({
          senderName: msgName.trim(),
          senderPhone: msgPhone.trim(),
          senderEmail: msgEmail.trim() || user.email || '',
          subject: msgSubject as MessageSubject,
          messageText: combinedMessage,
        });
      }

      await dispatchEmailToOwner({
        type: 'Direct App Message',
        senderName: msgName.trim(),
        senderPhone: msgPhone.trim(),
        senderEmail: msgEmail.trim() || user?.email || 'Not provided',
        subject: msgSubject,
        message: combinedMessage,
      });

      const mailtoSubject = `[Cool Bros AC Service Inquiry] ${msgSubject} - ${msgName.trim()}`;
      const mailtoBody = `Name: ${msgName.trim()}\nPhone: ${msgPhone.trim()}\nEmail: ${
        msgEmail.trim() || 'N/A'
      }\nAC Unit: ${msgAcDetails.trim() || 'N/A'}\nLocation: ${
        msgLocation.trim() || 'N/A'
      }\n\nMessage:\n${msgBody.trim()}`;

      setMsgFeedback({
        type: 'success',
        text: `Your message has been emailed to ${OWNER_EMAIL}. You can also tap "Send on WhatsApp" below for an instant chat reply.`,
        mailtoHref: `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(
          mailtoSubject
        )}&body=${encodeURIComponent(mailtoBody)}`,
      });
    } catch (err) {
      setMsgFeedback({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Could not send email. Please use the WhatsApp button below.',
      });
    } finally {
      setMsgSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#191A23] pb-20 md:pb-0 selection:bg-[#7DD3FC] selection:text-[#191A23]">
      {/* Scroll Progress Bar (Compositor-Only transform: scaleX) */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-1 bg-[#7DD3FC] border-b border-[#191A23] origin-left z-50 pointer-events-none"
      />

      {/* TOP BAR CONTRACT: Strictly 3 Zones separated by responsive gap */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#191A23]/10">
        <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between gap-3 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-12 h-16 sm:h-20">
          {/* Zone 1: Brand Snowflake Emblem + Wordmark */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigateHomeSection();
            }}
            className="inline-flex items-center gap-2 sm:gap-2.5 text-base sm:text-xl lg:text-2xl font-display font-bold tracking-tight text-[#191A23] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23] rounded-lg"
          >
            <CoolBrosLogo className="w-8 h-8 sm:w-9 sm:h-9 text-[#191A23]" />
            <span>Cool Bros AC Service</span>
          </a>

          {/* Zone 2: Clean Single-Line Navigation Links (Desktop lg+) */}
          <nav className="hidden lg:flex items-center gap-7 xl:gap-9 text-sm font-medium text-[#191A23]">
            <a
              href="#services"
              onClick={(e) => {
                e.preventDefault();
                navigateHomeSection('services');
              }}
              className="py-1 hover:underline decoration-[#7DD3FC] decoration-2 underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23] rounded"
            >
              Services
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
          </nav>

          {/* Zone 3: Primary Action / User Account Popover + Mobile/Tablet Menu Toggle */}
          <div className="relative flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                  className="group inline-flex items-center gap-2 sm:gap-2.5 pl-2 pr-3 sm:pr-4 py-1.5 min-h-[42px] text-xs font-semibold text-[#191A23] bg-white border border-[#191A23] rounded-xl hover:bg-[#7DD3FC] active:translate-y-0.5 transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                >
                  {user.photoURL && !avatarImgError ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || user.email || 'User profile'}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarImgError(true)}
                      className="w-7 h-7 rounded-full object-cover border border-[#191A23] shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#191A23] text-[#7DD3FC] flex items-center justify-center text-xs font-bold uppercase shrink-0">
                      {(user.displayName || user.email || 'U').charAt(0)}
                    </div>
                  )}
                  <span className="max-w-[90px] sm:max-w-[130px] truncate tracking-tight">
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Account'}
                  </span>
                </button>

                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2.5 w-64 bg-white border border-[#191A23] rounded-2xl p-3.5 z-50 space-y-3">
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
                            {user.displayName || 'Verified Customer'}
                          </p>
                          <p className="text-[11px] font-mono text-[#191A23]/70 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          signOutUser();
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 min-h-[42px] text-xs font-bold text-white bg-[#191A23] hover:bg-red-600 rounded-xl transition-colors cursor-pointer"
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
                className="group inline-flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold text-[#191A23] bg-white border border-[#191A23] rounded-xl hover:bg-[#7DD3FC] active:translate-y-0.5 transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
              >
                <svg
                  className="w-4 h-4 shrink-0"
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
                <span className="hidden sm:inline">Sign In with Google</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden min-w-[42px] min-h-[42px] flex items-center justify-center text-[#191A23] rounded-xl border border-[#191A23] hover:bg-[#F3F3F3] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Responsive Drawer (Below lg breakpoint) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t border-[#191A23] bg-white"
            >
              <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-sm font-semibold text-[#191A23]">
                  <a
                    href="#services"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateHomeSection('services');
                    }}
                    className="min-h-[46px] px-3.5 rounded-xl bg-[#F3F3F3] hover:bg-[#7DD3FC] border border-[#191A23] flex items-center justify-center text-center whitespace-nowrap transition-colors"
                  >
                    Services
                  </a>
                  <a
                    href="#protocol"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateHomeSection('protocol');
                    }}
                    className="min-h-[46px] px-3.5 rounded-xl bg-[#F3F3F3] hover:bg-[#7DD3FC] border border-[#191A23] flex items-center justify-center text-center whitespace-nowrap transition-colors"
                  >
                    Working Process
                  </a>
                  <a
                    href="#reviews"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateHomeSection('reviews');
                    }}
                    className="min-h-[46px] px-3.5 rounded-xl bg-[#F3F3F3] hover:bg-[#7DD3FC] border border-[#191A23] flex items-center justify-center text-center whitespace-nowrap transition-colors"
                  >
                    Reviews ({allReviews.length})
                  </a>
                  <a
                    href="#send-message"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateHomeSection('send-message');
                    }}
                    className="min-h-[46px] px-3.5 rounded-xl bg-[#191A23] text-white flex items-center justify-center text-center whitespace-nowrap"
                  >
                    Contact Us
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <a
                    href={buildWhatsAppUrl(
                      'Hi Cool Bros AC Service, I would like to book an AC service visit.'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[46px] px-4 font-bold bg-[#86EFAC] hover:bg-[#4ADE80] text-[#191A23] border border-[#191A23] rounded-xl flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>WhatsApp +91 9560415262</span>
                  </a>
                  <a
                    href="tel:+919560415262"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[46px] px-4 font-bold bg-[#7DD3FC] hover:bg-[#38BDF8] text-[#191A23] border border-[#191A23] rounded-xl flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>Call +91 9560415262</span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Auth Error Alert */}
      {authError && (
        <div className="bg-[#7DD3FC] border-b border-[#191A23] px-4 py-2.5 text-center text-xs font-semibold text-[#191A23]">
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

      <main className="flex-1">
        {activeLegalPage ? (
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
            {/* SPLIT HERO SECTION (Mobile, Tablet, & Desktop Optimized) */}
            <section className="pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-14 lg:pb-20">
              <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-center">
                  {/* Left 6 Columns: Editorial Headline, Copy, & Primary CTAs */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="lg:col-span-6 space-y-5 sm:space-y-6 text-left"
                  >
                    <h1
                      className="font-display font-bold text-[#191A23] tracking-tight text-balance"
                      style={{ fontSize: 'clamp(2.1rem, 4.3vw, 4rem)', lineHeight: 1.08 }}
                    >
                      Expert AC Service & Repair at Your Doorstep
                    </h1>

                    <p className="text-base sm:text-lg text-[#191A23]/80 leading-relaxed max-w-[52ch]">
                      Fast, reliable foam jet cleaning, gas charging, and inverter PCB repair across{' '}
                      <strong className="font-semibold text-[#191A23]">
                        Delhi & Gurugram
                      </strong>
                      .
                    </p>

                    <div className="pt-1 sm:pt-2 grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-3.5 sm:gap-4">
                      <a
                        href="#send-message"
                        className="inline-flex items-center justify-center gap-2.5 px-7 py-4 min-h-[50px] text-sm font-semibold text-white bg-[#191A23] border border-[#191A23] rounded-2xl hover:bg-[#191A23]/90 active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                      >
                        <span>Book a consultation</span>
                      </a>

                      <a
                        href={buildWhatsAppUrl(
                          'Hi Cool Bros AC Service, I would like to book an AC service / inquiry.'
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-4 min-h-[50px] text-sm font-bold text-[#191A23] bg-[#86EFAC] border border-[#191A23] rounded-2xl hover:bg-[#4ADE80] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
                      >
                        <MessageCircle className="w-4 h-4 shrink-0" />
                        <span>WhatsApp us</span>
                      </a>
                    </div>

                    {/* Direct Contact Trust Strip */}
                    <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm font-medium text-[#191A23]/80">
                      <a
                        href="tel:+919560415262"
                        className="inline-flex items-center gap-1.5 py-1 font-mono font-bold text-[#191A23] hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>+91 9560415262</span>
                      </a>
                      <span aria-hidden="true">·</span>
                      <a
                        href="mailto:coolbrosacservice@gmail.com"
                        className="inline-flex items-center gap-1.5 py-1 font-mono hover:underline break-all sm:break-normal"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span>coolbrosacservice@gmail.com</span>
                      </a>
                    </div>
                  </motion.div>

                  {/* Right 6 Columns: Animated HVAC Vector Art Illustration */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="lg:col-span-6"
                  >
                    <HeroCoolingIllustration />
                  </motion.div>
                </div>

                {/* BRAND LOGO STRIP (Dull B&W by default, Full Color on Cursor Hover) */}
                <div className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-[#191A23]/10">
                  <p className="text-[11px] sm:text-xs font-mono text-[#191A23]/60 mb-4 sm:mb-6 text-center lg:text-left">
                    FACTORY-CALIBRATED SERVICING FOR ALL MAJOR INVERTER & VRF SYSTEMS
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 items-center">
                    {SUPPORTED_BRANDS.map((brand) => (
                      <div
                        key={brand}
                        title={`${brand} AC Service & Repair`}
                        className="group flex items-center justify-center lg:justify-start py-2 px-2 rounded-xl grayscale opacity-45 contrast-75 hover:grayscale-0 hover:opacity-100 hover:contrast-100 hover:scale-105 active:grayscale-0 active:opacity-100 transition-all duration-300 ease-out cursor-pointer select-none"
                      >
                        <AcBrandLogo brand={brand} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 01: REDESIGNED SERVICES & LIVE RATE CONFIGURATOR */}
            <section id="services" className="py-12 sm:py-16 lg:py-24">
              <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
                {/* Section Header + Service Guarantee Highlights */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#191A23]/15">
                  <div className="space-y-3 sm:space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2">
                      <span className="bg-[#7DD3FC] px-3.5 py-1 rounded-lg border border-[#191A23] text-2xl sm:text-3xl font-display font-bold text-[#191A23]">
                        Services
                      </span>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#F3F3F3] border border-[#191A23]/20 text-[#191A23]">
                        06 Factory-Spec Packages
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-[#191A23]/80 leading-relaxed">
                      Precision HVAC maintenance, 140 PSI hydro-jet cleaning, nitrogen leak testing,
                      and inverter PCB diagnostics across Delhi &amp; Gurugram. Select your AC type
                      below for instant, upfront pricing:
                    </p>
                  </div>

                  {/* Key Engineering Guarantees */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
                    <div className="bg-[#F3F3F3] border border-[#191A23] rounded-xl px-3.5 py-2.5">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-[#191A23]/65">
                        INDOOR PROTECTION
                      </p>
                      <p className="text-xs sm:text-sm font-display font-bold text-[#191A23] mt-0.5">
                        360° Zero-Mess Jacket
                      </p>
                    </div>
                    <div className="bg-[#F3F3F3] border border-[#191A23] rounded-xl px-3.5 py-2.5">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-[#191A23]/65">
                        SERVICE WARRANTY
                      </p>
                      <p className="text-xs sm:text-sm font-display font-bold text-[#191A23] mt-0.5">
                        Up to 365 Days Cover
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1 bg-[#7DD3FC]/35 border border-[#191A23] rounded-xl px-3.5 py-2.5">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-[#191A23]/75">
                        DISPATCH SLA
                      </p>
                      <p className="text-xs sm:text-sm font-display font-bold text-[#191A23] mt-0.5">
                        60-Min Doorstep Arrival
                      </p>
                    </div>
                  </div>
                </div>

                {/* INTERACTIVE CONTROL BAR: Category Filter + Live AC Type & Unit Rate Configurator */}
                <div className="mt-6 sm:mt-8 bg-[#F3F3F3] border border-[#191A23] rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 space-y-4 sm:space-y-5">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    {/* Category Filter Tabs */}
                    <div className="space-y-1.5">
                      <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#191A23]/70">
                        1. Filter by Service Category
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {(
                          [
                            { id: 'all', label: 'All Packages (6)' },
                            { id: 'cleaning', label: 'Jet Wash & Chemical Clean' },
                            { id: 'repair', label: 'Gas Charging & PCB Repair' },
                            { id: 'amc', label: 'AMC & Installation' },
                          ] as { id: ServiceCategoryFilter; label: string }[]
                        ).map((tab) => {
                          const active = serviceCategory === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setServiceCategory(tab.id)}
                              className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                active
                                  ? 'bg-[#191A23] text-[#7DD3FC] border-[#191A23] shadow-[0_2px_0_0_#7DD3FC]'
                                  : 'bg-white text-[#191A23] border-[#191A23]/25 hover:border-[#191A23]'
                              }`}
                            >
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* AC System Type & Multi-Unit Configurator */}
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                      {/* AC Type Selector */}
                      <div className="space-y-1.5">
                        <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#191A23]/70">
                          2. Select AC System Type
                        </span>
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-[#191A23]">
                          {(Object.keys(AC_TYPE_MULTIPLIERS) as AcType[]).map((type) => {
                            const isSelected = selectedAcType === type;
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setSelectedAcType(type)}
                                className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                  isSelected
                                    ? 'bg-[#7DD3FC] text-[#191A23] border border-[#191A23] font-bold'
                                    : 'text-[#191A23]/75 hover:text-[#191A23] hover:bg-[#F3F3F3]'
                                }`}
                              >
                                {type}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Unit Count Selector with Multi-Unit Discount */}
                      <div className="space-y-1.5">
                        <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#191A23]/70">
                          3. Units {selectedUnitCount >= 2 && (
                            <span className="text-[#0284C7] font-bold">
                              ({selectedUnitCount >= 4 ? '15% OFF' : selectedUnitCount === 3 ? '10% OFF' : '5% OFF'})
                            </span>
                          )}
                        </span>
                        <div className="inline-flex items-center bg-white p-1 rounded-xl border border-[#191A23] gap-1">
                          {[1, 2, 3, 4].map((count) => {
                            const active = selectedUnitCount === count;
                            return (
                              <button
                                key={count}
                                type="button"
                                onClick={() => setSelectedUnitCount(count)}
                                className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                  active
                                    ? 'bg-[#191A23] text-[#7DD3FC]'
                                    : 'text-[#191A23]/75 hover:bg-[#F3F3F3]'
                                }`}
                              >
                                {count} {count === 1 ? 'AC' : 'ACs'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Configuration Summary Strip */}
                  <div className="pt-3 border-t border-[#191A23]/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#191A23]/80">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#0284C7]" />
                      <span>
                        Showing live rates for{' '}
                        <strong className="text-[#191A23]">
                          {selectedUnitCount} × {selectedAcType}
                        </strong>{' '}
                        ({AC_TYPE_MULTIPLIERS[selectedAcType].note})
                      </span>
                    </div>
                    {selectedUnitCount > 1 && (
                      <span className="bg-[#86EFAC] border border-[#191A23] px-2.5 py-0.5 rounded-md text-[11px] font-bold text-[#191A23]">
                        Multi-AC Fleet Discount Applied Automatically
                      </span>
                    )}
                  </div>
                </div>

                {/* REDESIGNED SERVICE CARDS GRID (1 col mobile, 2 cols tablet & desktop) */}
                <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 lg:gap-8">
                  {SERVICE_PACKAGES.filter(
                    (pkg) =>
                      serviceCategory === 'all' ||
                      SERVICE_CATEGORY_MAP[pkg.id] === serviceCategory
                  ).map((pkg, idx) => {
                    const originalIndex = SERVICE_PACKAGES.findIndex((p) => p.id === pkg.id);
                    const theme = getServiceCardTheme(originalIndex);
                    const [titleLine1, titleLine2] = splitServiceTitle(pkg.name);
                    const highlightBadge = SERVICE_HIGHLIGHT_BADGE[pkg.id];

                    // Calculate live price based on selected AC Type & Unit Count
                    const acMultiplier = AC_TYPE_MULTIPLIERS[selectedAcType]?.multiplier || 1;
                    const singleUnitRate = Math.round(pkg.basePriceInr * acMultiplier);
                    const multiDiscount =
                      selectedUnitCount >= 4
                        ? 0.15
                        : selectedUnitCount === 3
                        ? 0.1
                        : selectedUnitCount === 2
                        ? 0.05
                        : 0;
                    const totalRate = Math.round(
                      singleUnitRate * selectedUnitCount * (1 - multiDiscount)
                    );
                    const unitSummaryLabel = `${selectedAcType} (${selectedUnitCount} ${
                      selectedUnitCount === 1 ? 'Unit' : 'Units'
                    })`;

                    return (
                      <motion.article
                        key={pkg.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-30px' }}
                        transition={{
                          duration: 0.35,
                          delay: idx * 0.05,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        whileHover={{ y: -4 }}
                        className={`${theme.cardBg} border-2 border-[#191A23] rounded-[26px] sm:rounded-[34px] p-5 sm:p-7 lg:p-8 flex flex-col justify-between gap-5 shadow-[0_6px_0_0_#191A23] transition-all`}
                      >
                        {/* Top Telemetry Header Bar */}
                        <div
                          className={`flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl border ${theme.headerStripBg}`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${theme.badgeBg}`}
                            >
                              #{pkg.index}
                            </span>
                            <span className="text-xs font-mono font-semibold opacity-85">
                              {pkg.pressurePsi}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {highlightBadge && (
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[#7DD3FC] text-[#191A23] border border-[#191A23]">
                                {highlightBadge}
                              </span>
                            )}
                            <span
                              className={`hidden sm:inline-block px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold border ${theme.gainBadgeBg}`}
                            >
                              {pkg.expectedCoolingGain}
                            </span>
                          </div>
                        </div>

                        {/* Title + Tagline + Bespoke HVAC Illustration */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-2.5 flex-1">
                            <h3 className="font-display font-bold text-xl sm:text-2xl leading-snug flex flex-col items-start">
                              <span
                                className={`${theme.labelBg} px-2.5 py-0.5 rounded-md border border-[#191A23]`}
                              >
                                {titleLine1}
                              </span>
                              {titleLine2 && (
                                <span
                                  className={`${theme.labelBg} px-2.5 py-0.5 rounded-md border border-[#191A23] -mt-0.5`}
                                >
                                  {titleLine2}
                                </span>
                              )}
                            </h3>
                            <p className={`text-xs sm:text-sm leading-relaxed ${theme.metaText}`}>
                              {pkg.tagline}
                            </p>
                          </div>

                          {/* Compact Technical Illustration Box */}
                          <div
                            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border ${theme.illustrationBox} flex items-center justify-center p-2 shrink-0 self-end sm:self-center`}
                          >
                            <div className="scale-75 sm:scale-90 origin-center">
                              <ServiceCardIllustration index={originalIndex} />
                            </div>
                          </div>
                        </div>

                        {/* Visible Engineering Deliverables Checklist */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-mono font-bold uppercase tracking-wider opacity-75">
                              Included Engineering Protocol:
                            </p>
                            <span className="sm:hidden text-[11px] font-mono font-semibold text-[#0284C7]">
                              {pkg.expectedCoolingGain}
                            </span>
                          </div>
                          <ul className="grid grid-cols-1 gap-2">
                            {pkg.deliverables.map((item, dIdx) => (
                              <li
                                key={dIdx}
                                className="flex items-start gap-2.5 text-xs sm:text-[13px] leading-snug"
                              >
                                <span
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${theme.checkCircle}`}
                                >
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                                <span className="opacity-90">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* 3-Column Telemetry & Live Rate Bar */}
                        <div
                          className={`grid grid-cols-3 gap-2 rounded-2xl border p-3 sm:p-3.5 ${theme.metricsBg}`}
                        >
                          <div>
                            <p className="text-[10px] font-mono uppercase opacity-65">
                              {selectedUnitCount > 1
                                ? `TOTAL (${selectedUnitCount} ACs)`
                                : `${selectedAcType.toUpperCase()} RATE`}
                            </p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span
                                className={`text-lg sm:text-xl font-mono font-bold tabular-nums ${theme.priceText}`}
                              >
                                ₹{totalRate.toLocaleString('en-IN')}
                              </span>
                              {selectedUnitCount > 1 && (
                                <span className="text-[10px] font-mono opacity-70">
                                  (₹{Math.round(totalRate / selectedUnitCount)}/AC)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="border-x border-current/15 px-2.5">
                            <p className="text-[10px] font-mono uppercase opacity-65">
                              SERVICE TIME
                            </p>
                            <p className="text-sm sm:text-base font-mono font-bold tabular-nums mt-0.5">
                              {pkg.durationMinutes} Mins
                            </p>
                          </div>

                          <div className="pl-1">
                            <p className="text-[10px] font-mono uppercase opacity-65">
                              WARRANTY
                            </p>
                            <p className="text-sm sm:text-base font-mono font-bold tabular-nums mt-0.5">
                              {pkg.warrantyDays} Days
                            </p>
                          </div>
                        </div>

                        {/* Card Footer Actions: Instant WhatsApp + Form Booking + Modal Spec */}
                        <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                          <a
                            href={buildWhatsAppUrl(
                              `Hi Cool Bros AC Service, I want to book *${pkg.name}* for *${unitSummaryLabel}* (Est. ₹${totalRate.toLocaleString('en-IN')}). Please share available technician slots.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] text-xs sm:text-sm font-bold text-[#191A23] bg-[#86EFAC] border border-[#191A23] rounded-xl hover:bg-[#4ADE80] active:translate-y-0.5 transition-all whitespace-nowrap"
                          >
                            <MessageCircle className="w-4 h-4 shrink-0" />
                            <span>Book on WhatsApp</span>
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              handleSelectPackageForBooking(
                                pkg.name,
                                unitSummaryLabel,
                                totalRate
                              )
                            }
                            className={`inline-flex items-center justify-center gap-1.5 px-4 py-3 min-h-[46px] text-xs sm:text-sm font-semibold border rounded-xl transition-all cursor-pointer whitespace-nowrap ${theme.secondaryBtn}`}
                          >
                            <span>Schedule Online</span>
                            <ArrowUpRight className="w-4 h-4 shrink-0" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedServiceModal(pkg)}
                            title="View Full Package Specifications"
                            className={`inline-flex items-center justify-center px-3 py-3 min-h-[46px] text-xs font-mono font-semibold underline underline-offset-4 ${theme.learnText} opacity-80 hover:opacity-100 cursor-pointer shrink-0`}
                          >
                            Specs
                          </button>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>

                {/* CALLOUT BANNER: 60-MIN EMERGENCY DISPATCH DESK */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mt-10 sm:mt-14 bg-[#F3F3F3] border-2 border-[#191A23] rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 lg:p-12 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center shadow-[0_6px_0_0_#191A23]"
                >
                  <div className="md:col-span-8 lg:col-span-8 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-2 bg-[#7DD3FC] border border-[#191A23] px-3 py-1 rounded-lg text-xs font-mono font-bold text-[#191A23]">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>RAPID DISPATCH: DELHI &amp; GURUGRAM</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#191A23]/75">
                        · Same-Day Doorstep Slot Guaranteed
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-[#191A23] text-balance">
                      Emergency AC breakdown, water leakage, or warm air in Delhi or Gurugram?
                    </h3>

                    <p className="text-sm sm:text-base text-[#191A23]/80 max-w-2xl leading-relaxed">
                      Our mobile HVAC response vans carry R32/R410A refrigerant, digital manifold
                      gauges, 140 PSI hydro-jet pumps, and genuine inverter PCB spares across Dwarka,
                      South Delhi, Vasant Kunj, Janakpuri, DLF Phases 1–5, Golf Course Road, and Sohna Road.
                    </p>

                    <div className="pt-2 grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-3.5">
                      <a
                        href={buildWhatsAppUrl(
                          'Hi Cool Bros AC Service, I need urgent 60-minute AC inspection / breakdown support.'
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] text-sm font-bold text-[#191A23] bg-[#86EFAC] border border-[#191A23] rounded-2xl hover:bg-[#4ADE80] transition-all whitespace-nowrap"
                      >
                        <MessageCircle className="w-4 h-4 shrink-0" />
                        <span>WhatsApp +91 9560415262</span>
                      </a>
                      <a
                        href="tel:+919560415262"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] text-sm font-semibold text-white bg-[#191A23] rounded-2xl hover:bg-[#191A23]/90 transition-colors whitespace-nowrap"
                      >
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>Call Dispatch Desk</span>
                      </a>
                    </div>
                  </div>
                  <div className="md:col-span-4 lg:col-span-4 hidden md:flex justify-end">
                    <div className="w-44 h-44 lg:w-56 lg:h-56">
                      <DispatchDeskIllustration />
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* SECTION 02: "OUR WORKING PROCESS" ACCORDION */}
            <section id="protocol" className="py-12 sm:py-16 lg:py-24">
              <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
                <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 lg:gap-10">
                  <h2 className="inline-block self-start bg-[#7DD3FC] px-3.5 py-1 rounded-lg border border-[#191A23] text-2xl sm:text-3xl font-display font-bold text-[#191A23] shrink-0">
                    Our Working Process
                  </h2>
                  <p className="text-sm sm:text-base text-[#191A23]/80 max-w-2xl leading-relaxed">
                    Step-by-step 6-stage engineering protocol for restoring factory-spec cooling
                    without a single drop of indoor mess:
                  </p>
                </div>

                <div className="mt-8 sm:mt-12 space-y-4 sm:space-y-5">
                  {PROTOCOL_STEPS.map((st, index) => {
                    const isOpen = openStepIndex === index;
                    return (
                      <motion.div
                        key={st.step}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: index * 0.04 }}
                        className={`border border-[#191A23] rounded-[24px] sm:rounded-[34px] transition-colors duration-200 ${
                          isOpen ? 'bg-[#7DD3FC]' : 'bg-[#F3F3F3]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenStepIndex(isOpen ? -1 : index)}
                          className="w-full px-5 sm:px-8 lg:px-10 py-5 sm:py-7 lg:py-8 flex items-center justify-between gap-3 sm:gap-4 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23] rounded-[24px] sm:rounded-[34px]"
                        >
                          <div className="flex items-center gap-3.5 sm:gap-6 lg:gap-7 min-w-0">
                            <span className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold text-[#191A23] tabular-nums shrink-0">
                              {st.step}
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-base sm:text-xl lg:text-2xl font-display font-bold text-[#191A23] leading-snug">
                                {st.title}
                              </h3>
                              <span className="block text-[11px] sm:text-xs font-mono text-[#191A23]/75 mt-0.5">
                                {st.metric}
                              </span>
                            </div>
                          </div>

                          <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F3F3F3] border border-[#191A23] flex items-center justify-center shrink-0">
                            {isOpen ? (
                              <Minus className="w-5 h-5 text-[#191A23]" />
                            ) : (
                              <Plus className="w-5 h-5 text-[#191A23]" />
                            )}
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 sm:px-8 lg:px-10 pb-6 sm:pb-8 pt-4 border-t border-[#191A23]/25 text-sm sm:text-base text-[#191A23] leading-relaxed max-w-4xl">
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

            {/* SECTION 04: CUSTOMER REVIEWS & RATINGS (BOTH WITH SIGN-IN OR WITHOUT SIGN-IN) */}
            <section id="reviews" className="py-12 sm:py-16 lg:py-24">
              <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 lg:gap-10">
                    <h2 className="inline-block self-start bg-[#7DD3FC] px-3.5 py-1 rounded-lg border border-[#191A23] text-2xl sm:text-3xl font-display font-bold text-[#191A23] shrink-0">
                      Reviews & Ratings
                    </h2>
                    <p className="text-sm sm:text-base text-[#191A23]/80 max-w-xl leading-relaxed">
                      Read real customer feedback or share your AC service experience below — write
                      a review instantly as a guest or with your Google account:
                    </p>
                  </div>

                  {/* Aggregate Rating Summary */}
                  <div className="bg-[#191A23] text-white border border-[#191A23] rounded-2xl px-5 py-3.5 flex items-center gap-4 self-start md:self-auto shrink-0">
                    <div>
                      <p className="text-xl sm:text-2xl font-mono font-bold text-[#7DD3FC] tabular-nums leading-none">
                        {averageRating} / 5.0
                      </p>
                      <p className="text-[11px] font-mono text-white/70 mt-1">
                        {allReviews.length} Customer Reviews
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 text-[#7DD3FC]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-[#7DD3FC] text-[#7DD3FC]" />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 sm:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
                  {/* Left 5 Columns: Write a Review Form (Sticky on Desktop) */}
                  <div className="lg:col-span-5 lg:sticky lg:top-28 bg-[#F3F3F3] border border-[#191A23] rounded-[28px] sm:rounded-[36px] p-5 sm:p-8 space-y-5">
                    <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#191A23]/15">
                      <div>
                        <h3 className="text-lg sm:text-xl font-display font-bold text-[#191A23]">
                          Write a Customer Review
                        </h3>
                        <p className="text-xs text-[#191A23]/75 mt-0.5">
                          {user
                            ? `Posting as Verified Google User (${user.displayName || user.email})`
                            : 'Posting as Guest Customer (No sign-in required)'}
                        </p>
                      </div>
                      {!user && (
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          className="px-3 py-2 min-h-[38px] text-xs font-bold text-[#191A23] bg-white hover:bg-[#7DD3FC] border border-[#191A23] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Or Sign In
                        </button>
                      )}
                    </div>

                    {revFeedback && (
                      <div
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
                      {/* Interactive 1-5 Star Rating Picker */}
                      <div>
                        <label className="block text-xs font-bold text-[#191A23] mb-2">
                          Your Star Rating *
                        </label>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {[1, 2, 3, 4, 5].map((starVal) => {
                            const active = (revHoverRating ?? revRating) >= starVal;
                            return (
                              <button
                                key={starVal}
                                type="button"
                                onClick={() => setRevRating(starVal)}
                                onMouseEnter={() => setRevHoverRating(starVal)}
                                onMouseLeave={() => setRevHoverRating(null)}
                                className={`w-11 h-11 rounded-xl border border-[#191A23] flex items-center justify-center transition-all cursor-pointer ${
                                  active
                                    ? 'bg-[#191A23] text-[#7DD3FC]'
                                    : 'bg-white text-[#191A23]/30 hover:text-[#191A23]'
                                }`}
                                aria-label={`Rate ${starVal} out of 5 stars`}
                              >
                                <Star
                                  className={`w-5 h-5 ${active ? 'fill-[#7DD3FC]' : ''}`}
                                />
                              </button>
                            );
                          })}
                          <span className="ml-1.5 sm:ml-2 text-xs font-mono font-bold text-[#191A23] tabular-nums">
                            {revRating} / 5 Stars
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-[#191A23] mb-1">
                            Your Name *
                          </label>
                          <input
                            type="text"
                            required
                            minLength={2}
                            maxLength={80}
                            value={revName}
                            onChange={(e) => setRevName(e.target.value)}
                            placeholder="e.g., Amit Verma"
                            className="w-full px-3.5 py-2.5 min-h-[46px] text-base sm:text-sm bg-white border border-[#191A23] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#191A23] mb-1">
                            Locality (Delhi / Gurugram) *
                          </label>
                          <input
                            type="text"
                            required
                            minLength={2}
                            maxLength={80}
                            value={revLocality}
                            onChange={(e) => setRevLocality(e.target.value)}
                            placeholder="e.g., Dwarka Sec 12 / DLF Phase 3"
                            className="w-full px-3.5 py-2.5 min-h-[46px] text-base sm:text-sm bg-white border border-[#191A23] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#191A23] mb-1">
                          Service Package Used
                        </label>
                        <select
                          value={revService}
                          onChange={(e) => setRevService(e.target.value as ServiceType)}
                          className="w-full px-3.5 py-2.5 min-h-[46px] text-base sm:text-sm bg-white border border-[#191A23] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]"
                        >
                          {VALIDATION_RULES.SERVICE_TYPES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#191A23] mb-1">
                          Your Review *
                        </label>
                        <textarea
                          rows={3}
                          required
                          minLength={5}
                          maxLength={600}
                          value={revText}
                          onChange={(e) => setRevText(e.target.value)}
                          placeholder="Share how our technician performed, cooling improvement, or punctuality..."
                          className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-white border border-[#191A23] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={revSubmitting}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] text-sm font-bold text-[#191A23] bg-[#7DD3FC] border border-[#191A23] rounded-2xl hover:bg-[#38BDF8] active:translate-y-0.5 transition-all cursor-pointer"
                      >
                        <span>
                          {revSubmitting
                            ? 'Publishing Review...'
                            : user
                            ? 'Post Verified Review'
                            : 'Post Guest Review'}
                        </span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                  {/* Right 7 Columns: Filter Bar + Live Customer Reviews Feed */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Interactive Rating Filter Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {(['all', 5, 4, 3] as const).map((flt) => (
                          <button
                            key={String(flt)}
                            type="button"
                            onClick={() => setReviewFilterRating(flt)}
                            className={`px-3.5 py-2 min-h-[40px] text-xs font-bold rounded-xl border border-[#191A23] transition-colors cursor-pointer ${
                              reviewFilterRating === flt
                                ? 'bg-[#191A23] text-[#7DD3FC]'
                                : 'bg-white text-[#191A23] hover:bg-[#7DD3FC]'
                            }`}
                          >
                            {flt === 'all' ? `All Reviews (${allReviews.length})` : `${flt} ★`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-4">
                      {filteredReviews.map((rev, idx) => {
                        const isDarkCard = idx % 3 === 1;
                        const canDelete =
                          user &&
                          rev.authorId !== 'guest' &&
                          rev.authorId === user.uid &&
                          !rev.id.startsWith('featured-');

                        return (
                          <motion.div
                            key={rev.id}
                            initial={{ opacity: 0, y: 14 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className={`p-5 sm:p-7 rounded-[26px] sm:rounded-[30px] border border-[#191A23] space-y-4 ${
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
                                    className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded border border-[#191A23] ${
                                      rev.isVerifiedUser
                                        ? 'bg-[#7DD3FC] text-[#191A23]'
                                        : isDarkCard
                                        ? 'bg-white/15 text-white border-white/30'
                                        : 'bg-[#F3F3F3] text-[#191A23]'
                                    }`}
                                  >
                                    {rev.isVerifiedUser ? (
                                      <>
                                        <ShieldCheck className="w-3 h-3" />
                                        <span>Verified Google User</span>
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="w-3 h-3" />
                                        <span>Guest Reviewer</span>
                                      </>
                                    )}
                                  </span>
                                </div>
                                <p
                                  className={`text-xs font-mono mt-1 ${
                                    isDarkCard ? 'text-white/65' : 'text-[#191A23]/65'
                                  }`}
                                >
                                  {rev.serviceUsed} · {rev.locality}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-4 h-4 ${
                                        s <= rev.rating
                                          ? 'fill-[#7DD3FC] text-[#7DD3FC]'
                                          : isDarkCard
                                          ? 'text-white/25'
                                          : 'text-[#191A23]/20'
                                      }`}
                                    />
                                  ))}
                                </div>
                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOwnReview(rev.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete your review"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <p
                              className={`text-sm sm:text-base leading-relaxed ${
                                isDarkCard ? 'text-white/90' : 'text-[#191A23]/85'
                              }`}
                            >
                              "{rev.reviewText}"
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 05: CONTACT / SEND US A DIRECT MESSAGE FOR WHATSAPP & EMAIL */}
            <section id="send-message" className="py-12 sm:py-16 lg:py-24">
              <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
                <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 lg:gap-10">
                  <h2 className="inline-block self-start bg-[#7DD3FC] px-3.5 py-1 rounded-lg border border-[#191A23] text-2xl sm:text-3xl font-display font-bold text-[#191A23] shrink-0">
                    Contact Us
                  </h2>
                  <p className="text-sm sm:text-base text-[#191A23]/80 max-w-2xl leading-relaxed">
                    Send us a direct message for instant WhatsApp dispatch at{' '}
                    <span className="font-mono font-bold text-[#191A23]">+91 9560415262</span> or
                    email alert to{' '}
                    <span className="font-mono font-bold text-[#191A23] break-all sm:break-normal">{OWNER_EMAIL}</span>:
                  </p>
                </div>

                <div className="mt-8 sm:mt-12 bg-[#F3F3F3] border border-[#191A23] rounded-[28px] sm:rounded-[40px] p-5 sm:p-8 lg:p-12 xl:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
                  {/* Left 7 Columns: Direct Message Form */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Quick-Fill WhatsApp Templates */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-mono font-bold text-[#191A23]">
                        QUICK-SELECT SERVICE REQUIREMENT:
                      </p>
                      <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickTemplateSelect(
                              'General AC Inquiry',
                              'I need Foam Power Jet Servicing for my AC. Please share today/tomorrow slot availability.',
                              'Split AC (1 Unit)'
                            )
                          }
                          className="px-3.5 py-2.5 min-h-[42px] text-xs font-bold text-[#191A23] bg-white hover:bg-[#7DD3FC] border border-[#191A23] rounded-xl transition-colors cursor-pointer text-left sm:text-center whitespace-nowrap"
                        >
                          Foam Jet Service (₹599)
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
                          className="px-3.5 py-2.5 min-h-[42px] text-xs font-bold text-[#191A23] bg-white hover:bg-[#7DD3FC] border border-[#191A23] rounded-xl transition-colors cursor-pointer text-left sm:text-center whitespace-nowrap"
                        >
                          Not Cooling / Gas Check
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickTemplateSelect(
                              'General AC Inquiry',
                              'Need AC installation / uninstallation with copper pipe & vacuum testing.',
                              'Split AC (1 Unit)'
                            )
                          }
                          className="px-3.5 py-2.5 min-h-[42px] text-xs font-bold text-[#191A23] bg-white hover:bg-[#7DD3FC] border border-[#191A23] rounded-xl transition-colors cursor-pointer text-left sm:text-center whitespace-nowrap"
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
                          className="px-3.5 py-2.5 min-h-[42px] text-xs font-bold text-[#191A23] bg-white hover:bg-[#7DD3FC] border border-[#191A23] rounded-xl transition-colors cursor-pointer text-left sm:text-center whitespace-nowrap"
                        >
                          Multi-Unit / AMC Quote
                        </button>
                      </div>
                    </div>

                    {msgFeedback && (
                      <div
                        className={`p-4 rounded-2xl border border-[#191A23] text-xs font-semibold ${
                          msgFeedback.type === 'success'
                            ? 'bg-[#7DD3FC] text-[#191A23]'
                            : 'bg-red-100 text-red-950'
                        }`}
                      >
                        <p>{msgFeedback.text}</p>
                        {msgFeedback.mailtoHref && (
                          <a
                            href={msgFeedback.mailtoHref}
                            className="inline-block mt-1.5 font-bold underline"
                          >
                            Also open in your email client →
                          </a>
                        )}
                      </div>
                    )}

                    <form onSubmit={handleSendMessageSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#191A23] mb-1.5">
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
                            className="w-full px-4 py-3 min-h-[48px] text-base sm:text-sm bg-white border border-[#191A23] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#191A23] mb-1.5">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]{10,15}"
                            required
                            minLength={10}
                            maxLength={15}
                            value={msgPhone}
                            onChange={(e) => setMsgPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="9876543210"
                            className="w-full px-4 py-3 min-h-[48px] text-base sm:text-sm font-mono bg-white border border-[#191A23] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#191A23] mb-1.5">
                            AC Type & Quantity
                          </label>
                          <select
                            value={msgAcDetails}
                            onChange={(e) => setMsgAcDetails(e.target.value)}
                            className="w-full px-4 py-3 min-h-[48px] text-base sm:text-sm bg-white border border-[#191A23] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]"
                          >
                            <option value="Split AC (1 Unit)">Split AC (1 Unit)</option>
                            <option value="Split AC (2 Units)">Split AC (2 Units)</option>
                            <option value="Window AC (1 Unit)">Window AC (1 Unit)</option>
                            <option value="Inverter Split AC">Inverter Split AC</option>
                            <option value="Cassette / Commercial AC">Cassette / Commercial AC</option>
                            <option value="Multiple AC Units (3+)">Multiple AC Units (3+)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#191A23] mb-1.5">
                            Inquiry Topic
                          </label>
                          <select
                            value={msgSubject}
                            onChange={(e) => setMsgSubject(e.target.value)}
                            className="w-full px-4 py-3 min-h-[48px] text-base sm:text-sm bg-white border border-[#191A23] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]"
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#191A23] mb-1.5">
                            Your Locality (Delhi / Gurugram)
                          </label>
                          <input
                            type="text"
                            maxLength={200}
                            value={msgLocation}
                            onChange={(e) => setMsgLocation(e.target.value)}
                            placeholder="e.g., Dwarka, Vasant Kunj, or Gurugram Sector 56"
                            className="w-full px-4 py-3 min-h-[48px] text-base sm:text-sm bg-white border border-[#191A23] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#191A23] mb-1.5">
                            Your Email (Optional)
                          </label>
                          <input
                            type="email"
                            maxLength={120}
                            value={msgEmail}
                            onChange={(e) => setMsgEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-4 py-3 min-h-[48px] text-base sm:text-sm bg-white border border-[#191A23] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#191A23] mb-1.5">
                          Message / Issue Details *
                        </label>
                        <textarea
                          rows={3}
                          required
                          minLength={5}
                          maxLength={1000}
                          value={msgBody}
                          onChange={(e) => setMsgBody(e.target.value)}
                          placeholder="Describe your AC issue, model, or preferred visit time..."
                          className="w-full px-4 py-3 text-base sm:text-sm bg-white border border-[#191A23] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                        <a
                          href={currentMessageWhatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleWhatsAppDirectClick}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-4 min-h-[50px] text-sm font-bold text-[#191A23] bg-[#86EFAC] border border-[#191A23] rounded-2xl hover:bg-[#4ADE80] active:translate-y-0.5 transition-all whitespace-nowrap"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0" />
                          <span>Send on WhatsApp (+91 9560415262)</span>
                        </a>

                        <button
                          type="submit"
                          disabled={msgSending}
                          className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-4 min-h-[50px] text-sm font-semibold text-white bg-[#191A23] border border-[#191A23] rounded-2xl hover:bg-[#191A23]/90 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <Send className="w-4 h-4 shrink-0" />
                          <span>
                            {msgSending ? 'Sending Email...' : 'Also Send Email Alert'}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Right 5 Columns: Direct Engineer Helpline Cards (Sticky on Desktop) */}
                  <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
                    <div className="bg-white border border-[#191A23] rounded-[26px] sm:rounded-[30px] p-5 sm:p-7 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-[#7DD3FC] px-2.5 py-0.5 rounded border border-[#191A23] text-xs font-mono font-bold text-[#191A23]">
                          DIRECT ENGINEER HELPLINE
                        </span>
                        <span className="text-xs font-mono text-[#191A23]/60">08 AM – 09 PM</span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-display font-bold text-[#191A23]">
                        Instant Call, WhatsApp & Email Channels
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
                              <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-[#191A23]/80 font-semibold">
                                Message on WhatsApp
                              </p>
                              <p className="text-base font-mono font-bold text-[#191A23]">
                                +91 9560415262
                              </p>
                            </div>
                          </div>
                          <ArrowUpRight className="w-5 h-5 text-[#191A23] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>

                        {/* Phone Call Direct Button */}
                        <a
                          href="tel:+919560415262"
                          className="p-4 border border-[#191A23] bg-[#F3F3F3] rounded-2xl flex items-center justify-between hover:bg-white transition-colors group"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#191A23] text-white flex items-center justify-center shrink-0">
                              <Phone className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-[#191A23]/70 font-medium">
                                24/7 Dispatch & Booking Line
                              </p>
                              <p className="text-base font-mono font-bold text-[#191A23]">
                                +91 9560415262
                              </p>
                            </div>
                          </div>
                          <ArrowUpRight className="w-5 h-5 text-[#191A23]" />
                        </a>

                        {/* Email Direct Button */}
                        <a
                          href="mailto:coolbrosacservice@gmail.com"
                          className="p-4 border border-[#191A23] bg-[#191A23] text-white rounded-2xl flex items-center justify-between hover:bg-[#191A23]/90 transition-colors group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#7DD3FC] text-[#191A23] flex items-center justify-center shrink-0">
                              <Mail className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-white/70">Official Service & AMC Desk</p>
                              <p className="text-xs sm:text-sm font-mono font-semibold text-white truncate">
                                coolbrosacservice@gmail.com
                              </p>
                            </div>
                          </div>
                          <ArrowUpRight className="w-5 h-5 text-[#7DD3FC] shrink-0 ml-2" />
                        </a>
                      </div>

                      <div className="pt-3 border-t border-[#191A23]/15 space-y-2 text-xs text-[#191A23]/80">
                        <div className="flex items-center gap-2 font-semibold text-[#191A23]">
                          <MapPin className="w-4 h-4 text-[#191A23] shrink-0" />
                          <span>Dedicated Coverage: Delhi & Gurugram</span>
                        </div>
                        <p className="text-[11px] font-mono text-[#191A23]/70 leading-relaxed">
                          Delhi: Dwarka, Vasant Kunj, Janakpuri, South Delhi, Rohini, Connaught Place ·
                          Gurugram: DLF Phases 1–5, Cyber City, Sohna Rd, Golf Course Rd & All Sectors
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* ROUNDED DARK FOOTER */}
      <footer className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-6">
        <div className="bg-[#191A23] text-white rounded-t-[28px] sm:rounded-t-[40px] px-5 sm:px-10 lg:px-12 py-10 sm:py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8 pb-8 border-b border-white/15">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigateHomeSection();
              }}
              className="inline-flex items-center gap-2.5 text-lg sm:text-xl font-display font-bold text-white"
            >
              <CoolBrosLogo className="w-8 h-8 text-[#7DD3FC]" />
              <span>Cool Bros AC Service</span>
            </a>

            <div className="flex flex-wrap items-center gap-5 sm:gap-6 text-xs sm:text-sm font-medium text-white/80">
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault();
                  navigateHomeSection('services');
                }}
                className="py-1 hover:text-[#7DD3FC] underline underline-offset-4"
              >
                Services
              </a>
              <a
                href="#protocol"
                onClick={(e) => {
                  e.preventDefault();
                  navigateHomeSection('protocol');
                }}
                className="py-1 hover:text-[#7DD3FC] underline underline-offset-4"
              >
                Working Process
              </a>
              <a
                href="#reviews"
                onClick={(e) => {
                  e.preventDefault();
                  navigateHomeSection('reviews');
                }}
                className="py-1 hover:text-[#7DD3FC] underline underline-offset-4"
              >
                Reviews
              </a>
              <a
                href="#send-message"
                onClick={(e) => {
                  e.preventDefault();
                  navigateHomeSection('send-message');
                }}
                className="py-1 hover:text-[#7DD3FC] underline underline-offset-4"
              >
                Contact Us
              </a>
            </div>
          </div>

          <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-b border-white/15">
            {/* Contact Column */}
            <div className="md:col-span-5 space-y-2.5 text-xs sm:text-sm">
              <span className="inline-block bg-[#7DD3FC] text-[#191A23] font-bold px-2.5 py-0.5 rounded-md">
                Contact us:
              </span>
              <p className="text-white/85 break-all sm:break-normal">
                Email:{' '}
                <a href="mailto:coolbrosacservice@gmail.com" className="font-mono hover:text-[#7DD3FC]">
                  coolbrosacservice@gmail.com
                </a>
              </p>
              <p className="text-white/85">
                Phone / WhatsApp:{' '}
                <a href="tel:+919560415262" className="font-mono hover:text-[#7DD3FC]">
                  +91 9560415262
                </a>
              </p>
              <p className="text-white/85">
                Service Areas:{' '}
                <span className="font-semibold text-[#7DD3FC]">
                  Delhi & Gurugram
                </span>
              </p>
              <p className="text-white/70">
                Hours: 08:00 AM – 09:00 PM · All Inverter & Split/Window Brands
              </p>
            </div>

            {/* Legal & Policy Pages Column (Terms & Conditions, Privacy Policy, Return Policy, Refund Policy) */}
            <div className="md:col-span-3 space-y-2.5 text-xs sm:text-sm">
              <span className="inline-block bg-[#7DD3FC] text-[#191A23] font-bold px-2.5 py-0.5 rounded-md">
                Legal & Policies:
              </span>
              <ul className="space-y-2 pt-1">
                {LEGAL_PAGE_TABS.map((item) => (
                  <li key={item.slug}>
                    <button
                      type="button"
                      onClick={() => openLegalPage(item.slug)}
                      className={`py-0.5 text-left transition-colors cursor-pointer hover:text-[#7DD3FC] hover:underline underline-offset-4 ${
                        activeLegalPage === item.slug
                          ? 'text-[#7DD3FC] font-bold underline'
                          : 'text-white/85'
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* WhatsApp Dispatch Box */}
            <div className="md:col-span-4 bg-[#292A32] rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4">
              <div>
                <p className="text-sm font-display font-bold text-white">
                  Need instant technician dispatch?
                </p>
                <p className="text-xs text-white/70 mt-0.5">
                  Chat directly with our HVAC engineer on WhatsApp.
                </p>
              </div>
              <a
                href={buildWhatsAppUrl(
                  'Hi Cool Bros AC Service, I would like to inquire about AC servicing.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] text-xs font-bold text-[#191A23] bg-[#86EFAC] rounded-xl hover:bg-[#4ADE80] transition-all whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>WhatsApp +91 9560415262</span>
              </a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-white/60">
            <p>© {new Date().getFullYear()} Cool Bros AC Service. All Rights Reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              {LEGAL_PAGE_TABS.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => openLegalPage(item.slug)}
                  className="py-1 hover:text-[#7DD3FC] underline underline-offset-4 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* STICKY MOBILE BOTTOM QUICK-ACTION BAR (Phones Only < 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#191A23] px-3 py-2.5">
        <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
          <a
            href="tel:+919560415262"
            className="inline-flex items-center justify-center gap-2 min-h-[46px] px-4 text-xs font-bold text-white bg-[#191A23] border border-[#191A23] rounded-xl active:translate-y-0.5 transition-all whitespace-nowrap"
          >
            <Phone className="w-4 h-4 text-[#7DD3FC] shrink-0" />
            <span>Call Now</span>
          </a>
          <a
            href={buildWhatsAppUrl(
              'Hi Cool Bros AC Service, I would like to book an AC service / inquiry.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[46px] px-4 text-xs font-bold text-[#191A23] bg-[#86EFAC] border border-[#191A23] rounded-xl active:translate-y-0.5 transition-all whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>WhatsApp Us</span>
          </a>
        </div>
      </div>

      {/* SERVICE PACKAGE DELIVERABLES MODAL ("Learn more") */}
      <AnimatePresence>
        {selectedServiceModal && (
          <div
            className="fixed inset-0 z-50 bg-[#191A23]/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setSelectedServiceModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border-t-2 sm:border-2 border-[#191A23] rounded-t-[28px] sm:rounded-[34px] max-w-lg w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-8 space-y-5 sm:space-y-6"
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#191A23]/15 pb-4">
                <div>
                  <span className="inline-block bg-[#7DD3FC] border border-[#191A23] px-2.5 py-0.5 rounded-md text-xs font-mono font-bold text-[#191A23]">
                    PACKAGE {selectedServiceModal.index} · {selectedServiceModal.pressurePsi}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-[#191A23] mt-2">
                    {selectedServiceModal.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#191A23]/75 mt-1">
                    {selectedServiceModal.tagline}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedServiceModal(null)}
                  className="w-10 h-10 rounded-full bg-[#F3F3F3] border border-[#191A23] flex items-center justify-center text-[#191A23] hover:bg-[#7DD3FC] cursor-pointer shrink-0"
                  aria-label="Close service details modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-[#F3F3F3] border border-[#191A23] rounded-2xl p-3.5 sm:p-4 text-center">
                <div>
                  <p className="text-[10px] sm:text-[11px] font-mono text-[#191A23]/70">BASE RATE</p>
                  <p className="text-base sm:text-lg font-mono font-bold text-[#191A23] tabular-nums">
                    ₹{selectedServiceModal.basePriceInr}
                  </p>
                </div>
                <div className="border-x border-[#191A23]/15">
                  <p className="text-[10px] sm:text-[11px] font-mono text-[#191A23]/70">DURATION</p>
                  <p className="text-base sm:text-lg font-mono font-bold text-[#191A23] tabular-nums">
                    {selectedServiceModal.durationMinutes}m
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-[11px] font-mono text-[#191A23]/70">WARRANTY</p>
                  <p className="text-base sm:text-lg font-mono font-bold text-[#191A23] tabular-nums">
                    {selectedServiceModal.warrantyDays} Days
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-mono font-bold text-[#191A23]">
                  INCLUDED ENGINEERING DELIVERABLES:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-[#191A23]">
                  {selectedServiceModal.deliverables.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#7DD3FC] border border-[#191A23] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#191A23]" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href={buildWhatsAppUrl(
                    `Hi Cool Bros AC Service, I want to book ${selectedServiceModal.name} (₹${selectedServiceModal.basePriceInr}/unit).`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] text-xs font-bold text-[#191A23] bg-[#86EFAC] border border-[#191A23] rounded-xl hover:bg-[#4ADE80] transition-all whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>Book on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleSelectPackageForBooking(selectedServiceModal.name)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] text-xs font-semibold text-white bg-[#191A23] rounded-xl hover:bg-[#191A23]/90 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Inquire via Message Desk</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
