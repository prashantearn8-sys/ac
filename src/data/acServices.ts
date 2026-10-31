import { ServiceType } from '../firebase';

export interface ServicePackageSpec {
  id: string;
  index: string;
  name: ServiceType;
  tagline: string;
  basePriceInr: number;
}

export const SERVICE_PACKAGES: ServicePackageSpec[] = [
  {
    id: 'foam-jet',
    index: '01',
    name: 'Foam Power Jet Service',
    tagline: '140 PSI hydro-jet evaporator & condenser flush with alkaline bio-foam',
    basePriceInr: 599,
  },
  {
    id: 'anti-rust',
    index: '02',
    name: 'Anti-Rust Deep Chemical Wash',
    tagline: 'Complete coil descaling + hydrophobic anti-corrosive blue-fin coating',
    basePriceInr: 999,
  },
  {
    id: 'gas-charging',
    index: '03',
    name: 'Gas Charging & Leak Fix',
    tagline: 'Nitrogen pressure testing, silver brazing leak seal & OEM refrigerant recharge',
    basePriceInr: 2499,
  },
  {
    id: 'amc-plan',
    index: '04',
    name: 'Annual Maintenance Contract (AMC)',
    tagline: '3 scheduled hydro-jet services per year + priority 2-hour breakdown dispatch',
    basePriceInr: 1899,
  },
  {
    id: 'diagnostic-pcb',
    index: '05',
    name: 'Diagnostic & PCB Repair',
    tagline: 'Inverter PCB component-level fault isolation, sensor & capacitor replacement',
    basePriceInr: 349,
  },
  {
    id: 'install-uninstall',
    index: '06',
    name: 'Installation / Uninstallation',
    tagline: 'Laser-leveled mounting, core drilling, flare torque calibration & vacuuming',
    basePriceInr: 1499,
  },
];

export const PROTOCOL_STEPS = [
  {
    step: '01',
    title: 'Complete AC Inspection & Cooling Check',
    metric: 'Pre-Service Diagnosis',
    description:
      'Our technician checks cooling output, airflow, refrigerant pressure, and electrical connections to identify any hidden issues before starting the service.',
  },
  {
    step: '02',
    title: '360° Waterproof Jacket Protection',
    metric: '100% Spill-Free Indoor Setup',
    description:
      'We seal the PCB circuit box and fit a heavy-duty waterproof catchment jacket around the indoor AC unit so your walls, curtains, and floor stay completely clean and dry.',
  },
  {
    step: '03',
    title: 'Foam & Hydro-Jet Coil Deep Wash',
    metric: 'Deep Fin & Blower Cleaning',
    description:
      'Active coil-safe foam lifts compacted dust and grime from deep inside the cooling fins and blower wheel, followed by a regulated hydro-jet rinse.',
  },
  {
    step: '04',
    title: 'Drain Line Flush & Outdoor Unit Wash',
    metric: 'Zero Water Leakage Guarantee',
    description:
      'We pressure-flush the drain tray and pipe to eliminate algae blockages, and thoroughly jet-wash the outdoor condenser unit to restore peak heat rejection.',
  },
  {
    step: '05',
    title: 'Gas Pressure & Cooling Performance Test',
    metric: 'Digital Gauge & Amp Verification',
    description:
      'Digital gauges and clamp meters verify refrigerant pressure, compressor current draw, and supply grill temperature drop for fast, ice-cold cooling.',
  },
  {
    step: '06',
    title: 'Final Wipe-Down & Service Warranty',
    metric: '30 to 90 Days Service Coverage',
    description:
      'We sanitize and wipe down the AC panel, verify smooth louver and remote operation with you, and back our work with a clear post-service warranty.',
  },
];
