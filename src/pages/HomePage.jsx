import React, { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

const SLIDE_THEMES = [
  { glow: 'rgba(0,229,255,0.25)' },
  { glow: 'rgba(244,63,94,0.25)' },
  { glow: 'rgba(52,211,153,0.25)' },
  { glow: 'rgba(168,85,247,0.25)' },
  { glow: 'rgba(251,191,36,0.25)' },
  { glow: 'rgba(99,102,241,0.25)' },
];

function FullscreenSlide({ id, children, slideNum, onSlideInView }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.5, once: false });

  useEffect(() => {
    if (isInView && onSlideInView) {
      onSlideInView(slideNum - 1);
    }
  }, [isInView, slideNum, onSlideInView]);

  const theme = SLIDE_THEMES[slideNum - 1] || SLIDE_THEMES[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section
      id={id}
      ref={ref}
      data-slide-index={slideNum - 1}
      className="w-screen h-screen flex-shrink-0 relative overflow-hidden flex items-center justify-end"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Background image with zoom+fade */}
      <motion.img
        src="/assets/slide1.jpg"
        alt="CPCL Refinery Complex"
        className="absolute inset-0 w-full h-full object-cover object-[center_left] select-none pointer-events-none"
        loading="eager"
        initial={{ opacity: 0, scale: 1.08 }}
        animate={
          isInView
            ? { opacity: 1, scale: 1, transition: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] } }
            : { opacity: 0, scale: 1.08, transition: { duration: 0.6, ease: 'easeIn' } }
        }
      />

      {/* Ambient glow per slide */}
      <motion.div
        className="absolute top-1/2 right-1/3 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none blur-[120px] z-0"
        initial={{ opacity: 0 }}
        animate={
          isInView
            ? { opacity: 0.3, transition: { duration: 1.0, delay: 0.2 } }
            : { opacity: 0, transition: { duration: 0.4 } }
        }
        style={{ background: theme.glow }}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to right, rgba(3,6,18,0.15) 0%, rgba(3,6,18,0.5) 40%, rgba(3,6,18,0.92) 62%, #030612 100%)',
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#030612]/80 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#030612]/90 to-transparent pointer-events-none z-10" />

      {/* Content */}
      <div className="relative z-20 w-full max-w-2xl px-8 lg:px-16 mr-16 lg:mr-24 py-12 flex flex-col justify-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="flex flex-col gap-6"
        >
          {React.Children.map(children, (child) =>
            child ? <motion.div variants={itemVariants}>{child}</motion.div> : null
          )}
        </motion.div>
      </div>

      {/* Slide watermark */}
      <motion.div
        className="absolute bottom-8 left-12 z-20 pointer-events-none flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="text-3xl font-display font-black text-white/20">0{slideNum}</span>
        <div className="w-12 h-[1px] bg-white/20" />
        <span className="text-xs font-mono-code font-bold tracking-widest text-white/40 uppercase">
          GeM Compliance
        </span>
      </motion.div>
    </section>
  );
}

