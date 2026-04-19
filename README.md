# 🏥 Curaiva AI

> **Your Community Health Intelligence Platform**
> Connecting Patients · Doctors · Community Health Workers · Hospitals

[![Built with Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com)
[![Claude AI](https://img.shields.io/badge/Claude-AI%20Engine-D97706)](https://anthropic.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## What is Curaiva AI?

Curaiva AI is a unified, AI-powered health platform that bridges every critical gap in the community healthcare chain. Instead of solving one narrow problem, it connects all four pillars of healthcare delivery in a single product:

| Problem | Curaiva AI Solution |
|---|---|
| No access to doctors (rural/remote) | AI triage + async doctor messaging |
| Late diagnosis & early detection | Real-time symptom checker with severity scoring |
| Mental health neglected | AI companion with CBT tools + crisis escalation |
| Poor medication adherence | Smart reminders + CHW missed-dose alerts |

---

## ✨ Key Features

### 🤖 AI Symptom Triage
Patients describe symptoms in plain text or voice. The Claude AI engine assesses severity, scores urgency (low / moderate / critical), suggests self-care steps, and escalates automatically to a doctor when needed.

### 👨‍⚕️ Doctor Connect
Verified clinicians receive an AI-generated patient brief before every consultation — no cold reads. Async messaging with priority flagging keeps response times low even in resource-constrained settings.

### 🧠 Mental Health Companion
A daily check-in companion powered by Claude. Tracks mood over time, delivers CBT-based exercises, and automatically escalates crisis situations to human counselors or emergency contacts.

### 💊 Medication Tracker
Patients log their prescriptions once. Curaiva sends smart reminders, tracks adherence streaks, and alerts the assigned Community Health Worker when doses are missed consistently.

### 🌍 CHW Dashboard
Community Health Workers get a live, AI-prioritized patient list. One dashboard shows who missed meds, who flagged symptoms, who needs a home visit — ranked by urgency. One-click messaging and scheduling built in.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15 (App Router) | SSR, routing, UI |
| Styling | Tailwind CSS | Utility-first styling |
| Backend | Supabase | Auth, PostgreSQL, Realtime |
| AI Engine | Claude API (Anthropic) | Triage, summaries, mental health chat |
| Edge Logic | Supabase Edge Functions | Notifications, webhooks, cron jobs |
| Voice Input | Web Speech API | Browser-native voice capture |
| Notifications | Resend (email) + Termii (SMS) | Med reminders, CHW alerts |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [Anthropic API key](https://console.anthropic.com)

### 1. Clone the repository
```bash
git clone https://github.com/your-org/Curaiva-ai.git
cd Curaiva-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Notifications (optional for MVP)
RESEND_API_KEY=your_resend_key
TERMII_API_KEY=your_termii_key
```

### 4. Set up the database
```bash
npx supabase db push
```

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see Curaiva AI running.

---

## 📁 Project Structure

```
Curaiva-ai/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth pages (login, register)
│   ├── (dashboard)/            # Role-based dashboards
│   │   ├── patient/            # Patient portal
│   │   ├── doctor/             # Doctor inbox & consultation
│   │   └── chw/                # Community Health Worker dashboard
│   ├── api/                    # API route handlers
│   │   ├── triage/             # AI symptom triage endpoint
│   │   ├── mental-health/      # Mental health chat endpoint
│   │   └── summarize/          # Patient summary generation
│   └── layout.tsx
├── components/                 # Shared UI components
│   ├── triage/                 # Symptom input & results
│   ├── messaging/              # Doctor-patient messaging
│   ├── mental-health/          # Companion chat UI
│   ├── medication/             # Tracker & reminders
│   └── dashboard/              # CHW dashboard widgets
├── lib/                        # Core utilities
│   ├── supabase/               # Supabase client & server configs
│   ├── claude/                 # Claude API wrappers
│   └── notifications/          # Email/SMS helpers
├── supabase/
│   ├── migrations/             # Database schema migrations
│   └── functions/              # Edge Functions (reminders, alerts)
├── types/                      # TypeScript interfaces
└── public/                     # Static assets
```

---

## 🔐 User Roles

Curaiva AI has three distinct authenticated user roles:

| Role | Access | Key Actions |
|---|---|---|
| **Patient** | Own health data only | Triage, doctor messaging, mental health, med tracker |
| **Doctor** | Assigned patients | Consultation inbox, AI summaries, prescription notes |
| **CHW** | Assigned community | Patient watchlist, priority queue, home visit scheduling |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🏆 Built For

This project was built for a hackathon under the theme **"Real-Life Healthcare with AI"**.

> *Bridging the gaps. Saving lives. One AI interaction at a time.*