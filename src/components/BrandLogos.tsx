import React from 'react';

export interface BrandInfo {
  id: string;
  name: string;
  brandColor: string;
}

export const BRAND_LIST: BrandInfo[] = [
  { id: 'daikin', name: 'Daikin', brandColor: '#0097E2' },
  { id: 'lg', name: 'LG', brandColor: '#A50034' },
  { id: 'voltas', name: 'Voltas', brandColor: '#0054A6' },
  { id: 'bluestar', name: 'Blue Star', brandColor: '#004B87' },
  { id: 'hitachi', name: 'Hitachi', brandColor: '#DE1A22' },
  { id: 'lloyd', name: 'Lloyd', brandColor: '#0F2042' },
  { id: 'samsung', name: 'Samsung', brandColor: '#0C4DA2' },
  { id: 'godrej', name: 'Godrej', brandColor: '#DE1B24' },
];

export const BrandLogoSvg: React.FC<{ brandId: string; className?: string }> = ({
  brandId,
  className = 'h-6 sm:h-7 w-auto',
}) => {
  switch (brandId) {
    case 'daikin':
      return (
        <svg
          viewBox="0 0 120 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-label="Daikin"
        >
          {/* Daikin Iconic Triangle / Quadrilateral Facet */}
          <path d="M4 22L16 4H28L16 22H4Z" fill="#0097E2" />
          <path d="M16 4L28 4L22 13L16 4Z" fill="#58C8F5" />
          {/* DAIKIN Bold Wordmark */}
          <text
            x="34"
            y="20"
            fill="#0097E2"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="15"
            letterSpacing="0.05em"
          >
            DAIKIN
          </text>
        </svg>
      );

    case 'lg':
      return (
        <svg
          viewBox="0 0 90 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-label="LG"
        >
          {/* LG Classic Face Emblem */}
          <circle cx="14" cy="14" r="12" fill="#A50034" />
          <circle cx="9.5" cy="11.5" r="1.5" fill="#FFFFFF" />
          {/* L nose and G smile */}
          <path
            d="M13.5 8.5V16.5H18"
            stroke="#FFFFFF"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 14C21 17.866 17.866 21 14 21C10.134 21 7 17.866 7 14C7 10.134 10.134 7 14 7C16.8 7 19.2 8.6 20.3 11"
            stroke="#FFFFFF"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          {/* LG Text */}
          <text
            x="32"
            y="21"
            fill="#A50034"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="18"
            letterSpacing="0.02em"
          >
            LG
          </text>
        </svg>
      );

    case 'voltas':
      return (
        <svg
          viewBox="0 0 110 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-label="Voltas"
        >
          <text
            x="2"
            y="20"
            fill="#0054A6"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="17"
            fontStyle="italic"
            letterSpacing="0.06em"
          >
            VOLTAS
          </text>
          <text
            x="84"
            y="11"
            fill="#0054A6"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="700"
            fontSize="7"
          >
            A TATA Enterprise
          </text>
        </svg>
      );

    case 'bluestar':
      return (
        <svg
          viewBox="0 0 130 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-label="Blue Star"
        >
          {/* 5-pointed star emblem */}
          <path
            d="M14 4L16.8 11.5H24.5L18.2 16.2L20.6 23.5L14 19L7.4 23.5L9.8 16.2L3.5 11.5H11.2L14 4Z"
            fill="#004B87"
          />
          {/* Wordmark */}
          <text
            x="30"
            y="19"
            fill="#004B87"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="13.5"
            letterSpacing="0.08em"
          >
            BLUE STAR
          </text>
        </svg>
      );

    case 'hitachi':
      return (
        <svg
          viewBox="0 0 115 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-label="Hitachi"
        >
          <text
            x="2"
            y="18"
            fill="#DE1A22"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="16"
            letterSpacing="0.08em"
          >
            HITACHI
          </text>
          <text
            x="3"
            y="26"
            fill="#DE1A22"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="600"
            fontSize="6.5"
            letterSpacing="0.04em"
          >
            Inspire the Next
          </text>
        </svg>
      );

    case 'lloyd':
      return (
        <svg
          viewBox="0 0 100 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-label="Lloyd"
        >
          <text
            x="2"
            y="19"
            fill="#0F2042"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="16"
            letterSpacing="0.08em"
          >
            LLOYD
          </text>
          {/* Subtle red swoosh dot */}
          <circle cx="94" cy="9" r="2.5" fill="#E31B23" />
        </svg>
      );

    case 'samsung':
      return (
        <svg
          viewBox="0 0 115 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-label="Samsung"
        >
          <text
            x="2"
            y="20"
            fill="#0C4DA2"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="15.5"
            letterSpacing="0.1em"
          >
            SAMSUNG
          </text>
        </svg>
      );

    case 'godrej':
      return (
        <svg
          viewBox="0 0 100 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-label="Godrej"
        >
          <text
            x="2"
            y="20"
            fill="#DE1B24"
            fontFamily="Georgia, cursive, serif"
            fontStyle="italic"
            fontWeight="bold"
            fontSize="18"
            letterSpacing="0.02em"
          >
            Godrej
          </text>
        </svg>
      );

    default:
      return null;
  }
};