export default function HomePage({ containerRef, onNavigateToLogin, onSlideInView }) {
  return (
    <main
      ref={containerRef}
      className="w-screen h-screen overflow-y-scroll overflow-x-hidden no-scrollbar bg-[#030612]"
      style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}
    >
      {/* SLIDE 1 — CYAN */}
      <FullscreenSlide id="section-0" slideNum={1} onSlideInView={onSlideInView}>
        <div className="inline-flex items-center gap-2 border border-cyan-400/40 bg-cyan-950/40 backdrop-blur-xl rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase text-[#00E5FF] w-fit shadow-[0_0_15px_rgba(0,229,255,0.3)]">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
          CPCL · Ministry of Petroleum &amp; Natural Gas
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight font-display drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          AI-Powered Bid <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] via-[#38BDF8] to-[#2D6BE4]">
            Compliance
          </span>{' '}
          Verification
        </h1>

        <p className="text-lg lg:text-xl text-slate-200 leading-relaxed font-normal drop-shadow-md max-w-xl">
          Automated document parsing, cross-checking bid parameters, and real-time risk classification for GeM procurement tenders.
        </p>

        <div className="pt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="cursor-pointer font-bold text-white text-base px-8 py-3.5 rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_30px_rgba(45,107,228,0.6)] hover:brightness-110 flex items-center gap-2.5"
            style={{
              background: 'linear-gradient(135deg, #2D6BE4 0%, #0052CC 100%)',
              border: '1px solid rgba(0, 229, 255, 0.4)',
            }}
          >
            <span>Login to Get Started</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </FullscreenSlide>

      {/* SLIDE 2 — ROSE */}
      <FullscreenSlide id="section-1" slideNum={2} onSlideInView={onSlideInView}>
        <div className="inline-flex items-center gap-2 border border-rose-400/40 bg-rose-950/40 backdrop-blur-xl rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase text-rose-400 w-fit shadow-[0_0_15px_rgba(244,63,94,0.3)]">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          TENDER BOTTLENECK
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight font-display">
          Manual Verification is <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">
            Slow &amp; Inconsistent
          </span>
        </h2>

        <div className="flex flex-col gap-3.5 mt-1">
          {[
            {
              title: 'Weeks of Manual Document Audits',
              desc: 'Officers spend dozens of hours manually verifying balance sheets, GST certificates, and technical specs.',
            },
            {
              title: 'High Risk of Human Oversight',
              desc: 'Overlooked tender qualification caveats and subtle discrepancies lead to contested bid awards.',
            },
            {
              title: 'Zero Automated Audit Trail',
              desc: 'Lack of immutable scoring logs makes CVC audit compliance time-consuming and cumbersome.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 rounded-2xl border border-rose-500/25 bg-[#0A0E24]/85 backdrop-blur-xl shadow-xl hover:border-rose-400 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center flex-shrink-0 text-rose-400 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">{item.title}</h3>
                <p className="text-sm text-slate-300 mt-0.5 leading-relaxed font-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </FullscreenSlide>

      {/* SLIDE 3 — EMERALD */}
      <FullscreenSlide id="section-2" slideNum={3} onSlideInView={onSlideInView}>
        <div className="inline-flex items-center gap-2 border border-emerald-400/40 bg-emerald-950/40 backdrop-blur-xl rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase text-emerald-400 w-fit shadow-[0_0_15px_rgba(52,211,153,0.3)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          CAPABILITIES
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight font-display">
          Intelligent Document Suite
        </h2>

        <div className="flex flex-col gap-3.5 mt-1">
          {[
            {
              title: 'Multi-Modal OCR Verification',
              desc: 'AI reads PDFs, scans, and financial tables, instantly validating signatures and statutory dates.',
              icon: <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
            },
            {
              title: '0–100 Compliance Scorecard',
              desc: 'Quantitative algorithm benchmarks each submission against CPCL tender mandates with risk categorizations.',
              icon: <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
            },
            {
              title: 'Natural Language Decision Support',
              desc: 'Plain-English summary reports highlighting qualification red-flags to assist tender evaluating committees.',
              icon: <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
            },
          ].map((card, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 rounded-2xl border border-emerald-500/25 bg-[#090F24]/85 backdrop-blur-xl hover:border-emerald-400 transition-colors shadow-xl"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center flex-shrink-0 mt-0.5">
                {card.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">{card.title}</h3>
                <p className="text-sm text-slate-300 mt-0.5 leading-relaxed font-normal">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </FullscreenSlide>

      {/* SLIDE 4 — PURPLE */}
      <FullscreenSlide id="section-3" slideNum={4} onSlideInView={onSlideInView}>
        <div className="inline-flex items-center gap-2 border border-purple-400/40 bg-purple-950/40 backdrop-blur-xl rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase text-purple-400 w-fit shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          PROTOCOL
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight font-display">
          Three Simple Steps
        </h2>

        <div className="flex flex-col gap-3.5 mt-1">
          {[
            { step: '01', title: 'Upload Tender Dossier', desc: 'Vendor uploads all statutory proofs, certificates, and technical qualification forms via GeM.' },
            { step: '02', title: 'Neural Cross-Verification', desc: 'Platform cross-references criteria, audits blacklists, and evaluates financial ratios in seconds.' },
            { step: '03', title: 'Officer Verdict & Audit Stamp', desc: 'Procurement officer reviews itemized confidence scores and approves with tamper-proof audit trace.' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 rounded-2xl border border-purple-500/25 bg-[#080B1E]/85 backdrop-blur-xl shadow-lg hover:border-purple-400 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-mono-code font-black text-sm text-white flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                  boxShadow: '0 0 15px rgba(168,85,247,0.4)',
                }}
              >
                {item.step}
              </div>
              <div>
                <div className="text-base font-bold text-white font-display">{item.title}</div>
                <div className="text-sm text-slate-300 mt-0.5 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </FullscreenSlide>

      {/* SLIDE 5 — AMBER */}
      <FullscreenSlide id="section-4" slideNum={5} onSlideInView={onSlideInView}>
        <div className="inline-flex items-center gap-2 border border-amber-400/40 bg-amber-950/40 backdrop-blur-xl rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase text-amber-400 w-fit shadow-[0_0_15px_rgba(251,191,36,0.3)]">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          IMPACT METRICS
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight font-display">
          Proven Transformation
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          {[
            { value: '60%', label: 'Turnaround Reduction', sub: 'Audits done in minutes, not weeks' },
            { value: '80%', label: 'Less Manual Effort', sub: 'Freeing officers for core operations' },
            { value: '100%', label: 'Transparent Audit Trail', sub: 'Fully compliant with CVC standards' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="flex flex-col p-5 rounded-2xl border border-amber-500/25 bg-[#0E0C1C]/90 backdrop-blur-xl shadow-xl"
            >
              <span
                className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight font-display leading-none whitespace-nowrap"
                style={{ textShadow: '0 0 25px rgba(251,191,36,0.4)' }}
              >
                {stat.value}
              </span>
              <span className="text-sm font-bold text-white mt-3 font-display leading-snug">{stat.label}</span>
              <span className="text-xs text-slate-400 mt-1 leading-normal">{stat.sub}</span>
            </div>
          ))}
        </div>
      </FullscreenSlide>

      {/* SLIDE 6 — INDIGO */}
      <FullscreenSlide id="section-5" slideNum={6} onSlideInView={onSlideInView}>
        <div className="inline-flex items-center gap-2 border border-indigo-400/40 bg-indigo-950/40 backdrop-blur-xl rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase text-indigo-400 w-fit shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          DEPLOYMENT READY
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight font-display">
          Ready to Modernize GeM Procurement?
        </h2>

        <p className="text-lg text-slate-200 leading-relaxed max-w-xl">
          Connect your ministry authentication to start processing tender compliance dossiers with automated audit compliance.
        </p>

        <div className="pt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="cursor-pointer font-bold text-white text-lg px-9 py-4 rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_35px_rgba(99,102,241,0.5)] hover:brightness-110 flex items-center justify-center gap-3"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)' }}
          >
            <span>Login &amp; Get Started</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </FullscreenSlide>
    </main>
  );
}