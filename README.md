# GhostWire — AI Firewall for Enterprise LLM Security

> Prevent sensitive data leakage into AI systems. Detect, block, and audit risky prompts in real time with compliance-mapped explanations.

 **Live Demo:** https://ghost-wire-tan.vercel.app  
 **Backend API:** https://ghostwire-production-4b23.up.railway.app  
 **Category:** Cybersecurity × AI × Enterprise SaaS

---

## The Problem

Employees routinely paste API keys, customer records, source code, and internal documents into public AI tools like ChatGPT and Gemini.

Existing security tools — DLP systems, CASB platforms — were built for email and cloud storage. They have no concept of an LLM prompt.

The result: unmonitored, ungoverned AI adoption creating real compliance risk under GDPR, HIPAA, and the EU AI Act.

---

## The Solution

GhostWire is an AI-native prompt security layer that intercepts prompts before they reach any LLM, classifies the risk in under 2 seconds, and generates human-readable compliance explanations.

**Scan → Classify → Block → Audit. Automatically.**

---

## Core Features

- **Prompt Scanner** — Paste any prompt, get an instant risk assessment with confidence score and detected categories
- **AI Firewall** — Policy engine enforces ALLOW / WARN / BLOCK decisions automatically
- **Compliance Mapping** — Every incident tagged to GDPR, SOC2, HIPAA, EU AI Act articles automatically
- **Security Dashboard** — Real-time incident monitoring with severity distribution and scan activity charts
- **Incident Detail** — Full forensic view with highlighted sensitive tokens, AI explanation, and regulatory impact

---

## Detection Categories

| Category | Examples |
|---|---|
| API_KEY | AWS keys, tokens, secrets |
| PASSWORD | Passwords, passphrases |
| PII | Names, emails, SSNs, phone numbers |
| FINANCIAL | Card numbers, bank accounts |
| SOURCE_CODE | Proprietary code, internal scripts |
| INTERNAL_DOCS | Contracts, strategy memos |
| CUSTOMER_DATA | User databases, CRM exports |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python |
| AI Classification | Groq API (Llama 3.3 70B Versatile) |
| Database | Supabase PostgreSQL (RLS enabled) |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |

---

## Architecture

```
User Prompt
    ↓
Next.js Scanner (Vercel)
    ↓
POST /api/scan → FastAPI (Railway)
    ↓
Groq Llama 3.3 70B — Risk Classification
    ↓
Policy Engine → BLOCK / WARN / ALLOW
    ↓
Supabase — Incident stored with compliance tags
    ↓
Dashboard — Real-time audit trail
```

---

## API Reference

**POST /api/scan**
```json
// Request
{ "prompt": "Here is our AWS key AKIAIOSFODNN7EXAMPLE..." }

// Response
{
  "risk_level": "CRITICAL",
  "confidence_score": 95,
  "categories": ["API_KEY", "CUSTOMER_DATA"],
  "decision": "BLOCK",
  "explanation": "Detected exposed AWS credential and customer data.",
  "compliance_tags": ["GDPR Art. 5", "SOC2 CC6.1", "EU AI Act Art. 52"]
}
```

**GET /api/incidents** — Returns last 50 incidents  
**GET /api/incidents/:id** — Returns full incident detail  
**GET /api/stats** — Returns totals and severity breakdown  

---

## Local Setup

```bash
# Backend
cd ghostwire-backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Add .env
GROQ_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_KEY=your_service_role_key

uvicorn main:app --reload

# Frontend
cd ghostwire-frontend
npm install

# Add .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

---

## Demo Scenario

1. Open https://ghost-wire-tan.vercel.app
2. Paste this prompt in the scanner:

```
Here is our production AWS key AKIAIOSFODNN7EXAMPLE and our Q2 customer 
export including SSNs and payment records. Please summarize for the board.
```

3. GhostWire detects: API_KEY + PII + CUSTOMER_DATA  
4. Decision: **BLOCKED**  
5. Compliance tags: GDPR Art. 5, SOC2 CC6.1, EU AI Act Art. 52  
6. Incident logged to dashboard automatically

---

## Competitive Positioning

| Tool | Weakness | GhostWire Advantage |
|---|---|---|
| Nightfall AI | Detects, doesn't explain | Compliance-mapped explanations |
| Lakera Guard | No audit trail | Full incident forensics |
| DLP Systems | Not AI-aware | Prompt-native classification |
| CASB Platforms | Not prompt-level | Middleware SDK pattern |

---

## Demo Limitations & Production Roadmap

This demo illustrates the GhostWire governance architecture. Two important distinctions from a production deployment:

**1. Prompt Storage**  
In this demo, scanned prompts are stored in Supabase to power the audit dashboard. In a production enterprise deployment, GhostWire would run as an SDK inside the customer's own VPC — prompts would never leave their infrastructure. The classification result and compliance tags would be stored, not the raw prompt.

**2. Classification Engine**  
This demo uses Groq's hosted Llama 3.3 70B API. In production, the classifier would run on-premise or in the customer's private cloud, ensuring zero data egress.

**The architecture pattern, compliance mapping, and audit trail demonstrated here reflect what a real enterprise deployment would look like — the data residency model is what changes.**

---

## Roadmap

- [ ] SDK wrapper for enterprise API integration
- [ ] On-premise classifier deployment
- [ ] Browser extension for direct ChatGPT/Claude interception
- [ ] SOC2 export for compliance reporting
- [ ] Multi-tenant RBAC for enterprise teams
- [ ] SIEM integration (Splunk, Datadog)
- [ ] Hindi/regional language UI for broader accessibility

---

## Competitive Context

Nightfall AI raised $40M. Lakera raised $20M. The market is validated.

GhostWire's wedge: compliance-mapped explainability. Enterprise security teams don't just need to know *that* a prompt was risky — they need to know *which regulation* it violated and *why*, in language that survives a regulatory audit.

---

## Built By

**Sarvesh** — Solo Builder  
Microsoft Imagine Cup 2026 Semifinalist  

---

*Built for Orion Build Challenge 2026*