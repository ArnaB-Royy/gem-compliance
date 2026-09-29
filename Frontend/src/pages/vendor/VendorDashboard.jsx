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

// timestamps generated at runtime so they feel live
const generateAuditEntries = (baseTime) => {
  const t = new Date(baseTime);
  const fmt = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const add = (sec) => { const d = new Date(t); d.setSeconds(d.getSeconds() + sec); return fmt(d); };
  return [
    { icon: '✅', text: 'Documents received and encrypted',        hash: '3f8a2b1c', color: 'emerald', time: add(0)  },
    { icon: '✅', text: 'Zero-trust hash generated for all files', hash: '9c1d4e7f', color: 'emerald', time: add(1)  },
    { icon: '🔄', text: 'AI OCR extraction started',              hash: '2b5f8a3d', color: 'cyan',    time: add(2)  },
    { icon: '✅', text: 'GST Certificate verified',               hash: '7e1c9b4a', color: 'emerald', time: add(4)  },
    { icon: '✅', text: 'PAN Card verified',                      hash: '4d8f2e6c', color: 'emerald', time: add(5)  },
    { icon: '✅', text: 'Udyam Certificate verified',             hash: '1a5b9c3e', color: 'emerald', time: add(6)  },
    { icon: '⚠️', text: 'EPFO name variation detected',           hash: '8c3f7d2b', color: 'amber',   time: add(7)  },
    { icon: '✅', text: 'Cross-ministry blacklist check complete', hash: '5e9a1f4c', color: 'emerald', time: add(9)  },
    { icon: '🔄', text: 'Generating compliance score...',         hash: '6b2d8e5f', color: 'cyan',    time: add(11) },
    { icon: '⏳', text: 'Awaiting officer review assignment',      hash: 'pending...',color: 'rose',   time: add(13) },
  ];
};

const OFFICER_RESULT = {
  score: 82,
  officer: 'Sr. Procurement Officer R. Sharma',
  badge: 'PO-CPCL-2026-047',
  reviewedAt: null, // filled at runtime
  decision: 'approved',
  remarks: 'All statutory documents verified. Minor name variation in EPFO noted but within acceptable threshold. GST and PAN cross-verification passed. Vendor is eligible to participate in CPCL tender.',
  breakdown: [
    { label: 'GST Certificate',         score: 94, status: 'passed' },
    { label: 'PAN Card',                score: 97, status: 'passed' },
    { label: 'Udyam / MSME',            score: 91, status: 'passed' },
    { label: 'EPFO Compliance',         score: 72, status: 'flagged' },
    { label: 'Income Tax Return',       score: 96, status: 'passed' },
    { label: 'OEM Authorization',       score: 89, status: 'passed' },
  ],
};

const COLOR_MAP = {
  emerald: { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)', text: '#34D399', hashBg: 'rgba(52,211,153,0.1)', hashBorder: 'rgba(52,211,153,0.25)', hashText: '#34D399' },
  cyan:    { bg: 'rgba(0,194,255,0.10)',  border: 'rgba(0,194,255,0.3)',  text: '#00E5FF', hashBg: 'rgba(0,194,255,0.1)',  hashBorder: 'rgba(0,194,255,0.25)',  hashText: '#00E5FF' },
  amber:   { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.3)', text: '#FBBF24', hashBg: 'rgba(251,191,36,0.1)', hashBorder: 'rgba(251,191,36,0.25)', hashText: '#FBBF24' },
  rose:    { bg: 'rgba(244,63,94,0.10)',  border: 'rgba(244,63,94,0.3)',  text: '#FB7185', hashBg: 'rgba(244,63,94,0.1)',  hashBorder: 'rgba(244,63,94,0.25)',  hashText: '#FB7185' },
};

const STEPS = ['Upload Documents', 'AI Verification', 'Officer Review', 'Result'];

