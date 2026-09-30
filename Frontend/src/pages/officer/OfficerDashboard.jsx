import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getRecord, decide, toOfficerVendor, clearRecord } from '../../utils/storage';

// ── COLORS (ShipSense-inspired, purple accent) ────────────────
const C = {
  bg: '#050A18',
  bgDeep: '#080D1F',
  bgCard: 'rgba(12,16,35,0.9)',
  purple: '#A855F7',
  purpleDark: '#7C3AED',
  purpleLight: 'rgba(168,85,247,0.12)',
  purpleBorder: 'rgba(168,85,247,0.25)',
  cyan: '#00E5FF',
  green: '#34D399',
  amber: '#FBBF24',
  rose: '#FB7185',
  ink: '#FFFFFF',
  inkMid: '#CBD5E1',
  inkLight: '#64748B',
  inkFaint: 'rgba(255,255,255,0.15)',
  border: 'rgba(168,85,247,0.15)',
  borderLight: 'rgba(255,255,255,0.06)',
};

// ── BUILT-IN SAMPLE VENDORS (always shown; a live submission is added on top) ──
const VENDORS = [
  {
    id: 'SUB-2026-CPCL-482910',
    name: 'Demo Vendors Pvt Ltd',
    email: 'vendor@cpcl.gov.in',
    score: 82,
    risk: 'LOW',
    submittedAt: '27 Jan 2026, 14:23:09',
    issue: 'Minor EPFO name variation',
    documents: [
      { label: 'GST Certificate',   value: 'GSTIN: 27AAPFU0939F1ZV',   status: 'passed',  confidence: 94 },
      { label: 'PAN Card',          value: 'PAN: AAPFU0939F',           status: 'passed',  confidence: 97 },
      { label: 'Udyam Certificate', value: 'UDYAM-MH-10-0012345',       status: 'passed',  confidence: 91 },
      { label: 'EPFO Compliance',   value: 'Name variation detected',    status: 'flagged', confidence: 67 },
      { label: 'Income Tax Return', value: 'AY 2024-25 · ₹1.24 Cr',    status: 'passed',  confidence: 96 },
      { label: 'OEM Authorization', value: 'Bosch India Pvt Ltd',       status: 'passed',  confidence: 89 },
    ],
    fuzzy: { gst: 'Demo Vendors Pvt Ltd', pan: 'Demo Vendor Private Limited', score: 87 },
    ai: 'Vendor has valid GST and PAN credentials with high confidence. EPFO registered name has 87% similarity with GST name — likely a data entry inconsistency rather than fraud. Income tax turnover of ₹1.24 Cr meets the tender threshold. Cross-ministry blacklist check passed with no flags. Overall risk classification: LOW. Recommendation: Approve bid with a note on EPFO name variation for record.',
  },
  {
    id: 'SUB-2026-CPCL-391847',
    name: 'Ravi Enterprises Pvt Ltd',
    email: 'ravi@enterprises.in',
    score: 61,
    risk: 'MEDIUM',
    submittedAt: '27 Jan 2026, 11:45:32',
    issue: 'GST filing gap + turnover below threshold',
    documents: [
      { label: 'GST Certificate',   value: 'GSTIN: 29AABCR1234F1ZK',   status: 'passed',  confidence: 88 },
      { label: 'PAN Card',          value: 'PAN: AABCR1234F',           status: 'passed',  confidence: 91 },
      { label: 'Udyam Certificate', value: 'UDYAM-KA-05-0054321',       status: 'passed',  confidence: 84 },
      { label: 'EPFO Compliance',   value: 'Compliant · 12 employees',  status: 'passed',  confidence: 79 },
      { label: 'Income Tax Return', value: 'AY 2024-25 · ₹38 Lakh',    status: 'flagged', confidence: 72 },
      { label: 'OEM Authorization', value: 'Filing gap: Q2 2024',       status: 'flagged', confidence: 55 },
    ],
    fuzzy: { gst: 'Ravi Enterprises Pvt Ltd', pan: 'Ravi Enterprises Private Ltd', score: 93 },
    ai: 'Vendor GST and PAN documents are valid. However income tax return shows a turnover of ₹38 Lakh which is below the minimum tender threshold of ₹50 Lakh. Additionally a GST filing gap was detected in Q2 2024 which raises compliance concerns. Cross-ministry blacklist check passed. Overall risk: MEDIUM. Recommendation: Flag for manual review — request updated financial documents before approval.',
  },
  {
    id: 'SUB-2026-CPCL-204736',
    name: 'XYZ Traders Ltd',
    email: 'xyz@traders.co.in',
    score: 23,
    risk: 'HIGH',
    submittedAt: '27 Jan 2026, 09:12:44',
    issue: 'Blacklisted entity + PAN mismatch',
    documents: [
      { label: 'GST Certificate',   value: 'GSTIN: 07AAACX9876F1ZP',        status: 'flagged', confidence: 61 },
      { label: 'PAN Card',          value: 'PAN mismatch detected',           status: 'failed',  confidence: 31 },
      { label: 'Udyam Certificate', value: 'Certificate expired 2023',        status: 'failed',  confidence: 45 },
      { label: 'EPFO Compliance',   value: 'Non-compliant since Q3 2023',    status: 'failed',  confidence: 38 },
      { label: 'Income Tax Return', value: 'Not filed AY 2024-25',            status: 'failed',  confidence: 22 },
      { label: 'OEM Authorization', value: 'Document tampered — hash fail',  status: 'failed',  confidence: 18 },
    ],
    fuzzy: { gst: 'XYZ Traders Ltd', pan: 'XYZ Trade Solutions Pvt Ltd', score: 52 },
    ai: 'CRITICAL: This vendor has been flagged in the cross-ministry blacklist database — previously debarred by Ministry of Railways in 2024. PAN card name does not match GST registration with only 52% similarity. Udyam certificate has expired. ITR for AY 2024-25 has not been filed. OEM authorization document failed zero-trust hash verification indicating possible tampering. Overall risk: HIGH. Recommendation: Reject bid immediately and report to procurement compliance cell.',
  },
];

