import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GemLogo from '../components/GemLogo';

const PORTAL_DATA = {
  vendor: {
    name:     'Rajesh Kumar',
    email:    'vendor@cpcl.gov.in',
    password: 'vendor123',
  },
  officer: {
    name:     'Priya Sharma',
    email:    'officer@cpcl.gov.in',
    password: 'officer123',
  },
};

export default function LoginPage() {
  const [selected, setSelected] = useState(null);
  const [mode, setMode]         = useState('login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [hovered, setHovered]   = useState(null);
  const [filling, setFilling]   = useState(false);
  const [activeField, setActiveField] = useState(null); // which field is currently typing
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  const isVendor  = selected === 'vendor';
  const isOfficer = selected === 'officer';
  const accent    = isOfficer ? '#A855F7' : '#00E5FF';
  const accentRGB = isOfficer ? '168,85,247' : '0,229,255';

  // Clear all intervals on unmount
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // Typing helper — types one string into a setter, then calls onDone
  const typeString = (str, setter, speed, onDone, fieldName) => {
    let i = 0;
    setter('');
    setActiveField(fieldName);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      i++;
      setter(str.slice(0, i));
      if (i >= str.length) {
        clearInterval(intervalRef.current);
        if (onDone) setTimeout(onDone, 120);
      }
    }, speed);
  };

  // Chain: name → email → password → confirm (register) or email → password (login)
  const startFill = (type, currentMode) => {
    const data = PORTAL_DATA[type];
    clearInterval(intervalRef.current);
    setFilling(true);
    setName('');
    setEmail('');
    setPassword('');
    setConfirm('');

    if (currentMode === 'register') {
      typeString(data.name, setName, 38, () =>
        typeString(data.email, setEmail, 35, () =>
          typeString(data.password, setPassword, 45, () =>
            typeString(data.password, setConfirm, 45, () => {
              setActiveField(null);
              setFilling(false);
            }, 'confirm')
          , 'password')
        , 'email')
      , 'name');
    } else {
      typeString(data.email, setEmail, 35, () =>
        typeString(data.password, setPassword, 45, () => {
          setActiveField(null);
          setFilling(false);
        }, 'password')
      , 'email');
    }
  };

  const handleSelect = (type) => {
    setSelected(type);
    startFill(type, mode);
  };

  const handleModeSwitch = (m) => {
    setMode(m);
    setName('');
    setEmail('');
    setPassword('');
    setConfirm('');
    setActiveField(null);
    setFilling(false);
    clearInterval(intervalRef.current);
    // if a portal already selected, re-fill for new mode
    if (selected) {
      setTimeout(() => startFill(selected, m), 100);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selected || filling) return;
    navigate(`/${selected}/dashboard`);
  };

  const portals = [
    {
      type:  'vendor',
      label: 'Vendor Portal',
      sub:   'Suppliers & Contractors',
      accent: '#00E5FF',
      rgb:   '0,229,255',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      type:  'officer',
      label: 'Officer Portal',
      sub:   'Procurement Officers',
      accent: '#A855F7',
      rgb:   '168,85,247',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  const outerBorderColor = isOfficer
    ? 'rgba(168,85,247,0.6)'
    : isVendor
    ? 'rgba(0,229,255,0.6)'
    : 'rgba(99,102,241,0.4)';

  const outerGlow = isOfficer
    ? '0 0 50px rgba(168,85,247,0.25), 0 0 100px rgba(168,85,247,0.12)'
    : isVendor
    ? '0 0 50px rgba(0,229,255,0.25), 0 0 100px rgba(0,229,255,0.12)'
    : '0 0 50px rgba(99,102,241,0.15), 0 0 100px rgba(99,102,241,0.07)';

  // Blinking cursor shown inside a field while it's actively typing
  const Cursor = ({ field }) =>
    activeField === field ? (
      <motion.div
        animate={{ opacity: [1, 0, 1] }}
        transition={{ repeat: Infinity, duration: 0.65 }}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full pointer-events-none"
        style={{ background: accent }}
      />
    ) : null;

  const inputClass =
    'w-full px-4 py-3 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none bg-white/[0.04] border border-white/[0.08] transition-all';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="w-screen h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#030612]"
    >
      {/* Ambient glow */}
      <motion.div
        animate={{
          background: isOfficer
            ? 'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.13) 0%, transparent 65%)'
            : isVendor
            ? 'radial-gradient(ellipse at 50% 50%, rgba(0,229,255,0.11) 0%, transparent 65%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 65%)',
        }}
        transition={{ duration: 0.7 }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Back */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="fixed top-5 left-6 z-50"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-slate-300 hover:text-white px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
      </motion.div>

      {/* ── OUTER BOX ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px] mx-4 rounded-3xl p-6"
        style={{
          background: 'linear-gradient(160deg, #0B1120 0%, #080D1A 60%, #060A15 100%)',
          border: `1.5px solid ${outerBorderColor}`,
          boxShadow: `${outerGlow}, 0 32px 64px rgba(0,0,0,0.8)`,
          transition: 'border 0.5s ease, box-shadow 0.5s ease',
        }}
      >
        {/* Corner dots */}
        {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
          <motion.div
            key={i}
            animate={{ background: selected ? accent : '#6366F1', opacity: 0.8 }}
            transition={{ duration: 0.5 }}
            className={`absolute ${pos} w-1.5 h-1.5 rounded-full`}
          />
        ))}

        {/* Logo */}
        <div className="flex flex-col items-center mb-5">
          <GemLogo height={52} />
          <motion.p
            animate={{ color: selected ? accent : '#6366F1' }}
            transition={{ duration: 0.5 }}
            className="text-[10px] font-mono font-bold tracking-[0.18em] mt-2 uppercase"
          >
            Ministry of Petroleum &amp; Natural Gas · CPCL
          </motion.p>
        </div>

        {/* ── PORTAL CARDS ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {portals.map(({ type, label, sub, accent: ac, rgb, icon }) => {
            const active  = selected === type;
            const isHover = hovered === type;
            return (
              <motion.button
                key={type}
                type="button"
                onClick={() => handleSelect(type)}
                onHoverStart={() => setHovered(type)}
                onHoverEnd={() => setHovered(null)}
                animate={{
                  y:          isHover ? -6 : 0,
                  scale:      isHover ? 1.03 : 1,
                  boxShadow:  isHover || active
                    ? `0 0 40px rgba(${rgb},0.45), inset 0 1px 0 rgba(${rgb},0.25), 0 12px 32px rgba(0,0,0,0.5)`
                    : `inset 0 1px 0 rgba(${rgb},0.08), 0 4px 12px rgba(0,0,0,0.3)`,
                  borderColor: active ? ac : isHover ? `rgba(${rgb},0.7)` : `rgba(${rgb},0.3)`,
                  background:  active
                    ? `linear-gradient(145deg, rgba(${rgb},0.18) 0%, rgba(${rgb},0.06) 100%)`
                    : isHover
                    ? `linear-gradient(145deg, rgba(${rgb},0.12) 0%, rgba(${rgb},0.03) 100%)`
                    : 'rgba(255,255,255,0.025)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="relative flex flex-col items-center gap-2 py-5 px-3 rounded-2xl cursor-pointer overflow-hidden border-[1.5px]"
                style={{ borderColor: `rgba(${rgb},0.3)` }}
              >
                <motion.div
                  animate={{ opacity: active ? 1 : isHover ? 0.7 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 0%, rgba(${rgb},0.2) 0%, transparent 70%)` }}
                />

                <motion.div
                  animate={{
                    background: active ? ac : isHover ? `rgba(${rgb},0.22)` : `rgba(${rgb},0.12)`,
                    boxShadow:  active ? `0 0 24px rgba(${rgb},0.7)` : isHover ? `0 0 18px rgba(${rgb},0.5)` : `0 0 8px rgba(${rgb},0.2)`,
                    scale: isHover ? 1.12 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10"
                  style={{ color: active ? (type === 'vendor' ? '#000' : '#fff') : ac }}
                >
                  {icon}
                </motion.div>

                <motion.span
                  animate={{
                    color: active || isHover ? ac : '#e2e8f0',
                    textShadow: active || isHover ? `0 0 16px rgba(${rgb},0.8), 0 0 32px rgba(${rgb},0.4)` : 'none',
                  }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-black tracking-tight relative z-10"
                >
                  {label}
                </motion.span>

                <motion.span
                  animate={{
                    color: active ? ac : isHover ? `rgba(${rgb},0.95)` : `rgba(${rgb},0.75)`,
                    textShadow: active || isHover ? `0 0 12px rgba(${rgb},0.6)` : 'none',
                  }}
                  transition={{ duration: 0.3 }}
                  className="text-[11px] font-mono font-semibold relative z-10 text-center leading-tight"
                >
                  {sub}
                </motion.span>

                <motion.div
                  animate={{
                    width:   active ? '40px' : isHover ? '28px' : '0px',
                    opacity: active || isHover ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="h-0.5 rounded-full relative z-10"
                  style={{ background: ac, boxShadow: `0 0 10px ${ac}` }}
                />
              </motion.button>
            );
          })}
        </div>

        {/* ── FORM BOX ── */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(4,8,20,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Toggle */}
          <div className="flex rounded-xl overflow-hidden mb-4" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {['login', 'register'].map((m) => (
              <motion.button
                key={m}
                type="button"
                onClick={() => handleModeSwitch(m)}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-2.5 text-xs font-mono font-bold capitalize tracking-widest transition-all duration-300 cursor-pointer"
                style={{
                  background: mode === m ? (selected ? accent : '#6366F1') : 'transparent',
                  color: mode === m ? (isVendor ? '#000' : '#fff') : 'rgba(255,255,255,0.3)',
                }}
              >
                {m}
              </motion.button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">

            {/* Name — register only */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 48 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative"
                >
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    style={{ height: 48 }}
                    onFocus={(e) => (e.target.style.borderColor = accent)}
                    onBlur={(e)  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                  <Cursor field="name" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="relative">
              <input
                type="text"
                placeholder="Official Email / Government ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                onFocus={(e) => (e.target.style.borderColor = accent)}
                onBlur={(e)  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
              <Cursor field="email" />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                onFocus={(e) => (e.target.style.borderColor = accent)}
                onBlur={(e)  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
              <Cursor field="password" />
            </div>

            {/* Confirm — register only */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  key="confirm-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 48 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative"
                >
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputClass}
                    style={{ height: 48 }}
                    onFocus={(e) => (e.target.style.borderColor = accent)}
                    onBlur={(e)  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                  <Cursor field="confirm" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              whileHover={selected && !filling ? { scale: 1.02, boxShadow: `0 0 36px rgba(${accentRGB},0.55)` } : {}}
              whileTap={selected && !filling ? { scale: 0.97 } : {}}
              className="w-full py-3 rounded-xl font-black text-sm tracking-wide mt-1 transition-colors duration-300"
              style={{
                background: selected
                  ? `linear-gradient(135deg, ${accent} 0%, ${isOfficer ? '#6B21A8' : '#2D6BE4'} 100%)`
                  : 'rgba(255,255,255,0.05)',
                color:     selected ? (isVendor ? '#000' : '#fff') : 'rgba(255,255,255,0.2)',
                boxShadow: selected && !filling ? `0 0 28px rgba(${accentRGB},0.35)` : 'none',
                cursor:    selected && !filling ? 'pointer' : 'not-allowed',
              }}
            >
              {filling ? (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  {mode === 'register' ? 'Setting up account...' : 'Authenticating...'}
                </motion.span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </motion.button>
          </form>

          {/* Hint */}
          <div className="mt-3 text-center min-h-[14px]">
            {selected && !filling ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-mono"
                style={{ color: `rgba(${accentRGB},0.45)` }}
              >
                {mode === 'login'
                  ? `Click Sign In to continue as ${selected}`
                  : `Click Create Account to continue as ${selected}`}
              </motion.p>
            ) : !selected ? (
              <p className="text-[10px] font-mono text-indigo-500/60 tracking-wide">
                Select a portal above to continue
              </p>
            ) : null}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}