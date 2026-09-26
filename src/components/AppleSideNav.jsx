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

/**
 * Apple / ROG Astral style compact frosted vertical scroll indicator:
 * - Positioned on the right side
 * - Text badge displaying the current slide name ONLY appears when hovered over with the mouse
 * - Active dot indicator changes dynamically in real-time as the user scrolls
 */
export default function AppleSideNav({ activeIndex, onSelectSection }) {
  const [isHovered, setIsHovered] = useState(false);

  const activeSlide = SLIDES[activeIndex] || SLIDES[0];

  const handlePrev = (e) => {
    e.stopPropagation();
    if (activeIndex > 0) {
      onSelectSection(activeIndex - 1);
    } else {
      onSelectSection(0);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (activeIndex < SLIDES.length - 1) {
      onSelectSection(activeIndex + 1);
    }
  };

  return (
    <nav
      aria-label="Slide navigation"
      className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex items-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Current Active Label Badge - ONLY visible when hovered over with mouse */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 12, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mr-3 flex items-center pointer-events-none"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-2xl border border-white/15 shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
              <span className="text-[11px] font-mono-code font-bold tracking-widest uppercase text-white whitespace-nowrap">
                {activeSlide.label}
              </span>
              <span className="text-[9px] font-mono-code text-slate-400 font-semibold">
                [{activeSlide.tag}]
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Frosted Glass Capsule Column */}
      <div
        className="flex flex-col items-center gap-3 p-2 rounded-full backdrop-blur-2xl"
        style={{
          background: 'rgba(5, 9, 24, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 12px 36px 0 rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Up arrow scroll button */}
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

        {/* The 6 Dots */}
        {SLIDES.map((slide) => {
          const isActive = activeIndex === slide.id;

          return (
            <button
              key={slide.id}
              onClick={() => onSelectSection(slide.id)}
              aria-label={`Jump to slide ${slide.tag}`}
              className="group relative flex items-center justify-center w-6 h-6 rounded-full cursor-pointer focus:outline-none"
            >
              {isActive ? (
                <motion.div
                  layoutId="activeSlideIndicator"
                  className="w-2.5 h-5 rounded-full bg-gradient-to-b from-[#00E5FF] to-[#2D6BE4] shadow-[0_0_12px_#00E5FF]"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-white group-hover:scale-150 transition-all duration-200" />
              )}
            </button>
          );
        })}

        {/* Down arrow scroll button */}
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
