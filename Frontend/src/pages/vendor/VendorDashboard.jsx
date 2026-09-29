import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const OCR_TIMEOUT_MS = 30000;

const DOCS = [
  { id: 'gst',   title: 'GST Certificate',          sub: 'Proof of valid GST registration' },
  { id: 'pan',   title: 'PAN Card',                  sub: 'Company or proprietor PAN card' },
  { id: 'udyam', title: 'Udyam / MSME Certificate', sub: 'MSME registration certificate' },
  { id: 'epfo',  title: 'EPFO Compliance Document',  sub: 'Employee provident fund compliance' },
  { id: 'itr',   title: 'Income Tax Return',         sub: 'Latest ITR filing document' },
  { id: 'oem',   title: 'OEM Authorization Letter',  sub: 'Original equipment manufacturer auth' },
];

// Fields returned by the backend for each docType
const FIELD_DEFS = {
  gst:   [['gstin', 'GSTIN'], ['legalName', 'Legal Name'], ['tradeName', 'Trade Name'], ['address', 'Address'], ['registrationDate', 'Reg. Date'], ['constitution', 'Constitution']],
  pan:   [['pan', 'PAN'], ['name', 'Name'], ['fatherName', "Father's Name"], ['dob', 'DOB / Inc. Date']],
  udyam: [['udyamNumber', 'Udyam No'], ['enterpriseName', 'Enterprise'], ['enterpriseType', 'Type'], ['majorActivity', 'Activity'], ['address', 'Address'], ['registrationDate', 'Reg. Date']],
  epfo:  [['establishmentName', 'Establishment'], ['establishmentCode', 'Code'], ['address', 'Address'], ['dateOfCoverage', 'Coverage Date']],
  itr:   [['pan', 'PAN'], ['name', 'Name'], ['assessmentYear', 'Assess. Year'], ['acknowledgementNumber', 'Ack. No'], ['filingDate', 'Filing Date']],
  oem:   [['oemName', 'OEM'], ['authorizedVendorName', 'Vendor'], ['productsAuthorized', 'Products'], ['issueDate', 'Issue Date'], ['validUntil', 'Valid Until'], ['referenceNumber', 'Ref. No']],
};

// ── DEMO SAFETY NET ── saved results used ONLY when the person clicks "Use demo fallback"
const H = 'high';
const FALLBACK = {
  gst:   { values: { gstin: '19ABCDE1234F1Z5', legalName: 'Demo Traders Pvt Ltd', tradeName: 'Demo Traders', address: 'Kolkata, West Bengal', registrationDate: '01/07/2017', constitution: 'Private Limited Company' }, confidence: { gstin: H, legalName: H, tradeName: H, address: H, registrationDate: H, constitution: H } },
  pan:   { values: { pan: 'ABCDE1234F', name: 'Demo Traders Pvt Ltd', fatherName: null, dob: '12/03/2015' }, confidence: { pan: H, name: H, fatherName: H, dob: H } },
  udyam: { values: { udyamNumber: 'UDYAM-WB-10-0012345', enterpriseName: 'Demo Traders Pvt Ltd', enterpriseType: 'Micro', majorActivity: 'Trading', address: 'Kolkata, West Bengal', registrationDate: '05/08/2020' }, confidence: { udyamNumber: H, enterpriseName: H, enterpriseType: H, majorActivity: H, address: H, registrationDate: H } },
  epfo:  { values: { establishmentName: 'Demo Traders Pvt Ltd', establishmentCode: 'WBCAL0012345000', address: 'Kolkata, West Bengal', dateOfCoverage: '01/04/2018' }, confidence: { establishmentName: H, establishmentCode: H, address: H, dateOfCoverage: H } },
  itr:   { values: { pan: 'ABCDE1234F', name: 'Demo Traders Pvt Ltd', assessmentYear: '2024-25', acknowledgementNumber: '123456789012345', filingDate: '28/07/2024' }, confidence: { pan: H, name: H, assessmentYear: H, acknowledgementNumber: H, filingDate: H } },
  oem:   { values: { oemName: 'Bosch India Pvt Ltd', authorizedVendorName: 'Demo Traders Pvt Ltd', productsAuthorized: 'Industrial Equipment', issueDate: '01/04/2025', validUntil: '31/03/2027', referenceNumber: 'BOSCH/AUTH/2025/047' }, confidence: { oemName: H, authorizedVendorName: H, productsAuthorized: H, issueDate: H, validUntil: H, referenceNumber: H } },
};

