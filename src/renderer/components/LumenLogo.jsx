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
        <linearGradient id="lumen-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.55)" />
        </linearGradient>
        <linearGradient id="lumen-grad-left" x1="0%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.60)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.90)" />
        </linearGradient>
        <linearGradient id="lumen-grad-right" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.90)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.55)" />
        </linearGradient>
        <linearGradient id="lumen-grad-bottom" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.85)" />
        </linearGradient>
      </defs>

      {/* Left arm */}
      <path
        d="M32 8 C28 6, 22 10, 18 20 L8 70 C4 88, 16 108, 32 118 Q48 128, 60 128"
        stroke="url(#lumen-grad-left)"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />

      {/* Right arm */}
      <path
        d="M88 8 C92 6, 98 10, 102 20 L112 70 C116 88, 104 108, 88 118 Q72 128, 60 128"
        stroke="url(#lumen-grad-right)"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />

      {/* Bottom curve */}
      <path
        d="M8 70 C4 95, 25 128, 60 128 C95 128, 116 95, 112 70"
        stroke="url(#lumen-grad-bottom)"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />

      {/* Center dot */}
      <circle cx="60" cy="72" r="6" fill="rgba(255,255,255,0.80)" />
    </svg>
  );
}