// ── HELPERS ───────────────────────────────────────────────────
const scoreColor  = (s) => s >= 75 ? C.green  : s >= 50 ? C.amber  : C.rose;
const scoreBg     = (s) => s >= 75 ? 'rgba(52,211,153,0.12)'  : s >= 50 ? 'rgba(251,191,36,0.12)'  : 'rgba(244,63,94,0.12)';
const scoreBorder = (s) => s >= 75 ? 'rgba(52,211,153,0.35)'  : s >= 50 ? 'rgba(251,191,36,0.35)'  : 'rgba(244,63,94,0.35)';
const riskColor   = (r) => r === 'LOW' ? C.green : r === 'MEDIUM' ? C.amber : C.rose;
const riskBg      = (r) => r === 'LOW' ? 'rgba(52,211,153,0.1)' : r === 'MEDIUM' ? 'rgba(251,191,36,0.1)' : 'rgba(244,63,94,0.1)';
const riskBorder  = (r) => r === 'LOW' ? 'rgba(52,211,153,0.3)' : r === 'MEDIUM' ? 'rgba(251,191,36,0.3)' : 'rgba(244,63,94,0.3)';
const docColor    = (s) => s === 'passed' ? C.green : s === 'flagged' ? C.amber : C.rose;
const docBg       = (s) => s === 'passed' ? 'rgba(52,211,153,0.1)' : s === 'flagged' ? 'rgba(251,191,36,0.1)' : 'rgba(244,63,94,0.1)';
const docBorder   = (s) => s === 'passed' ? 'rgba(52,211,153,0.25)' : s === 'flagged' ? 'rgba(251,191,36,0.25)' : 'rgba(244,63,94,0.25)';
const docIcon     = (s) => s === 'passed' ? '✅' : s === 'flagged' ? '⚠️' : '❌';

