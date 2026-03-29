import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-10", showText = false }) => {
  return (
    <div className={`flex items-center justify-start ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto overflow-visible"
      >
        <defs>
          <linearGradient id="audioFeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
          <filter id="audioFeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Circular Frame */}
        <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="4" opacity="0.2" />
        <circle cx="50" cy="50" r="35" stroke="url(#audioFeGradient)" strokeWidth="2" filter="url(#audioFeGlow)" />

        {/* Headphones Icon */}
        <path 
          d="M30 55V45C30 33.9543 38.9543 25 50 25C61.0457 25 70 33.9543 70 45V55" 
          stroke="white" 
          strokeWidth="4" 
          strokeLinecap="round" 
        />
        <rect x="25" y="50" width="10" height="15" rx="4" fill="url(#audioFeGradient)" />
        <rect x="65" y="50" width="10" height="15" rx="4" fill="url(#audioFeGradient)" />

        {/* FE Text */}
        <text 
          x="50" 
          y="55" 
          textAnchor="middle" 
          fill="white" 
          fontSize="20" 
          fontWeight="900" 
          fontFamily="sans-serif"
          className="italic"
        >
          FE
        </text>

        {/* Waveform */}
        <path 
          d="M35 50L42 45L48 55L52 45L58 55L65 50" 
          stroke="#06B6D4" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    </div>
  );
};
