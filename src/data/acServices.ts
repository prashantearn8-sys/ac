import { AcType, ServiceType, TonnageType } from '../firebase';

export interface ServicePackageSpec {
  id: string;
  index: string;
  name: ServiceType;
  tagline: string;
  basePriceInr: number;
  durationMinutes: number;
  warrantyDays: number;
  recommendedIntervalMonths: number;
  pressurePsi: string;
  expectedCoolingGain: string;
  deliverables: string[];
  colSpan: 'lg:col-span-7' | 'lg:col-span-5';
}

export const SERVICE_PACKAGES: ServicePackageSpec[] = [
  {
    id: 'foam-jet',
    index: '01',
    name: 'Foam Power Jet Service',
    tagline: '140 PSI hydro-jet evaporator & condenser flush with alkaline bio-foam',
    basePriceInr: 599,
    durationMinutes: 45,
    warrantyDays: 30,
    recommendedIntervalMonths: 4,
    pressurePsi: '140 PSI Regulated',
    expectedCoolingGain: '+28% Airflow Velocity',
    deliverables: [
      '360° waterproof catchment jacket installation around indoor unit',
      'Alkaline foaming coil degreasing & high-pressure hydro-jet wash',
      'Blower wheel, drain tray & condensate pipe nitrogen/water purge',
      'Digital clamp-meter compressor amperage & suction pressure audit',
    ],
    colSpan: 'lg:col-span-7',
  },
  {
    id: 'anti-rust',
    index: '02',
    name: 'Anti-Rust Deep Chemical Wash',
    tagline: 'Complete coil descaling + hydrophobic anti-corrosive blue-fin coating',
    basePriceInr: 999,
    durationMinutes: 65,
    warrantyDays: 60,
    recommendedIntervalMonths: 6,
    pressurePsi: '160 PSI + Coating',
    expectedCoolingGain: '-19% Power Draw',
    deliverables: [
      'Deep chemical descaling of copper U-bends and aluminum evaporator fins',
      'Anti-corrosive polymeric shield spray to prevent pinhole gas leaks',
      'Outdoor condenser unit high-pressure wash & fan bearing lubrication',
      'Post-service ΔT supply/return grill thermal calibration check',
    ],
    colSpan: 'lg:col-span-5',
  },
  {
    id: 'gas-charging',
    index: '03',
    name: 'Gas Charging & Leak Fix',
    tagline: 'Nitrogen pressure testing, silver brazing leak seal & OEM refrigerant recharge',
    basePriceInr: 2499,
    durationMinutes: 90,
    warrantyDays: 90,
    recommendedIntervalMonths: 12,
    pressurePsi: '350 PSI N₂ Test',
    expectedCoolingGain: '-12.5°C Supply Grill ΔT',
    deliverables: [
      '350 PSI dry nitrogen pressure holding test & soap-bubble joint inspection',
      'Oxy-acetylene silver brazing for flare nut or capillary joint leaks',
      '500-micron two-stage rotary vacuum dehydration to remove moisture',
      'Precision by-weight recharge of R32, R410A, or R22 refrigerant',
    ],
    colSpan: 'lg:col-span-5',
  },
  {
    id: 'amc-plan',
    index: '04',
    name: 'Annual Maintenance Contract (AMC)',
    tagline: '3 scheduled hydro-jet services per year + priority 2-hour breakdown dispatch',
    basePriceInr: 1899,
    durationMinutes: 60,
    warrantyDays: 365,
    recommendedIntervalMonths: 4,
    pressurePsi: 'Full Season Cover',
    expectedCoolingGain: 'Zero Summer Downtime',
    deliverables: [
      '3 scheduled Foam Power Jet cleanings (Pre-Summer, Mid-Monsoon, Post-Season)',
      'Unlimited breakdown visits with zero inspection or visitation fees',
      'Complimentary refrigerant top-up (up to 150g) & capacitor replacement',
      'Automated maintenance reminders synced directly to your customer dashboard',
    ],
    colSpan: 'lg:col-span-7',
  },
  {
    id: 'diagnostic-pcb',
    index: '05',
    name: 'Diagnostic & PCB Repair',
    tagline: 'Inverter PCB component-level fault isolation, sensor & capacitor replacement',
    basePriceInr: 349,
    durationMinutes: 40,
    warrantyDays: 30,
    recommendedIntervalMonths: 6,
    pressurePsi: '50-Point Electrical',
    expectedCoolingGain: 'OEM Error Code Reset',
    deliverables: [
      'Inverter IPM module, relay, and thermistor resistance diagnostics',
      'Start/run capacitor microfarad (µF) load testing & terminal crimping',
      'Contactor, swing louver stepper motor & transformer voltage verification',
      '100% inspection fee adjustment if major repair is approved on site',
    ],
    colSpan: 'lg:col-span-5',
  },
  {
    id: 'install-uninstall',
    index: '06',
    name: 'Installation / Uninstallation',
    tagline: 'Laser-leveled mounting, core drilling, flare torque calibration & vacuuming',
    basePriceInr: 1499,
    durationMinutes: 110,
    warrantyDays: 90,
    recommendedIntervalMonths: 6,
    pressurePsi: '500 Micron Vacuum',
    expectedCoolingGain: 'Factory-Spec Commissioning',
    deliverables: [
      'Laser-leveled indoor wall plate mounting & vibration-damped outdoor bracket',
      'Safe pump-down refrigerant recovery into condenser during uninstallation',
      'Precision eccentric flaring & digital torque wrench nut tightening',
      'Mandatory vacuum pump purge & leak test prior to valve release',
    ],
    colSpan: 'lg:col-span-7',
  },
];

