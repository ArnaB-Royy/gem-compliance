import React from 'react';
import { motion } from 'framer-motion';

/**
 * DotNav Component
 * Provides vertical floating glass navigation with smooth scrolling and reactive active state
 * Strict theme colors:
 * Background: rgba(255,255,255,0.05) + backdrop blur
 * Border: rgba(45,107,228,0.3)
 * Primary Accent: #2D6BE4
 * Secondary / Text: #A8B8D8
 */
export default function DotNav({ activeIndex, onDotClick, total = 6 }) {
  const dots = Array.from({ length: total }, (_, i) => i);

  return (
    <nav
      aria-label="Section navigation"
      className="fixed left-6 top-1/2 -translate-y-1/2 z-50 pointer-events-auto"
    >
      <div
        className="flex flex-col items-center gap-[12px] relative"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(45, 107, 228, 0.3)',
          borderRadius: '24px',
          padding: '16px 10px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Subtle connecting vertical line */}
        <div
          className="absolute top-4 bottom-4 w-[1px] -z-0 pointer-events-none"
          style={{ background: 'rgba(45, 107, 228, 0.25)' }}
        />

        {dots.map((index) => {
          const isActive = activeIndex === index;

          return (
            <button
              key={index}
              onClick={() => onDotClick(index)}
              aria-label={`Navigate to section ${index + 1}`}
              aria-current={isActive ? 'step' : undefined}
              className="relative flex items-center justify-center p-1 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6BE4] transition-all group z-10"
            >
              {isActive ? (
                <motion.div
                  layoutId="activeDot"
                  initial={false}
                  animate={{
                    scale: 1.3,
                    boxShadow: '0 0 12px #2D6BE4, 0 0 20px rgba(45,107,228,0.6)',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 25,
                  }}
                  className="rounded-full bg-[#2D6BE4]"
                  style={{ width: '10px', height: '10px' }}
                />
              ) : (
                <motion.div
                  whileHover={{
                    scale: 1.2,
                    borderColor: '#2D6BE4',
                  }}
                  transition={{ duration: 0.2 }}
                  className="rounded-full bg-transparent transition-colors duration-200"
                  style={{
                    width: '8px',
                    height: '8px',
                    border: '1.5px solid #A8B8D8',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
