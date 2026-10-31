import { ServiceType } from '../firebase';

export const WHATSAPP_NUMBER = '919560415262';
export const CONTACT_PHONE_DISPLAY = '+91 9560415262';
export const CONTACT_PHONE_HREF = 'tel:+919560415262';
export const OWNER_EMAIL = 'coolbrosacservice@gmail.com';
export const OPERATING_HOURS = '08:00 AM – 09:00 PM (Daily)';

export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export interface ServicePackageSpec {
  id: string;
  index: string;
  name: ServiceType;
  tagline: string;
  basePriceInr: number;
  unitLabel: string;
  warrantyLabel: string;
}

export const SERVICE_PACKAGES: ServicePackageSpec[] = [
  {
    id: 'foam-jet',
    index: '01',
    name: 'Foam Power Jet Service',
    tagline:
      '140 PSI hydro-jet indoor evaporator & outdoor condenser wash inside a 360° waterproof catchment jacket + drain pipe flush',
    basePriceInr: 599,
    unitLabel: 'per AC · incl. taxes',
    warrantyLabel: '30-Day Service Warranty',
  },
  {
    id: 'anti-rust',
    index: '02',
    name: 'Anti-Rust Deep Chemical Wash',
    tagline:
      'Complete indoor/outdoor coil descaling + protective anti-corrosive blue-fin coating to help reduce gas leaks',
    basePriceInr: 999,
    unitLabel: 'per AC · incl. taxes',
    warrantyLabel: '45-Day Service Warranty',
  },
  {
    id: 'gas-charging',
    index: '03',
    name: 'Gas Charging & Leak Fix',
    tagline:
      'Nitrogen pressure test, copper brazing leak seal, 500-micron deep vacuuming & full R32 / R410A / R22 recharge by weight',
    basePriceInr: 2499,
    unitLabel: 'per AC · complete refill',
    warrantyLabel: '90-Day Leak & Gas Warranty',
  },
  {
    id: 'amc-plan',
    index: '04',
    name: 'Annual Maintenance Contract (AMC)',
    tagline:
      '2 scheduled foam hydro-jet services + 1 pre-summer checkup per year with priority breakdown support',
    basePriceInr: 1899,
    unitLabel: 'per AC / year',
    warrantyLabel: '365-Day Priority Coverage',
  },
  {
    id: 'diagnostic-pcb',
    index: '05',
    name: 'Diagnostic & PCB Repair',
    tagline:
      'On-site clamp-meter & pressure fault isolation, sensor/capacitor test & inverter PCB component-level repair estimate',
    basePriceInr: 349,
    unitLabel: 'starting at · per visit',
    warrantyLabel: 'Up to 90-Day Repair Warranty',
  },
  {
    id: 'install-uninstall',
    index: '06',
    name: 'Installation / Uninstallation',
    tagline:
      'Laser-leveled indoor/outdoor mounting, core drilling, flare nut torque calibration & vacuum testing (split or window AC)',
    basePriceInr: 1499,
    unitLabel: 'starting at · per AC',
    warrantyLabel: '30-Day Installation Warranty',
  },
];

export interface SparePartRateItem {
  item: string;
  specification: string;
  priceDisplay: string;
  warranty: string;
}

export const INSPECTION_AND_PARTS_RATES: SparePartRateItem[] = [
  {
    item: 'Standalone Diagnostic / Visit Fee',
    specification: 'Waived (₹0) when you proceed with any service or repair; charged only if no work is taken after diagnosis',
    priceDisplay: '₹249 (₹0 with service)',
    warranty: 'N/A',
  },
  {
    item: 'Compressor / Fan Run Capacitor',
    specification: '35–55 mFD dual/single heavy-duty capacitor replacement',
    priceDisplay: '₹450 – ₹750',
    warranty: '90 Days',
  },
  {
    item: 'Contactor Relay / Sensor Probe',
    specification: 'Outdoor magnetic contactor or indoor room/coil NTC thermistor',
    priceDisplay: '₹550 – ₹950',
    warranty: '90 Days',
  },
  {
    item: 'Inverter PCB Component-Level Repair',
    specification: 'IPM module, power supply IC, relay & track restoration in lab',
    priceDisplay: '₹1,499 – ₹3,499',
    warranty: '90 Days',
  },
  {
    item: 'Copper Piping Kit (With Insulation & Wire)',
    specification: 'Heavy-gauge twin copper tubing + nitrile foam sleeve + 4-core cable',
    priceDisplay: '₹380 / ft',
    warranty: '90 Days',
  },
  {
    item: 'Heavy-Duty Outdoor Wall Stand & Fasteners',
    specification: 'Powder-coated MS angle bracket with anchor bolts',
    priceDisplay: '₹750 / set',
    warranty: '1 Year',
  },
];