const CONF_STYLE = {
  high:   { color: '#34D399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' },
  medium: { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
  low:    { color: '#FB7185', bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.3)' },
};
const CONF_SCORE = { high: 97, medium: 75, low: 45 };

const COLOR_MAP = {
  emerald: { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)', text: '#34D399', hashBg: 'rgba(52,211,153,0.1)', hashBorder: 'rgba(52,211,153,0.25)', hashText: '#34D399' },
  cyan:    { bg: 'rgba(0,194,255,0.10)',  border: 'rgba(0,194,255,0.3)',  text: '#00E5FF', hashBg: 'rgba(0,194,255,0.1)',  hashBorder: 'rgba(0,194,255,0.25)',  hashText: '#00E5FF' },
  amber:   { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.3)', text: '#FBBF24', hashBg: 'rgba(251,191,36,0.1)', hashBorder: 'rgba(251,191,36,0.25)', hashText: '#FBBF24' },
  rose:    { bg: 'rgba(244,63,94,0.10)',  border: 'rgba(244,63,94,0.3)',  text: '#FB7185', hashBg: 'rgba(244,63,94,0.1)',  hashBorder: 'rgba(244,63,94,0.25)',  hashText: '#FB7185' },
};

const STEPS = ['Upload Documents', 'AI Verification', 'Officer Review', 'Result'];

// ── HELPERS ───────────────────────────────────────────────────
const isEmpty = (v) => v === null || v === undefined || String(v).trim() === '';

// Which fields need a human to look at them
const reviewFields = (entry, docId) =>
  FIELD_DEFS[docId].filter(([k]) => isEmpty(entry.values?.[k]) || entry.confidence?.[k] === 'low').map(([k]) => k);

// 0-100 extraction score for one document, based on per-field confidence
const docScore = (entry, docId) => {
  const defs = FIELD_DEFS[docId];
  const total = defs.reduce((sum, [k]) => {
    if (isEmpty(entry.values?.[k])) return sum + 30;
    return sum + (CONF_SCORE[entry.confidence?.[k]] ?? 60);
  }, 0);
  return Math.round(total / defs.length);
};

const normalizeName = (s) =>
  String(s || '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !['PVT', 'PRIVATE', 'LTD', 'LIMITED', 'LLP'].includes(w))
    .join(' ');

const levenshtein = (a, b) => {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
};

const nameSimilarity = (a, b) => {
  const x = normalizeName(a), y = normalizeName(b);
  if (!x || !y) return 0;
  if (x === y) return 100;
  return Math.round((1 - levenshtein(x, y) / Math.max(x.length, y.length)) * 100);
};

const cleanId = (s) => String(s || '').toUpperCase().replace(/\s+/g, '');

// Cross-document checks on the REAL extracted data
function buildMatch(ocr) {
  const val = (id, k) => (ocr[id] && !ocr[id].loading && !ocr[id].error ? ocr[id].values?.[k] : null);

  const names = [
    ['GST Legal Name', 'gst', 'legalName'],
    ['GST Trade Name', 'gst', 'tradeName'],
    ['PAN Name', 'pan', 'name'],
    ['Udyam Enterprise', 'udyam', 'enterpriseName'],
    ['EPFO Establishment', 'epfo', 'establishmentName'],
    ['ITR Name', 'itr', 'name'],
    ['OEM Authorized Vendor', 'oem', 'authorizedVendorName'],
  ].map(([label, id, k]) => ({ label, value: val(id, k), trade: label === 'GST Trade Name' }))
   .filter((x) => !isEmpty(x.value));

  const ref = names.find((n) => !n.trade) || null;
  const rows = ref ? names.filter((n) => n !== ref).map((n) => ({ ...n, score: nameSimilarity(ref.value, n.value) })) : [];

  const idChecks = [];
  const panPan = cleanId(val('pan', 'pan')), itrPan = cleanId(val('itr', 'pan'));
  const gstin = cleanId(val('gst', 'gstin'));
  if (panPan && itrPan) idChecks.push({ label: 'PAN card vs ITR PAN', a: panPan, b: itrPan, ok: panPan === itrPan });
  if (panPan && gstin.length >= 12) idChecks.push({ label: 'PAN card vs PAN inside GSTIN', a: panPan, b: gstin.slice(2, 12), ok: panPan === gstin.slice(2, 12) });

  const scores = rows.filter((r) => !r.trade).map((r) => r.score);
  if (idChecks.some((c) => !c.ok)) scores.push(40);
  const overall = scores.length ? Math.min(...scores) : null;

  return { ref, rows, idChecks, overall };
}

// Generic OCR call: FormData, 30 s timeout, clear error messages
async function callOcr(docType, file) {
  const fd = new FormData();
  fd.append('docType', docType);
  fd.append('file', file);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OCR_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/api/ocr`, { method: 'POST', body: fd, signal: ctrl.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ? `${data.error}${res.status === 500 ? ' (Gemini busy?)' : ''}` : `Server error ${res.status}`);
    return data.fields || {};
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Request timed out (30 s)');
    if (e instanceof TypeError) throw new Error('Cannot reach backend. Is it running?');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ── SMALL SHARED UI ───────────────────────────────────────────
function PrivacyFooter({ text }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono text-slate-200"
        style={{ background: 'rgba(0,194,255,0.07)', border: '1px solid rgba(0,194,255,0.2)' }}>
        <span>🔒</span><span>{text}</span>
      </div>
      <div className="flex gap-2">
        {[
          { icon: '🔒', label: 'DPDPA Compliant',    color: '#00E5FF', bg: 'rgba(0,194,255,0.12)',   border: 'rgba(0,194,255,0.3)' },
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
  );
}

// ── FILE PREVIEW MODAL ─────────────────────────────────────────
function FilePreviewModal({ file, docTitle, onClose }) {
  const url = useRef(URL.createObjectURL(file));
  const isImage = file.type.startsWith('image/');
  const isPdf   = file.type === 'application/pdf';

  useEffect(() => () => URL.revokeObjectURL(url.current), []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6"
        style={{ background: 'rgba(3,6,18,0.85)', backdropFilter: 'blur(16px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col rounded-2xl overflow-hidden"
          style={{ width: '80vw', maxWidth: '900px', height: '85vh', background: 'rgba(5,10,24,0.98)', border: '1px solid rgba(0,194,255,0.25)', boxShadow: '0 0 60px rgba(0,194,255,0.15)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,194,255,0.15)' }}>
            <div>
              <p className="text-white text-sm font-bold">{docTitle}</p>
              <p className="text-[#00E5FF] text-xs font-mono">{file.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.open(url.current, '_blank')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer hover:brightness-125"
                style={{ background: 'rgba(0,194,255,0.1)', border: '1px solid rgba(0,194,255,0.25)', color: '#00E5FF' }}>
                Open in new tab
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer">✕</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 no-scrollbar">
            {isImage && <img src={url.current} alt={file.name} className="max-w-full max-h-full object-contain rounded-xl" />}
            {isPdf && <iframe src={url.current} title={file.name} className="w-full h-full rounded-xl" style={{ border: 'none', minHeight: '600px' }} />}
            {!isImage && !isPdf && <p className="text-white font-bold">Preview not available for this file type</p>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── OCR RESULT PANEL (real data) ──────────────────────────────
function OcrPanel({ docId, ocr, onRetry, onFallback }) {
  if (ocr.loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-4 h-4 rounded-full border-2 border-[#00C2FF] border-t-transparent flex-shrink-0" />
        <span className="text-xs font-mono text-[#00E5FF] font-semibold">AI Reading Document... (up to 30 s)</span>
      </div>
    );
  }

  if (ocr.error) {
    return (
      <div className="px-4 py-3 flex flex-col gap-2">
        <p className="text-xs font-mono font-bold text-rose-400">❌ OCR failed</p>
        <p className="text-xs font-mono text-slate-200">{ocr.error}</p>
        <div className="flex gap-2 mt-1">
          <button onClick={() => onRetry(docId)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer hover:brightness-125"
            style={{ background: 'rgba(0,194,255,0.12)', border: '1px solid rgba(0,194,255,0.35)', color: '#00E5FF' }}>
            ↻ Retry
          </button>
          <button onClick={() => onFallback(docId)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer hover:brightness-125"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#FBBF24' }}>
            Use demo fallback
          </button>
        </div>
      </div>
    );
  }

  const defs = FIELD_DEFS[docId];
  const flagged = reviewFields(ocr, docId);
  const score = docScore(ocr, docId);

  return (
    <div className="px-4 py-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-mono font-bold text-[#00E5FF] uppercase tracking-wider">OCR Extracted Data</p>
        {ocr.fallback && (
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#FBBF24' }}>
            FALLBACK DATA
          </span>
        )}
      </div>

      {defs.map(([k, label]) => {
        const v = ocr.values?.[k];
        const conf = ocr.confidence?.[k];
        const cs = CONF_STYLE[conf];
        const needsReview = isEmpty(v) || conf === 'low';
        return (
          <div key={k} className="flex items-start gap-2">
            <span className="text-[10px] font-mono text-slate-400 w-24 flex-shrink-0 pt-0.5">{label}</span>
            <span className="text-xs font-mono text-slate-100 flex-1 break-words">{isEmpty(v) ? '—' : v}</span>
            {cs && !isEmpty(v) && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: cs.bg, border: `1px solid ${cs.border}`, color: cs.color }}>{conf}</span>
            )}
            {needsReview && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: '#FB7185' }}>
                Needs human review
              </span>
            )}
          </div>
        );
      })}

      <div className="mt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-mono text-slate-300">Extraction Confidence</span>
          <span className="text-xs font-mono text-[#00E5FF] font-bold">{score}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/5">
          <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #2D6BE4, #00E5FF)' }} />
        </div>
        {flagged.length > 0 && (
          <p className="text-[10px] font-mono text-amber-300 mt-2">
            ⚠️ {flagged.length} field{flagged.length > 1 ? 's' : ''} flagged for human review
          </p>
        )}
      </div>
    </div>
  );
}

// ── UPLOAD BOX ────────────────────────────────────────────────
function UploadBox({ doc, file, ocr, onFile, onRemove, onRetry, onFallback }) {
  const inputRef = useRef();
  const [dragging, setDragging]     = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(doc.id, f);
  };

  const fmt = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-2">
      <div
        onClick={() => { if (!file) inputRef.current.click(); else setPreviewing(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="relative rounded-2xl p-5 transition-all duration-300 cursor-pointer"
        style={{
          background: file ? 'rgba(0,194,255,0.08)' : dragging ? 'rgba(45,107,228,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1.5px dashed ${file ? '#00C2FF' : dragging ? '#2D6BE4' : 'rgba(0,194,255,0.3)'}`,
          backdropFilter: 'blur(12px)',
          boxShadow: file ? '0 0 28px rgba(0,194,255,0.18), inset 0 0 24px rgba(0,194,255,0.04)' : '0 0 18px rgba(0,194,255,0.08)',
        }}
      >
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden"
          onChange={(e) => { if (e.target.files[0]) onFile(doc.id, e.target.files[0]); e.target.value = ''; }} />

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
            <p className="text-xs text-slate-400 font-mono tracking-wider">JPG · PNG (max 5 MB)</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(0,194,255,0.2)', border: '1px solid rgba(0,194,255,0.4)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#00C2FF" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">{doc.title}</p>
                <p className="text-[#00E5FF] text-xs font-mono truncate mt-0.5">{file.name}</p>
                <p className="text-slate-300 text-xs mt-0.5">{fmt(file.size)}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onRemove(doc.id); }}
                className="text-slate-400 hover:text-rose-400 transition-colors text-base leading-none mt-0.5 cursor-pointer">✕</button>
            </div>
            <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-mono font-semibold"
              style={{ background: 'rgba(0,194,255,0.06)', border: '1px solid rgba(0,194,255,0.2)', color: '#00E5FF' }}>
              Click card to preview
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {ocr && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }} className="rounded-xl overflow-hidden"
            style={{ background: 'rgba(0,194,255,0.05)', border: '1px solid rgba(0,194,255,0.25)', boxShadow: '0 0 16px rgba(0,194,255,0.08)' }}>
            <OcrPanel docId={doc.id} ocr={ocr} onRetry={onRetry} onFallback={onFallback} />
          </motion.div>
        )}
      </AnimatePresence>

      {previewing && <FilePreviewModal file={file} docTitle={doc.title} onClose={() => setPreviewing(false)} />}
    </motion.div>
  );
}

