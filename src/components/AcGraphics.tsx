import React from 'react';
import { motion } from 'motion/react';

/**
 * Brand Logo: Cool Bros AC Service — Transparent Blue Macro Snowflake PNG (/logo.png)
 */
export const CoolBrosLogo: React.FC<{ className?: string }> = ({
  className = 'w-9 h-9',
}) => (
  <img
    src="/logo.png?v=simple-blue"
    alt="Cool Bros AC Service Logo"
    referrerPolicy="no-referrer"
    className={`${className} object-contain select-none shrink-0`}
  />
);

/**
 * Hero Illustration (Selector 2):
 * Neo-Brutalist Split AC Indoor Unit + Outdoor Condenser Fan + 140 PSI Hydro-Jet
 * + Digital Manifold Gauge + Floating HVAC Telemetry Badges.
 */
export const HeroCoolingIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-[460px] sm:max-w-[560px] lg:max-w-[640px] xl:max-w-[680px] mx-auto aspect-[1.08/1] select-none">
      <svg
        viewBox="0 0 540 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-hidden sm:overflow-visible"
      >
        {/* Background Tilted Airflow Orbital Rings */}
        <g transform="rotate(-14 270 265)">
          <ellipse
            cx="270"
            cy="265"
            rx="215"
            ry="58"
            stroke="#191A23"
            strokeWidth="1.75"
            strokeDasharray="6 6"
          />
          <ellipse
            cx="270"
            cy="290"
            rx="195"
            ry="48"
            stroke="#191A23"
            strokeWidth="1.75"
          />
        </g>

        {/* Outdoor Condenser Unit (Lower-Left Module with Rotating Fan Turbine) */}
        <motion.g
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Condenser Chassis */}
          <rect
            x="46"
            y="250"
            width="166"
            height="122"
            rx="16"
            fill="#F3F3F3"
            stroke="#191A23"
            strokeWidth="2.5"
          />
          {/* Top Lid Accent */}
          <path
            d="M46 266C46 257.163 53.1634 250 62 250H196C204.837 250 212 257.163 212 266V270H46V266Z"
            fill="#7DD3FC"
            stroke="#191A23"
            strokeWidth="2.5"
          />
          {/* Fan Shroud Circle */}
          <circle
            cx="110"
            cy="320"
            r="40"
            fill="#191A23"
            stroke="#191A23"
            strokeWidth="2.5"
          />
          {/* Animated Condenser Fan Blades */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '110px 320px' }}
          >
            <path
              d="M110 320C102 302 104 286 114 286C122 286 120 304 110 320Z"
              fill="#7DD3FC"
            />
            <path
              d="M110 320C128 312 144 314 144 324C144 332 126 330 110 320Z"
              fill="#7DD3FC"
            />
            <path
              d="M110 320C118 338 116 354 106 354C98 354 100 336 110 320Z"
              fill="#7DD3FC"
            />
            <path
              d="M110 320C92 328 76 326 76 316C76 308 94 310 110 320Z"
              fill="#7DD3FC"
            />
            <circle cx="110" cy="320" r="8" fill="#FFFFFF" stroke="#191A23" strokeWidth="2" />
          </motion.g>
          {/* Right Condenser Grill Lines & Service Valves */}
          <line x1="164" y1="286" x2="196" y2="286" stroke="#191A23" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="164" y1="298" x2="196" y2="298" stroke="#191A23" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="164" y1="310" x2="196" y2="310" stroke="#191A23" strokeWidth="2.5" strokeLinecap="round" />
          <rect
            x="164"
            y="326"
            width="32"
            height="28"
            rx="6"
            fill="#FFFFFF"
            stroke="#191A23"
            strokeWidth="2"
          />
          <text
            x="180"
            y="344"
            textAnchor="middle"
            fill="#191A23"
            fontSize="10"
            fontWeight="800"
            fontFamily="monospace"
          >
            R32
          </text>
        </motion.g>

        {/* Insulated Copper Refrigerant Piping Connecting Indoor & Outdoor Units */}
        <path
          d="M212 340H268C284 340 296 328 296 312V208"
          stroke="#191A23"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M212 340H268C284 340 296 328 296 312V208"
          stroke="#7DD3FC"
          strokeWidth="3.5"
          strokeDasharray="8 6"
          strokeLinecap="round"
        />

        {/* High-Wall Split AC Indoor Unit (Top-Center Main Hero Unit) */}
        <motion.g
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Main Indoor AC Body */}
          <rect
            x="110"
            y="80"
            width="316"
            height="110"
            rx="22"
            fill="#FFFFFF"
            stroke="#191A23"
            strokeWidth="3"
          />
          {/* Top Intake Accent Strip */}
          <path
            d="M132 80H404C416.15 80 426 89.8497 426 102V106H110V102C110 89.8497 119.85 80 132 80Z"
            fill="#7DD3FC"
            stroke="#191A23"
            strokeWidth="2.5"
          />
          {/* Front Panel Seam Line */}
          <line x1="126" y1="142" x2="410" y2="142" stroke="#191A23" strokeWidth="2" />

          {/* Digital LED Temperature Readout Display (16°C) */}
          <rect
            x="338"
            y="112"
            width="66"
            height="22"
            rx="6"
            fill="#191A23"
          />
          <circle cx="349" cy="123" r="3.5" fill="#7DD3FC" />
          <text
            x="378"
            y="127"
            textAnchor="middle"
            fill="#7DD3FC"
            fontSize="12"
            fontWeight="800"
            fontFamily="monospace"
          >
            16°C
          </text>

          {/* Left Brand Emblem on AC Chassis */}
          <rect
            x="132"
            y="114"
            width="58"
            height="18"
            rx="5"
            fill="#F3F3F3"
            stroke="#191A23"
            strokeWidth="1.75"
          />
          <text
            x="161"
            y="126"
            textAnchor="middle"
            fill="#191A23"
            fontSize="9"
            fontWeight="800"
            fontFamily="monospace"
          >
            INVERTER
          </text>

          {/* Open Motorized Swing Louver Flap */}
          <path
            d="M124 156H412L402 178H134L124 156Z"
            fill="#7DD3FC"
            stroke="#191A23"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Directional Louver Fins */}
          <line x1="165" y1="156" x2="160" y2="178" stroke="#191A23" strokeWidth="2" />
          <line x1="215" y1="156" x2="210" y2="178" stroke="#191A23" strokeWidth="2" />
          <line x1="268" y1="156" x2="268" y2="178" stroke="#191A23" strokeWidth="2" />
          <line x1="320" y1="156" x2="325" y2="178" stroke="#191A23" strokeWidth="2" />
          <line x1="370" y1="156" x2="375" y2="178" stroke="#191A23" strokeWidth="2" />

          {/* Animated Chilled Airflow Waves Flowing Downward from AC */}
          <motion.g
            animate={{ y: [0, 8, 0], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M162 198C154 214 166 226 156 242"
              stroke="#191A23"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="5 5"
            />
            <path
              d="M235 198C227 218 240 232 228 252"
              stroke="#191A23"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M312 198C304 218 318 232 306 252"
              stroke="#191A23"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M376 198C368 214 380 226 370 242"
              stroke="#191A23"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="5 5"
            />
          </motion.g>
        </motion.g>

        {/* 140 PSI Hydro-Jet Pressure Washer Lance & Spray Mist (Lower-Right) */}
        <motion.g
          animate={{ x: [0, -5, 0], y: [0, -4, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Fan-Shaped Hydro-Jet Water Spray Cone Hitting Coil */}
          <path
            d="M354 244L276 188L326 176L354 244Z"
            fill="#7DD3FC"
            fillOpacity="0.65"
            stroke="#191A23"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          {/* Foam Bubbles on AC Coil */}
          <circle cx="282" cy="184" r="9" fill="#FFFFFF" stroke="#191A23" strokeWidth="2" />
          <circle cx="300" cy="178" r="12" fill="#7DD3FC" stroke="#191A23" strokeWidth="2" />
          <circle cx="318" cy="184" r="8" fill="#FFFFFF" stroke="#191A23" strokeWidth="2" />

          {/* High-Pressure Jet Nozzle & Trigger Handle */}
          <path
            d="M352 242L420 296L408 312L340 256L352 242Z"
            fill="#191A23"
            stroke="#191A23"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect
            x="408"
            y="286"
            width="64"
            height="28"
            rx="8"
            transform="rotate(38 408 286)"
            fill="#7DD3FC"
            stroke="#191A23"
            strokeWidth="2.5"
          />
          {/* Digital Pressure Gauge Mounted on Jet Gun */}
          <circle
            cx="392"
            cy="348"
            r="38"
            fill="#FFFFFF"
            stroke="#191A23"
            strokeWidth="2.5"
          />
          <circle
            cx="392"
            cy="348"
            r="28"
            fill="#7DD3FC"
            stroke="#191A23"
            strokeWidth="2"
          />
          <path d="M392 348L406 334" stroke="#191A23" strokeWidth="3" strokeLinecap="round" />
          <circle cx="392" cy="348" r="4" fill="#191A23" />
          <text
            x="392"
            y="366"
            textAnchor="middle"
            fill="#191A23"
            fontSize="9"
            fontWeight="800"
            fontFamily="monospace"
          >
            140 PSI
          </text>
        </motion.g>

        {/* Floating Badge 1: Top-Left Sub-Zero Snowflake Badge */}
        <motion.g
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle
            cx="62"
            cy="114"
            r="34"
            fill="#7DD3FC"
            stroke="#191A23"
            strokeWidth="2.5"
          />
          <path
            d="M62 94V134M42 114H82M48 100L76 128M76 100L48 128"
            stroke="#191A23"
            strokeWidth="2.75"
            strokeLinecap="round"
          />
          <circle cx="62" cy="114" r="5" fill="#FFFFFF" stroke="#191A23" strokeWidth="2" />
        </motion.g>

        {/* Floating Badge 2: Top-Right 500-Micron Vacuum / ΔT Thermometer Badge */}
        <motion.g
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 3.7, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        >
          <circle cx="482" cy="118" r="34" fill="#191A23" />
          {/* Thermometer Icon */}
          <rect
            x="477"
            y="95"
            width="10"
            height="28"
            rx="5"
            fill="#FFFFFF"
            stroke="#7DD3FC"
            strokeWidth="2"
          />
          <circle cx="482" cy="128" r="9" fill="#7DD3FC" />
          <line x1="482" y1="104" x2="482" y2="128" stroke="#7DD3FC" strokeWidth="3.5" />
          <line x1="491" y1="102" x2="496" y2="102" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <line x1="491" y1="109" x2="498" y2="109" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <line x1="491" y1="116" x2="496" y2="116" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </motion.g>

        {/* Floating Badge 3: Middle-Right Warranty Shield Badge */}
        <motion.g
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        >
          <circle
            cx="484"
            cy="222"
            r="30"
            fill="#FFFFFF"
            stroke="#191A23"
            strokeWidth="2.5"
          />
          <path
            d="M484 202L500 208V220C500 231 493 239 484 242C475 239 468 231 468 220V208L484 202Z"
            fill="#7DD3FC"
            stroke="#191A23"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M478 222L482 226L491 217"
            stroke="#191A23"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.g>

        {/* Bottom Telemetry Pill Tag */}
        <g transform="translate(154, 412)">
          <rect
            x="0"
            y="0"
            width="212"
            height="40"
            rx="12"
            fill="#7DD3FC"
            stroke="#191A23"
            strokeWidth="2.2"
          />
          <circle cx="22" cy="20" r="6" fill="#191A23" />
          <text
            x="114"
            y="24"
            textAnchor="middle"
            fill="#191A23"
            fontSize="11"
            fontWeight="800"
            fontFamily="monospace"
          >
            500-MICRON VACUUM TESTED
          </text>
        </g>
      </svg>
    </div>
  );
};

/**
 * Custom HVAC & AC Engineering Illustrations for the 6 Service Cards (Selectors 3–8):
 * 0: Foam Power Jet Service (Split AC + 140 PSI Hydro-Jet Spray + Foam Bubbles)
 * 1: Anti-Rust Deep Chemical Wash (Copper/Aluminum Fin Coil + Protective Blue-Fin Shield + Spray)
 * 2: Gas Charging & Leak Fix (R32 Refrigerant Cylinder + Dual Manifold Pressure Gauges)
 * 3: Annual Maintenance Contract (3-Season Scheduled AC Calendar + Rotating Fan + Shield)
 * 4: Diagnostic & PCB Repair (Inverter PCB Circuit Board + Capacitor + Digital Multimeter)
 * 5: Installation / Uninstallation (Wall-Mounted Split AC Bracket + Laser Level + Copper Coils)
 */
export const ServiceCardIllustration: React.FC<{ index: number }> = ({ index }) => {
  const variant = index % 6;

  if (variant === 0) {
    // Card 1 (#F3F3F3 bg): Foam Power Jet Service — Split AC Unit + 140 PSI Hydro-Jet Lance & Foam
    return (
      <svg viewBox="0 0 210 160" fill="none" className="w-36 sm:w-44 h-28 sm:h-36 shrink-0">
        {/* Split AC Indoor Unit */}
        <rect
          x="16"
          y="18"
          width="144"
          height="52"
          rx="10"
          fill="#FFFFFF"
          stroke="#191A23"
          strokeWidth="2.2"
        />
        {/* Exposed Evaporator Coil Fins inside AC */}
        <rect
          x="26"
          y="26"
          width="96"
          height="22"
          rx="4"
          fill="#7DD3FC"
          stroke="#191A23"
          strokeWidth="1.75"
        />
        {[38, 50, 62, 74, 86, 98, 110].map((x) => (
          <line key={x} x1={x} y1="26" x2={x} y2="48" stroke="#191A23" strokeWidth="1.4" />
        ))}
        {/* Digital Temp Pill */}
        <rect x="130" y="30" width="22" height="12" rx="3" fill="#191A23" />
        <circle cx="141" cy="36" r="2.5" fill="#7DD3FC" />
        {/* Catchment Waterproof Jacket Funnel */}
        <path
          d="M24 70L42 126H134L152 70"
          fill="#7DD3FC"
          fillOpacity="0.35"
          stroke="#191A23"
          strokeWidth="1.8"
          strokeDasharray="4 3"
        />
        {/* High-Pressure Hydro-Jet Spray Cone */}
        <path
          d="M142 108L76 48L114 48L142 108Z"
          fill="#7DD3FC"
          stroke="#191A23"
          strokeWidth="1.75"
        />
        {/* Active Foam Bubbles on Coil */}
        <circle cx="72" cy="48" r="7" fill="#FFFFFF" stroke="#191A23" strokeWidth="1.75" />
        <circle cx="86" cy="44" r="9" fill="#FFFFFF" stroke="#191A23" strokeWidth="1.75" />
        <circle cx="102" cy="49" r="6" fill="#7DD3FC" stroke="#191A23" strokeWidth="1.75" />
        {/* Hydro-Jet Gun Nozzle & Handle */}
        <path
          d="M138 104L188 134L180 146L130 114L138 104Z"
          fill="#191A23"
          stroke="#191A23"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        {/* Mini 140 PSI Badge */}
        <rect
          x="18"
          y="120"
          width="68"
          height="24"
          rx="6"
          fill="#191A23"
        />
        <text
          x="52"
          y="136"
          textAnchor="middle"
          fill="#7DD3FC"
          fontSize="10"
          fontWeight="800"
          fontFamily="monospace"
        >
          140 PSI JET
        </text>
      </svg>
    );
  }

  if (variant === 1) {
    // Card 2 (#7DD3FC bg): Anti-Rust Deep Chemical Wash — Copper U-Bend Fin Coil + Protective Shield
    return (
      <svg viewBox="0 0 210 160" fill="none" className="w-36 sm:w-44 h-28 sm:h-36 shrink-0">
        {/* Evaporator / Condenser Fin Coil Block */}
        <rect
          x="24"
          y="22"
          width="118"
          height="96"
          rx="10"
          fill="#FFFFFF"
          stroke="#191A23"
          strokeWidth="2.2"
        />
        {/* Horizontal Copper Refrigerant Tubes */}
        {[40, 60, 80, 100].map((y) => (
          <line key={y} x1="34" y1={y} x2="132" y2={y} stroke="#191A23" strokeWidth="3.5" strokeLinecap="round" />
        ))}
        {/* Vertical Aluminum Cooling Fins */}
        {[46, 62, 78, 94, 110, 122].map((x) => (
          <line key={x} x1={x} y1="30" x2={x} y2="110" stroke="#191A23" strokeWidth="1.5" />
        ))}
        {/* Copper U-Bends on Left Edge */}
        <path
          d="M24 40C12 40 12 60 24 60M24 80C12 80 12 100 24 100"
          stroke="#191A23"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Anti-Rust Polymeric Shield Badge (Right Side) */}
        <path
          d="M150 40L188 54V84C188 110 171 128 150 136C129 128 112 110 112 84V54L150 40Z"
          fill="#FFFFFF"
          stroke="#191A23"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M150 50L178 60V84C178 103 165 117 150 124C135 117 122 103 122 84V60L150 50Z"
          fill="#7DD3FC"
          stroke="#191A23"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Checkmark Inside Anti-Rust Shield */}
        <path
          d="M138 86L147 95L164 76"
          stroke="#191A23"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Sparkle Stars */}
        <path d="M178 18L181 26L189 29L181 32L178 40L175 32L167 29L175 26L178 18Z" fill="#191A23" />
      </svg>
    );
  }

  if (variant === 2) {
    // Card 3 (#191A23 dark bg): Gas Charging & Leak Fix — R32 Refrigerant Cylinder + Dual Manifold Gauge
    return (
      <svg viewBox="0 0 210 160" fill="none" className="w-36 sm:w-44 h-28 sm:h-36 shrink-0">
        {/* R32 / R410A Refrigerant Gas Cylinder */}
        <rect
          x="28"
          y="46"
          width="66"
          height="96"
          rx="16"
          fill="#7DD3FC"
          stroke="#FFFFFF"
          strokeWidth="2.2"
        />
        {/* Cylinder Valve Collar / Guard */}
        <path
          d="M44 46V30C44 26 47 24 51 24H71C75 24 78 26 78 30V46"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          fill="#191A23"
        />
        <circle cx="61" cy="34" r="5" fill="#7DD3FC" />
        {/* R32 Stencil Badge on Tank */}
        <rect
          x="38"
          y="72"
          width="46"
          height="26"
          rx="5"
          fill="#191A23"
        />
        <text
          x="61"
          y="89"
          textAnchor="middle"
          fill="#7DD3FC"
          fontSize="12"
          fontWeight="800"
          fontFamily="monospace"
        >
          R32
        </text>
        {/* High-Pressure Charging Hose */}
        <path
          d="M78 34C112 34 106 88 136 88"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Digital Manifold Gauge Block (Right) */}
        <rect
          x="118"
          y="34"
          width="74"
          height="88"
          rx="12"
          fill="#FFFFFF"
          stroke="#191A23"
          strokeWidth="2"
        />
        {/* Gauge Dial */}
        <circle
          cx="155"
          cy="68"
          r="23"
          fill="#7DD3FC"
          stroke="#191A23"
          strokeWidth="2"
        />
        <path d="M155 68L168 55" stroke="#191A23" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="155" cy="68" r="3.5" fill="#191A23" />
        {/* Digital Micron / PSI Readout */}
        <rect x="128" y="98" width="54" height="16" rx="4" fill="#191A23" />
        <text
          x="155"
          y="109"
          textAnchor="middle"
          fill="#7DD3FC"
          fontSize="8.5"
          fontWeight="800"
          fontFamily="monospace"
        >
          350 PSI
        </text>
      </svg>
    );
  }

  if (variant === 3) {
    // Card 4 (#F3F3F3 bg): Annual Maintenance Contract (AMC) — 365-Day Service Calendar & AC Fan
    return (
      <svg viewBox="0 0 210 160" fill="none" className="w-36 sm:w-44 h-28 sm:h-36 shrink-0">
        {/* Main AMC Schedule Board */}
        <rect
          x="24"
          y="26"
          width="128"
          height="106"
          rx="12"
          fill="#FFFFFF"
          stroke="#191A23"
          strokeWidth="2.2"
        />
        {/* Top Calendar Header */}
        <path
          d="M24 38C24 31.3726 29.3726 26 36 26H140C146.627 26 152 31.3726 152 38V50H24V38Z"
          fill="#7DD3FC"
          stroke="#191A23"
          strokeWidth="2.2"
        />
        {/* Calendar Binding Rings */}
        <rect x="48" y="18" width="8" height="16" rx="4" fill="#191A23" />
        <rect x="84" y="18" width="8" height="16" rx="4" fill="#191A23" />
        <rect x="120" y="18" width="8" height="16" rx="4" fill="#191A23" />
        {/* 3 Scheduled Seasonal Service Slots */}
        {[64, 86, 108].map((y, i) => (
          <g key={y}>
            <rect
              x="36"
              y={y}
              width="16"
              height="14"
              rx="4"
              fill="#7DD3FC"
              stroke="#191A23"
              strokeWidth="1.75"
            />
            <path
              d={`M40 ${y + 7}L43 ${y + 10}L49 ${y + 4}`}
              stroke="#191A23"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="60"
              y1={y + 7}
              x2={i === 1 ? '118' : '132'}
              y2={y + 7}
              stroke="#191A23"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        ))}
        {/* Overlapping 365-Day AMC Fan Badge */}
        <circle
          cx="158"
          cy="104"
          r="32"
          fill="#7DD3FC"
          stroke="#191A23"
          strokeWidth="2.2"
        />
        <circle cx="158" cy="104" r="22" fill="#FFFFFF" stroke="#191A23" strokeWidth="1.75" />
        <text
          x="158"
          y="102"
          textAnchor="middle"
          fill="#191A23"
          fontSize="10"
          fontWeight="800"
          fontFamily="monospace"
        >
          365d
        </text>
        <text
          x="158"
          y="113"
          textAnchor="middle"
          fill="#191A23"
          fontSize="8"
          fontWeight="800"
          fontFamily="monospace"
        >
          AMC
        </text>
      </svg>
    );
  }

  if (variant === 4) {
    // Card 5 (#7DD3FC bg): Diagnostic & PCB Repair — Inverter PCB Board + Capacitor + Clamp Meter
    return (
      <svg viewBox="0 0 210 160" fill="none" className="w-36 sm:w-44 h-28 sm:h-36 shrink-0">
        {/* PCB Board Base */}
        <rect
          x="20"
          y="24"
          width="132"
          height="104"
          rx="10"
          fill="#FFFFFF"
          stroke="#191A23"
          strokeWidth="2.2"
        />
        {/* Central Inverter IPM Chip */}
        <rect
          x="58"
          y="52"
          width="52"
          height="46"
          rx="6"
          fill="#191A23"
        />
        {/* IC Chip Pins */}
        {[60, 70, 80, 90].map((y) => (
          <g key={y}>
            <line x1="48" y1={y} x2="58" y2={y} stroke="#191A23" strokeWidth="2.2" />
            <line x1="110" y1={y} x2="120" y2={y} stroke="#191A23" strokeWidth="2.2" />
          </g>
        ))}
        <text
          x="84"
          y="79"
          textAnchor="middle"
          fill="#7DD3FC"
          fontSize="10"
          fontWeight="800"
          fontFamily="monospace"
        >
          PCB IC
        </text>
        {/* Circuit Traces & Solder Nodes */}
        <path d="M34 40H52L62 52" stroke="#191A23" strokeWidth="1.75" />
        <circle cx="34" cy="40" r="3.5" fill="#7DD3FC" stroke="#191A23" strokeWidth="1.5" />
        <path d="M34 110H56L66 98" stroke="#191A23" strokeWidth="1.75" />
        <circle cx="34" cy="110" r="3.5" fill="#7DD3FC" stroke="#191A23" strokeWidth="1.5" />
        {/* Capacitor Cylinder & Multimeter Probe (Right Side) */}
        <rect
          x="136"
          y="42"
          width="48"
          height="88"
          rx="10"
          fill="#F3F3F3"
          stroke="#191A23"
          strokeWidth="2.2"
        />
        {/* Multimeter Screen */}
        <rect
          x="144"
          y="52"
          width="32"
          height="20"
          rx="3"
          fill="#7DD3FC"
          stroke="#191A23"
          strokeWidth="1.5"
        />
        <text
          x="160"
          y="65"
          textAnchor="middle"
          fill="#191A23"
          fontSize="8.5"
          fontWeight="800"
          fontFamily="monospace"
        >
          230V
        </text>
        {/* Rotary Selector Dial */}
        <circle cx="160" cy="96" r="14" fill="#191A23" />
        <line x1="160" y1="96" x2="168" y2="88" stroke="#7DD3FC" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  // Card 6 (#191A23 dark bg): Installation / Uninstallation — Split AC Wall Plate + Laser Level + Copper Coil
  return (
    <svg viewBox="0 0 210 160" fill="none" className="w-36 sm:w-44 h-28 sm:h-36 shrink-0">
      {/* Split AC Unit Mounted on Wall */}
      <rect
        x="22"
        y="24"
        width="156"
        height="52"
        rx="10"
        fill="#FFFFFF"
        stroke="#191A23"
        strokeWidth="2"
      />
      <path d="M32 62H168" stroke="#191A23" strokeWidth="2" />
      <rect x="134" y="34" width="30" height="14" rx="4" fill="#191A23" />
      <text
        x="149"
        y="44"
        textAnchor="middle"
        fill="#7DD3FC"
        fontSize="8"
        fontWeight="800"
        fontFamily="monospace"
      >
        16°C
      </text>

      {/* Laser Spirit Level Bar Below AC */}
      <rect
        x="28"
        y="88"
        width="144"
        height="24"
        rx="6"
        fill="#7DD3FC"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
      {/* Center Spirit Bubble Vial */}
      <rect
        x="78"
        y="93"
        width="44"
        height="14"
        rx="7"
        fill="#FFFFFF"
        stroke="#191A23"
        strokeWidth="1.75"
      />
      <circle cx="100" cy="100" r="5" fill="#191A23" />
      <line x1="92" y1="93" x2="92" y2="107" stroke="#191A23" strokeWidth="1.5" />
      <line x1="108" y1="93" x2="108" y2="107" stroke="#191A23" strokeWidth="1.5" />

      {/* Precision Alignment Dimension Arrows */}
      <line x1="22" y1="132" x2="178" y2="132" stroke="#7DD3FC" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="22" cy="132" r="4" fill="#7DD3FC" />
      <circle cx="178" cy="132" r="4" fill="#7DD3FC" />
      <rect x="66" y="122" width="68" height="18" rx="4" fill="#FFFFFF" />
      <text
        x="100"
        y="134"
        textAnchor="middle"
        fill="#191A23"
        fontSize="8.5"
        fontWeight="800"
        fontFamily="monospace"
      >
        0.0° LEVEL
      </text>
    </svg>
  );
};

export type AcBrandName =
  | 'DAIKIN'
  | 'LG'
  | 'VOLTAS'
  | 'BLUE STAR'
  | 'CARRIER'
  | 'HITACHI';

/**
 * Authentic AC Brand Logos (Full color when hovered, dull B&W grayscale by default via parent CSS)
 */
export const AcBrandLogo: React.FC<{ brand: AcBrandName }> = ({ brand }) => {
  switch (brand) {
    case 'DAIKIN':
      return (
        <svg
          viewBox="0 0 180 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-9 sm:h-11 w-auto select-none"
          aria-label="Daikin Air Conditioning"
        >
          {/* Iconic Daikin Two-Tone Blue Corner Triangle */}
          <polygon points="6,8 34,8 6,36" fill="#004B87" />
          <polygon points="15,8 34,8 6,36 6,17" fill="#00A0E9" />
          {/* Bold Italic DAIKIN Wordmark */}
          <text
            x="38"
            y="34"
            fill="#0097E0"
            fontFamily="var(--font-display), sans-serif"
            fontSize="27"
            fontWeight="800"
            fontStyle="italic"
            letterSpacing="1.5"
          >
            DAIKIN
          </text>
        </svg>
      );

    case 'LG':
      return (
        <svg
          viewBox="0 0 140 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-9 sm:h-11 w-auto select-none"
          aria-label="LG Air Conditioners"
        >
          {/* Official LG Heritage Red Circle (#A50034) */}
          <circle cx="24" cy="24" r="18.5" fill="#A50034" />
          {/* Stylized White 'G' Outer Arc */}
          <path
            d="M24 10.5C16.544 10.5 10.5 16.544 10.5 24C10.5 31.456 16.544 37.5 24 37.5C31.1 37.5 36.92 32.02 37.46 25.05H28.2"
            stroke="#FFFFFF"
            strokeWidth="2.6"
            strokeLinecap="butt"
          />
          {/* Stylized White 'L' Center Nose */}
          <path
            d="M24 15.2V26.8H27.6"
            stroke="#FFFFFF"
            strokeWidth="2.6"
            strokeLinecap="butt"
          />
          {/* White Eye Dot */}
          <circle cx="18.2" cy="18.5" r="2" fill="#FFFFFF" />
          {/* Bold LG Wordmark */}
          <text
            x="50"
            y="34"
            fill="#A50034"
            fontFamily="var(--font-display), sans-serif"
            fontSize="30"
            fontWeight="800"
            letterSpacing="1"
          >
            LG
          </text>
        </svg>
      );

    case 'VOLTAS':
      return (
        <svg
          viewBox="0 0 175 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-9 sm:h-11 w-auto select-none"
          aria-label="Voltas A Tata Enterprise"
        >
          {/* Authentic Voltas Bold Wordmark (#005BAC) */}
          <text
            x="8"
            y="29"
            fill="#005BAC"
            fontFamily="var(--font-display), sans-serif"
            fontSize="28"
            fontWeight="900"
            letterSpacing="2.2"
          >
            VOLTAS
          </text>
          {/* Thin Blue Rule + "A TATA Enterprise" Subtitle */}
          <line x1="8" y1="33.5" x2="148" y2="33.5" stroke="#00AEEF" strokeWidth="1.4" />
          <text
            x="78"
            y="43.5"
            textAnchor="middle"
            fill="#005BAC"
            fontFamily="var(--font-sans), sans-serif"
            fontSize="8.5"
            fontWeight="700"
            letterSpacing="1.1"
          >
            A TATA Enterprise
          </text>
        </svg>
      );

    case 'BLUE STAR':
      return (
        <svg
          viewBox="0 0 215 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-9 sm:h-11 w-auto select-none"
          aria-label="Blue Star Air Conditioners"
        >
          {/* Authentic BLUE STAR Bold Wordmark on Left */}
          <text
            x="6"
            y="31"
            fill="#0054A6"
            fontFamily="var(--font-display), sans-serif"
            fontSize="22"
            fontWeight="800"
            letterSpacing="1"
          >
            BLUE STAR
          </text>
          {/* Authentic Blue Star Right-Side Wedge & Asymmetric 4-Point Star */}
          <polygon points="154,36 204,10 204,36" fill="#0072BC" />
          <path
            d="M188 9L190.2 21.5L206 23.5L190.2 25.5L188 38L185.8 25.5L146 23.5L185.8 21.5L188 9Z"
            fill="#00AEEF"
          />
          <path
            d="M188 13L189.4 22.3L201 23.5L189.4 24.7L188 34L186.6 24.7L158 23.5L186.6 22.3L188 13Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'CARRIER':
      return (
        <svg
          viewBox="0 0 175 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-9 sm:h-11 w-auto select-none"
          aria-label="Carrier Air Conditioning"
        >
          {/* Iconic Carrier Royal-Blue Oval Badge */}
          <ellipse cx="86" cy="24" rx="76" ry="18" fill="#002F87" />
          <ellipse
            cx="86"
            cy="24"
            rx="71"
            ry="14.5"
            stroke="#38BDF8"
            strokeWidth="1.6"
          />
          {/* White Italic Carrier Script Wordmark */}
          <text
            x="86"
            y="31"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="var(--font-display), sans-serif"
            fontSize="22"
            fontWeight="800"
            fontStyle="italic"
            letterSpacing="1"
          >
            Carrier
          </text>
        </svg>
      );

    case 'HITACHI':
      return (
        <svg
          viewBox="0 0 185 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-9 sm:h-11 w-auto select-none"
          aria-label="Hitachi Inspire the Next"
        >
          {/* Authentic HITACHI Wide-Tracked Corporate Wordmark in Hitachi Red (#E60027) */}
          <text
            x="8"
            y="26"
            fill="#E60027"
            fontFamily="var(--font-display), sans-serif"
            fontSize="24"
            fontWeight="900"
            letterSpacing="3.8"
          >
            HITACHI
          </text>
          {/* Authentic "Inspire the Next" Tagline + Signature Red Slash Accent */}
          <text
            x="22"
            y="41"
            fill="#191A23"
            fontFamily="var(--font-sans), sans-serif"
            fontSize="11"
            fontWeight="700"
            fontStyle="italic"
            letterSpacing="0.4"
          >
            Inspire the Next
          </text>
          {/* Iconic Hitachi Red Forward Slash Accent Next to "Next" */}
          <path
            d="M118 33L125 28L122 36Z"
            fill="#E60027"
          />
        </svg>
      );
  }
};