// ── FILE PREVIEW MODAL ─────────────────────────────────────────
function FilePreviewModal({ file, docTitle, onClose }) {
  const url = useRef(URL.createObjectURL(file));
  const isImage = file.type.startsWith('image/');
  const isPdf   = file.type === 'application/pdf';

  useEffect(() => {
    return () => URL.revokeObjectURL(url.current);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6"
        style={{ background: 'rgba(3,6,18,0.85)', backdropFilter: 'blur(16px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col rounded-2xl overflow-hidden"
          style={{
            width: '80vw', maxWidth: '900px', height: '85vh',
            background: 'rgba(5,10,24,0.98)',
            border: '1px solid rgba(0,194,255,0.25)',
            boxShadow: '0 0 60px rgba(0,194,255,0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(0,194,255,0.15)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(0,194,255,0.15)', border: '1px solid rgba(0,194,255,0.3)' }}>
                <svg className="w-4 h-4 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-bold">{docTitle}</p>
                <p className="text-[#00E5FF] text-xs font-mono">{file.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.open(url.current, '_blank')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all hover:brightness-125 cursor-pointer"
                style={{ background: 'rgba(0,194,255,0.1)', border: '1px solid rgba(0,194,255,0.25)', color: '#00E5FF' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in new tab
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >✕</button>
            </div>
          </div>

          {/* Modal body */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 no-scrollbar">
            {isImage && (
              <img
                src={url.current}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-xl"
                style={{ boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}
              />
            )}
            {isPdf && (
              <iframe
                src={url.current}
                title={file.name}
                className="w-full h-full rounded-xl"
                style={{ border: 'none', minHeight: '600px' }}
              />
            )}
            {!isImage && !isPdf && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(0,194,255,0.1)', border: '1px solid rgba(0,194,255,0.3)' }}>
                  <svg className="w-8 h-8 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-white font-bold">Preview not available for this file type</p>
                <button
                  onClick={() => window.open(url.current, '_blank')}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all hover:brightness-125"
                  style={{ background: 'linear-gradient(135deg,#2D6BE4,#00E5FF)', color: '#fff' }}
                >
                  Open in new tab
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── UPLOAD BOX ────────────────────────────────────────────────
function UploadBox({ doc, file, ocr, onFile, onRemove }) {
  const inputRef = useRef();
  const [dragging, setDragging]     = useState(false);
  const [previewing, setPreviewing] = useState(false);

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
        onClick={() => {
          if (!file) inputRef.current.click();
          else setPreviewing(true);
        }}
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
          border: `1.5px dashed ${file ? '#00C2FF' : dragging ? '#2D6BE4' : 'rgba(0,194,255,0.3)'}`,
          backdropFilter: 'blur(12px)',
          boxShadow: file
            ? '0 0 28px rgba(0,194,255,0.18), inset 0 0 24px rgba(0,194,255,0.04)'
            : dragging
            ? '0 0 24px rgba(45,107,228,0.2)'
            : '0 0 18px rgba(0,194,255,0.08)',
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
              animate={{ boxShadow: ['0 0 0px rgba(0,194,255,0)', '0 0 20px rgba(0,194,255,0.5)', '0 0 0px rgba(0,194,255,0)'] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(45,107,228,0.2)', border: '1px solid rgba(0,194,255,0.4)' }}
            >
              <svg className="w-6 h-6 text-[#00C2FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </motion.div>
            <div className="text-center">
              <p className="text-white text-sm font-bold">{doc.title}</p>
              <p className="text-slate-300 text-xs mt-1">{doc.sub}</p>
            </div>
            <p className="text-xs text-[#00E5FF] font-mono font-semibold">Drag & drop or click to browse</p>
            <p className="text-xs text-slate-400 font-mono tracking-wider">PDF · JPG · PNG</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
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
                <p className="text-[#00E5FF] text-xs font-mono truncate mt-0.5">{file.name}</p>
                <p className="text-slate-300 text-xs mt-0.5">{fmt(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(doc.id); }}
                className="text-slate-400 hover:text-rose-400 transition-colors text-base leading-none mt-0.5 cursor-pointer"
              >✕</button>
            </div>
            {/* Preview hint */}
            <div
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-mono font-semibold"
              style={{ background: 'rgba(0,194,255,0.06)', border: '1px solid rgba(0,194,255,0.2)', color: '#00E5FF' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Click card to preview
            </div>
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
              border: '1px solid rgba(0,194,255,0.25)',
              boxShadow: '0 0 16px rgba(0,194,255,0.08)',
            }}
          >
            {ocr.loading ? (
              <div className="flex items-center gap-2 px-4 py-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-4 h-4 rounded-full border-2 border-[#00C2FF] border-t-transparent flex-shrink-0"
                />
                <span className="text-xs font-mono text-[#00E5FF] font-semibold">AI Reading Document...</span>
              </div>
            ) : (
              <div className="px-4 py-3 flex flex-col gap-1.5">
                <p className="text-[10px] font-mono font-bold text-[#00E5FF] uppercase tracking-wider mb-1">
                  OCR Extracted Data
                </p>
                {ocr.lines.map((l, i) => (
                  <p key={i} className="text-xs font-mono text-slate-100">{l}</p>
                ))}
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono text-slate-300">Extraction Confidence</span>
                    <span className="text-xs font-mono text-[#00E5FF] font-bold">{ocr.confidence}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ocr.confidence}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #2D6BE4, #00E5FF)' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File preview modal */}
      {previewing && (
        <FilePreviewModal
          file={file}
          docTitle={doc.title}
          onClose={() => setPreviewing(false)}
        />
      )}
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
        background: 'rgba(251,191,36,0.07)',
        border: '1.5px solid rgba(251,191,36,0.4)',
        boxShadow: '0 0 28px rgba(251,191,36,0.12)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">⚠️</span>
        <p className="text-white text-sm font-black">Cross-Document Name Verification</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-[10px] font-mono text-slate-300 uppercase tracking-wider mb-1">GST Name</p>
          <p className="text-white text-sm font-bold">Demo Vendors Pvt Ltd</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-[10px] font-mono text-slate-300 uppercase tracking-wider mb-1">PAN Name</p>
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
        <span className="text-sm font-black font-mono text-amber-300">{score}% Match</span>
      </div>
      <p className="text-xs text-amber-200 font-mono mt-2">
        Minor variation detected — will be flagged for officer review
      </p>
    </motion.div>
  );
}

// ── RESULT STATE ───────────────────────────────────────────────
function ResultState({ subId }) {
  const result   = OFFICER_RESULT;
  const approved = result.decision === 'approved';
  const reviewedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const scoreColor = result.score >= 80 ? '#34D399' : result.score >= 50 ? '#FBBF24' : '#FB7185';
  const scoreBg    = result.score >= 80 ? 'rgba(52,211,153,0.12)' : result.score >= 50 ? 'rgba(251,191,36,0.12)' : 'rgba(244,63,94,0.12)';
  const scoreBorder= result.score >= 80 ? 'rgba(52,211,153,0.35)' : result.score >= 50 ? 'rgba(251,191,36,0.35)' : 'rgba(244,63,94,0.35)';

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto py-10 px-6">

      {/* Decision banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 text-center"
        style={{
          background: approved ? 'rgba(52,211,153,0.08)' : 'rgba(244,63,94,0.08)',
          border: `1.5px solid ${approved ? 'rgba(52,211,153,0.4)' : 'rgba(244,63,94,0.4)'}`,
          boxShadow: `0 0 40px ${approved ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)'}`,
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: approved ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)',
            border: `2px solid ${approved ? 'rgba(52,211,153,0.5)' : 'rgba(244,63,94,0.5)'}`,
            boxShadow: `0 0 40px ${approved ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)'}`,
          }}
        >
          <span className="text-4xl">{approved ? '✅' : '❌'}</span>
        </motion.div>
        <h1 className="text-3xl font-black text-white mb-1">
          {approved ? 'Bid Approved' : 'Bid Rejected'}
        </h1>
        <p className="text-sm font-mono mb-4" style={{ color: approved ? '#34D399' : '#FB7185' }}>
          {approved ? 'Your submission meets all CPCL tender compliance requirements' : 'Your submission did not meet the compliance requirements'}
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="text-xs font-mono text-slate-300 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            ID: {subId}
          </span>
          <span className="text-xs font-mono text-slate-300 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Reviewed: {reviewedAt}
          </span>
        </div>
      </motion.div>

      {/* Score + Officer info */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-4"
      >
        {/* Score card */}
        <div className="rounded-2xl p-5 flex flex-col items-center justify-center gap-2"
          style={{ background: scoreBg, border: `1.5px solid ${scoreBorder}`, boxShadow: `0 0 24px ${scoreBg}` }}>
          <p className="text-xs font-mono text-slate-300 uppercase tracking-widest">Compliance Score</p>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <motion.circle
                cx="48" cy="48" r="40" fill="none"
                stroke={scoreColor} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - result.score / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              />
            </svg>
            <span className="text-2xl font-black" style={{ color: scoreColor }}>{result.score}</span>
          </div>
          <p className="text-xs font-mono font-bold" style={{ color: scoreColor }}>
            {result.score >= 80 ? '✅ Compliant' : result.score >= 50 ? '⚠️ Review Required' : '❌ Non-Compliant'}
          </p>
        </div>

        {/* Officer card */}
        <div className="rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: 'rgba(168,85,247,0.08)', border: '1.5px solid rgba(168,85,247,0.3)', boxShadow: '0 0 24px rgba(168,85,247,0.1)' }}>
          <p className="text-xs font-mono text-purple-300 uppercase tracking-widest">Reviewed By</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)' }}>
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-bold">{result.officer}</p>
              <p className="text-purple-300 text-xs font-mono mt-0.5">{result.badge}</p>
            </div>
          </div>
          <div className="rounded-xl p-3 mt-1"
            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <p className="text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">Officer Remarks</p>
            <p className="text-sm text-white leading-relaxed">{result.remarks}</p>
          </div>
        </div>
      </motion.div>

      {/* Per-document breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl p-5"
        style={{ background: 'rgba(5,10,24,0.8)', border: '1px solid rgba(0,194,255,0.2)', backdropFilter: 'blur(12px)' }}
      >
        <p className="text-xs font-mono font-bold text-[#00E5FF] uppercase tracking-widest mb-4">
          Document Compliance Breakdown
        </p>
        <div className="flex flex-col gap-3">
          {result.breakdown.map((item, i) => {
            const c = item.status === 'passed'
              ? { color: '#34D399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)' }
              : { color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' };
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                className="flex items-center gap-3"
              >
                <span className="text-sm w-4 flex-shrink-0">{item.status === 'passed' ? '✅' : '⚠️'}</span>
                <p className="text-sm text-white flex-1 font-medium">{item.label}</p>
                <div className="w-32 h-1.5 rounded-full bg-white/5 flex-shrink-0">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 + i * 0.07 }}
                    className="h-full rounded-full"
                    style={{ background: c.color }}
                  />
                </div>
                <span
                  className="text-xs font-mono font-bold w-8 text-right flex-shrink-0"
                  style={{ color: c.color }}
                >{item.score}%</span>
                <span
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex-shrink-0"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
                >
                  {item.status}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Privacy + badges */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono text-slate-200"
          style={{ background: 'rgba(0,194,255,0.07)', border: '1px solid rgba(0,194,255,0.2)' }}>
          <span>🔒</span>
          <span>Audit sealed · DPDPA Compliant · Tamper-proof result record</span>
        </div>
        <div className="flex gap-2">
          {[
            { icon: '🔒', label: 'DPDPA Compliant',    color: '#00E5FF', bg: 'rgba(0,194,255,0.12)',   border: 'rgba(0,194,255,0.3)'   },
            { icon: '⚡', label: 'Offline First',       color: '#A855F7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' },
            { icon: '🛡️', label: 'Zero Trust Verified', color: '#34D399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' },
          ].map(({ icon, label, color, bg, border }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold"
              style={{ background: bg, border: `1px solid ${border}`, color }}>
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── VERIFICATION STATE ─────────────────────────────────────────
function VerificationState({ subId, subTime, onSimulateResult }) {
  const [visibleEntries, setVisibleEntries] = useState(0);
  const [auditEntries]                      = useState(() => generateAuditEntries(new Date()));
  const allDone = visibleEntries >= auditEntries.length;

  useEffect(() => {
    if (visibleEntries >= auditEntries.length) return;
    const t = setTimeout(() => setVisibleEntries((v) => v + 1), 900);
    return () => clearTimeout(t);
  }, [visibleEntries, auditEntries.length]);

  const stepStatus = [
    { label: 'Documents Submitted', state: 'done'    },
    { label: 'AI Verification',     state: 'done'    },
    { label: 'Officer Review',      state: 'active'  },
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
              border: '1.5px solid rgba(0,194,255,0.5)',
              boxShadow: '0 0 40px rgba(0,194,255,0.35)',
            }}
          >
            <svg className="w-8 h-8 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </motion.div>
        </div>
        <h1 className="text-3xl font-black text-white">Verification In Progress</h1>
        <p className="text-slate-200 text-sm mt-2">Our AI is analyzing your documents for compliance</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="text-sm font-mono text-[#00E5FF] font-bold">ID: {subId}</span>
          <span className="text-slate-500">·</span>
          <span className="text-sm font-mono text-slate-300">{subTime}</span>
        </div>
      </motion.div>

      {/* Audit trail */}
      <div className="rounded-2xl p-5"
        style={{ background: 'rgba(5,10,24,0.8)', border: '1px solid rgba(0,194,255,0.2)', backdropFilter: 'blur(12px)', boxShadow: '0 0 28px rgba(0,194,255,0.08)' }}>
        <p className="text-xs font-mono font-bold text-[#00E5FF] uppercase tracking-widest mb-4">Live Audit Trail</p>
        <div className="flex flex-col gap-2">
          {auditEntries.slice(0, visibleEntries).map((entry, i) => {
            const c = COLOR_MAP[entry.color];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-3 py-2 px-3 rounded-xl"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}
              >
                <span className="text-sm flex-shrink-0">{entry.icon}</span>
                <span className="text-xs font-medium flex-1" style={{ color: c.text }}>{entry.text}</span>
                {/* TIMESTAMP */}
                <span className="text-[10px] font-mono text-slate-400 flex-shrink-0 mr-1">{entry.time}</span>
                <span
                  className="text-[10px] font-mono font-bold flex-shrink-0 px-2 py-0.5 rounded-md"
                  style={{ background: c.hashBg, color: c.hashText, border: `1px solid ${c.hashBorder}` }}
                >
                  #{entry.hash}
                </span>
              </motion.div>
            );
          })}
          {!allDone && (
            <div className="flex items-center gap-2 px-3 py-2">
              {[0,1,2].map((d) => (
                <motion.div key={d} animate={{ opacity: [0.3,1,0.3] }} transition={{ repeat: Infinity, duration: 1, delay: d * 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Step tracker */}
      <div className="rounded-2xl p-6"
        style={{ background: 'rgba(5,10,24,0.8)', border: '1px solid rgba(0,194,255,0.2)', backdropFilter: 'blur(12px)', boxShadow: '0 0 28px rgba(0,194,255,0.08)' }}>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-8 right-8 h-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <motion.div
            initial={{ width: 0 }} animate={{ width: '45%' }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
            className="absolute top-5 left-8 h-0.5"
            style={{ background: 'linear-gradient(90deg, #2D6BE4, #00E5FF)' }}
          />
          {stepStatus.map(({ label, state }, i) => (
            <div key={i} className="flex flex-col items-center gap-2 relative z-10">
              <motion.div
                animate={state === 'active' ? { boxShadow: ['0 0 0px rgba(0,229,255,0)','0 0 20px rgba(0,229,255,0.8)','0 0 0px rgba(0,229,255,0)'] } : {}}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs"
                style={{
                  background: state === 'done' ? 'linear-gradient(135deg,#2D6BE4,#00E5FF)' : state === 'active' ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)',
                  border: state === 'done' ? 'none' : state === 'active' ? '2px solid #00E5FF' : '2px solid rgba(255,255,255,0.12)',
                  color: state === 'done' ? '#fff' : state === 'active' ? '#00E5FF' : '#64748b',
                }}
              >
                {state === 'done' ? '✓' : state === 'active' ? '⏳' : i + 1}
              </motion.div>
              <span className="text-xs font-bold text-center leading-tight max-w-[72px]"
                style={{ color: state === 'done' ? '#fff' : state === 'active' ? '#00E5FF' : '#64748b' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SIMULATE OFFICER REVIEW BUTTON — only shows after audit trail completes ── */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(168,85,247,0.07)',
              border: '1.5px solid rgba(168,85,247,0.35)',
              boxShadow: '0 0 32px rgba(168,85,247,0.12)',
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)' }}>
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-black">Awaiting Officer Review</p>
                <p className="text-purple-300 text-xs font-mono mt-1">
                  Sr. Procurement Officer R. Sharma · PO-CPCL-2026-047 has been assigned to review your submission.
                </p>
                <p className="text-slate-400 text-xs mt-2">
                  In a live deployment the officer logs into their portal, reviews each document and score, then approves or rejects the bid. Click below to simulate what happens after the officer completes their review.
                </p>
              </div>
            </div>
            <motion.button
              onClick={onSimulateResult}
              animate={{
                boxShadow: ['0 0 0px rgba(168,85,247,0)','0 0 28px rgba(168,85,247,0.5)','0 0 0px rgba(168,85,247,0)'],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-4 w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              style={{ background: 'linear-gradient(135deg,#A855F7,#6366F1)', color: '#fff' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Simulate Officer Approval — See Result
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy + badges */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono text-slate-200"
          style={{ background: 'rgba(0,194,255,0.07)', border: '1px solid rgba(0,194,255,0.2)' }}>
          <span>🔒</span>
          <span>Processed on secure government servers · DPDPA Compliant · No data shared externally</span>
        </div>
        <div className="flex gap-2">
          {[
            { icon: '🔒', label: 'DPDPA Compliant',    color: '#00E5FF', bg: 'rgba(0,194,255,0.12)',   border: 'rgba(0,194,255,0.3)'   },
            { icon: '⚡', label: 'Offline First',       color: '#A855F7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' },
            { icon: '🛡️', label: 'Zero Trust Verified', color: '#34D399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' },
          ].map(({ icon, label, color, bg, border }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold"
              style={{ background: bg, border: `1px solid ${border}`, color }}>
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
  const navigate              = useNavigate();
  const [files, setFiles]     = useState({});
  const [ocr, setOcr]         = useState({});
  const [state, setState]     = useState('upload');
  const [subId, setSubId]     = useState('');
  const [subTime, setSubTime] = useState('');
  const [activeStep]          = useState(0);

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
    const ts = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    setSubId(id);
    setSubTime(ts);
    setTimeout(() => setState('verification'), 1800);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col" style={{ background: '#050A18' }}>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: 'rgba(0,194,255,0.06)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'rgba(45,107,228,0.07)' }} />
      </div>

      {/* ── HEADER ── */}
      <header
        className="flex-shrink-0 flex items-center px-8 z-50 relative"
        style={{
          height: '64px',
          background: 'rgba(5,10,24,0.9)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(0,194,255,0.18)',
          boxShadow: '0 1px 40px rgba(0,194,255,0.1)',
        }}
      >
        <div style={{ width: '240px', flexShrink: 0 }}>
            <img
                src="/assets/gem-logo.png"
                alt="GeM"
                style={{ height: 44, cursor: 'pointer' }}
                onClick={() => navigate('/')}
            />
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 h-2 rounded-full bg-[#00E5FF]"
            style={{ boxShadow: '0 0 8px rgba(0,229,255,0.8)' }}
          />
          <span className="text-white font-black text-lg tracking-wide">Vendor Portal</span>
        </div>
        <div style={{ width: '240px', flexShrink: 0 }} className="flex items-center justify-end gap-4">
          <span className="text-slate-300 text-sm font-mono">vendor@cpcl.gov.in</span>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-1.5 rounded-lg text-sm font-bold font-mono cursor-pointer transition-all hover:brightness-125"
            style={{ background: 'rgba(45,107,228,0.2)', border: '1px solid rgba(0,194,255,0.4)', color: '#00E5FF', boxShadow: '0 0 14px rgba(45,107,228,0.25)' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 min-h-0 relative z-10">

        {/* SIDEBAR */}
        {state !== 'verification' && state !== 'result' && (
          <aside
            className="flex-shrink-0 flex flex-col gap-1 px-4 py-6 overflow-y-auto no-scrollbar"
            style={{ width: '240px', background: 'rgba(5,10,24,0.7)', borderRight: '1px solid rgba(0,194,255,0.12)', backdropFilter: 'blur(16px)' }}
          >
            <p className="text-[10px] font-mono font-bold text-[#00C2FF]/70 uppercase tracking-widest mb-3 px-3">Progress</p>
            {STEPS.map((label, i) => {
              const done   = i < activeStep;
              const active = i === activeStep;
              return (
                <div key={i} className="flex items-start gap-3 px-3 py-3">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <motion.div
                      animate={active ? { boxShadow: ['0 0 0px rgba(0,229,255,0)','0 0 16px rgba(0,229,255,0.7)','0 0 0px rgba(0,229,255,0)'] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                      style={{
                        background: done ? 'linear-gradient(135deg,#2D6BE4,#00E5FF)' : active ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)',
                        border: done ? 'none' : active ? '2px solid #00E5FF' : '2px solid rgba(255,255,255,0.12)',
                        color: done ? '#fff' : active ? '#00E5FF' : '#64748b',
                      }}
                    >
                      {done ? '✓' : active
                        ? <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse inline-block" />
                        : <span className="text-xs font-bold">{i + 1}</span>
                      }
                    </motion.div>
                    {i < STEPS.length - 1 && (
                      <div className="w-0.5 h-7 rounded-full" style={{ background: done ? 'linear-gradient(#2D6BE4,#00E5FF)' : 'rgba(255,255,255,0.08)' }} />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-bold leading-tight" style={{ color: active ? '#00E5FF' : done ? '#ffffff' : '#94a3b8' }}>
                      {label}
                    </p>
                    {active && <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(0,229,255,0.6)' }}>In progress</p>}
                  </div>
                </div>
              );
            })}
            <div className="mt-auto mx-1 p-4 rounded-2xl"
              style={{ background: 'rgba(45,107,228,0.1)', border: '1px solid rgba(0,194,255,0.25)', boxShadow: '0 0 20px rgba(0,194,255,0.08)' }}>
              <p className="text-xs font-mono text-slate-300 mb-2">Documents Uploaded</p>
              <div className="flex items-end gap-1 mb-3">
                <span className="text-3xl font-black text-white leading-none">{uploadedCount}</span>
                <span className="text-slate-300 text-base mb-0.5">/ {DOCS.length}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5">
                <motion.div
                  animate={{ width: `${(uploadedCount / DOCS.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,#2D6BE4,#00E5FF)' }}
                />
              </div>
            </div>
          </aside>
        )}

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto min-h-0 no-scrollbar">
          {state === 'upload' && (
            <div className="px-8 py-8 pb-28 flex flex-col gap-6 max-w-5xl mx-auto">
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-black text-white">Upload Compliance Documents</h1>
                <p className="text-slate-300 text-sm mt-2">All documents required for tender eligibility verification</p>
              </motion.div>
              <div className="grid grid-cols-2 gap-5">
                {DOCS.map((doc) => (
                  <UploadBox key={doc.id} doc={doc} file={files[doc.id]} ocr={ocr[doc.id]} onFile={handleFile} onRemove={handleRemove} />
                ))}
                <FuzzyMatchCard gstOcr={ocr['gst']} panOcr={ocr['pan']} />
              </div>
            </div>
          )}

          {state === 'submitting' && (
            <div className="flex flex-col items-center justify-center h-full min-h-[70vh] gap-5">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="w-14 h-14 rounded-full border-4 border-t-transparent"
                style={{ borderColor: '#00E5FF', borderTopColor: 'transparent' }}
              />
              <p className="text-white font-black text-xl">Submitting Documents...</p>
              <p className="text-slate-300 text-sm font-mono">Encrypting and uploading securely</p>
            </div>
          )}

          {state === 'verification' && (
            <VerificationState
              subId={subId}
              subTime={subTime}
              onSimulateResult={() => setState('result')}
            />
          )}

          {state === 'result' && (
            <ResultState subId={subId} />
          )}
        </main>
      </div>

      {/* SUBMIT BAR */}
      <AnimatePresence>
        {state === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="flex-shrink-0 flex items-center gap-5 px-8 py-4 relative z-50"
            style={{ background: 'rgba(5,10,24,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(0,194,255,0.2)', boxShadow: '0 -4px 40px rgba(0,194,255,0.1)' }}
          >
            <div className="flex-1">
              <div className="flex justify-between mb-1.5">
                <span className="text-sm text-slate-200 font-mono">{uploadedCount} of {DOCS.length} documents uploaded</span>
                <span className="text-sm font-mono font-bold" style={{ color: allUploaded ? '#00E5FF' : '#475569' }}>
                  {Math.round((uploadedCount / DOCS.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5">
                <motion.div
                  animate={{ width: `${(uploadedCount / DOCS.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,#2D6BE4,#00E5FF)' }}
                />
              </div>
            </div>
            <motion.button
              onClick={handleSubmit}
              disabled={!allUploaded}
              animate={allUploaded ? { boxShadow: ['0 0 0px rgba(0,229,255,0)','0 0 32px rgba(0,229,255,0.6)','0 0 0px rgba(0,229,255,0)'] } : {}}
              transition={{ repeat: Infinity, duration: 1.8 }}
              whileHover={allUploaded ? { scale: 1.03 } : {}}
              whileTap={allUploaded ? { scale: 0.97 } : {}}
              className="px-8 py-3 rounded-xl font-black text-sm flex-shrink-0 transition-all duration-300"
              style={{
                background: allUploaded ? 'linear-gradient(135deg,#2D6BE4,#00E5FF)' : 'rgba(255,255,255,0.05)',
                color: allUploaded ? '#fff' : '#475569',
                cursor: allUploaded ? 'pointer' : 'not-allowed',
              }}
            >
              Submit for Verification
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}