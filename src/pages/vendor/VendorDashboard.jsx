import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const OCR_DATA = {
  gst:   { lines: ['GSTIN: 27AAPFU0939F1ZV','Name: Demo Vendors Pvt Ltd','Valid till: Dec 2026','Status: Active ✅'], confidence: 94 },
  pan:   { lines: ['PAN: AAPFU0939F','Name: Demo Vendor Private Limited','Type: Company ✅','Issued by: Income Tax Dept'], confidence: 97 },
  udyam: { lines: ['Udyam No: UDYAM-MH-10-0012345','Category: Micro Enterprise','Activity: Manufacturing ✅','Valid: Lifetime'], confidence: 91 },
  epfo:  { lines: ['Establishment ID: MHBAN0012345000','Name: Demo Vendors Pvt Ltd','Employees covered: 47','Compliance: Up to date ✅'], confidence: 88 },
  itr:   { lines: ['PAN: AAPFU0939F','AY: 2024-25','Gross Total Income: ₹1.24 Cr','Filing Status: Filed ✅'], confidence: 96 },
  oem:   { lines: ['OEM: Bosch India Pvt Ltd','Authorized Dealer: Demo Vendors','Valid till: Mar 2026','Product Category: Industrial ✅'], confidence: 89 },
};

const DOCS = [
  { id: 'gst',   title: 'GST Certificate',          sub: 'Proof of valid GST registration' },
  { id: 'pan',   title: 'PAN Card',                  sub: 'Company or proprietor PAN card' },
  { id: 'udyam', title: 'Udyam / MSME Certificate', sub: 'MSME registration certificate' },
  { id: 'epfo',  title: 'EPFO Compliance Document',  sub: 'Employee provident fund compliance' },
  { id: 'itr',   title: 'Income Tax Return',         sub: 'Latest ITR filing document' },
  { id: 'oem',   title: 'OEM Authorization Letter',  sub: 'Original equipment manufacturer auth' },
];

const AUDIT_ENTRIES = [
  { icon: '✅', text: 'Documents received and encrypted',        hash: '3f8a2b1c' },
  { icon: '✅', text: 'Zero-trust hash generated for all files', hash: '9c1d4e7f' },
  { icon: '🔄', text: 'AI OCR extraction started',              hash: '2b5f8a3d' },
  { icon: '✅', text: 'GST Certificate verified',               hash: '7e1c9b4a' },
  { icon: '✅', text: 'PAN Card verified',                      hash: '4d8f2e6c' },
  { icon: '✅', text: 'Udyam Certificate verified',             hash: '1a5b9c3e' },
  { icon: '⚠️', text: 'EPFO name variation detected',           hash: '8c3f7d2b' },
  { icon: '✅', text: 'Cross-ministry blacklist check complete', hash: '5e9a1f4c' },
  { icon: '🔄', text: 'Generating compliance score...',         hash: '6b2d8e5f' },
  { icon: '⏳', text: 'Awaiting officer review assignment',      hash: 'pending...' },
];

const STEPS = ['Upload Documents', 'AI Verification', 'Officer Review', 'Result'];

