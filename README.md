<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:050A18,50:2D6BE4,100:00E5FF&height=200&section=header&text=GeM%20Compliance&fontSize=60&fontColor=ffffff&fontAlignY=38&desc=AI-Powered%20Bid%20Verification%20Platform&descAlignY=58&descSize=20&animation=fadeIn" width="100%"/>

<br/>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=22&pause=1000&color=00E5FF&center=true&vCenter=true&width=700&lines=SIH+2026+%7C+Problem+Statement+26100;Ministry+of+Petroleum+%26+Natural+Gas;AI+that+verifies+government+bids+instantly;Zero+manual+errors.+Zero+delays.+Zero+fraud.)](https://git.io/typing-svg)

<br/>

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=00E5FF)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

<br/>

> **Government procurement officers spend weeks manually verifying vendor documents across 10+ portals.**
> **GeM Compliance does it in seconds — with AI, zero errors, and a tamper-proof audit trail.**

</div>

---

## 🎯 The Problem

```
Vendor submits bid on GeM portal
         ↓
Officer manually checks GST portal → EPFO portal → PAN database
→ MSME registry → ITR records → OEM certificates
         ↓
Takes 2–4 weeks. Errors happen. Fraud slips through.
```

**GeM Compliance replaces this entire chain with one AI-powered platform.**

---

## ✨ How It Works

```
 VENDOR                    PLATFORM                   OFFICER
   │                           │                          │
   │── Upload 6 documents ────►│                          │
   │                           │── Gemini Vision OCR      │
   │                           │── Fuzzy Name Match       │
   │                           │── Blacklist Check        │
   │                           │── Compliance Score       │
   │                           │                          │
   │◄── Live audit trail ──────│                          │
   │                           │──── Review Queue ───────►│
   │                           │                          │── Approve/Reject
   │◄── Final result ──────────│◄─── Zero-trust stamp ───│
```

---

## 🚀 Key Innovations

| # | Innovation | What It Does |
|---|-----------|-------------|
| 🔍 | **Live OCR Preview** | Gemini Vision reads documents in real time — watch AI extract data as you upload |
| 🧠 | **Explainable AI (XAI)** | Every decision explained in plain English, not just a score |
| 🔤 | **Fuzzy Name Matching** | Cross-document name verification with % similarity — catches typos and mismatches |
| 🔒 | **Zero Trust Hashing** | Every decision gets a tamper-proof audit hash — immutable, DPDPA compliant |
| 📴 | **Offline First** | AI processing runs locally — no internet dependency during verification |
| 🛡️ | **Cross-Ministry Blacklist** | Checks against all ministry databases, not just CPCL |
| 📊 | **AI Confidence Calibration** | Uncertain fields auto-flagged for human review |
| 🗃️ | **DPDPA Compliant** | Documents processed locally and auto-deleted after verification |

---

## 🖥️ Platform Preview

<div align="center">

| Vendor Portal | Officer Portal |
|:---:|:---:|
| 🔵 Cyan Theme | 🟣 Purple Theme |
| Upload → OCR → Submit | Review Queue → Approve/Reject |
| Live audit trail | Zero-trust stamp |

</div>

---

## 🗂️ Project Structure

```
gem-compliance/
├── src/
│   ├── components/
│   │   ├── AppleSideNav.jsx     # Dot navigation
│   │   └── GemLogo.jsx          # Logo component
│   ├── pages/
│   │   ├── HomePage.jsx         # 6-section landing page
│   │   ├── LoginPage.jsx        # Vendor + Officer login
│   │   ├── vendor/
│   │   │   └── VendorDashboard.jsx   # Upload, OCR, audit trail
│   │   └── officer/
│   │       └── OfficerDashboard.jsx  # Review queue, decisions
│   └── App.jsx
├── backend/
│   ├── server.js                # Express server
│   ├── routes/
│   │   └── ocr.js               # Gemini Vision OCR route
│   └── .env.example
└── public/
    └── assets/
```

---

## ⚙️ Tech Stack

```
Frontend          Backend           AI / APIs
─────────         ─────────         ─────────────
React + Vite      Node.js           Google Gemini Vision
Tailwind CSS      Express           OCR + Extraction
Framer Motion     MongoDB
React Router      Multer
```

---

## 🏃 Run Locally

```bash
# Clone the repo
git clone https://github.com/ArnaB-Royy/gem-compliance.git
cd gem-compliance

# Install frontend dependencies
npm install
npm run dev

# In a new terminal — setup backend
cd backend
npm install

# Add your Gemini API key
cp .env.example .env
# Edit .env and add: GEMINI_API_KEY=your_key_here

node server.js
```

Frontend runs on `http://localhost:5173`
Backend runs on `http://localhost:3000`

---

## 🎬 Demo Credentials

| Portal | Email | Password |
|--------|-------|----------|
| 🔵 Vendor | vendor@cpcl.gov.in | vendor123 |
| 🟣 Officer | officer@cpcl.gov.in | officer123 |

---

## 👨‍💻 Team MindForge

<div align="center">

<table>
  <tr>
    <td align="center">
      <b>Arnab Roy</b><br/>
      <sub>Full Stack + AI Integration</sub><br/>
      <a href="https://github.com/ArnaB-Royy">
        <img src="https://img.shields.io/badge/GitHub-ArnaB--Royy-2D6BE4?style=flat&logo=github"/>
      </a>
    </td>
    <td align="center">
      <b>Juhi Thakur</b><br/>
      <sub>UI Design + Assets</sub><br/>
      <img src="https://img.shields.io/badge/Role-Designer-00E5FF?style=flat"/>
    </td>
    <td align="center">
      <b>Soumi Nandi</b><br/>
      <sub>Research + Documentation</sub><br/>
      <img src="https://img.shields.io/badge/Role-Research-A855F7?style=flat"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <b>Neha Dey</b><br/>
      <sub>Backend + Testing</sub><br/>
      <img src="https://img.shields.io/badge/Role-Backend-34D399?style=flat"/>
    </td>
    <td align="center">
      <b>Aitijhya Jana</b><br/>
      <sub>Presentation + PPT</sub><br/>
      <img src="https://img.shields.io/badge/Role-Presentation-FBBF24?style=flat"/>
    </td>
    <td align="center">
      <b>MindForge</b><br/>
      <sub>SIH 2026</sub><br/>
      <img src="https://img.shields.io/badge/Team-MindForge-FB7185?style=flat"/>
    </td>
  </tr>
</table>

</div>

---

## 🏆 Built For

<div align="center">

**Smart India Hackathon 2026**
**PS ID: 26100**
**Ministry of Petroleum & Natural Gas**
**Chennai Petroleum Corporation Limited (CPCL)**

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00E5FF,50:2D6BE4,100:050A18&height=120&section=footer" width="100%"/>

</div>
