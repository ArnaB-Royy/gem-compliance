import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GemLogo from '../components/GemLogo';

export default function LoginPage() {
  return (
    <div className="w-screen h-screen flex items-center justify-center relative overflow-hidden bg-[#030612] px-6">
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none opacity-20 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, #00E5FF 0%, #2D6BE4 50%, transparent 70%)',
        }}
      />

      {/* Return home link / brand */}
      <div className="fixed top-6 left-8 z-50">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono-code font-bold tracking-wider text-slate-300 hover:text-white px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          BACK TO PRESENTATION
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -20 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10 rounded-3xl p-8"
        style={{
          background: 'rgba(8, 14, 32, 0.85)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(0, 229, 255, 0.15)',
        }}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-4">
            <GemLogo height={132} />
          </div>
          <h2 className="text-2xl font-black text-white font-display tracking-tight">Officer Portal Login</h2>
          <p className="text-xs font-mono-code text-[#00E5FF] mt-1 font-semibold tracking-wider uppercase">
            Ministry of Petroleum &amp; Natural Gas · CPCL
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300 mb-2">
              Official Email / Government ID
            </label>
            <input
              type="text"
              placeholder="officer@cpcl.gov.in"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all font-mono-code text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300 mb-2">
              Security Key / Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all font-mono-code text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-200 mt-2 hover:brightness-110 active:scale-[0.98] shadow-[0_0_25px_rgba(45,107,228,0.5)] font-display cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #00E5FF 0%, #2D6BE4 100%)',
            }}
          >
            Authenticate via Parichay / SSO
          </button>
        </form>
      </motion.div>
    </div>
  );
}
