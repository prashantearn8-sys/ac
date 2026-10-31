import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  RotateCcw,
  RefreshCw,
  Phone,
  Mail,
  MessageCircle,
  Check,
} from 'lucide-react';
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  OPERATING_HOURS,
  OWNER_EMAIL,
} from '../data/acServices';

export type LegalPageSlug = 'terms' | 'privacy' | 'return-policy' | 'refund-policy';

interface LegalSection {
  number: string;
  title: string;
  summaryTag: string;
  paragraphs: string[];
  bullets?: string[];
}

interface LegalPageData {
  slug: LegalPageSlug;
  title: string;
  badge: string;
  lastUpdated: string;
  subtitle: string;
  highlights: { label: string; value: string }[];
  sections: LegalSection[];
}

export const LEGAL_PAGES_DATA: Record<LegalPageSlug, LegalPageData> = {
  terms: {
    slug: 'terms',
    title: 'Terms & Conditions',
    badge: 'SERVICE AGREEMENT & TERMS OF USE',
    lastUpdated: 'October 2026',
    subtitle:
      'These Terms & Conditions govern all residential and commercial air conditioning inspection, servicing, repair, gas charging, and installation work performed by Cool Bros AC Service across Delhi and Gurugram.',
    highlights: [
      { label: 'SERVICE WARRANTY', value: '30 to 90 Days Coverage' },
      { label: 'STANDALONE VISIT FEE', value: '₹249 (₹0 With Any Service)' },
      { label: 'PRICING POLICY', value: 'Published Upfront Rate Card' },
    ],
    sections: [
      {
        number: '01',
        title: 'Scope of AC Services & Operating Window',
        summaryTag: 'Doorstep Inspection & Repair Protocol',
        paragraphs: [
          'Cool Bros AC Service is an independent multi-brand air conditioning maintenance and repair provider offering 140 PSI foam hydro-jet cleaning, refrigerant gas charging (R32, R410A, R22), inverter PCB repair, and split/window AC installation across Delhi and Gurugram.',
          `All appointments requested via WhatsApp (${CONTACT_PHONE_DISPLAY}), telephone, or our website dispatch desk are scheduled within our standard operating window of ${OPERATING_HOURS}.`,
        ],
        bullets: [
          'Customers must provide safe access to both the indoor evaporator unit (IDU) and outdoor condenser unit (ODU), along with functional water and electrical supply points.',
          'If high-rise outdoor unit access requires society maintenance permission, ladder clearance, or safety harness authorization, the customer is responsible for arranging society gate or roof clearance prior to arrival.',
        ],
      },
      {
        number: '02',
        title: 'Inspection Fee, Published Rate Card & Billing',
        summaryTag: 'Pre-Work Approval & Zero Hidden Charges',
        paragraphs: [
          'If you book a cleaning service or approve a repair estimate, the inspection and visiting fee is ₹0 (completely waived). If our technician performs an on-site fault diagnosis and you decide not to proceed with any service or repair, a flat ₹249 diagnostic visit fee applies.',
          'Before starting any repair or component replacement beyond the booked base package, our technician conducts a digital clamp-meter and manifold gauge check and shares an itemized cost estimate from our published rate card on the website.',
        ],
        bullets: [
          'Base service packages cover technician labor, hydro-jet cleaning, and standard wash consumables per AC unit, inclusive of taxes.',
          'Spare parts (capacitors, contactor relays, sensors, copper piping at ₹380/ft, outdoor wall brackets at ₹750/set, or lab PCB repairs) are billed strictly according to the published Spare Parts Rate Card on our homepage and only after your approval.',
          'Payment is collected only after job completion and testing via UPI, cash, or bank transfer.',
        ],
      },
      {
        number: '03',
        title: 'Service Warranty Coverage & Exclusions',
        summaryTag: '30-to-90 Day Workmanship Warranty',
        paragraphs: [
          'Every service and repair performed by Cool Bros AC Service includes a post-service warranty: 30 days on Foam Power Jet Service and Installations, 45 days on Anti-Rust Chemical Wash, and 90 days on Refrigerant Gas Charging and Inverter PCB / Spare Part repairs.',
        ],
        bullets: [
          'Warranty covers the specific fault repaired, replaced spare parts, or refrigerant leak joints brazed and sealed by our technician.',
          'Warranty does not cover pre-existing compressor failure, external high-voltage surge damage where no stabilizer is installed, physical damage, rodent damage to wiring, or units opened by third-party mechanics after our visit.',
        ],
      },
      {
        number: '04',
        title: 'Customer Responsibilities & Safety',
        summaryTag: 'Site Readiness & Independent Service Notice',
        paragraphs: [
          'Customers are requested to inform the technician of any known electrical earthing issues, tripping MCBs, or prior repair history before diagnostics begin.',
          'Cool Bros AC Service is an independent service provider and is not affiliated with or authorized by any AC manufacturer. Brand names mentioned on this website indicate equipment compatibility only.',
        ],
      },
    ],
  },

  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    badge: 'DPDP ACT COMPLIANCE & DATA PRIVACY',
    lastUpdated: 'October 2026',
    subtitle:
      'How Cool Bros AC Service collects, processes, retains, and protects your personal data in compliance with India’s Digital Personal Data Protection (DPDP) framework.',
    highlights: [
      { label: 'THIRD-PARTY AD SALES', value: 'Zero Data Selling' },
      { label: 'RETENTION PERIOD', value: 'Up to 12 Months (Warranty)' },
      { label: 'DATA REMOVAL SLA', value: 'Within 24 Hours of Request' },
    ],
    sections: [
      {
        number: '01',
        title: 'Information We Collect & Purpose',
        summaryTag: 'Minimal Dispatch & Review Data',
        paragraphs: [
          'We collect only the information you voluntarily provide to coordinate doorstep AC servicing, maintain your service warranty, or publish a moderated customer review.',
        ],
        bullets: [
          'Inquiry & Dispatch Details: Your name, locality/sector, AC unit type, and issue description entered into our Contact Us form or sent via WhatsApp.',
          'Customer Reviews: Your name, locality, star rating, service package used, and review text submitted for moderation.',
          'Optional Google Sign-In: If you sign in with Google (for verified reviews or admin management), we receive your basic Google profile (display name, verified email address, and profile photo URL) via Firebase Authentication.',
        ],
      },
      {
        number: '02',
        title: 'Third-Party Service Providers & Data Sharing',
        summaryTag: 'Transparent Processor Disclosure',
        paragraphs: [
          'We never sell, rent, or trade your personal data to telemarketers or advertising networks. To operate this website and deliver your inquiries, data is processed through the following infrastructure providers:',
        ],
        bullets: [
          'Google Cloud & Firebase (Google LLC): Provides Google OAuth 2.0 authentication and encrypted Cloud Firestore database storage for service catalogs, moderated reviews, and signed-in inquiry logs.',
          `Email Relay (FormSubmit.co / SMTP): When you dispatch an inquiry from our website, your inquiry text and name are relayed via HTTPS to our official dispatch inbox (${OWNER_EMAIL}).`,
          `WhatsApp (Meta Platforms, Inc.): When you tap any "WhatsApp" button, your message is opened directly in WhatsApp under Meta's privacy policy.`,
        ],
      },
      {
        number: '03',
        title: 'Data Retention & Security Safeguards',
        summaryTag: '12-Month Retention & Access Controls',
        paragraphs: [
          'All database reads and writes are protected by TLS encryption in transit and strict Firebase Security Rules. Public visitors can only read approved reviews and service prices; private inquiry logs are restricted strictly to the sender and authorized dispatch administrators.',
          'Service inquiry records are retained for up to 12 months to verify 30-to-90-day service warranties and annual AMC schedules, after which they are deleted. Approved customer reviews remain published until you request removal.',
        ],
      },
      {
        number: '04',
        title: 'Your DPDP Rights, Deletion & Grievance Redressal',
        summaryTag: '24-Hour Deletion & Grievance Officer',
        paragraphs: [
          'Under India’s Digital Personal Data Protection (DPDP) principles, you have the right to access, correct, withdraw consent, and erase your personal data. Signed-in users can also delete their own reviews directly on the website.',
          `Grievance Officer & Privacy Desk: Contact Cool Bros AC Service Grievance Desk at ${OWNER_EMAIL} or call/WhatsApp ${CONTACT_PHONE_DISPLAY} (${OPERATING_HOURS}). All data deletion requests are completed within 24 hours, and formal privacy grievances are resolved within 72 hours.`,
        ],
      },
    ],
  },

  'return-policy': {
    slug: 'return-policy',
    title: 'Return Policy',
    badge: 'SPARE PARTS & COMPONENT REPLACEMENT POLICY',
    lastUpdated: 'October 2026',
    subtitle:
      'Our policy for returning, exchanging, or replacing AC spare parts, copper installation kits, outdoor brackets, and repaired PCB boards supplied during service visits.',
    highlights: [
      { label: 'PARTS WARRANTY SWAP', value: '90 Days Free Replacement' },
      { label: 'UNUSED ACCESSORIES', value: '7-Day Return Window' },
      { label: 'COMPONENT GRADE', value: 'OEM-Compatible & Tested' },
    ],
    sections: [
      {
        number: '01',
        title: 'Spare Parts Grade & 90-Day Replacement Warranty',
        summaryTag: 'Free Doorstep Component Exchange',
        paragraphs: [
          'All replacement electrical and mechanical parts supplied by Cool Bros AC Service—including run capacitors, fan motors, contactor relays, swing motors, and NTC sensors—are brand-new, OEM-compatible components. For Inverter PCB faults, we perform component-level IC repair on your original board (or supply a pre-tested board only when explicitly agreed on your estimate).',
          'If any part supplied or repaired by us fails within its 90-day warranty window, our technician will visit your premises and replace or re-repair the component at zero labor or part cost.',
        ],
      },
      {
        number: '02',
        title: 'Return of Unused Accessories & Sealed Kits',
        summaryTag: '7-Day Return Eligibility',
        paragraphs: [
          'If you purchased standalone AC installation accessories from our technician (such as outdoor condenser wall stands, drain pipes, or sealed copper pipe rolls) that were not installed or opened, they may be returned within 7 calendar days of purchase for a full refund.',
        ],
        bullets: [
          'The item must be unused, unmounted, and in its original condition along with the service bill or invoice.',
          'Custom-cut copper piping, flared tubing, or brazed joints that have already been sized and fitted to your site cannot be returned as unused inventory, unless found defective under warranty.',
        ],
      },
      {
        number: '03',
        title: 'Old Component Retention & PCB Lab Job Sheets',
        summaryTag: 'Full Ownership of Replaced Parts',
        paragraphs: [
          'Whenever our technician replaces a faulty part in your AC unit, the old replaced part remains your property unless an explicit trade-in discount was agreed upon in writing on your estimate.',
          'When an Inverter PCB board is taken to our electronics lab for component-level IC testing, the technician provides a written job receipt and reinstalls your board within 24 to 48 hours.',
        ],
      },
      {
        number: '04',
        title: 'How to Initiate a Part Return or Warranty Swap',
        summaryTag: 'Priority 24-Hour Visit Scheduling',
        paragraphs: [
          `To request a spare part return or 90-day warranty replacement, message our support desk on WhatsApp at ${CONTACT_PHONE_DISPLAY} or email ${OWNER_EMAIL} with your service date and locality. Priority warranty visits are scheduled within 24 hours.`,
        ],
      },
    ],
  },

  'refund-policy': {
    slug: 'refund-policy',
    title: 'Refund Policy',
    badge: 'CANCELLATION, RE-SERVICE & REFUND GUARANTEE',
    lastUpdated: 'October 2026',
    subtitle:
      'Clear, consistent rules for zero-fee booking cancellations, complimentary warranty re-visits, and 3–5 business day refunds when a repaired fault cannot be resolved.',
    highlights: [
      { label: 'BOOKING CANCELLATION', value: '100% Free Before Visit' },
      { label: 'WARRANTY RE-CHECK', value: 'Free Visit Within 24 Hours' },
      { label: 'REFUND TIMELINE', value: '3–5 Business Days' },
    ],
    sections: [
      {
        number: '01',
        title: 'Pay-After-Service & Zero-Fee Cancellation',
        summaryTag: 'No Online Advance Required',
        paragraphs: [
          'Cool Bros AC Service does not collect online advance payments to book an appointment. You pay only after our technician completes the service or repair at your doorstep.',
          'You may cancel or reschedule your appointment at any time prior to technician arrival at zero cancellation cost.',
        ],
      },
      {
        number: '02',
        title: 'Complimentary Warranty Re-Check Within 24 Hours',
        summaryTag: 'Free Rectification Visit',
        paragraphs: [
          'If your AC experiences the same cooling drop, water drip, or fault within the 30-to-90-day warranty period after our service, we dispatch a senior technician within 24 hours for a complimentary re-inspection and rectification at ₹0 extra charge.',
        ],
        bullets: [
          'Zero visiting or inspection charges apply during your active warranty window.',
          'If refrigerant pressure drops from a flare nut or brazing joint sealed by us during the 90-day gas warranty, we re-vacuum and recharge the refrigerant free of cost.',
        ],
      },
      {
        number: '03',
        title: 'Eligibility for Post-Service Refunds',
        summaryTag: 'No-Fix Protection',
        paragraphs: [
          'You are eligible for a full or partial refund of charges paid after service under the following conditions:',
        ],
        bullets: [
          'Unresolved Fault (No-Fix Guarantee): If our technician repairs a component or charges refrigerant and the specific fault remains unresolved even after our complimentary warranty re-check visit, the repair charges collected for that fault are refunded.',
          'Unrepairable Lab PCB: If a PCB board taken for lab repair cannot be restored to stable operation, no repair charge is billed (or any part deposit paid is refunded in full).',
          'Duplicate or Excess Payment: Any accidental double payment made via UPI or bank transfer is refunded in full once verified.',
        ],
      },
      {
        number: '04',
        title: 'Consistent 3–5 Business Day Refund Processing',
        summaryTag: 'UPI or Bank Transfer Settlement',
        paragraphs: [
          'All approved refunds (including unresolved repair claims, unused accessory returns, or duplicate UPI transfers) are processed via UPI or IMPS/NEFT bank transfer within 3 to 5 business days of claim approval.',
          `To raise a warranty or refund claim, message our Escalation Desk on WhatsApp at ${CONTACT_PHONE_DISPLAY} or email ${OWNER_EMAIL} (${OPERATING_HOURS}).`,
        ],
      },
    ],
  },
};