// ── UPLOAD BOX ────────────────────────────────────────────────
function UploadBox({ doc, file, ocr, onFile, onRemove }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(doc.id, f);
  };

  const fmt = (b) => b < 1024 * 1024
    ? `${(b / 1024).toFixed(1)} KB`
    : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-2"
    >
      {/* Drop zone */}
      <div
        onClick={() => !file && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="relative rounded-2xl p-5 transition-all duration-300 cursor-pointer"
        style={{
          background: file
            ? 'rgba(0,194,255,0.08)'
            : dragging
            ? 'rgba(45,107,228,0.15)'
            : 'rgba(255,255,255,0.04)',
          border: `1.5px dashed ${file ? '#00C2FF' : dragging ? '#2D6BE4' : 'rgba(0,194,255,0.25)'}`,
          backdropFilter: 'blur(12px)',
          boxShadow: file
            ? '0 0 24px rgba(0,194,255,0.15), inset 0 0 24px rgba(0,194,255,0.04)'
            : dragging
            ? '0 0 24px rgba(45,107,228,0.2)'
            : '0 0 16px rgba(0,194,255,0.06)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => e.target.files[0] && onFile(doc.id, e.target.files[0])}
        />

        {!file ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <motion.div
              animate={{ boxShadow: ['0 0 0px rgba(0,194,255,0)', '0 0 18px rgba(0,194,255,0.4)', '0 0 0px rgba(0,194,255,0)'] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(45,107,228,0.2)', border: '1px solid rgba(0,194,255,0.3)' }}
            >
              <svg className="w-6 h-6 text-[#00C2FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </motion.div>
            <div className="text-center">
              <p className="text-white text-sm font-bold">{doc.title}</p>
              <p className="text-slate-300 text-xs mt-1">{doc.sub}</p>
            </div>
            <p className="text-xs text-[#00C2FF]/60 font-mono">Drag & drop or click to browse</p>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">PDF · JPG · PNG</p>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(0,194,255,0.2)', border: '1px solid rgba(0,194,255,0.4)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#00C2FF" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate">{doc.title}</p>
              <p className="text-[#00C2FF] text-xs font-mono truncate mt-0.5">{file.name}</p>
              <p className="text-slate-400 text-xs mt-0.5">{fmt(file.size)}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(doc.id); }}
              className="text-slate-500 hover:text-rose-400 transition-colors text-base leading-none mt-0.5 cursor-pointer"
            >✕</button>
          </div>
        )}
      </div>

      {/* OCR Preview */}
      <AnimatePresence>
        {ocr && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(0,194,255,0.05)',
              border: '1px solid rgba(0,194,255,0.2)',
              boxShadow: '0 0 12px rgba(0,194,255,0.08)',
            }}
          >
            {ocr.loading ? (
              <div className="flex items-center gap-2 px-4 py-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-4 h-4 rounded-full border-2 border-[#00C2FF] border-t-transparent flex-shrink-0"
                />
                <span className="text-xs font-mono text-[#00C2FF]">AI Reading Document...</span>
              </div>
            ) : (
              <div className="px-4 py-3 flex flex-col gap-1.5">
                <p className="text-[10px] font-mono font-bold text-[#00C2FF] uppercase tracking-wider mb-1">
                  OCR Extracted Data
                </p>
                {ocr.lines.map((l, i) => (
                  <p key={i} className="text-xs font-mono text-slate-200">{l}</p>
                ))}
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono text-slate-400">Extraction Confidence</span>
                    <span className="text-[10px] font-mono text-[#00C2FF] font-bold">{ocr.confidence}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ocr.confidence}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #2D6BE4, #00C2FF)' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── FUZZY MATCH CARD ──────────────────────────────────────────
function FuzzyMatchCard({ gstOcr, panOcr }) {
  if (!gstOcr || !panOcr || gstOcr.loading || panOcr.loading) return null;
  const score = 87;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="col-span-2 rounded-2xl p-5"
      style={{
        background: 'rgba(251,191,36,0.06)',
        border: '1.5px solid rgba(251,191,36,0.35)',
        boxShadow: '0 0 24px rgba(251,191,36,0.1)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">⚠️</span>
        <p className="text-white text-sm font-black">Cross-Document Name Verification</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">GST Name</p>
          <p className="text-white text-sm font-bold">Demo Vendors Pvt Ltd</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">PAN Name</p>
          <p className="text-white text-sm font-bold">Demo Vendor Private Limited</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: '#FBBF24' }}
          />
        </div>
        <span className="text-sm font-black font-mono text-amber-400">{score}% Match</span>
      </div>
      <p className="text-xs text-amber-300 font-mono mt-2">
        Minor variation detected — will be flagged for officer review
      </p>
    </motion.div>
  );
}

// ── VERIFICATION STATE ─────────────────────────────────────────
function VerificationState({ subId, subTime }) {
  const [visibleEntries, setVisibleEntries] = useState(0);

  useEffect(() => {
    if (visibleEntries >= AUDIT_ENTRIES.length) return;
    const t = setTimeout(() => setVisibleEntries((v) => v + 1), 900);
    return () => clearTimeout(t);
  }, [visibleEntries]);

  const stepStatus = [
    { label: 'Documents Submitted', state: 'done' },
    { label: 'AI Verification',     state: 'done' },
    { label: 'Officer Review',      state: 'active' },
    { label: 'Result Pending',      state: 'pending' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto py-10 px-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="flex justify-center mb-5">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(45,107,228,0.3), rgba(0,194,255,0.2))',
              border: '1.5px solid rgba(0,194,255,0.4)',
              boxShadow: '0 0 32px rgba(0,194,255,0.3)',
            }}
          >
            <svg className="w-8 h-8 text-[#00C2FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </motion.div>
        </div>
        <h1 className="text-3xl font-black text-white">Verification In Progress</h1>
        <p className="text-slate-300 text-sm mt-2">Our AI is analyzing your documents for compliance</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="text-xs font-mono text-[#00C2FF]">ID: {subId}</span>
          <span className="text-slate-600">·</span>
          <span className="text-xs font-mono text-slate-400">{subTime}</span>
        </div>
      </motion.div>

      {/* Audit trail */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,194,255,0.12)', backdropFilter: 'blur(12px)', boxShadow: '0 0 24px rgba(0,194,255,0.06)' }}>
        <p className="text-xs font-mono font-bold text-[#00C2FF] uppercase tracking-widest mb-4">Live Audit Trail</p>
        <div className="flex flex-col gap-2">
          {AUDIT_ENTRIES.slice(0, visibleEntries).map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-3 py-2 px-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <span className="text-sm flex-shrink-0">{entry.icon}</span>
              <span className="text-xs text-slate-200 flex-1">{entry.text}</span>
              <span className="text-[9px] font-mono flex-shrink-0 px-2 py-0.5 rounded-md" style={{ background: 'rgba(45,107,228,0.15)', color: '#2D6BE4', border: '1px solid rgba(45,107,228,0.2)' }}>
                #{entry.hash}
              </span>
            </motion.div>
          ))}
          {visibleEntries < AUDIT_ENTRIES.length && (
            <div className="flex items-center gap-2 px-3 py-2">
              {[0, 1, 2].map((d) => (
                <motion.div key={d} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: d * 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#00C2FF]" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Step tracker */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,194,255,0.12)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-8 right-8 h-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '45%' }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
            className="absolute top-5 left-8 h-0.5"
            style={{ background: 'linear-gradient(90deg, #2D6BE4, #00C2FF)' }}
          />
          {stepStatus.map(({ label, state }, i) => (
            <div key={i} className="flex flex-col items-center gap-2 relative z-10">
              <motion.div
                animate={state === 'active' ? { boxShadow: ['0 0 0px rgba(0,194,255,0)', '0 0 18px rgba(0,194,255,0.7)', '0 0 0px rgba(0,194,255,0)'] } : {}}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs"
                style={{
                  background: state === 'done' ? 'linear-gradient(135deg, #2D6BE4, #00C2FF)' : state === 'active' ? 'rgba(0,194,255,0.15)' : 'rgba(255,255,255,0.05)',
                  border: state === 'done' ? 'none' : state === 'active' ? '2px solid #00C2FF' : '2px solid rgba(255,255,255,0.1)',
                  color: state === 'done' ? '#fff' : state === 'active' ? '#00C2FF' : '#475569',
                }}
              >
                {state === 'done' ? '✓' : state === 'active' ? '⏳' : i + 1}
              </motion.div>
              <span className="text-[11px] font-bold text-center leading-tight max-w-[72px]" style={{ color: state === 'done' ? '#fff' : state === 'active' ? '#00C2FF' : '#475569' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy + badges */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono text-slate-300" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span>🔒</span>
          <span>Processed on secure government servers · DPDPA Compliant · No data shared externally</span>
        </div>
        <div className="flex gap-2">
          {[{ icon: '🔒', label: 'DPDPA Compliant' }, { icon: '⚡', label: 'Offline First' }, { icon: '🛡️', label: 'Zero Trust Verified' }].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold" style={{ background: 'rgba(45,107,228,0.12)', border: '1px solid rgba(0,194,255,0.25)', color: '#00C2FF' }}>
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────
export default function VendorDashboard() {
  const navigate                = useNavigate();
  const [files, setFiles]       = useState({});
  const [ocr, setOcr]           = useState({});
  const [state, setState]       = useState('upload');
  const [subId, setSubId]       = useState('');
  const [subTime, setSubTime]   = useState('');
  const [activeStep]            = useState(0);

  const uploadedCount = Object.keys(files).length;
  const allUploaded   = uploadedCount === DOCS.length;

  const handleFile = (id, file) => {
    setFiles((f) => ({ ...f, [id]: file }));
    setOcr((o) => ({ ...o, [id]: { loading: true } }));
    setTimeout(() => {
      setOcr((o) => ({ ...o, [id]: { loading: false, ...OCR_DATA[id] } }));
    }, 2000);
  };

  const handleRemove = (id) => {
    setFiles((f) => { const n = { ...f }; delete n[id]; return n; });
    setOcr((o)  => { const n = { ...o }; delete n[id]; return n; });
  };

  const handleSubmit = () => {
    if (!allUploaded) return;
    setState('submitting');
    const id = `SUB-2026-CPCL-${Math.floor(100000 + Math.random() * 900000)}`;
    const ts = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSubId(id);
    setSubTime(ts);
    setTimeout(() => setState('verification'), 1800);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col" style={{ background: '#050A18' }}>

      {/* Ambient background glows — like homepage slides */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: 'rgba(0,194,255,0.07)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'rgba(45,107,228,0.08)' }} />
      </div>

      {/* ── HEADER ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-0"
        style={{
          height: '64px',
          background: 'rgba(5,10,24,0.85)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(0,194,255,0.15)',
          boxShadow: '0 1px 32px rgba(0,194,255,0.08)',
        }}
      >
        <img src="/assets/gem-logo.png" alt="GeM" style={{ height: 44 }} />
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 h-2 rounded-full bg-[#00E5FF]"
          />
          <span className="text-white font-black text-base tracking-wide">Vendor Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-300 text-sm font-mono">vendor@cpcl.gov.in</span>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-1.5 rounded-lg text-sm font-bold font-mono cursor-pointer transition-all hover:brightness-125"
            style={{
              background: 'rgba(45,107,228,0.2)',
              border: '1px solid rgba(45,107,228,0.5)',
              color: '#00C2FF',
              boxShadow: '0 0 12px rgba(45,107,228,0.2)',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 pt-[64px] relative z-10">

        {/* ── SIDEBAR ── */}
        {state !== 'verification' && (
          <aside
            className="fixed top-[64px] left-0 bottom-0 w-60 flex flex-col gap-1 px-4 py-6"
            style={{
              background: 'rgba(5,10,24,0.7)',
              borderRight: '1px solid rgba(0,194,255,0.1)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <p className="text-[10px] font-mono font-bold text-[#00C2FF]/60 uppercase tracking-widest mb-3 px-3">
              Progress
            </p>

            {STEPS.map((label, i) => {
              const done   = i < activeStep;
              const active = i === activeStep;
              return (
                <div key={i} className="flex items-start gap-3 px-3 py-3">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <motion.div
                      animate={active ? { boxShadow: ['0 0 0px rgba(0,194,255,0)', '0 0 14px rgba(0,194,255,0.6)', '0 0 0px rgba(0,194,255,0)'] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                      style={{
                        background: done
                          ? 'linear-gradient(135deg,#2D6BE4,#00C2FF)'
                          : active
                          ? 'rgba(0,194,255,0.15)'
                          : 'rgba(255,255,255,0.05)',
                        border: done
                          ? 'none'
                          : active
                          ? '2px solid #00C2FF'
                          : '2px solid rgba(255,255,255,0.12)',
                        color: done ? '#fff' : active ? '#00C2FF' : '#64748b',
                      }}
                    >
                      {done ? '✓' : (
                        active
                          ? <span className="w-2 h-2 rounded-full bg-[#00C2FF] animate-pulse inline-block" />
                          : <span className="text-xs">{i + 1}</span>
                      )}
                    </motion.div>
                    {i < STEPS.length - 1 && (
                      <div className="w-0.5 h-7 rounded-full" style={{ background: done ? 'linear-gradient(#2D6BE4,#00C2FF)' : 'rgba(255,255,255,0.08)' }} />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-bold leading-tight" style={{ color: active ? '#00E5FF' : done ? '#fff' : '#64748b' }}>
                      {label}
                    </p>
                    {active && (
                      <p className="text-[10px] font-mono text-[#00C2FF]/60 mt-0.5">In progress</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Upload count widget */}
            <div
              className="mt-auto mx-1 p-4 rounded-2xl"
              style={{
                background: 'rgba(45,107,228,0.1)',
                border: '1px solid rgba(0,194,255,0.2)',
                boxShadow: '0 0 16px rgba(0,194,255,0.06)',
              }}
            >
              <p className="text-[10px] font-mono text-slate-400 mb-2">Documents Uploaded</p>
              <div className="flex items-end gap-1 mb-3">
                <span className="text-3xl font-black text-white leading-none">{uploadedCount}</span>
                <span className="text-slate-400 text-base mb-0.5">/ {DOCS.length}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5">
                <motion.div
                  animate={{ width: `${(uploadedCount / DOCS.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,#2D6BE4,#00C2FF)' }}
                />
              </div>
            </div>
          </aside>
        )}

        {/* ── MAIN CONTENT ── */}
        <main
          className="flex-1 overflow-y-auto"
          style={{
            marginLeft: state !== 'verification' ? '240px' : '0',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {/* UPLOAD STATE */}
          {state === 'upload' && (
            <div className="px-8 py-8 pb-32 flex flex-col gap-6 max-w-5xl mx-auto">
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-black text-white">Upload Compliance Documents</h1>
                <p className="text-slate-300 text-sm mt-2">
                  All documents required for tender eligibility verification
                </p>
              </motion.div>

              {/* Grid — 2 cols, centered */}
              <div className="grid grid-cols-2 gap-5">
                {DOCS.map((doc) => (
                  <UploadBox
                    key={doc.id}
                    doc={doc}
                    file={files[doc.id]}
                    ocr={ocr[doc.id]}
                    onFile={handleFile}
                    onRemove={handleRemove}
                  />
                ))}

                <FuzzyMatchCard gstOcr={ocr['gst']} panOcr={ocr['pan']} />
              </div>
            </div>
          )}

          {/* SUBMITTING STATE */}
          {state === 'submitting' && (
            <div className="flex flex-col items-center justify-center h-full min-h-[70vh] gap-5">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="w-14 h-14 rounded-full border-4 border-t-transparent"
                style={{ borderColor: '#00C2FF', borderTopColor: 'transparent' }}
              />
              <p className="text-white font-black text-xl">Submitting Documents...</p>
              <p className="text-slate-400 text-sm font-mono">Encrypting and uploading securely</p>
            </div>
          )}

          {/* VERIFICATION STATE */}
          {state === 'verification' && (
            <VerificationState subId={subId} subTime={subTime} />
          )}
        </main>
      </div>

      {/* ── STICKY SUBMIT BAR — outside main so it overlays everything ── */}
      {state === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 z-40 flex items-center gap-5 px-8 py-4"
          style={{
            left: '240px',
            right: 0,
            background: 'rgba(5,10,24,0.95)',
            backdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(0,194,255,0.15)',
            boxShadow: '0 -4px 32px rgba(0,194,255,0.08)',
          }}
        >
          <div className="flex-1">
            <div className="flex justify-between mb-1.5">
              <span className="text-sm text-slate-300 font-mono">
                {uploadedCount} of {DOCS.length} documents uploaded
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: allUploaded ? '#00C2FF' : '#475569' }}>
                {Math.round((uploadedCount / DOCS.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5">
              <motion.div
                animate={{ width: `${(uploadedCount / DOCS.length) * 100}%` }}
                transition={{ duration: 0.4 }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#2D6BE4,#00C2FF)' }}
              />
            </div>
          </div>

          <motion.button
            onClick={handleSubmit}
            disabled={!allUploaded}
            animate={allUploaded ? {
              boxShadow: ['0 0 0px rgba(0,194,255,0)', '0 0 28px rgba(0,194,255,0.6)', '0 0 0px rgba(0,194,255,0)'],
            } : {}}
            transition={{ repeat: Infinity, duration: 1.8 }}
            whileHover={allUploaded ? { scale: 1.03 } : {}}
            whileTap={allUploaded ? { scale: 0.97 } : {}}
            className="px-8 py-3 rounded-xl font-black text-sm transition-all duration-300 flex-shrink-0"
            style={{
              background: allUploaded ? 'linear-gradient(135deg,#2D6BE4,#00C2FF)' : 'rgba(255,255,255,0.05)',
              color:  allUploaded ? '#fff' : '#475569',
              cursor: allUploaded ? 'pointer' : 'not-allowed',
            }}
          >
            Submit for Verification
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}