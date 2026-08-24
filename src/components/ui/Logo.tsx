import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showSubtitle?: boolean
  className?: string
}

export function Logo({ size = 'md', showSubtitle = true, className = '' }: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  }

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Dynamic Emblem with Radiant Glow */}
      <div className="relative group flex items-center justify-center shrink-0">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition duration-300" />
        <div
          className={`${iconSizes[size]} relative rounded-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border border-pink-500/30 flex items-center justify-center shadow-lg overflow-hidden`}
        >
          {/* Custom SVG Icon combining Avatar Profile + Pop Sparkle */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-white transform group-hover:scale-110 transition-transform duration-300"
          >
            <defs>
              <linearGradient id="popGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ec4899" />
                <stop offset="0.5" stopColor="#a855f7" />
                <stop offset="1" stopColor="#6366f1" />
              </linearGradient>
            </defs>

            {/* Circular Profile Ring */}
            <circle cx="16" cy="16" r="13.5" stroke="url(#popGrad)" strokeWidth="2.5" strokeDasharray="3 2" />

            {/* Avatar Head */}
            <circle cx="16" cy="11.5" r="4" fill="url(#popGrad)" />

            {/* Avatar Body / Shoulder Arc */}
            <path
              d="M8.5 24C8.5 19.8579 11.8579 16.5 16 16.5C20.1421 16.5 23.5 19.8579 23.5 24"
              stroke="url(#popGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Pop Sparkle Star */}
            <path
              d="M24 5L24.8 7.2L27 8L24.8 8.8L24 11L23.2 8.8L21 8L23.2 7.2L24 5Z"
              fill="#f43f5e"
            />
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className={`font-black tracking-tight leading-none ${textSizes[size]} text-white flex items-center`}>
          <span>Perfil</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-fuchsia-400 to-indigo-400 font-extrabold ml-0.5">
            Pop
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 ml-0.5 animate-pulse" />
        </div>
        {showSubtitle && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
            Avatares & Campanhas
          </span>
        )}
      </div>
    </div>
  )
}
