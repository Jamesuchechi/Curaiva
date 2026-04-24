# Contributing to Curaiva AI

Thank you for your interest in contributing. Curaiva AI is a healthcare AI platform built on MCP, A2A, and FHIR R4. We welcome contributions that improve clinical accuracy, platform reliability, and accessibility.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (free tier works)
- An MISTRAL/GROQ API key
- Access to a FHIR R4 server (HAPI public server works for development)

### Local Setup

```bash
# Clone the repo
git clone https://github.com/your-org/curaiva-ai.git
cd curaiva-ai

# MCP Server
cd mcp-server
npm install
cp .env.example .env
# Fill in MISTRAL/GROQ_API_KEY in .env
npm run dev
# Server runs on http://localhost:3001

# Web App (separate terminal)
cd ../web
npm install
cp .env.example .env.local
# Fill in Supabase + MCP server URL
npm run dev
# App runs on http://localhost:3000

# Run Supabase migrations
npx supabase db push
# Or paste supabase/migrations/001_initial.sql into Supabase SQL editor
```

### Verify Setup

```bash
# MCP server health check
curl http://localhost:3001/health

# Seed FHIR test data
node scripts/fhir-seed.js --dry-run   # Validate without posting
node scripts/fhir-seed.js             # Actually seed
```

---

## How to Contribute

1. **Fork** the repository
2. **Create a branch:** `git checkout -b feature/your-feature-name`
3. **Make your changes** — follow the code style below
4. **Test:** Confirm all 6 MCP tools still pass, UI still renders
5. **Commit:** `git commit -m "feat: describe your change"`
6. **Push:** `git push origin feature/your-feature-name`
7. **Open a Pull Request** — fill in the template

---

## Code Style

- TypeScript strict mode — no `any` types
- Zod validation on all MCP tool inputs
- All colours via CSS variables — no hardcoded hex values in components
- All Claude calls server-side — never in client components
- RLS on every new Supabase table you add
- Error handling required on all FHIR and Claude calls

---

## What We Welcome

- New MCP tools (additional clinical capabilities)
- Language support (Hausa, Yoruba, Igbo, Swahili)
- Accessibility improvements
- Performance optimisations
- Security improvements
- Documentation improvements

## What We Don't Accept

- Changes that expose API keys client-side
- Removal of RLS policies
- Dependencies with known high/critical vulnerabilities
- Clinical claims that haven't been reviewed

---

## Reporting Issues

Use the GitHub Issue templates:

- **Bug report** — for broken functionality
- **Feature request** — for new capabilities

For **security vulnerabilities**, do NOT open a public issue. See `SECURITY.md`.

---

_Curaiva AI — Built to bridge the healthcare gap._