export const AC_TYPE_MULTIPLIERS: Record<AcType, { multiplier: number; label: string; note: string }> = {
  'Split AC': {
    multiplier: 1.0,
    label: 'High-Wall Split System',
    note: 'Standard indoor + outdoor unit configuration',
  },
  'Window AC': {
    multiplier: 0.85,
    label: 'Monoblock Window Unit',
    note: 'Slide-out chassis wash & condenser clean',
  },
  'Cassette AC': {
    multiplier: 1.45,
    label: '4-Way Ceiling Cassette',
    note: 'Includes condensate lift-pump & louvers disassembly',
  },
  'Ductable / VRF': {
    multiplier: 1.85,
    label: 'Commercial Ductable / VRF',
    note: 'High-static AHU coil & multi-circuit manifold service',
  },
};

export const TONNAGE_MULTIPLIERS: Record<TonnageType, { multiplier: number; btu: string }> = {
  '1.0 Ton': { multiplier: 1.0, btu: '12,000 BTU/hr' },
  '1.5 Ton': { multiplier: 1.1, btu: '18,000 BTU/hr' },
  '2.0 Ton': { multiplier: 1.25, btu: '24,000 BTU/hr' },
  '3.0+ Ton': { multiplier: 1.55, btu: '36,000+ BTU/hr' },
};

export interface CalculatorAddon {
  id: string;
  name: string;
  pricePerUnit: number;
  description: string;
}

export const CALCULATOR_ADDONS: CalculatorAddon[] = [
  {
    id: 'bluefin-shield',
    name: 'Anti-Corrosive U-Bend Coating',
    pricePerUnit: 249,
    description: 'Protects copper hairpin bends from atmospheric acid & drain pan corrosion',
  },
  {
    id: 'drain-nitrogen',
    name: 'Pressurized Drain Line Descale',
    pricePerUnit: 149,
    description: 'Eliminates algae bio-slime blockage to prevent indoor wall water leakage',
  },
  {
    id: 'superheat-audit',
    name: 'Digital Subcooling & Energy Audit',
    pricePerUnit: 199,
    description: 'Full psychrometric ΔT report + compressor amp draw optimization',
  },
];

export interface PricingCalculationResult {
  basePerUnit: number;
  adjustedPerUnit: number;
  addonsPerUnit: number;
  subtotal: number;
  fleetDiscountPercent: number;
  fleetDiscountAmount: number;
  finalTotal: number;
  estimatedKwhSavedPerYear: number;
  estimatedBillSavingsInr: number;
}

export function calculateServicePricing(
  serviceType: ServiceType,
  acType: AcType,
  tonnage: TonnageType,
  unitCount: number,
  selectedAddonIds: string[]
): PricingCalculationResult {
  const pkg =
    SERVICE_PACKAGES.find((p) => p.name === serviceType) || SERVICE_PACKAGES[0];
  const acSpec = AC_TYPE_MULTIPLIERS[acType] || AC_TYPE_MULTIPLIERS['Split AC'];
  const tonSpec = TONNAGE_MULTIPLIERS[tonnage] || TONNAGE_MULTIPLIERS['1.5 Ton'];

  const basePerUnit = pkg.basePriceInr;
  const adjustedPerUnit = Math.round(
    basePerUnit * acSpec.multiplier * tonSpec.multiplier
  );

  const addonsPerUnit = CALCULATOR_ADDONS.filter((a) =>
    selectedAddonIds.includes(a.id)
  ).reduce((sum, a) => sum + a.pricePerUnit, 0);

  const safeUnits = Math.max(1, Math.min(20, Math.round(unitCount)));
  const subtotal = (adjustedPerUnit + addonsPerUnit) * safeUnits;

  let fleetDiscountPercent = 0;
  if (safeUnits >= 4) {
    fleetDiscountPercent = 15;
  } else if (safeUnits >= 2) {
    fleetDiscountPercent = 10;
  }

  const fleetDiscountAmount = Math.round((subtotal * fleetDiscountPercent) / 100);
  const finalTotal = Math.max(199, subtotal - fleetDiscountAmount);

  // Realistic energy savings calculation based on clean condenser/evaporator heat transfer
  const kwhPerUnitYear =
    tonnage === '1.0 Ton'
      ? 190
      : tonnage === '1.5 Ton'
      ? 265
      : tonnage === '2.0 Ton'
      ? 350
      : 520;
  const estimatedKwhSavedPerYear = kwhPerUnitYear * safeUnits;
  const estimatedBillSavingsInr = Math.round(estimatedKwhSavedPerYear * 8.5);

  return {
    basePerUnit,
    adjustedPerUnit,
    addonsPerUnit,
    subtotal,
    fleetDiscountPercent,
    fleetDiscountAmount,
    finalTotal,
    estimatedKwhSavedPerYear,
    estimatedBillSavingsInr,
  };
}

