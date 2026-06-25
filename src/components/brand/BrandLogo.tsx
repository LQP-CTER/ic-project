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
  const markSize = sizeMap[size];

  return (
    <div className={`brand-logo brand-logo-${theme} brand-logo-size-${size} ${className}`}>
      <svg
        className="brand-logo-mark"
        width={markSize}
        height={markSize}
        viewBox="0 0 72 72"
        role="img"
        aria-label="IC Platform logo"
      >
        <defs>
          <linearGradient id={gradientId} x1="5" y1="5" x2="67" y2="67" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#f97316" />
            <stop offset="1" stopColor="#ea580c" />
          </linearGradient>
        </defs>

        <rect x="5" y="5" width="62" height="62" rx="18" fill={`url(#${gradientId})`} />

        <path d="M20.8 21.8h7.8v27.6h-7.8V21.8Z" fill="white" />
        <path
          d="M47.4 50.5c-8.9 0-15.7-6.4-15.7-14.9s6.8-14.9 15.7-14.9c4.5 0 8.3 1.5 11.1 4.4l-5 5.4c-1.6-1.6-3.4-2.4-5.6-2.4-4.2 0-7.3 3.1-7.3 7.5s3.1 7.5 7.3 7.5c2.2 0 4-.8 5.6-2.4l5 5.4c-2.8 2.9-6.6 4.4-11.1 4.4Z"
          fill="white"
        />
      </svg>

      {showText && (
        <span className="brand-logo-text">
          <span className="brand-logo-name">IC Platform</span>
        </span>
      )}
    </div>
  );
}