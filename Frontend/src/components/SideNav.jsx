import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  { id: 0, label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 1, label: 'The Problem', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { id: 2, label: 'Features', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { id: 3, label: 'How It Works', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 4, label: 'Results', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 5, label: 'Get Started', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
];

export default function SideNav({ activeIndex, onSelectSection }) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <aside
      aria-label="Navigation"
      className="fixed left-6 top-1/2 -translate-y-1/2 z-50 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={{
          width: isHovered ? 210 : 54,
        }}
        transition={{
          type: 'spring',
          stiffness: 340,
          damping: 28,
        }}
        className="relative flex flex-col items-start gap-2 py-4 px-2 overflow-hidden rounded-[24px] shadow-2xl backdrop-blur-2xl"
        style={{
          background: 'rgba(8, 14, 30, 0.75)',
          border: '1px solid rgba(45, 107, 228, 0.35)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 25px rgba(45, 107, 228, 0.2)',
        }}
      >
        {/* Navigation Dots / Items */}
        <div className="flex flex-col gap-1 w-full">
          {SECTIONS.map((sec) => {
            const isActive = activeIndex === sec.id;

            return (
              <button
                key={sec.id}
                onClick={() => onSelectSection(sec.id)}
                className={`relative flex items-center w-full h-[40px] px-2 rounded-xl transition-all duration-200 cursor-pointer group text-left ${
                  isActive
                    ? 'bg-[#030712] text-white shadow-inner border border-blue-500/40'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.06]'
                }`}
                style={{
                  background: isActive ? '#020617' : undefined,
                }}
              >
                {/* Active Indicator Glow / Dot */}
                <div className="w-[24px] flex items-center justify-center flex-shrink-0">
                  {isActive ? (
                    <motion.div
                      layoutId="activeDotPill"
                      className="w-[10px] h-[10px] rounded-full bg-[#2D6BE4]"
                      style={{
                        boxShadow: '0 0 12px #2D6BE4, 0 0 20px rgba(0, 194, 255, 0.8)',
                      }}
                    />
                  ) : (
                    <div className="w-[8px] h-[8px] rounded-full border-[1.5px] border-[#64748B] group-hover:border-[#2D6BE4] transition-colors" />
                  )}
                </div>

                {/* Section Title when expanded */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="ml-2 text-[13px] font-semibold tracking-wide whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      {sec.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        {/* Separator Line */}
        <div className="w-full h-[1px] bg-white/[0.08] my-1" />

        {/* Login Button in Sidebar */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center w-full h-[40px] px-2 rounded-xl text-white font-semibold transition-all duration-200 cursor-pointer overflow-hidden group"
          style={{
            background: isHovered
              ? 'linear-gradient(135deg, #2D6BE4, #1E40AF)'
              : 'rgba(45, 107, 228, 0.2)',
            border: '1px solid rgba(45, 107, 228, 0.4)',
            boxShadow: isHovered ? '0 0 20px rgba(45, 107, 228, 0.5)' : 'none',
          }}
        >
          <div className="w-[24px] flex items-center justify-center flex-shrink-0 text-white">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>

          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="ml-2 text-[13px] font-bold tracking-wide whitespace-nowrap"
              >
                Officer Login
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.div>
    </aside>
  );
}