export const COMPATIBLE_AC_BRANDS: string[] = [
  'Daikin',
  'LG',
  'Voltas',
  'Blue Star',
  'Hitachi',
  'Lloyd',
  'Samsung',
  'Godrej',
];

export const PROTOCOL_STEPS = [
  {
    step: '01',
    title: 'Complete AC Inspection & Cooling Check',
    metric: 'Pre-Service Diagnosis',
    description:
      'Our technician checks cooling output, airflow, refrigerant pressure, and electrical connections to identify any issues and confirm the upfront quote before starting work.',
  },
  {
    step: '02',
    title: '360° Waterproof Jacket Protection',
    metric: 'Indoor Catchment Jacket Setup',
    description:
      'We cover the PCB circuit box and fit a heavy-duty waterproof catchment funnel around the indoor AC unit to protect your walls, curtains, and floor from water spray.',
  },
  {
    step: '03',
    title: 'Foam & Hydro-Jet Coil Deep Wash',
    metric: 'Deep Fin & Blower Cleaning',
    description:
      'Coil-safe cleaning foam loosens compacted dust and grime from deep inside the evaporator fins and blower wheel, followed by a regulated 140 PSI hydro-jet rinse.',
  },
  {
    step: '04',
    title: 'Drain Line Flush & Outdoor Unit Wash',
    metric: 'High-Pressure Drain Line Flush',
    description:
      'We pressure-flush the condensate drain tray and pipe to clear slime blockages, and jet-wash the outdoor condenser unit to restore heat rejection.',
  },
  {
    step: '05',
    title: 'Gas Pressure & Cooling Performance Test',
    metric: 'Digital Gauge & Amp Verification',
    description:
      'Digital manifold gauges and clamp meters verify refrigerant operating pressure, compressor current draw, and grill temperature drop.',
  },
  {
    step: '06',
    title: 'Final Wipe-Down & Service Warranty',
    metric: '30 to 90 Days Service Coverage',
    description:
      'We wipe down the AC panel, test louver and remote operation with you, and provide a clear 30-to-90-day post-service workmanship warranty.',
  },
];

export type AreaSlug =
  | 'ac-service-dwarka'
  | 'ac-service-south-delhi'
  | 'ac-service-rohini'
  | 'ac-service-dlf-gurugram'
  | 'ac-service-sohna-road';

export interface ServiceAreaSpec {
  slug: AreaSlug;
  shortName: string;
  title: string;
  city: 'New Delhi' | 'Gurugram';
  etaText: string;
  sectorsCovered: string;
  description: string;
}