export const LEGAL_PAGE_TABS: { slug: LegalPageSlug; label: string }[] = [
  { slug: 'terms', label: 'Terms & Conditions' },
  { slug: 'privacy', label: 'Privacy Policy' },
  { slug: 'return-policy', label: 'Return Policy' },
  { slug: 'refund-policy', label: 'Refund Policy' },
];

interface LegalPageViewProps {
  activeSlug: LegalPageSlug;
  onSelectSlug: (slug: LegalPageSlug) => void;
  onBackHome: () => void;
  whatsappUrl: string;
}

export const LegalPageView: React.FC<LegalPageViewProps> = ({
  activeSlug,
  onSelectSlug,
  onBackHome,
  whatsappUrl,
}) => {
  const page = LEGAL_PAGES_DATA[activeSlug];

  const renderPageIcon = (slug: LegalPageSlug) => {
    switch (slug) {
      case 'terms':
        return <FileText className="w-5 h-5" aria-hidden="true" />;
      case 'privacy':
        return <ShieldCheck className="w-5 h-5" aria-hidden="true" />;
      case 'return-policy':
        return <RotateCcw className="w-5 h-5" aria-hidden="true" />;
      case 'refund-policy':
        return <RefreshCw className="w-5 h-5" aria-hidden="true" />;
    }
  };

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 space-y-8 sm:space-y-10">
        {/* Top Bar: Back to Home + 4 Policy Page Switcher Links */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#191A23]/15">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onBackHome();
            }}
            className="self-start inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-bold text-[#191A23] bg-white hover:bg-[#7DD3FC] border border-[#191A23] rounded-xl active:translate-y-0.5 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Home</span>
          </a>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
            {LEGAL_PAGE_TABS.map((tab) => {
              const isActive = tab.slug === activeSlug;
              return (
                <a
                  key={tab.slug}
                  href={`/${tab.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectSlug(tab.slug);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex items-center justify-center sm:justify-start gap-2 px-3.5 sm:px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-bold rounded-xl border border-[#191A23] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23] ${
                    isActive
                      ? 'bg-[#7DD3FC] text-[#191A23]'
                      : 'bg-[#F3F3F3] text-[#191A23]/80 hover:bg-white hover:text-[#191A23]'
                  }`}
                >
                  {renderPageIcon(tab.slug)}
                  <span className="truncate">{tab.label}</span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Hero Banner for the Active Policy Page */}
        <motion.div
          key={page.slug}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-[#191A23] text-white border border-[#191A23] rounded-[28px] sm:rounded-[38px] p-6 sm:p-10 lg:p-12 space-y-6 sm:space-y-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <span className="inline-flex items-center gap-2 bg-[#7DD3FC] text-[#191A23] px-3 py-1 rounded-lg border border-[#191A23] text-xs font-mono font-bold">
              {renderPageIcon(page.slug)}
              <span>{page.badge}</span>
            </span>
            <span className="text-xs font-mono text-white/80">
              Last Updated: {page.lastUpdated} · Cool Bros AC Service
            </span>
          </div>

          <div className="space-y-3 sm:space-y-4 max-w-3xl">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-white">
              {page.title}
            </h1>
            <p className="text-sm sm:text-base text-white/85 leading-relaxed">
              {page.subtitle}
            </p>
          </div>

          {/* 3 Key Highlights Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 pt-2">
            {page.highlights.map((hl) => (
              <div
                key={hl.label}
                className="bg-[#292A32] border border-white/15 rounded-2xl p-4"
              >
                <p className="text-xs font-mono text-[#7DD3FC] font-bold">
                  {hl.label}
                </p>
                <p className="text-base sm:text-lg font-display font-bold text-white mt-1">
                  {hl.value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Detailed Policy Sections */}
        <div className="space-y-5 sm:space-y-6">
          {page.sections.map((sec, idx) => {
            const isBlueCard = idx % 2 === 1;
            return (
              <motion.article
                key={`${page.slug}-${sec.number}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className={`border border-[#191A23] rounded-[26px] sm:rounded-[34px] p-5 sm:p-8 lg:p-10 space-y-4 sm:space-y-5 ${
                  isBlueCard ? 'bg-[#E0F2FE]' : 'bg-[#F8FAFC]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#191A23]/15">
                  <div className="flex items-center gap-3.5 sm:gap-4">
                    <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#191A23] text-[#7DD3FC] font-display font-bold text-lg sm:text-xl flex items-center justify-center shrink-0">
                      {sec.number}
                    </span>
                    <h2 className="text-lg sm:text-2xl font-display font-bold text-[#191A23]">
                      {sec.title}
                    </h2>
                  </div>
                  <span className="self-start sm:self-auto bg-[#7DD3FC] text-[#191A23] border border-[#191A23] px-3 py-1 rounded-lg text-xs font-mono font-bold">
                    {sec.summaryTag}
                  </span>
                </div>

                <div className="space-y-3.5 text-sm sm:text-base text-[#191A23] leading-relaxed">
                  {sec.paragraphs.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>

                {sec.bullets && sec.bullets.length > 0 && (
                  <ul className="space-y-2.5 pt-2">
                    {sec.bullets.map((b, bIdx) => (
                      <li
                        key={bIdx}
                        className="flex items-start gap-3 text-sm sm:text-base text-[#191A23]"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#7DD3FC] border border-[#191A23] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-[#191A23]" aria-hidden="true" />
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.article>
            );
          })}
        </div>

        {/* Bottom Support & Escalation Desk Card */}
        <div className="bg-white border-2 border-[#191A23] rounded-[26px] sm:rounded-[34px] p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-block bg-[#7DD3FC] border border-[#191A23] px-2.5 py-0.5 rounded text-xs font-mono font-bold text-[#191A23]">
              QUESTIONS ABOUT OUR {page.title.toUpperCase()}?
            </span>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-[#191A23]">
              Contact Our Customer Support & Grievance Desk
            </h3>
            <p className="text-sm text-[#191A23]/80 max-w-xl">
              Reach out directly via WhatsApp, phone, or email ({OPERATING_HOURS}) for assistance with
              service warranties, part replacements, privacy requests, or billing clarifications.
            </p>
          </div>

          <div className="w-full lg:w-auto grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3 shrink-0">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] text-xs sm:text-sm font-bold text-[#191A23] bg-[#86EFAC] border border-[#191A23] rounded-2xl hover:bg-[#4ADE80] transition-all whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span>WhatsApp {CONTACT_PHONE_DISPLAY}</span>
            </a>

            <a
              href={CONTACT_PHONE_HREF}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] text-xs sm:text-sm font-semibold text-white bg-[#191A23] rounded-2xl hover:bg-[#191A23]/90 transition-colors whitespace-nowrap"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span>Call {CONTACT_PHONE_DISPLAY}</span>
            </a>

            <a
              href={`mailto:${OWNER_EMAIL}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] text-xs sm:text-sm font-semibold text-[#191A23] bg-[#F3F3F3] border border-[#191A23] rounded-2xl hover:bg-[#7DD3FC] transition-colors whitespace-nowrap"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span>{OWNER_EMAIL}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
