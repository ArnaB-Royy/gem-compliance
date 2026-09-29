import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  { id: 0, label: 'OVERVIEW', tag: '01' },
  { id: 1, label: 'THE PROBLEM', tag: '02' },
  { id: 2, label: 'KEY FEATURES', tag: '03' },
  { id: 3, label: 'HOW IT WORKS', tag: '04' },
  { id: 4, label: 'IMPACT & STATS', tag: '05' },
  { id: 5, label: 'GET STARTED', tag: '06' },
];

const SLIDE_COLORS = [
  { color: '#00E5FF', glow: 'rgba(0,229,255,0.8)',   gradient: 'linear-gradient(to bottom, #00E5FF, #2D6BE4)' },
  { color: '#F43F5E', glow: 'rgba(244,63,94,0.8)',   gradient: 'linear-gradient(to bottom, #F43F5E, #FB923C)' },
  { color: '#34D399', glow: 'rgba(52,211,153,0.8)',  gradient: 'linear-gradient(to bottom, #34D399, #059669)' },
  { color: '#A855F7', glow: 'rgba(168,85,247,0.8)',  gradient: 'linear-gradient(to bottom, #A855F7, #6366F1)' },
  { color: '#FBBF24', glow: 'rgba(251,191,36,0.8)',  gradient: 'linear-gradient(to bottom, #FBBF24, #F97316)' },
  { color: '#6366F1', glow: 'rgba(99,102,241,0.8)',  gradient: 'linear-gradient(to bottom, #6366F1, #2563EB)' },
];

export default function AppleSideNav({ activeIndex, onSelectSection }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handlePrev = (e) => {
    e.stopPropagation();
    if (activeIndex > 0) onSelectSection(activeIndex - 1);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (activeIndex < SLIDES.length - 1) onSelectSection(activeIndex + 1);
  };

  return (
    <nav
      aria-label="Slide navigation"
      className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex items-center select-none"
    >
      {/* Compact Frosted Glass Capsule */}
      <div
        className="flex flex-col items-center gap-3 p-2 rounded-full backdrop-blur-2xl"
        style={{
          background: 'rgba(5, 9, 24, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 12px 36px 0 rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Up arrow */}
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label="Previous Slide"
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer mb-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Dots */}
        {SLIDES.map((slide) => {
          const isActive = activeIndex === slide.id;
          const isHovered = hoveredIndex === slide.id;
          const theme = SLIDE_COLORS[slide.id];

          return (
            <button
              key={slide.id}
              onClick={() => onSelectSection(slide.id)}
              onMouseEnter={() => setHoveredIndex(slide.id)}
              onMouseLeave={() => setHoveredIndex(null)}
              aria-label={`Jump to ${slide.label}`}
              className="group relative flex items-center justify-center w-6 h-6 rounded-full cursor-pointer focus:outline-none"
            >
              {/* Per-dot tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: 8, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-10 flex items-center pointer-events-none"
                  >
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-2xl border shadow-[0_10px_25px_rgba(0,0,0,0.8)] whitespace-nowrap"
                      style={{ borderColor: `${theme.color}40` }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: theme.color,
                          boxShadow: `0 0 8px ${theme.color}`,
                        }}
                      />
                      <span className="text-[11px] font-mono-code font-bold tracking-widest uppercase text-white">
                        {slide.label}
                      </span>
                      <span className="text-[9px] font-mono-code text-slate-400 font-semibold">
                        [{slide.tag}]
                      </span>
                    </div>
                    {/* Arrow pointing right toward dot */}
                    <div
                      className="w-2 h-2 rotate-45 -ml-1 border-r border-t"
                      style={{
                        background: 'rgba(0,0,0,0.8)',
                        borderColor: `${theme.color}40`,
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dot / Active pill — no layoutId, uses fade+scale instead */}
              <AnimatePresence mode="wait">
                {isActive ? (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, scaleY: 0.5 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0.5 }}
                    className="w-2.5 h-5 rounded-full"
                    style={{
                      background: theme.gradient,
                      boxShadow: `0 0 12px ${theme.glow}`,
                    }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  />
                ) : (
                  <motion.div
                    key="inactive"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-white group-hover:scale-150 transition-all duration-200"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </AnimatePresence>
            </button>
          );
        })}

        {/* Down arrow */}
        <button
          onClick={handleNext}
          disabled={activeIndex === SLIDES.length - 1}
          aria-label="Next Slide"
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer mt-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </nav>
  );
}