// ── SIDEBAR ───────────────────────────────────────────────────
function Sidebar({ filter, setFilter, stats, onBack, showBack }) {
  const filters = [
    { key: 'all',      label: 'All Vendors',  icon: '📋' },
    { key: 'pending',  label: 'Pending',      icon: '⏳' },
    { key: 'approved', label: 'Approved',     icon: '✅' },
    { key: 'rejected', label: 'Rejected',     icon: '❌' },
  ];

  return (
    <aside
      className="flex-shrink-0 flex flex-col"
      style={{
        width: '220px',
        background: C.bgDeep,
        borderRight: `1px solid ${C.border}`,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Gradient top line */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.purple}, #6366F1, ${C.purple})`, backgroundSize: '200%' }} />

      <div className="flex flex-col gap-5 p-4 flex-1 overflow-y-auto no-scrollbar">

        {/* Officer card */}
        <div
          className="rounded-2xl p-4"
          style={{ background: C.purpleLight, border: `1px solid ${C.purpleBorder}` }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)' }}
          >
            <svg className="w-5 h-5" style={{ color: C.purple }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-white font-black text-sm">Sr. PO R. Sharma</p>
          <p className="text-xs font-mono mt-0.5" style={{ color: C.purple }}>PO-CPCL-2026-047</p>
          <div style={{ height: '1px', background: C.purpleBorder, margin: '10px 0' }} />
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Total',    value: stats.total,    color: C.inkMid  },
              { label: 'Pending',  value: stats.pending,  color: C.amber   },
              { label: 'Approved', value: stats.approved, color: C.green   },
              { label: 'Rejected', value: stats.rejected, color: C.rose    },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-xs font-mono" style={{ color: C.inkLight }}>{label}</p>
                <p className="text-lg font-black font-mono leading-tight" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back to queue button — shows when in detail view */}
        <AnimatePresence>
          {showBack && (
            <motion.button
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all w-full"
              style={{
                background: 'rgba(168,85,247,0.15)',
                border: `1px solid ${C.purpleBorder}`,
                color: C.purple,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Queue
            </motion.button>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 mb-1" style={{ color: C.inkLight }}>
            Filter
          </p>
          {filters.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-left cursor-pointer transition-all w-full"
              style={{
                background: filter === key ? C.purpleLight : 'transparent',
                color: filter === key ? C.purple : C.inkLight,
                border: filter === key ? `1px solid ${C.purpleBorder}` : '1px solid transparent',
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
              {key !== 'all' && (
                <span
                  className="ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full"
                  style={{
                    background: filter === key ? C.purpleLight : 'rgba(255,255,255,0.06)',
                    color: filter === key ? C.purple : C.inkLight,
                  }}
                >
                  {key === 'pending' ? stats.pending : key === 'approved' ? stats.approved : stats.rejected}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Innovation badges */}
        <div className="mt-auto flex flex-col gap-2">
          {[
            { icon: '🔒', label: 'DPDPA Compliant',     color: C.cyan,   bg: 'rgba(0,229,255,0.1)',   border: 'rgba(0,229,255,0.25)'   },
            { icon: '⚡', label: 'Offline First',        color: C.purple, bg: C.purpleLight,            border: C.purpleBorder           },
            { icon: '🛡️', label: 'Zero Trust',           color: C.green,  bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)'  },
            { icon: '🧠', label: 'Explainable Scoring',  color: C.amber,  bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)'  },
          ].map(({ icon, label, color, bg, border }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold"
              style={{ background: bg, border: `1px solid ${border}`, color }}
            >
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ── VENDOR ROW (ShipSense table style) ───────────────────────
function VendorRow({ vendor, onView, decision, index }) {
  const [hovered, setHovered] = useState(false);
  const sc = vendor.score;
  const decided = decision !== undefined;
  const approved = decision === 'approved';
  const live = !!vendor.live;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onView(vendor)}
      className="relative cursor-pointer transition-all"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 130px 120px 110px 140px 120px',
        alignItems: 'center',
        padding: '14px 20px',
        borderBottom: `1px solid ${C.borderLight}`,
        background: hovered ? 'rgba(168,85,247,0.06)' : live ? 'rgba(0,229,255,0.05)' : 'transparent',
        paddingLeft: hovered ? '28px' : '20px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Left accent bar (always on for the live submission, on hover for the rest) */}
      <div
        style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: hovered || live ? '3px' : '0px',
          background: live ? C.cyan : `linear-gradient(to bottom, ${C.purple}, #6366F1)`,
          borderRadius: '0 2px 2px 0',
          transition: 'width 0.2s ease',
        }}
      />

      {/* Vendor name + ID */}
      <div className="flex flex-col gap-0.5 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          <p
            className="text-sm font-black truncate"
            style={{
              background: `linear-gradient(135deg, ${C.purple}, #6366F1)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {vendor.name}
          </p>
          {live && (
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.4)', color: C.cyan }}
            >
              LIVE
            </span>
          )}
          {!live && (
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: C.amber }}
            >
              SAMPLE
            </span>
          )}
          {decided && (
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: approved ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)',
                border: `1px solid ${approved ? 'rgba(52,211,153,0.4)' : 'rgba(244,63,94,0.4)'}`,
                color: approved ? C.green : C.rose,
              }}
            >
              {approved ? '✅ Approved' : '❌ Rejected'}
            </span>
          )}
        </div>
        <p className="text-[10px] font-mono" style={{ color: C.inkLight }}>{vendor.id}</p>
        <p className="text-[10px] font-mono" style={{ color: C.inkLight }}>{vendor.submittedAt}</p>
      </div>

      {/* Score */}
      <div
        className="flex items-center justify-center w-14 h-14 rounded-xl"
        style={{ background: scoreBg(sc), border: `1.5px solid ${scoreBorder(sc)}` }}
      >
        <div className="text-center">
          <p className="text-xl font-black leading-none" style={{ color: scoreColor(sc) }}>{sc}</p>
          <p className="text-[8px] font-mono" style={{ color: C.inkLight }}>/ 100</p>
        </div>
      </div>

      {/* Risk */}
      <span
        className="text-[10px] font-mono font-black px-3 py-1.5 rounded-full w-fit"
        style={{ background: riskBg(vendor.risk), border: `1px solid ${riskBorder(vendor.risk)}`, color: riskColor(vendor.risk) }}
      >
        {vendor.risk} RISK
      </span>

      {/* Doc bars */}
      <div className="flex flex-col gap-1">
        <p className="text-[9px] font-mono" style={{ color: C.inkLight }}>
          {vendor.documents.filter(d => d.status === 'passed').length}/{vendor.documents.length} verified
        </p>
        <div className="flex gap-0.5">
          {vendor.documents.map((doc, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full"
              style={{ background: docColor(doc.status), opacity: 0.7 }}
              title={doc.label}
            />
          ))}
        </div>
      </div>

      {/* Issue */}
      <p className="text-[10px] font-mono pr-4" style={{ color: C.inkLight }}>{vendor.issue}</p>

      {/* Review button */}
      <motion.div
        animate={{
          boxShadow: hovered ? '0 0 20px rgba(168,85,247,0.4)' : '0 0 8px rgba(168,85,247,0.1)',
        }}
        className="px-4 py-2 rounded-xl text-xs font-black text-white text-center"
        style={{ background: 'linear-gradient(135deg, #A855F7, #6366F1)' }}
      >
        Review →
      </motion.div>
    </motion.div>
  );
}

// ── VENDOR LIST VIEW ──────────────────────────────────────────
function VendorList({ vendors, decisions, onView, filter, hasLive }) {
  const filtered = vendors.filter((v) => {
    if (filter === 'all')      return true;
    if (filter === 'approved') return decisions[v.id] === 'approved';
    if (filter === 'rejected') return decisions[v.id] === 'rejected';
    if (filter === 'pending')  return !decisions[v.id];
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Page header — ShipSense style */}
      <div className="px-8 pt-8 pb-5">
        <div className="flex items-center gap-2 mb-2">
          <div style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, ${C.purple}, #6366F1)`, borderRadius: '2px' }} />
          <span
            className="text-[10px] font-mono font-bold uppercase tracking-widest"
            style={{
              background: `linear-gradient(90deg, ${C.purple}, #6366F1)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Procurement Officer · CPCL
          </span>
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: C.purple, boxShadow: `0 0 6px ${C.purple}` }}
          />
          <span className="text-[10px] font-mono" style={{ color: C.inkLight }}>Live</span>
        </div>
        <h1
          className="text-4xl font-black"
          style={{
            background: `linear-gradient(135deg, ${C.ink} 0%, ${C.inkMid} 50%, ${C.purple} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
          }}
        >
          Review Queue
        </h1>
        <p className="text-sm mt-1" style={{ color: C.inkLight }}>
          {filtered.length} vendor{filtered.length !== 1 ? 's' : ''} {filter === 'all' ? 'in queue' : `· ${filter}`}
          {!hasLive && ' · no live vendor submission in this browser yet'}
        </p>
      </div>

      {/* Table */}
      <div
        className="mx-8 rounded-2xl overflow-hidden flex-1"
        style={{
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(168,85,247,0.06)',
        }}
      >
        {/* Gradient top line */}
        <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.purple}, #6366F1, ${C.purple})` }} />

        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 130px 120px 110px 140px 120px',
            padding: '10px 20px',
            borderBottom: `1px solid ${C.borderLight}`,
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          {['Vendor', 'Score', 'Risk', 'Docs', 'Issue', 'Action'].map((h) => (
            <p key={h} className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: C.inkLight }}>{h}</p>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-4xl">📭</span>
            <p className="text-white font-bold">No vendors in this category</p>
          </div>
        ) : (
          filtered.map((vendor, i) => (
            <VendorRow
              key={vendor.id}
              vendor={vendor}
              decision={decisions[vendor.id]}
              onView={onView}
              index={i}
            />
          ))
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}

// ── DETAIL VIEW ───────────────────────────────────────────────
function VendorDetail({ vendor, onBack, onDecision, decision }) {
  const [remarks, setRemarks]   = useState('');
  const [deciding, setDeciding] = useState(false);
  const [stamp, setStamp]       = useState(null);
  const sc = vendor.score;

  const handleDecision = (type) => {
    if (!remarks.trim() || deciding) return;
    setDeciding(true);
    setTimeout(() => {
      // onDecision saves the decision (live vendor -> localStorage) and may return the saved time/hash
      const saved = onDecision(vendor.id, type, remarks.trim());
      const hash = saved?.hash || Math.random().toString(16).slice(2, 10).toUpperCase();
      const ts   = saved?.ts || new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
      setStamp({ type, hash, ts });
      setDeciding(false);
    }, 1500);
  };

  const isApproved = stamp?.type === 'approved' || decision === 'approved';

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-5 py-8 px-8 overflow-y-auto no-scrollbar"
      style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, ${C.purple}, #6366F1)`, borderRadius: '2px' }} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: C.purple }}>
            Vendor Review
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-3xl font-black"
              style={{
                background: `linear-gradient(135deg, ${C.ink}, ${C.inkMid} 50%, ${C.purple})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {vendor.name}
            </h1>
            <p className="text-xs font-mono mt-1" style={{ color: C.inkLight }}>
              {vendor.id} · {vendor.submittedAt}
            </p>
            {!vendor.live && (
              <p className="text-[10px] font-mono mt-1" style={{ color: C.amber }}>
                ⚠️ Sample data for demonstration. Not a real submission.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl"
              style={{ background: scoreBg(sc), border: `1.5px solid ${scoreBorder(sc)}` }}
            >
              <span className="text-3xl font-black leading-none" style={{ color: scoreColor(sc) }}>{sc}</span>
              <span className="text-[10px] font-mono mt-0.5" style={{ color: C.inkLight }}>/ 100</span>
            </div>
            <span
              className="text-sm font-mono font-black px-4 py-2 rounded-xl"
              style={{ background: riskBg(vendor.risk), border: `1.5px solid ${riskBorder(vendor.risk)}`, color: riskColor(vendor.risk) }}
            >
              {vendor.risk} RISK
            </span>
          </div>
        </div>
      </div>

      {/* Document table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: C.bgCard, border: `1px solid ${C.border}`, backdropFilter: 'blur(12px)' }}
      >
        <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.purple}, #6366F1)` }} />
        <div className="px-5 py-3" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: C.purple }}>
            Document Verification Results
          </p>
        </div>
        {vendor.documents.map((doc, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-4 px-5 py-3.5"
            style={{ borderBottom: i < vendor.documents.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}
          >
            <span className="text-sm w-5 flex-shrink-0">{docIcon(doc.status)}</span>
            <p className="text-sm text-white font-bold w-44 flex-shrink-0">{doc.label}</p>
            <p className="text-xs font-mono flex-1 break-words" style={{ color: C.inkMid }}>{doc.value}</p>
            <div className="flex items-center gap-2 w-32 flex-shrink-0">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${doc.confidence}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + i * 0.06 }}
                  className="h-full rounded-full"
                  style={{ background: docColor(doc.status) }}
                />
              </div>
              <span className="text-xs font-mono font-bold w-8 text-right flex-shrink-0" style={{ color: docColor(doc.status) }}>
                {doc.confidence}%
              </span>
            </div>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex-shrink-0 w-16 text-center"
              style={{ background: docBg(doc.status), border: `1px solid ${docBorder(doc.status)}`, color: docColor(doc.status) }}
            >
              {doc.status}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Fuzzy match */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl p-5"
        style={{
          background: vendor.fuzzy.score >= 90 ? 'rgba(52,211,153,0.07)' : 'rgba(251,191,36,0.07)',
          border: `1.5px solid ${vendor.fuzzy.score >= 90 ? 'rgba(52,211,153,0.35)' : 'rgba(251,191,36,0.35)'}`,
        }}
      >
        <p className="text-xs font-mono font-bold uppercase tracking-widest mb-3"
          style={{ color: vendor.fuzzy.score >= 90 ? C.green : C.amber }}>
          {vendor.fuzzy.score >= 90 ? '✅' : '⚠️'} Cross-Document Name Verification
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            { label: 'GST Name', value: vendor.fuzzy.gst },
            { label: 'PAN Name', value: vendor.fuzzy.pan },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.borderLight}` }}>
              <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: C.inkLight }}>{label}</p>
              <p className="text-white text-sm font-bold">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${vendor.fuzzy.score}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: vendor.fuzzy.score >= 90 ? C.green : C.amber }}
            />
          </div>
          <span className="text-sm font-black font-mono" style={{ color: vendor.fuzzy.score >= 90 ? C.green : C.amber }}>
            {vendor.fuzzy.score}% Match
          </span>
        </div>
      </motion.div>

      {/* Rule-based assessment */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl p-5"
        style={{
          background: C.purpleLight,
          border: `1.5px solid ${C.purpleBorder}`,
          boxShadow: '0 0 32px rgba(168,85,247,0.1)',
        }}
      >
        <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.purple}, #6366F1)`, borderRadius: '2px', marginBottom: '16px' }} />
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(168,85,247,0.2)', border: `1px solid ${C.purpleBorder}` }}
          >
            <svg className="w-4 h-4" style={{ color: C.purple }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: C.purple }}>
            Rule-Based Assessment
          </p>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: C.inkMid }}>{vendor.ai}</p>
        <p className="text-[10px] font-mono mt-3 pt-3" style={{ color: 'rgba(168,85,247,0.5)', borderTop: `1px solid ${C.purpleBorder}` }}>
          Automated summary from extracted data and scoring rules · Advisory only · Not a final decision
        </p>
      </motion.div>

      {/* Decision section */}
      <AnimatePresence>
        {!stamp && !decision && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-5"
            style={{ background: C.bgCard, border: `1px solid ${C.border}`, backdropFilter: 'blur(12px)' }}
          >
            <p className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: C.purple }}>
              Officer Decision
            </p>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add your remarks before making a decision..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm font-mono text-white placeholder-slate-600 resize-none focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.purpleBorder}` }}
              onFocus={(e) => e.target.style.borderColor = C.purple}
              onBlur={(e)  => e.target.style.borderColor = C.purpleBorder}
            />
            {!remarks.trim() && (
              <p className="text-xs font-mono mt-2" style={{ color: C.inkLight }}>⚠️ Remarks required before decision</p>
            )}
            <div className="flex gap-3 mt-4">
              {[
                { type: 'approved', label: '✅ Approve Bid', bg: 'linear-gradient(135deg, #34D399, #059669)', glow: 'rgba(52,211,153,0.5)' },
                { type: 'rejected', label: '❌ Reject Bid',  bg: 'linear-gradient(135deg, #FB7185, #BE123C)', glow: 'rgba(244,63,94,0.5)'  },
              ].map(({ type, label, bg, glow }) => (
                <motion.button
                  key={type}
                  onClick={() => handleDecision(type)}
                  disabled={!remarks.trim() || deciding}
                  whileHover={remarks.trim() ? { scale: 1.02, boxShadow: `0 0 28px ${glow}` } : {}}
                  whileTap={remarks.trim() ? { scale: 0.98 } : {}}
                  className="flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: remarks.trim() ? bg : 'rgba(255,255,255,0.05)',
                    color: remarks.trim() ? '#fff' : C.inkLight,
                    cursor: remarks.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  {deciding ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-4 h-4 rounded-full border-2 border-white border-t-transparent"
                    />
                  ) : label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audit stamp */}
      <AnimatePresence>
        {(stamp || decision) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl p-5"
            style={{
              background: isApproved ? 'rgba(52,211,153,0.08)' : 'rgba(244,63,94,0.08)',
              border: `1.5px solid ${isApproved ? 'rgba(52,211,153,0.4)' : 'rgba(244,63,94,0.4)'}`,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: isApproved ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)' }}
              >
                {isApproved ? '✅' : '❌'}
              </motion.div>
              <div>
                <p className="text-white font-black text-sm">
                  {isApproved ? 'Bid Approved' : 'Bid Rejected'}
                </p>
                <p className="text-xs font-mono mt-0.5" style={{ color: C.inkLight }}>
                  Zero-trust audit stamp generated
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Officer',    value: 'Sr. PO R. Sharma · PO-CPCL-2026-047' },
                { label: 'Timestamp', value: stamp?.ts || vendor.decidedAt || new Date().toLocaleString('en-IN') },
                { label: 'Audit Hash', value: `#${stamp?.hash || vendor.auditHash || 'A8F3B2C1'}` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderLight}` }}>
                  <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: C.inkLight }}>{label}</p>
                  <p className="text-xs font-mono text-white font-bold break-all">{value}</p>
                </div>
              ))}
            </div>
            {vendor.live && vendor.remarks && (
              <p className="text-xs font-mono mt-3" style={{ color: C.inkMid }}>
                Remarks: {vendor.remarks}
              </p>
            )}
            <p className="text-[10px] font-mono mt-3 pt-3" style={{ color: C.inkLight, borderTop: `1px solid ${C.borderLight}` }}>
              🛡️ Tamper-proof · DPDPA Compliant · Immutable audit record
              {vendor.live && ' · Log in as Vendor to see the bid status'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────
export default function OfficerDashboard() {
  const navigate                    = useNavigate();
  const [record, setRecord]         = useState(() => getRecord());   // the vendor's saved submission (localStorage)
  const [selectedId, setSelectedId] = useState(null);
  const [seedDecisions, setSeed]    = useState({});                  // decisions on the 3 built-in sample vendors
  const [filter, setFilter]         = useState('all');

  // Re-read the saved record when the tab regains focus or another tab changes it
  useEffect(() => {
    const refresh = () => setRecord(getRecord());
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  // Live submission (null until the vendor has submitted) goes on top of the built-in vendors
  const base = toOfficerVendor(record);
  const liveVendor = base
    ? { ...base, decidedAt: record.decidedAt, auditHash: record.hash, remarks: record.remarks }
    : null;
  const vendors = liveVendor ? [liveVendor, ...VENDORS] : VENDORS;

  // One decisions map for the list, the filters and the stats
  const decisions = { ...seedDecisions };
  if (liveVendor && record.decision) decisions[liveVendor.id] = record.decision;

  const selectedVendor = selectedId ? vendors.find((v) => v.id === selectedId) || null : null;

  const handleDecision = (id, type, remarks) => {
    if (liveVendor && id === liveVendor.id) {
      const rec = decide(type, remarks);   // writes status + remarks into the shared record
      setRecord(rec);
      return { ts: rec.decidedAt, hash: rec.hash };
    }
    setSeed((d) => ({ ...d, [id]: type }));
    return null;
  };

  // Clear the saved demo data (same as the button on the vendor page)
  const handleStartFresh = () => {
    clearRecord();
    setRecord(getRecord());
    setSeed({});
    setSelectedId(null);
    setFilter('all');
  };

  const approved = vendors.filter((v) => decisions[v.id] === 'approved').length;
  const rejected = vendors.filter((v) => decisions[v.id] === 'rejected').length;
  const pending  = vendors.length - approved - rejected;
  const stats    = { total: vendors.length, approved, rejected, pending };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col" style={{ background: C.bg }}>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: 'rgba(168,85,247,0.06)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: 'rgba(99,102,241,0.07)' }} />
      </div>

      {/* HEADER */}
      <header
        className="flex-shrink-0 flex items-center px-8 z-50 relative"
        style={{
          height: '64px',
          background: 'rgba(5,10,24,0.95)',
          backdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${C.border}`,
          boxShadow: '0 1px 40px rgba(168,85,247,0.08)',
        }}
      >
        <div style={{ width: '340px', flexShrink: 0 }}>
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
            className="w-2 h-2 rounded-full"
            style={{ background: C.purple, boxShadow: `0 0 8px ${C.purple}` }}
          />
          <span className="text-white font-black text-lg tracking-wide">Officer Portal</span>
        </div>
        <div style={{ width: '340px', flexShrink: 0 }} className="flex items-center justify-end gap-3">
          <span className="text-sm font-mono" style={{ color: C.inkMid }}>officer@cpcl.gov.in</span>
          <button
            onClick={handleStartFresh}
            title="Clear the saved demo data and start over"
            className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono cursor-pointer transition-all hover:brightness-125"
            style={{
              background: 'rgba(251,191,36,0.1)',
              border: '1px solid rgba(251,191,36,0.3)',
              color: C.amber,
            }}
          >
            ↺ Start fresh
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-1.5 rounded-lg text-sm font-bold font-mono cursor-pointer transition-all hover:brightness-125"
            style={{
              background: 'rgba(168,85,247,0.15)',
              border: `1px solid ${C.purpleBorder}`,
              color: C.purple,
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 min-h-0 relative z-10">
        <Sidebar
          filter={filter}
          setFilter={setFilter}
          stats={stats}
          showBack={!!selectedVendor}
          onBack={() => setSelectedId(null)}
        />

        <main className="flex-1 overflow-y-auto min-h-0 no-scrollbar">
          <AnimatePresence mode="wait">
            {!selectedVendor ? (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <VendorList
                  vendors={vendors}
                  decisions={decisions}
                  onView={(v) => setSelectedId(v.id)}
                  filter={filter}
                  hasLive={!!liveVendor}
                />
              </motion.div>
            ) : (
              <motion.div
                key="detail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <VendorDetail
                  vendor={selectedVendor}
                  decision={decisions[selectedVendor.id]}
                  onBack={() => setSelectedId(null)}
                  onDecision={handleDecision}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}