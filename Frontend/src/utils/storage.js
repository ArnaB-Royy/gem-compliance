const KEY = 'gem_compliance_demo_v1';

// status: none | ocr_done | pending | approved | rejected
const blank = () => ({
  sessionId: Math.random().toString(36).slice(2, 10), // created once, kept across logouts
  status: 'none',
  subId: null,
  subTime: null,
  docs: {},          // { gst: { values, confidence, fallback }, pan: {...}, ... }
  breakdown: [],     // [{ label, score, status }] one per document
  matchScore: null,  // cross-document name match, 0-100
  score: null,       // final compliance score, 0-100
  hash: null,        // audit hash created on submit
  decision: null,    // 'approved' | 'rejected' (set by officer)
  remarks: '',       // officer remarks
  decidedAt: null,
  updatedAt: 0,
});

// ── core read / write ─────────────────────────────────────────
export function getRecord() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    return { ...blank(), ...JSON.parse(raw) };
  } catch {
    return blank(); // storage blocked or corrupted: act as if empty
  }
}

function saveRecord(rec) {
  const next = { ...rec, updatedAt: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: ignore, the demo keeps running */
  }
  return next;
}

export function updateRecord(patch) {
  return saveRecord({ ...getRecord(), ...patch });
}

// "Start fresh demo": wipes everything and creates a new sessionId
export function clearRecord() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  return blank();
}

// ── shared score formula (vendor result + officer table must match) ──
export function computeScore(breakdown, matchScore) {
  if (!breakdown?.length) return 0;
  const avgDoc = Math.round(breakdown.reduce((s, b) => s + b.score, 0) / breakdown.length);
  return Math.round(avgDoc * 0.6 + (matchScore ?? 100) * 0.4);
}

// ── vendor side ───────────────────────────────────────────────
// Call when all 6 OCR results are ready. `ocr` is the page's ocr state.
export function saveExtraction({ ocr, breakdown, matchScore }) {
  const docs = {};
  Object.entries(ocr || {}).forEach(([id, e]) => {
    if (e && !e.loading && !e.error) {
      docs[id] = { values: e.values || {}, confidence: e.confidence || {}, fallback: !!e.fallback };
    }
  });
  return updateRecord({
    status: 'ocr_done',
    docs,
    breakdown,
    matchScore,
    score: computeScore(breakdown, matchScore),
    decision: null,
    remarks: '',
    decidedAt: null,
  });
}

// Call when the vendor clicks "Submit for Verification"
export function submitRecord() {
  const subId = `SUB-2026-CPCL-${Math.floor(100000 + Math.random() * 900000)}`;
  const subTime = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const hash = Math.random().toString(16).slice(2, 10).toUpperCase();
  return updateRecord({ status: 'pending', subId, subTime, hash });
}

// ── officer side ──────────────────────────────────────────────
export function decide(type, remarks) {
  // type: 'approved' | 'rejected'
  return updateRecord({
    status: type,
    decision: type,
    remarks: remarks || '',
    decidedAt: new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
  });
}

// ── convert the saved record into the shape OfficerDashboard renders ──
const KEY_FIELD = {
  gst: ['gstin', 'GSTIN'],
  pan: ['pan', 'PAN'],
  udyam: ['udyamNumber', 'Udyam'],
  epfo: ['establishmentName', 'Establishment'],
  itr: ['assessmentYear', 'AY'],
  oem: ['oemName', 'OEM'],
};

const LABELS = {
  gst: 'GST Certificate',
  pan: 'PAN Card',
  udyam: 'Udyam Certificate',
  epfo: 'EPFO Compliance',
  itr: 'Income Tax Return',
  oem: 'OEM Authorization',
};

const CONF_NUM = { high: 97, medium: 75, low: 45 };

// Returns null until the vendor has submitted.
export function toOfficerVendor(rec = getRecord()) {
  if (!['pending', 'approved', 'rejected'].includes(rec.status)) return null;

  const docs = Object.keys(LABELS).map((id) => {
    const entry = rec.docs?.[id];
    const b = rec.breakdown?.find((x) => x.label === LABELS[id]) || {};
    const [k, prefix] = KEY_FIELD[id];
    const v = entry?.values?.[k];
    const score = b.score ?? 0;
    return {
      label: LABELS[id],
      value: v ? `${prefix}: ${v}` : 'Not extracted',
      status: score >= 85 ? 'passed' : score >= 50 ? 'flagged' : 'failed',
      confidence: score,
    };
  });

  const gstName = rec.docs?.gst?.values?.legalName || rec.docs?.pan?.values?.name || 'Unnamed Vendor';
  const panName = rec.docs?.pan?.values?.name || '—';
  const score = rec.score ?? 0;
  const risk = score >= 75 ? 'LOW' : score >= 50 ? 'MEDIUM' : 'HIGH';
  const flagged = docs.filter((d) => d.status !== 'passed');
  const match = rec.matchScore ?? 100;

  const issue = match < 85
    ? `Name mismatch across documents (${match}% match)`
    : flagged.length
      ? `${flagged.length} document(s) with flagged fields`
      : 'No issues found';

  const ai = `Live submission. ${docs.filter((d) => d.status === 'passed').length} of ${docs.length} documents extracted with high confidence. `
    + `Cross-document name match is ${match}%. `
    + (flagged.length ? `Flagged: ${flagged.map((d) => d.label).join(', ')}. ` : 'No documents flagged. ')
    + `Overall risk classification: ${risk}. `
    + (risk === 'LOW' ? 'Recommendation: Approve bid.' : risk === 'MEDIUM' ? 'Recommendation: Manual review before approval.' : 'Recommendation: Reject or request corrected documents.');

  return {
    id: rec.subId,
    name: gstName,
    email: 'vendor@cpcl.gov.in',
    score,
    risk,
    submittedAt: rec.subTime,
    issue,
    documents: docs,
    fuzzy: { gst: gstName, pan: panName, score: match },
    ai,
    live: true,                 // lets the officer table highlight it
    decision: rec.decision,     // 'approved' | 'rejected' | null
  };
}