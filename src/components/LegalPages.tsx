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
      'These Terms & Conditions govern all residential and commercial air conditioning inspection, servicing, repair, gas charging, and installation work performed by Cool Bros AC Service.',
    highlights: [
      { label: 'SERVICE WARRANTY', value: 'Up to 90 Days Coverage' },
      { label: 'INSPECTION FEE', value: 'Waived Upon Job Approval' },
      { label: 'PRICING POLICY', value: 'Upfront Flat-Rate Quotes' },
    ],
    sections: [
      {
        number: '01',
        title: 'Scope of HVAC Services & Technician Visits',
        summaryTag: 'Doorstep Inspection & Repair Protocol',
        paragraphs: [
          'Cool Bros AC Service provides doorstep air conditioning maintenance, 140 PSI foam hydro-jet cleaning, refrigerant gas charging (R32, R410A, R22), inverter PCB repair, and split/window AC installation exclusively across residential and commercial premises in Delhi and Gurugram.',
          'All bookings requested via WhatsApp (+91 9560415262), telephone, or our website dispatch desk are scheduled within our standard operating window of 08:00 AM to 09:00 PM, 7 days a week across Delhi and Gurugram.',
        ],
        bullets: [
          'Customers must provide safe access to both the indoor evaporator unit (IDU) and outdoor condenser unit (ODU), along with functional water and electrical supply points.',
          'If high-rise outdoor unit access requires society maintenance permission, ladder clearance, or safety harness authorization, the customer is responsible for arranging society gate/roof clearance prior to arrival.',
        ],
      },
      {
        number: '02',
        title: 'Transparent Estimates, Spare Parts & Billing',
        summaryTag: 'Pre-Work Approval & Rate Card',
        paragraphs: [
          'Before starting any repair or component replacement beyond the booked base package, our technician conducts a digital clamp-meter and manifold gauge audit and shares an itemized cost estimate.',
          'Work commences only after explicit customer approval of the quoted estimate. No hidden charges are added after job completion.',
        ],
        bullets: [
          'Base service packages cover technician labor, hydro-jet cleaning, and standard consumables as listed in the package deliverables.',
          'Additional spare parts (such as copper piping, capacitors, contactor relays, fan motors, condenser coils, or outdoor wall brackets) are billed strictly according to our pre-approved rate card.',
        ],
      },
      {
        number: '03',
        title: 'Service Warranty Coverage & Exclusions',
        summaryTag: '30-to-90 Day Workmanship Guarantee',
        paragraphs: [
          'Every service and repair performed by Cool Bros AC Service includes a post-service warranty ranging from 30 days (Foam Jet Cleaning) to 90 days (Refrigerant Gas Charging & Inverter PCB Repair), clearly noted on your service invoice.',
        ],
        bullets: [
          'Warranty covers the specific fault repaired, replaced spare parts, or refrigerant leak joints sealed by our technician.',
          'Warranty does not cover pre-existing compressor failure, external voltage surge damage where no stabilizer is installed, physical damage, rodent damage to wiring, or units tampered with by third-party technicians after our visit.',
        ],
      },
      {
        number: '04',
        title: 'Customer Responsibilities & Safety',
        summaryTag: 'Site Readiness & Appliance History',
        paragraphs: [
          'Customers are requested to inform the technician of any known electrical leakage, tripping circuit breakers, or prior repair history before diagnostics begin.',
          'Cool Bros AC Service technicians reserve the right to pause or decline outdoor condenser work during severe lightning, heavy rainstorms, or unsafe structural scaffolding conditions until it is safe to proceed.',
        ],
      },
    ],
  },

  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    badge: 'DATA PROTECTION & CUSTOMER PRIVACY',
    lastUpdated: 'October 2026',
    subtitle:
      'How Cool Bros AC Service collects, protects, and uses your contact details, service address, and Google account information when you book an AC service or submit a review.',
    highlights: [
      { label: 'THIRD-PARTY AD SALES', value: 'Zero Data Selling' },
      { label: 'AUTHENTICATION', value: 'Google OAuth 2.0 Security' },
      { label: 'DATA CONTROL', value: 'Instant Deletion on Request' },
    ],
    sections: [
      {
        number: '01',
        title: 'Information We Collect',
        summaryTag: 'Minimal Contact & Service Data',
        paragraphs: [
          'We collect only the information required to dispatch an HVAC engineer to your location, send booking confirmations, and display customer reviews on our platform.',
        ],
        bullets: [
          'Contact & Dispatch Details: Your name, phone number, locality/address, AC type, and issue description submitted through our Contact & WhatsApp dispatch form.',
          'Google Sign-In Profile (Optional): When you sign in with Google, we receive your basic public profile (display name, email address, and profile avatar URL) via Firebase Authentication.',
          'Customer Reviews: When you publish a review (either as a signed-in user or as a guest), your submitted name, locality, star rating, service package used, and review text are stored in our database.',
        ],
      },
      {
        number: '02',
        title: 'How We Use Your Information',
        summaryTag: 'Dispatch, Warranty & Support Only',
        paragraphs: [
          'Your personal data is used exclusively to coordinate doorstep AC servicing, maintain your warranty records, and respond to your support inquiries.',
        ],
        bullets: [
          'Assigning the nearest certified HVAC technician to your sector or locality.',
          'Communicating arrival ETAs, digital service invoices, and warranty follow-ups via WhatsApp (+91 9560415262), phone call, or email (coolbrosacservice@gmail.com).',
          'Never selling, renting, or trading your phone number or email address to third-party telemarketers or ad networks.',
        ],
      },
      {
        number: '03',
        title: 'Database Security & Encryption',
        summaryTag: 'Google Cloud & Firestore Rules',
        paragraphs: [
          'All inquiry records and customer reviews are stored on Google Firebase / Firestore infrastructure with strict security rules and HTTPS/TLS encryption in transit.',
          'Direct messages and contact details are write-only for public visitors and accessible strictly to authorized Cool Bros AC Service dispatch personnel.',
        ],
      },
      {
        number: '04',
        title: 'Your Rights & Data Removal',
        summaryTag: 'Delete Reviews or Contact Records Anytime',
        paragraphs: [
          'Signed-in users can delete their own published reviews directly from the Reviews & Ratings section at any time with a single click.',
          'To request complete removal of your service history, phone number, or guest review record, simply email coolbrosacservice@gmail.com or message +91 9560415262 and our team will purge the record within 24 hours.',
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
      'Our policy for returning, exchanging, or replacing AC spare parts, copper installation kits, stabilizers, and hardware components supplied during service visits.',
    highlights: [
      { label: 'PARTS REPLACEMENT', value: '30–90 Days Free Swap' },
      { label: 'UNUSED ACCESSORIES', value: '7-Day Return Window' },
      { label: 'OEM COMPATIBILITY', value: '100% Genuine Grade Parts' },
    ],
    sections: [
      {
        number: '01',
        title: 'Defective or Malfunctioning Spare Parts Replacement',
        summaryTag: 'Free Doorstep Component Exchange',
        paragraphs: [
          'Any spare part supplied and installed by Cool Bros AC Service—including capacitors, fan motors, contactor relays, swing motors, sensors, or refurbished/new PCB boards—is covered by our component replacement warranty.',
          'If an installed part fails or exhibits manufacturing defects within its warranty period (30 to 90 days depending on the component), our technician will visit your premises and replace the defective part at zero additional labor or component cost.',
        ],
      },
      {
        number: '02',
        title: 'Return of Unused Accessories & Sealed Parts',
        summaryTag: '7-Day Return Eligibility',
        paragraphs: [
          'If you purchased standalone AC accessories or installation hardware from our technician (such as outdoor condenser wall stands, stabilizer units, drain pipes, or sealed copper pipe rolls) that were not installed or opened, they may be returned within 7 calendar days of purchase.',
        ],
        bullets: [
          'The item must be unused, unmounted, and in its original condition with the service bill or receipt.',
          'Custom-cut copper piping, flared tubing, or braised joints that have already been custom-sized and fitted to your site cannot be returned as unused inventory, unless found defective.',
        ],
      },
      {
        number: '03',
        title: 'Old Component Retention & Exchange Transparency',
        summaryTag: 'Full Ownership of Replaced Parts',
        paragraphs: [
          'Whenever our technician replaces a faulty part in your AC unit, the old replaced part remains your property unless an explicit exchange discount was agreed upon in writing on your estimate.',
          'For Inverter PCB repairs where your original board is taken to our lab for component-level IC testing, a signed job sheet is provided and your original board is returned and reinstalled within 24–48 hours.',
        ],
      },
      {
        number: '04',
        title: 'How to Initiate a Part Return or Warranty Swap',
        summaryTag: 'Priority 24-Hour Resolution',
        paragraphs: [
          'To request a spare part return or warranty replacement, contact our support desk on WhatsApp at +91 9560415262 or email coolbrosacservice@gmail.com with your registered phone number and service date. Priority warranty visits are scheduled within 24 hours.',
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
      'Clear, fair, and customer-first rules for booking cancellations, free warranty re-visits, and money-back refunds when cooling issues cannot be resolved.',
    highlights: [
      { label: 'BOOKING CANCELLATION', value: '100% Free Before Visit' },
      { label: 'FREE RE-CHECK VISIT', value: 'Within 24 Hours' },
      { label: 'REFUND PROCESSING', value: '3–5 Business Days' },
    ],
    sections: [
      {
        number: '01',
        title: 'Zero-Fee Booking Cancellation & Rescheduling',
        summaryTag: 'Cancel Anytime Before Dispatch',
        paragraphs: [
          'You may cancel or reschedule your AC service appointment at any time prior to technician arrival at zero cancellation cost.',
          'If any advance amount was paid online prior to the visit, 100% of the advance is refunded immediately upon cancellation.',
        ],
      },
      {
        number: '02',
        title: 'Free Priority Re-Service Before Refund',
        summaryTag: 'Complimentary Warranty Rectification',
        paragraphs: [
          'If your AC experiences the same cooling drop, water leakage, or noise issue within the warranty period after our service, we first dispatch a senior technician within 24 hours for a complimentary re-inspection and rectification at zero extra charge.',
        ],
        bullets: [
          'Zero visiting or inspection charges apply during the warranty window.',
          'If gas pressure drops due to a flare nut or brazing joint serviced by us, we re-vacuum and recharge the refrigerant free of cost.',
        ],
      },
      {
        number: '03',
        title: 'Eligibility for Service & Repair Refunds',
        summaryTag: 'No-Fix, No-Fee Protection',
        paragraphs: [
          'We stand behind a strict engineering outcome standard. You are eligible for a full or partial refund under the following circumstances:',
        ],
        bullets: [
          'Unresolved Fault (No-Fix Guarantee): If our technician repairs a component or charges refrigerant and the specific fault remains unresolved even after our warranty re-check visit, the repair charges collected for that fault are refunded.',
          'Spare Part Unavailable: If an advance was collected for a specific OEM spare part or PCB repair that cannot be sourced or repaired within the promised timeframe, 100% of the advance is refunded.',
          'Duplicate or Excess Payment: Any accidental double payment via UPI, bank transfer, or cash is refunded in full within 24 hours of verification.',
        ],
      },
      {
        number: '04',
        title: 'Refund Timeline & Payment Method',
        summaryTag: 'Direct UPI or Bank Transfer in 3–5 Days',
        paragraphs: [
          'Approved refunds are processed via your original payment method (UPI, IMPS/NEFT bank transfer, or digital wallet) within 3 to 5 business days.',
          'To raise a refund or warranty claim, message our Escalation Desk on WhatsApp at +91 9560415262 or email coolbrosacservice@gmail.com with your phone number and service details.',
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
        return <FileText className="w-5 h-5" />;
      case 'privacy':
        return <ShieldCheck className="w-5 h-5" />;
      case 'return-policy':
        return <RotateCcw className="w-5 h-5" />;
      case 'refund-policy':
        return <RefreshCw className="w-5 h-5" />;
    }
  };

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 space-y-8 sm:space-y-10">
        {/* Top Bar: Back to Home + 4 Policy Page Switcher Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#191A23]/15">
          <button
            type="button"
            onClick={onBackHome}
            className="self-start inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-bold text-[#191A23] bg-white hover:bg-[#7DD3FC] border border-[#191A23] rounded-xl active:translate-y-0.5 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
            {LEGAL_PAGE_TABS.map((tab) => {
              const isActive = tab.slug === activeSlug;
              return (
                <button
                  key={tab.slug}
                  type="button"
                  onClick={() => onSelectSlug(tab.slug)}
                  className={`inline-flex items-center justify-center sm:justify-start gap-2 px-3.5 sm:px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-bold rounded-xl border border-[#191A23] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191A23] ${
                    isActive
                      ? 'bg-[#7DD3FC] text-[#191A23]'
                      : 'bg-[#F3F3F3] text-[#191A23]/80 hover:bg-white hover:text-[#191A23]'
                  }`}
                >
                  {renderPageIcon(tab.slug)}
                  <span className="truncate">{tab.label}</span>
                </button>
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
            <span className="text-xs font-mono text-white/70">
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
                <p className="text-[11px] font-mono text-[#7DD3FC] font-bold">
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
                  isBlueCard ? 'bg-[#7DD3FC]/25' : 'bg-[#F3F3F3]'
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

                <div className="space-y-3.5 text-sm sm:text-base text-[#191A23]/90 leading-relaxed">
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
                          <Check className="w-3 h-3 text-[#191A23]" />
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
        <div className="bg-white border border-[#191A23] rounded-[26px] sm:rounded-[34px] p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-block bg-[#7DD3FC] border border-[#191A23] px-2.5 py-0.5 rounded text-xs font-mono font-bold text-[#191A23]">
              QUESTIONS ABOUT OUR {page.title.toUpperCase()}?
            </span>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-[#191A23]">
              Contact Our Customer Support & Warranty Desk
            </h3>
            <p className="text-sm text-[#191A23]/80 max-w-xl">
              Reach out directly via WhatsApp, phone, or email for instant assistance with
              service warranties, part replacements, or billing clarifications.
            </p>
          </div>

          <div className="w-full lg:w-auto grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3 shrink-0">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] text-xs sm:text-sm font-bold text-[#191A23] bg-[#86EFAC] border border-[#191A23] rounded-2xl hover:bg-[#4ADE80] transition-all whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp +91 9560415262</span>
            </a>

            <a
              href="tel:+919560415262"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] text-xs sm:text-sm font-semibold text-white bg-[#191A23] rounded-2xl hover:bg-[#191A23]/90 transition-colors whitespace-nowrap"
            >
              <Phone className="w-4 h-4" />
              <span>Call +91 9560415262</span>
            </a>

            <a
              href="mailto:coolbrosacservice@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] text-xs sm:text-sm font-semibold text-[#191A23] bg-[#F3F3F3] border border-[#191A23] rounded-2xl hover:bg-[#7DD3FC] transition-colors whitespace-nowrap"
            >
              <Mail className="w-4 h-4" />
              <span>coolbrosacservice@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