export const SERVICE_AREAS: Record<AreaSlug, ServiceAreaSpec> = {
  'ac-service-dwarka': {
    slug: 'ac-service-dwarka',
    shortName: 'Dwarka & Janakpuri',
    title: 'Doorstep AC Service & Repair in Dwarka & West Delhi',
    city: 'New Delhi',
    etaText: '45–60 Min Technician Arrival',
    sectorsCovered:
      'Dwarka Sectors 1 to 29, Palam, Dabri, Janakpuri, Uttam Nagar, Vikaspuri & IGI Airport Enclave',
    description:
      'Dedicated Cool Bros AC Service technicians stationed in Dwarka provide same-day 140 PSI foam hydro-jet cleaning, high-rise society outdoor unit servicing, R32/R410A gas charging, and inverter PCB repair across all CGHS apartments and DDA sectors.',
  },
  'ac-service-south-delhi': {
    slug: 'ac-service-south-delhi',
    shortName: 'South Delhi & Vasant Kunj',
    title: 'Doorstep AC Service & Repair in South Delhi & Vasant Kunj',
    city: 'New Delhi',
    etaText: '45–60 Min Technician Arrival',
    sectorsCovered:
      'Vasant Kunj, Greater Kailash (GK 1 & 2), Saket, Hauz Khas, Green Park, Malviya Nagar, Defence Colony, Lajpat Nagar & Chattarpur',
    description:
      'Fast, clean doorstep AC maintenance and breakdown repair across South Delhi residences, builder floors, and commercial offices. Includes 360° waterproof indoor catchment protection and upfront rate-card billing.',
  },
  'ac-service-rohini': {
    slug: 'ac-service-rohini',
    shortName: 'Rohini & North-West Delhi',
    title: 'Doorstep AC Service & Repair in Rohini, Pitampura & North Delhi',
    city: 'New Delhi',
    etaText: '45–60 Min Technician Arrival',
    sectorsCovered:
      'Rohini Sectors 1 to 37, Pitampura, Shalimar Bagh, Paschim Vihar, Punjabi Bagh, Model Town & Ashok Vihar',
    description:
      'Complete split and window AC foam jet servicing, nitrogen leak testing, gas refilling, and copper pipe installation across Rohini and North-West Delhi sectors between 08:00 AM and 09:00 PM daily.',
  },
  'ac-service-dlf-gurugram': {
    slug: 'ac-service-dlf-gurugram',
    shortName: 'DLF Phase 1–5 & Cyber City',
    title: 'Doorstep AC Service & Repair in DLF Phase 1–5, Sushant Lok & Golf Course Rd',
    city: 'Gurugram',
    etaText: '45–60 Min Technician Arrival',
    sectorsCovered:
      'DLF Phases 1, 2, 3, 4 & 5, Sushant Lok 1–3, Golf Course Road, MG Road, Cyber City, Udyog Vihar & Sectors 27–57',
    description:
      'Specialized inverter split AC, VRF, and cassette AC servicing for high-rise condos, villas, and offices in DLF Gurugram and Golf Course Road. Equipped with digital manifold gauges and 500-micron vacuum pumps.',
  },
  'ac-service-sohna-road': {
    slug: 'ac-service-sohna-road',
    shortName: 'Sohna Road & New Gurugram',
    title: 'Doorstep AC Service & Repair on Sohna Road & Sectors 48–86 Gurugram',
    city: 'Gurugram',
    etaText: '45–60 Min Technician Arrival',
    sectorsCovered:
      'Sohna Road, Golf Course Extension Road, Nirvana Country, South City 2, Badshahpur & Gurugram Sectors 48 to 86',
    description:
      'Same-day foam power jet wash, anti-rust condenser coating, gas charging, and core-drilled split AC installation for gated townships along Sohna Road and Golf Course Extension Road.',
  },
};

export const AREA_LIST: ServiceAreaSpec[] = Object.values(SERVICE_AREAS);

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is included in the ₹599 Foam Power Jet AC Service?',
    answer:
      'Our ₹599 per-unit Foam Power Jet Service covers complete indoor evaporator coil foaming, 140 PSI regulated hydro-jet washing inside a 360° waterproof catchment jacket, condensate drain tray and pipe pressure-flushing, outdoor condenser jet washing, and a final cooling + ampere check. All taxes are included.',
  },
  {
    question: 'Is there an inspection fee if I only want my AC checked?',
    answer:
      'If you proceed with any service package or approve our repair quote, the inspection fee is ₹0 (completely waived). If our technician visits, performs a full clamp-meter and pressure fault diagnosis, and you decide not to take any service or repair, a flat ₹249 standalone inspection fee applies.',
  },
  {
    question: 'Do you charge extra for spare parts or gas top-up?',
    answer:
      'Base cleaning packages cover labor and jet-wash consumables. If your AC requires refrigerant gas charging or a replacement part (such as a capacitor, sensor, contactor, or copper pipe), the technician shares a transparent price from our published rate card before starting work. No work is done without your approval.',
  },
  {
    question: 'What warranty do you provide on AC servicing and repairs?',
    answer:
      'We provide a 30-day workmanship warranty on Foam Power Jet Service and AC Installations, a 45-day warranty on Anti-Rust Chemical Wash, and a 90-day warranty on Refrigerant Gas Charging, Leak Brazing, and Inverter PCB / Spare Part replacements.',
  },
  {
    question: 'Which AC brands and types do you service?',
    answer:
      'As an independent multi-brand AC service provider, we service all major residential and commercial Split, Window, Inverter, and Cassette ACs—including Daikin, LG, Voltas, Blue Star, Carrier, Hitachi, Panasonic, Mitsubishi, O General, Lloyd, and Samsung.',
  },
  {
    question: 'What are your operating hours and how do I pay?',
    answer:
      'Our technicians operate 7 days a week from 08:00 AM to 09:00 PM across Delhi and Gurugram. You pay only after the job is completed and tested at your premises via UPI, cash, or bank transfer.',
  },
];
