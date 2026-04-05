import React from 'react';

export default function LumenLogo({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Main gradient: deep purple to lighter purple */}
        <linearGradient id="lumen-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9B5BFF" />
          <stop offset="40%" stopColor="#7E3FF2" />
          <stop offset="100%" stopColor="#6929D0" />
        </linearGradient>
        {/* Left arm gradient: lighter/lavender tones */}
        <linearGradient id="lumen-grad-left" x1="0%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#B88EFF" />
          <stop offset="50%" stopColor="#9B6BF7" />
          <stop offset="100%" stopColor="#7E3FF2" />
        </linearGradient>
        {/* Right arm gradient */}
        <linearGradient id="lumen-grad-right" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7E3FF2" />
          <stop offset="60%" stopColor="#6929D0" />
          <stop offset="100%" stopColor="#8B55F0" />
        </linearGradient>
        {/* Bottom curve gradient: lighter purple sweep */}
        <linearGradient id="lumen-grad-bottom" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#B088F9" />
          <stop offset="50%" stopColor="#9B6BF7" />
          <stop offset="100%" stopColor="#7E3FF2" />
        </linearGradient>
      </defs>

      {/* Left arm of the U - tapers to a point at top */}
      <path
        d="M32 8 C28 6, 22 10, 18 20 L8 70 C4 88, 16 108, 32 118 Q48 128, 60 128"
        stroke="url(#lumen-grad-left)"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />

      {/* Right arm of the U - tapers to a point at top */}
      <path
        d="M88 8 C92 6, 98 10, 102 20 L112 70 C116 88, 104 108, 88 118 Q72 128, 60 128"
        stroke="url(#lumen-grad-right)"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />

      {/* Bottom connecting curve for smooth blend */}
      <path
        d="M8 70 C4 95, 25 128, 60 128 C95 128, 116 95, 112 70"
        stroke="url(#lumen-grad-bottom)"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />

      {/* Center dot */}
      <circle cx="60" cy="72" r="8" fill="#7E3FF2" />
    </svg>
  );
}