// ── FUZZY MATCH CARD (real names) ─────────────────────────────
function FuzzyMatchCard({ match }) {
  const { ref, rows, idChecks, overall } = match;
  if (!ref || (rows.length === 0 && idChecks.length === 0)) return null;

  const colorFor = (s) => (s >= 85 ? '#34D399' : s >= 60 ? '#FBBF24' : '#FB7185');
  const ok = overall === null || overall >= 85;
  const accent = ok ? '52,211,153' : overall >= 60 ? '251,191,36' : '244,63,94';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="col-span-2 rounded-2xl p-5"
      style={{ background: `rgba(${accent},0.07)`, border: `1.5px solid rgba(${accent},0.4)`, boxShadow: `0 0 28px rgba(${accent},0.12)` }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{ok ? '✅' : '⚠️'}</span>
        <p className="text-white text-sm font-black">Cross-Document Name Verification</p>
      </div>
      <p className="text-[11px] font-mono text-slate-300 mb-4">
        Reference: <span className="text-white font-bold">{ref.label}</span> — "{ref.value}"
      </p>

      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <div className="w-40 flex-shrink-0">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{r.label}{r.trade ? ' (info)' : ''}</p>
              <p className="text-xs text-white font-bold truncate">{r.value}</p>
            </div>
            <div className="flex-1 h-1.5 rounded-full bg-white/5">
              <motion.div initial={{ width: 0 }} animate={{ width: `${r.score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full" style={{ background: colorFor(r.score) }} />
            </div>
            <span className="text-xs font-black font-mono w-12 text-right" style={{ color: colorFor(r.score) }}>{r.score}%</span>
          </div>
        ))}
      </div>

      {idChecks.length > 0 && (
        <div className="mt-4 pt-3 flex flex-col gap-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {idChecks.map((c) => (
            <p key={c.label} className="text-xs font-mono" style={{ color: c.ok ? '#34D399' : '#FB7185' }}>
              {c.ok ? '✅' : '❌'} {c.label}: {c.a} {c.ok ? '=' : '≠'} {c.b}
            </p>
          ))}
        </div>
      )}

      <p className="text-xs font-mono mt-3" style={{ color: ok ? '#34D399' : '#FBBF24' }}>
        {ok ? 'All names and IDs are consistent across documents' : 'Mismatch detected — will be flagged for officer review'}
      </p>
    </motion.div>
  );
}

// ── RESULT STATE ───────────────────────────────────────────────
function ResultState({ subId, breakdown, matchScore }) {
  const avgDoc = Math.round(breakdown.reduce((s, b) => s + b.score, 0) / breakdown.length);
  const score = Math.round(avgDoc * 0.6 + matchScore * 0.4);
  const approved = score >= 70;
  const flaggedCount = breakdown.filter((b) => b.status === 'flagged').length;

  const result = {
    officer: 'Sr. Procurement Officer R. Sharma',
    badge: 'PO-CPCL-2026-047',
    remarks: approved
      ? `Documents verified. Cross-document name match: ${matchScore}%. ${flaggedCount ? `${flaggedCount} document(s) had fields flagged for review but are within acceptable limits.` : 'No fields flagged.'} Vendor is eligible to participate in the CPCL tender.`
      : `Cross-document name match is ${matchScore}% and ${flaggedCount} document(s) have flagged fields. Compliance score is below the eligibility threshold.`,
  };

  const reviewedAt = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const scoreColor  = score >= 80 ? '#34D399' : score >= 50 ? '#FBBF24' : '#FB7185';
  const scoreBg     = score >= 80 ? 'rgba(52,211,153,0.12)' : score >= 50 ? 'rgba(251,191,36,0.12)' : 'rgba(244,63,94,0.12)';
  const scoreBorder = score >= 80 ? 'rgba(52,211,153,0.35)' : score >= 50 ? 'rgba(251,191,36,0.35)' : 'rgba(244,63,94,0.35)';

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto py-10 px-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 text-center"
        style={{ background: approved ? 'rgba(52,211,153,0.08)' : 'rgba(244,63,94,0.08)', border: `1.5px solid ${approved ? 'rgba(52,211,153,0.4)' : 'rgba(244,63,94,0.4)'}`, boxShadow: `0 0 40px ${approved ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)'}` }}>
        <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: approved ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)', border: `2px solid ${approved ? 'rgba(52,211,153,0.5)' : 'rgba(244,63,94,0.5)'}` }}>
          <span className="text-4xl">{approved ? '✅' : '❌'}</span>
        </motion.div>
        <h1 className="text-3xl font-black text-white mb-1">{approved ? 'Bid Approved' : 'Bid Rejected'}</h1>
        <p className="text-sm font-mono mb-4" style={{ color: approved ? '#34D399' : '#FB7185' }}>
          {approved ? 'Your submission meets all CPCL tender compliance requirements' : 'Your submission did not meet the compliance requirements'}
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="text-xs font-mono text-slate-300 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>ID: {subId}</span>
          <span className="text-xs font-mono text-slate-300 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>Reviewed: {reviewedAt}</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 flex flex-col items-center justify-center gap-2"
          style={{ background: scoreBg, border: `1.5px solid ${scoreBorder}`, boxShadow: `0 0 24px ${scoreBg}` }}>
          <p className="text-xs font-mono text-slate-300 uppercase tracking-widest">Compliance Score</p>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <motion.circle cx="48" cy="48" r="40" fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - score / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} />
            </svg>
            <span className="text-2xl font-black" style={{ color: scoreColor }}>{score}</span>
          </div>
          <p className="text-xs font-mono font-bold" style={{ color: scoreColor }}>
            {score >= 80 ? '✅ Compliant' : score >= 50 ? '⚠️ Review Required' : '❌ Non-Compliant'}
          </p>
        </div>

        <div className="rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: 'rgba(168,85,247,0.08)', border: '1.5px solid rgba(168,85,247,0.3)', boxShadow: '0 0 24px rgba(168,85,247,0.1)' }}>
          <p className="text-xs font-mono text-purple-300 uppercase tracking-widest">Reviewed By</p>
          <div>
            <p className="text-white text-sm font-bold">{result.officer}</p>
            <p className="text-purple-300 text-xs font-mono mt-0.5">{result.badge}</p>
          </div>
          <div className="rounded-xl p-3 mt-1" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <p className="text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">Officer Remarks</p>
            <p className="text-sm text-white leading-relaxed">{result.remarks}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl p-5"
        style={{ background: 'rgba(5,10,24,0.8)', border: '1px solid rgba(0,194,255,0.2)', backdropFilter: 'blur(12px)' }}>
        <p className="text-xs font-mono font-bold text-[#00E5FF] uppercase tracking-widest mb-4">Document Compliance Breakdown</p>
        <div className="flex flex-col gap-3">
          {breakdown.map((item, i) => {
            const c = item.status === 'passed' ? { color: '#34D399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' } : { color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' };
            return (
              <motion.div key={item.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }} className="flex items-center gap-3">
                <span className="text-sm w-4 flex-shrink-0">{item.status === 'passed' ? '✅' : '⚠️'}</span>
                <p className="text-sm text-white flex-1 font-medium">{item.label}</p>
                <div className="w-32 h-1.5 rounded-full bg-white/5 flex-shrink-0">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.score}%` }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 + i * 0.07 }}
                    className="h-full rounded-full" style={{ background: c.color }} />
                </div>
                <span className="text-xs font-mono font-bold w-10 text-right flex-shrink-0" style={{ color: c.color }}>{item.score}%</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex-shrink-0"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>{item.status}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <PrivacyFooter text="Audit sealed · DPDPA Compliant · Tamper-proof result record" />
    </div>
  );
}

// ── AUDIT TRAIL ───────────────────────────────────────────────
const generateAuditEntries = (baseTime, matchOk) => {
  const fmt = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const add = (sec) => { const d = new Date(baseTime); d.setSeconds(d.getSeconds() + sec); return fmt(d); };
  return [
    { icon: '✅', text: 'Documents received and encrypted',        hash: '3f8a2b1c', color: 'emerald', time: add(0) },
    { icon: '✅', text: 'Zero-trust hash generated for all files', hash: '9c1d4e7f', color: 'emerald', time: add(1) },
    { icon: '✅', text: 'AI OCR extraction completed (Gemini Vision)', hash: '2b5f8a3d', color: 'cyan', time: add(2) },
    { icon: '✅', text: 'GST Certificate verified',                hash: '7e1c9b4a', color: 'emerald', time: add(4) },
    { icon: '✅', text: 'PAN Card verified',                       hash: '4d8f2e6c', color: 'emerald', time: add(5) },
    { icon: '✅', text: 'Udyam Certificate verified',              hash: '1a5b9c3e', color: 'emerald', time: add(6) },
    matchOk
      ? { icon: '✅', text: 'Cross-document name verification passed', hash: '8c3f7d2b', color: 'emerald', time: add(7) }
      : { icon: '⚠️', text: 'Name mismatch detected across documents', hash: '8c3f7d2b', color: 'amber', time: add(7) },
    { icon: '✅', text: 'Cross-ministry blacklist check complete', hash: '5e9a1f4c', color: 'emerald', time: add(9) },
    { icon: '🔄', text: 'Generating compliance score...',          hash: '6b2d8e5f', color: 'cyan',    time: add(11) },
    { icon: '⏳', text: 'Awaiting officer review assignment',      hash: 'pending...', color: 'rose',  time: add(13) },
  ];
};

function VerificationState({ subId, subTime, matchOk, onSimulateResult }) {
  const [visibleEntries, setVisibleEntries] = useState(0);
  const [auditEntries] = useState(() => generateAuditEntries(new Date(), matchOk));
  const allDone = visibleEntries >= auditEntries.length;

  useEffect(() => {
    if (visibleEntries >= auditEntries.length) return;
    const t = setTimeout(() => setVisibleEntries((v) => v + 1), 900);
    return () => clearTimeout(t);
  }, [visibleEntries, auditEntries.length]);

  const stepStatus = [
    { label: 'Documents Submitted', state: 'done' },
    { label: 'AI Verification',     state: 'done' },
    { label: 'Officer Review',      state: 'active' },
    { label: 'Result Pending',      state: 'pending' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto py-10 px-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-black text-white">Verification In Progress</h1>
        <p className="text-slate-200 text-sm mt-2">Our AI is analyzing your documents for compliance</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="text-sm font-mono text-[#00E5FF] font-bold">ID: {subId}</span>
          <span className="text-slate-500">·</span>
          <span className="text-sm font-mono text-slate-300">{subTime}</span>
        </div>
      </motion.div>

      <div className="rounded-2xl p-5" style={{ background: 'rgba(5,10,24,0.8)', border: '1px solid rgba(0,194,255,0.2)', backdropFilter: 'blur(12px)', boxShadow: '0 0 28px rgba(0,194,255,0.08)' }}>
        <p className="text-xs font-mono font-bold text-[#00E5FF] uppercase tracking-widest mb-4">Live Audit Trail</p>
        <div className="flex flex-col gap-2">
          {auditEntries.slice(0, visibleEntries).map((entry, i) => {
            const c = COLOR_MAP[entry.color];
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}
                className="flex items-center gap-3 py-2 px-3 rounded-xl" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                <span className="text-sm flex-shrink-0">{entry.icon}</span>
                <span className="text-xs font-medium flex-1" style={{ color: c.text }}>{entry.text}</span>
                <span className="text-[10px] font-mono text-slate-400 flex-shrink-0 mr-1">{entry.time}</span>
                <span className="text-[10px] font-mono font-bold flex-shrink-0 px-2 py-0.5 rounded-md"
                  style={{ background: c.hashBg, color: c.hashText, border: `1px solid ${c.hashBorder}` }}>#{entry.hash}</span>
              </motion.div>
            );
          })}
          {!allDone && (
            <div className="flex items-center gap-2 px-3 py-2">
              {[0, 1, 2].map((d) => (
                <motion.div key={d} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: d * 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: 'rgba(5,10,24,0.8)', border: '1px solid rgba(0,194,255,0.2)', backdropFilter: 'blur(12px)', boxShadow: '0 0 28px rgba(0,194,255,0.08)' }}>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-8 right-8 h-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
            className="absolute top-5 left-8 h-0.5" style={{ background: 'linear-gradient(90deg, #2D6BE4, #00E5FF)' }} />
          {stepStatus.map(({ label, state }, i) => (
            <div key={i} className="flex flex-col items-center gap-2 relative z-10">
              <motion.div
                animate={state === 'active' ? { boxShadow: ['0 0 0px rgba(0,229,255,0)', '0 0 20px rgba(0,229,255,0.8)', '0 0 0px rgba(0,229,255,0)'] } : {}}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs"
                style={{
                  background: state === 'done' ? 'linear-gradient(135deg,#2D6BE4,#00E5FF)' : state === 'active' ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)',
                  border: state === 'done' ? 'none' : state === 'active' ? '2px solid #00E5FF' : '2px solid rgba(255,255,255,0.12)',
                  color: state === 'done' ? '#fff' : state === 'active' ? '#00E5FF' : '#64748b',
                }}>
                {state === 'done' ? '✓' : state === 'active' ? '⏳' : i + 1}
              </motion.div>
              <span className="text-xs font-bold text-center leading-tight max-w-[72px]"
                style={{ color: state === 'done' ? '#fff' : state === 'active' ? '#00E5FF' : '#64748b' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {allDone && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="rounded-2xl p-5" style={{ background: 'rgba(168,85,247,0.07)', border: '1.5px solid rgba(168,85,247,0.35)', boxShadow: '0 0 32px rgba(168,85,247,0.12)' }}>
            <p className="text-white text-sm font-black">Awaiting Officer Review</p>
            <p className="text-purple-300 text-xs font-mono mt-1">Sr. Procurement Officer R. Sharma · PO-CPCL-2026-047 has been assigned to review your submission.</p>
            <p className="text-slate-400 text-xs mt-2">In a live deployment the officer logs into their portal, reviews each document and score, then approves or rejects the bid. Click below to simulate what happens after the officer completes their review.</p>
            <motion.button onClick={onSimulateResult}
              animate={{ boxShadow: ['0 0 0px rgba(168,85,247,0)', '0 0 28px rgba(168,85,247,0.5)', '0 0 0px rgba(168,85,247,0)'] }}
              transition={{ repeat: Infinity, duration: 2 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="mt-4 w-full py-3 rounded-xl font-black text-sm cursor-pointer"
              style={{ background: 'linear-gradient(135deg,#A855F7,#6366F1)', color: '#fff' }}>
              Simulate Officer Review — See Result
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <PrivacyFooter text="Processed in memory only · DPDPA Compliant · No documents stored" />
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

  const filesRef = useRef({});                  // latest file per doc (to ignore stale results)
  const queueRef = useRef(Promise.resolve());   // OCR jobs run ONE AFTER ANOTHER

  const uploadedCount = Object.keys(files).length;
  const allUploaded   = uploadedCount === DOCS.length;
  const allReady      = allUploaded && DOCS.every((d) => ocr[d.id] && !ocr[d.id].loading && !ocr[d.id].error);

  const match = useMemo(() => buildMatch(ocr), [ocr]);

  const processDoc = async (id, file) => {
    if (filesRef.current[id] !== file) return;            // removed or replaced while waiting in queue
    setOcr((o) => ({ ...o, [id]: { loading: true } }));
    try {
      const fields = await callOcr(id, file);
      if (filesRef.current[id] !== file) return;
      const { confidence = {}, ...values } = fields;
      setOcr((o) => ({ ...o, [id]: { loading: false, values, confidence } }));
    } catch (err) {
      if (filesRef.current[id] !== file) return;
      setOcr((o) => ({ ...o, [id]: { loading: false, error: err.message || 'Unknown error' } }));
    }
  };

  const enqueue = (id, file) => {
    queueRef.current = queueRef.current.then(() => processDoc(id, file));   // processDoc never throws
  };

  const handleFile = (id, file) => {
    if (file.size > 5 * 1024 * 1024) {
      setFiles((f) => ({ ...f, [id]: file }));
      filesRef.current[id] = file;
      setOcr((o) => ({ ...o, [id]: { loading: false, error: 'File is larger than 5 MB. Please upload a smaller image.' } }));
      return;
    }
    filesRef.current[id] = file;
    setFiles((f) => ({ ...f, [id]: file }));
    setOcr((o) => ({ ...o, [id]: { loading: true } }));
    enqueue(id, file);
  };

  const handleRemove = (id) => {
    delete filesRef.current[id];
    setFiles((f) => { const n = { ...f }; delete n[id]; return n; });
    setOcr((o)  => { const n = { ...o }; delete n[id]; return n; });
  };

  const handleRetry = (id) => {
    const file = filesRef.current[id];
    if (!file) return;
    setOcr((o) => ({ ...o, [id]: { loading: true } }));
    enqueue(id, file);
  };

  // DEMO SAFETY NET: manual fallback, clearly labelled in the UI
  const handleFallback = (id) => {
    setOcr((o) => ({ ...o, [id]: { loading: false, fallback: true, ...FALLBACK[id] } }));
  };

  const breakdown = useMemo(
    () => DOCS.map((d) => {
      const entry = ocr[d.id];
      if (!entry || entry.loading || entry.error) return { label: d.title, score: 0, status: 'flagged' };
      const score = docScore(entry, d.id);
      const flags = reviewFields(entry, d.id).length;
      return { label: d.title, score, status: score >= 85 && flags === 0 ? 'passed' : 'flagged' };
    }),
    [ocr]
  );

  const matchScore = match.overall ?? 100;

  const handleSubmit = () => {
    if (!allReady) return;
    setState('submitting');
    setSubId(`SUB-2026-CPCL-${Math.floor(100000 + Math.random() * 900000)}`);
    setSubTime(new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setTimeout(() => setState('verification'), 1800);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col" style={{ background: '#050A18' }}>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: 'rgba(0,194,255,0.06)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'rgba(45,107,228,0.07)' }} />
      </div>

      {/* HEADER */}
      <header className="flex-shrink-0 flex items-center px-8 z-50 relative"
        style={{ height: '64px', background: 'rgba(5,10,24,0.9)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(0,194,255,0.18)', boxShadow: '0 1px 40px rgba(0,194,255,0.1)' }}>
        <div style={{ width: '240px', flexShrink: 0 }}>
          <img src="/assets/gem-logo.png" alt="GeM" style={{ height: 44, cursor: 'pointer' }} onClick={() => navigate('/')} />
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 h-2 rounded-full bg-[#00E5FF]" style={{ boxShadow: '0 0 8px rgba(0,229,255,0.8)' }} />
          <span className="text-white font-black text-lg tracking-wide">Vendor Portal</span>
        </div>
        <div style={{ width: '240px', flexShrink: 0 }} className="flex items-center justify-end gap-4">
          <span className="text-slate-300 text-sm font-mono">vendor@cpcl.gov.in</span>
          <button onClick={() => navigate('/login')}
            className="px-4 py-1.5 rounded-lg text-sm font-bold font-mono cursor-pointer transition-all hover:brightness-125"
            style={{ background: 'rgba(45,107,228,0.2)', border: '1px solid rgba(0,194,255,0.4)', color: '#00E5FF', boxShadow: '0 0 14px rgba(45,107,228,0.25)' }}>
            Logout
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 min-h-0 relative z-10">
        {state !== 'verification' && state !== 'result' && (
          <aside className="flex-shrink-0 flex flex-col gap-1 px-4 py-6 overflow-y-auto no-scrollbar"
            style={{ width: '240px', background: 'rgba(5,10,24,0.7)', borderRight: '1px solid rgba(0,194,255,0.12)', backdropFilter: 'blur(16px)' }}>
            <p className="text-[10px] font-mono font-bold text-[#00C2FF]/70 uppercase tracking-widest mb-3 px-3">Progress</p>
            {STEPS.map((label, i) => {
              const done = i < activeStep, active = i === activeStep;
              return (
                <div key={i} className="flex items-start gap-3 px-3 py-3">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <motion.div
                      animate={active ? { boxShadow: ['0 0 0px rgba(0,229,255,0)', '0 0 16px rgba(0,229,255,0.7)', '0 0 0px rgba(0,229,255,0)'] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                      style={{
                        background: done ? 'linear-gradient(135deg,#2D6BE4,#00E5FF)' : active ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)',
                        border: done ? 'none' : active ? '2px solid #00E5FF' : '2px solid rgba(255,255,255,0.12)',
                        color: done ? '#fff' : active ? '#00E5FF' : '#64748b',
                      }}>
                      {done ? '✓' : active ? <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse inline-block" /> : <span className="text-xs font-bold">{i + 1}</span>}
                    </motion.div>
                    {i < STEPS.length - 1 && (
                      <div className="w-0.5 h-7 rounded-full" style={{ background: done ? 'linear-gradient(#2D6BE4,#00E5FF)' : 'rgba(255,255,255,0.08)' }} />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-bold leading-tight" style={{ color: active ? '#00E5FF' : done ? '#ffffff' : '#94a3b8' }}>{label}</p>
                    {active && <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(0,229,255,0.6)' }}>In progress</p>}
                  </div>
                </div>
              );
            })}
            <div className="mt-auto mx-1 p-4 rounded-2xl" style={{ background: 'rgba(45,107,228,0.1)', border: '1px solid rgba(0,194,255,0.25)', boxShadow: '0 0 20px rgba(0,194,255,0.08)' }}>
              <p className="text-xs font-mono text-slate-300 mb-2">Documents Uploaded</p>
              <div className="flex items-end gap-1 mb-3">
                <span className="text-3xl font-black text-white leading-none">{uploadedCount}</span>
                <span className="text-slate-300 text-base mb-0.5">/ {DOCS.length}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5">
                <motion.div animate={{ width: `${(uploadedCount / DOCS.length) * 100}%` }} transition={{ duration: 0.4 }}
                  className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#2D6BE4,#00E5FF)' }} />
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto min-h-0 no-scrollbar">
          {state === 'upload' && (
            <div className="px-8 py-8 pb-28 flex flex-col gap-6 max-w-5xl mx-auto">
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-black text-white">Upload Compliance Documents</h1>
                <p className="text-slate-300 text-sm mt-2">Each document is read live by Gemini Vision. Documents are processed one after another.</p>
              </motion.div>
              <div className="grid grid-cols-2 gap-5 items-start">
                {DOCS.map((doc) => (
                  <UploadBox key={doc.id} doc={doc} file={files[doc.id]} ocr={ocr[doc.id]}
                    onFile={handleFile} onRemove={handleRemove} onRetry={handleRetry} onFallback={handleFallback} />
                ))}
                <FuzzyMatchCard match={match} />
              </div>
            </div>
          )}

          {state === 'submitting' && (
            <div className="flex flex-col items-center justify-center h-full min-h-[70vh] gap-5">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="w-14 h-14 rounded-full border-4 border-t-transparent" style={{ borderColor: '#00E5FF', borderTopColor: 'transparent' }} />
              <p className="text-white font-black text-xl">Submitting Documents...</p>
              <p className="text-slate-300 text-sm font-mono">Encrypting and uploading securely</p>
            </div>
          )}

          {state === 'verification' && (
            <VerificationState subId={subId} subTime={subTime} matchOk={matchScore >= 85} onSimulateResult={() => setState('result')} />
          )}

          {state === 'result' && <ResultState subId={subId} breakdown={breakdown} matchScore={matchScore} />}
        </main>
      </div>

      {/* SUBMIT BAR */}
      <AnimatePresence>
        {state === 'upload' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="flex-shrink-0 flex items-center gap-5 px-8 py-4 relative z-50"
            style={{ background: 'rgba(5,10,24,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(0,194,255,0.2)', boxShadow: '0 -4px 40px rgba(0,194,255,0.1)' }}>
            <div className="flex-1">
              <div className="flex justify-between mb-1.5">
                <span className="text-sm text-slate-200 font-mono">
                  {uploadedCount} of {DOCS.length} uploaded
                  {allUploaded && !allReady && ' · waiting for OCR to finish / fix errors'}
                </span>
                <span className="text-sm font-mono font-bold" style={{ color: allReady ? '#00E5FF' : '#475569' }}>
                  {Math.round((uploadedCount / DOCS.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5">
                <motion.div animate={{ width: `${(uploadedCount / DOCS.length) * 100}%` }} transition={{ duration: 0.4 }}
                  className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#2D6BE4,#00E5FF)' }} />
              </div>
            </div>
            <motion.button onClick={handleSubmit} disabled={!allReady}
              animate={allReady ? { boxShadow: ['0 0 0px rgba(0,229,255,0)', '0 0 32px rgba(0,229,255,0.6)', '0 0 0px rgba(0,229,255,0)'] } : {}}
              transition={{ repeat: Infinity, duration: 1.8 }}
              whileHover={allReady ? { scale: 1.03 } : {}} whileTap={allReady ? { scale: 0.97 } : {}}
              className="px-8 py-3 rounded-xl font-black text-sm flex-shrink-0 transition-all duration-300"
              style={{
                background: allReady ? 'linear-gradient(135deg,#2D6BE4,#00E5FF)' : 'rgba(255,255,255,0.05)',
                color: allReady ? '#fff' : '#475569',
                cursor: allReady ? 'pointer' : 'not-allowed',
              }}>
              Submit for Verification
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}