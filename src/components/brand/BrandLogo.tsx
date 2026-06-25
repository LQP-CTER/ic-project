import { useId } from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 40,
  md: 52,
  lg: 72,
};

export function BrandLogo({ size = 'md', theme = 'dark', showText = true, className = '' }: BrandLogoProps) {
  const rawId = useId().replace(/:/g, '');
  const gradientId = `ic-gradient-${rawId}`;
  const glowId = `ic-glow-${rawId}`;
  const shineId = `ic-shine-${rawId}`;
  const markSize = sizeMap[size];

  return (
    <div className={`brand-logo brand-logo-${theme} brand-logo-size-${size} ${className}`}>
      <svg
        className="brand-logo-mark"
        width={markSize}
        height={markSize}
        viewBox="0 0 72 72"
        role="img"
        aria-label="IC Platform product by EX Team logo"
      >
        <defs>
          <linearGradient id={gradientId} x1="10" y1="8" x2="64" y2="66" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="0.45" stopColor="#6366f1" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
          <radialGradient id={glowId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(20 15) rotate(46) scale(48)">
            <stop stopColor="white" stopOpacity="0.82" />
            <stop offset="0.52" stopColor="white" stopOpacity="0.16" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={shineId} x1="18" y1="13" x2="52" y2="61" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0.45" />
            <stop offset="0.42" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="5" y="5" width="62" height="62" rx="20" fill={`url(#${gradientId})`} />
        <rect x="5" y="5" width="62" height="62" rx="20" fill={`url(#${glowId})`} />
        <path d="M18 17c0-2.2 1.8-4 4-4h22c11 0 19 8 19 19v18c0 5-4 9-9 9H22c-2.2 0-4-1.8-4-4V17Z" fill={`url(#${shineId})`} />

        <path d="M20.8 21.8h7.8v27.6h-7.8V21.8Z" fill="white" />
        <path
          d="M47.4 50.5c-8.9 0-15.7-6.4-15.7-14.9s6.8-14.9 15.7-14.9c4.5 0 8.3 1.5 11.1 4.4l-5 5.4c-1.6-1.6-3.4-2.4-5.6-2.4-4.2 0-7.3 3.1-7.3 7.5s3.1 7.5 7.3 7.5c2.2 0 4-.8 5.6-2.4l5 5.4c-2.8 2.9-6.6 4.4-11.1 4.4Z"
          fill="white"
        />

        <g>
          <rect x="32" y="50.5" width="26" height="11" rx="5.5" fill="#07101f" fillOpacity="0.84" />
          <text x="45" y="58.5" textAnchor="middle" fontSize="7.3" fontWeight="900" fill="white" fontFamily="Inter, Arial, sans-serif">
            EX
          </text>
        </g>
      </svg>

      {showText && (
        <span className="brand-logo-text">
          <span className="brand-logo-name">IC Platform</span>
          <span className="brand-logo-byline">Product by EX Team</span>
        </span>
      )}
    </div>
  );
}