<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:050A18,40:0A1628,70:1a2d5a,100:2D6BE4&height=180&section=header&text=GeM+Compliance&fontSize=56&fontColor=ffffff&fontAlignY=40&desc=AI-Powered+Bid+Verification+Platform+%7C+SIH+2026&descAlignY=62&descSize=16&animation=fadeIn" width="100%"/>

<br/>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=20&pause=1200&color=00E5FF&center=true&vCenter=true&width=750&lines=SIH+2026+%7C+Problem+Statement+26100;Ministry+of+Petroleum+%26+Natural+Gas+%7C+CPCL;Automated+bid+verification+in+seconds%2C+not+weeks;Zero+manual+errors.+Zero+delays.+Zero+fraud.;Team+MindForge+%F0%9F%9A%80)](https://git.io/typing-svg)

<br/>

<a href="https://gem-compliance-mindforge.vercel.app/" target="_blank">
  <img src="https://img.shields.io/badge/🌐_Frontend-gem--compliance--mindforge.vercel.app-2D6BE4?style=for-the-badge&labelColor=050A18"/>
</a>
&nbsp;
<a href="https://gem-compliance-coyt.onrender.com/" target="_blank">
  <img src="https://img.shields.io/badge/⚙️_Backend-gem--compliance--coyt.onrender.com-A855F7?style=for-the-badge&labelColor=050A18"/>
</a>

<br/><br/>

![React](https://img.shields.io/badge/React-050A18?style=for-the-badge&logo=react&logoColor=00E5FF)
![Vite](https://img.shields.io/badge/Vite-050A18?style=for-the-badge&logo=vite&logoColor=A78BFA)
![Node.js](https://img.shields.io/badge/Node.js-050A18?style=for-the-badge&logo=node.js&logoColor=34D399)
![TailwindCSS](https://img.shields.io/badge/Tailwind-050A18?style=for-the-badge&logo=tailwindcss&logoColor=00E5FF)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-050A18?style=for-the-badge&logo=framer&logoColor=A855F7)
![Express](https://img.shields.io/badge/Express-050A18?style=for-the-badge&logo=express&logoColor=white)

</div>

---

## 🔍 Problem Statement

**PS ID: 26100 · Ministry of Petroleum & Natural Gas · CPCL**

> Government officers spend **weeks** manually verifying vendor documents across 10+ portals — GST, PAN, EPFO, MSME, ITR, OEM. Errors happen. Fraud slips through. No audit trail exists.

```
❌ BEFORE                              ✅ AFTER
──────────────────────────────         ──────────────────────────────
Vendor submits bid on GeM              Vendor submits bid on GeM
          ↓                                        ↓
Officer checks GST portal              AI reads all 6 documents
          ↓                                        ↓
Officer checks EPFO portal             Cross-verifies names, IDs, dates
          ↓                                        ↓
Officer checks PAN database            Generates compliance score 0–100
          ↓                                        ↓
Officer checks MSME registry           Officer reviews → approves
          ↓                                        ↓
2–4 weeks. Errors. No trail.           Minutes. Accurate. Tamper-proof.
```

---

## ✨ Innovations

| | Feature | Description |
|---|---|---|
| 🧠 | **Explainable AI (XAI)** | Every decision explained in plain English — not just a score |
| 🔤 | **Fuzzy Name Matching** | Cross-document name similarity check with % score — catches typos & mismatches |
| 🔒 | **Zero Trust Hashing** | Every approval gets a tamper-proof SHA audit hash — immutable record |
| 📴 | **Offline First** | AI processing runs locally — no internet dependency |
| 🛡️ | **Cross-Ministry Blacklist** | Checks across all ministry databases, not just CPCL |
| 📊 | **AI Confidence Calibration** | Uncertain fields auto-flagged for human review |
| 🗃️ | **DPDPA Compliant** | Documents processed locally and auto-deleted post-verification |
| 👁️ | **Live OCR Preview** | Watch AI extract document data in real time with confidence bars |

---

## 🖥️ Platform

```
┌─────────────────────────────────────────────────────────────┐
│                     VENDOR PORTAL  🔵                        │
│  Upload 6 Docs → Live OCR → Fuzzy Match → Submit → Result   │
├─────────────────────────────────────────────────────────────┤
│                    OFFICER PORTAL  🟣                         │
│  Review Queue → Document Detail → AI Rec → Approve/Reject   │
└─────────────────────────────────────────────────────────────┘
```

### Demo Credentials

| Portal | Email | Password |
|--------|-------|----------|
| 🔵 Vendor | vendor@cpcl.gov.in | vendor123 |
| 🟣 Officer | officer@cpcl.gov.in | officer123 |

---

## 🗂️ Project Structure

```
gem-compliance/
├── README.md
│
├── Backend/
│   ├── server.js                   # Express server entry point
│   ├── listModels.js               # AI model listing utility
│   ├── package.json
│   └── routes/
│       └── ocr.js                  # Document OCR route
│
└── Frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── vercel.json
    ├── public/
    │   ├── favicon.svg
    │   ├── icons.svg
    │   └── assets/
    │       ├── gem-logo.png
    │       └── slide1–6.jpg        # Hero section images
    └── src/
        ├── App.jsx                 # Router setup
        ├── main.jsx
        ├── components/
        │   ├── AppleSideNav.jsx    # Dot scroll navigation
        │   ├── DotNav.jsx
        │   ├── GemLogo.jsx         # GeM logo component
        │   └── SideNav.jsx
        ├── pages/
        │   ├── HomePage.jsx        # 6-section scroll landing page
        │   ├── LoginPage.jsx       # Vendor + Officer login
        │   ├── vendor/
        │   │   └── VendorDashboard.jsx   # Upload, OCR, audit trail
        │   └── officer/
        │       └── OfficerDashboard.jsx  # Review queue, decisions
        └── utils/
            └── storage.js
```

---

## ⚙️ Tech Stack

```
Frontend                    Backend
────────────────────        ──────────────────
React 18 + Vite             Node.js
Tailwind CSS                Express
Framer Motion               Multer
React Router DOM            dotenv + cors
```

---

## 🏃 Run Locally

```bash
# Clone
git clone https://github.com/ArnaB-Royy/gem-compliance.git
cd gem-compliance

# Frontend
cd Frontend
npm install
npm run dev
# → http://localhost:5173

# Backend (new terminal)
cd Backend
npm install
cp .env.example .env
# Add your API key inside .env
node server.js
# → http://localhost:3000
```

---

## 🚀 Deployment

| Layer | Platform | URL |
|-------|----------|-----|
| Frontend | Vercel | https://gem-compliance-mindforge.vercel.app/ |
| Backend | Render | https://gem-compliance-coyt.onrender.com/ |

> ⚠️ API keys are stored as environment variables on the hosting platform — never in code or GitHub.

---

## 👥 Team MindForge

<div align="center">

<table>
  <tr>
    <td align="center" width="150">
      <br/>
      <b>Souhardya Sarkar</b><br/>
      <sub>Team Leader</sub><br/><br/>
      <img src="https://img.shields.io/badge/Leader-A855F7?style=flat-square"/>
    </td>
    <td align="center" width="150">
      <br/>
      <b>Arnab Roy</b><br/>
      <sub>Full Stack + AI</sub><br/><br/>
      <a href="https://github.com/ArnaB-Royy">
        <img src="https://img.shields.io/badge/GitHub-2D6BE4?style=flat-square&logo=github&logoColor=white"/>
      </a>
    </td>
    <td align="center" width="150">
      <br/>
      <b>Juhi Thakur</b><br/>
      <sub>UI Design + Assets</sub><br/><br/>
      <img src="https://img.shields.io/badge/Design-00E5FF?style=flat-square"/>
    </td>
  </tr>
  <tr>
    <td align="center" width="150">
      <br/>
      <b>Soumi Nandi</b><br/>
      <sub>Research + Docs</sub><br/><br/>
      <img src="https://img.shields.io/badge/Research-34D399?style=flat-square"/>
    </td>
    <td align="center" width="150">
      <br/>
      <b>Neha Dey</b><br/>
      <sub>Backend + Testing</sub><br/><br/>
      <img src="https://img.shields.io/badge/Backend-FB7185?style=flat-square"/>
    </td>
    <td align="center" width="150">
      <br/>
      <b>Aitijhya Jana</b><br/>
      <sub>Presentation + PPT</sub><br/><br/>
      <img src="https://img.shields.io/badge/Presentation-FBBF24?style=flat-square"/>
    </td>
  </tr>
</table>

</div>

---

<div align="center">

**Smart India Hackathon 2026 · PS ID: 26100**<br/>
**Ministry of Petroleum & Natural Gas · CPCL**

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2D6BE4,50:0A1628,100:050A18&height=100&section=footer" width="100%"/>

</div>
