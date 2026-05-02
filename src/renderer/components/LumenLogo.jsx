import React from 'react';

/**
 * LumenLogo — faithful recreation of the original U+dot mark.
 * Renders in white strokes on dark backgrounds (sidebar).
 * The shadow layer recreates the depth/overlay effect of the original.
 */
export default function LumenLogo({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="lu-main" x1="10" y1="0" x2="90" y2="116" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.97)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.70)" />
        </linearGradient>
        <linearGradient id="lu-shadow" x1="0" y1="20" x2="55" y2="116" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.38)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.52)" />
        </linearGradient>
      </defs>

      {/* Shadow — left arm depth layer, slightly offset */}
      <path
        d="M24 7
           C20 5 11 11 10 26
           L10 78
           C10 96 28 110 50 112"
        stroke="url(#lu-shadow)"
        strokeWidth="23"
        strokeLinecap="round"
        fill="none"
      />

      {/* Main U shape — left arm + bottom arc + right arm */}
      <path
        d="M24 7
           C20 5 11 11 10 26
           L10 78
           C10 97 29 112 50 112
           C71 112 90 97 90 78
           L90 26
           C89 11 80 5 76 7"
        stroke="url(#lu-main)"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Center dot */}
      <circle cx="50" cy="68" r="7.5" fill="rgba(255,255,255,0.88)" />
    </svg>
  );
}