export interface CaseStudyProof {
  id: string;
  client: string;
  roleAndOrg: string;
  location: string;
  headlineMetric: string;
  secondaryMetric: string;
  beforeState: string;
  intervention: string;
  outcomeQuote: string;
}

export const CASE_STUDY_PROOFS: CaseStudyProof[] = [
  {
    id: 'proof-1',
    client: 'Anirudh Kulkarni',
    roleAndOrg: 'Facilities Director, Vertex Co-Working Spaces',
    location: 'Sector 44, Gurugram',
    headlineMetric: '-24.6% Monthly HVAC Power Draw',
    secondaryMetric: '18 Split & Cassette Units Restored in 1 Day',
    beforeState:
      'High head pressure and fouled condenser fins caused compressors to trip every afternoon at 38°C ambient temperature.',
    intervention:
      'Executed 140 PSI alkaline Foam Power Jet descaling across all 18 units and recalibrated R410A subcooling.',
    outcomeQuote:
      'Supply grill temperature dropped from 19.4°C to 11.2°C within an hour of completion, and our electricity bill dropped by ₹18,400 the very next billing cycle.',
  },
  {
    id: 'proof-2',
    client: 'Dr. Meera Nair',
    roleAndOrg: 'Chief Administrator, Lotus Diagnostics & Imaging',
    location: 'Dwarka Sector 12, Delhi',
    headlineMetric: '100% Uptime Across 14 Months',
    secondaryMetric: 'Zero Moisture Leak or Compressor Faults',
    beforeState:
      'Recurring indoor water overflow and micro-leaks in copper U-bends disrupted MRI and ultrasound room schedules.',
    intervention:
      'Enrolled 9 Daikin inverter units under the Cool Bros AMC with Anti-Rust polymeric coil shielding and quarterly nitrogen drain purges.',
    outcomeQuote:
      'Having automated maintenance reminders and a 60-minute technician response guarantee across Delhi & Gurugram completely eliminated our summer equipment downtime.',
  },
  {
    id: 'proof-3',
    client: 'Siddharth Malhotra',
    roleAndOrg: 'Residential Homeowner (4-BHK Penthouse)',
    location: 'Vasant Kunj, Delhi',
    headlineMetric: '+32% CFM Airflow Recovery',
    secondaryMetric: '4.9/5 Verified Post-Service Audit',
    beforeState:
      'Two 2.0-Ton Mitsubishi Heavy split ACs were running continuously overnight without cooling the bedrooms below 25°C.',
    intervention:
      'Identified a flare-nut micro-leak using 350 PSI nitrogen testing, re-flared with digital torque wrench, evacuated to 500 microns, and recharged by weight.',
    outcomeQuote:
      'Unlike local mechanics who just top up gas blindly, the Cool Bros engineer showed me the digital micron gauge reading before recharging.',
  },
];

export const PROTOCOL_STEPS = [
  {
    step: '01',
    title: 'Psychrometric & Electrical Baseline Audit',
    metric: '50-Point Pre-Check',
    description:
      'Before touching a wrench, our technician records supply/return grill ΔT temperature differential, compressor starting current (Amps), and error history.',
  },
  {
    step: '02',
    title: '360° Waterproof Jacket & PCB Isolation',
    metric: 'IPX4 Splash Containment',
    description:
      'We seal the inverter PCB housing and mount a heavy-duty polyurethane catchment trough around the indoor chassis so your walls and curtains stay bone-dry.',
  },
  {
    step: '03',
    title: '140 PSI Alkaline Hydro-Jet Coil Flush',
    metric: 'Fin-Safe Regulated Pressure',
    description:
      'Biodegradable foaming surfactant lifts compacted dust and biofilm from deep inside the evaporator core, flushed clean without bending delicate aluminum fins.',
  },
  {
    step: '04',
    title: 'Condensate Line & Outdoor Condenser Purge',
    metric: 'Zero Backflow Guarantee',
    description:
      'High-pressure flush clears algae blockage in the drain pipe while the outdoor condenser unit is washed to restore optimal heat rejection.',
  },
  {
    step: '05',
    title: 'Subcooling, Superheat & Refrigerant Verification',
    metric: '±0.5 PSI Digital Accuracy',
    description:
      'Digital manifold gauges verify suction and discharge pressures against ambient temperature charts, ensuring peak COP (Coefficient of Performance).',
  },
  {
    step: '06',
    title: 'Digital Job Sheet & Reminder Sync',
    metric: 'Automated Lifecycle Log',
    description:
      'Post-service ΔT and amperage readings are logged directly to your Cool Bros account, automatically scheduling your next preventive reminder.',
  },
];
