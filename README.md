# AI Cold Email Factory

A web application that generates highly personalized cold outreach emails at scale using AI. Built with React, Express, Node.js, PostgreSQL, and multiple AI providers.

## Features

- **Company Profile Management** — CRUD for company info, services, case studies, pricing, and target industries
- **AI Email Generation** — Generate up to 500 unique cold emails with 3 AI providers: Gemini, Groq (Llama 3.1), or local Ollama
- **Send Test Emails** — Select any generated email and send it to your inbox via SMTP to preview how it looks
- **Real-time Progress Tracking** — Polling-based progress indicator during generation
- **Smart Variety** — Emails differ across 5 subject patterns, 5 hook styles, 5 CTA types, and 5 body structures
- **CSV Export** — Download generated emails as CSV for import into email tools
- **Search & Filter** — Filter emails by CTA type, opening hook, or keyword search
- **Bulk Select & Send** — Check multiple emails and send them all at once
- **Clean Responsive UI** — Mobile-friendly design with plain CSS

## Architecture

```
                         ┌─────────────────┐
                         │   Browser        │
                         │ (React SPA)      │
                         └────────┬────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │    Express Server           │
                    │  (Port 5002)               │
                    │  ┌─────────┐  ┌──────────┐ │
                    │  │ Static  │  │  API     │ │
                    │  │ Assets  │  │ Routes   │ │
                    │  └─────────┘  └────┬─────┘ │
                    └────────────────────┼───────┘
                                         │
                    ┌────────────────────▼───────┐
                    │         PostgreSQL          │
                    │      (Port 5433)            │
                    └────────────────────────────┘
                                         │
                    ┌────────────────────▼───────┐
                    │   AI Providers:             │
                    │   • Gemini (gemini-3.5-flash)│
                    │   • Groq (llama-3.1-8b)     │
                    │   • Ollama (local)          │
                    └────────────────────────────┘
```

**Production mode:** The Express server on port 5002 serves both the React build (static files) and the REST API. One port, one ngrok tunnel.

**Development mode:** React dev server on port 3000 proxies `/api/*` calls to port 5002 via the `"proxy"` setting in `package.json`, enabling hot-reload.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, React Router, Axios, Plain CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL 16 (port 5433 — Homebrew default) |
| AI | Gemini (`gemini-3.5-flash`), Groq (`llama-3.1-8b-instant` / `llama-3.3-70b-versatile`), Ollama (`llama3.2:1b`) |
| Email | Nodemailer via Gmail SMTP |
| Ports | Backend: 5002 (also serves the built frontend), Dev server: 3000 |

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 16+ (installed via Homebrew)
- At least one AI API key: Gemini (https://aistudio.google.com/) or Groq (https://console.groq.com)

## Setup Instructions

### Step 1: Install PostgreSQL

```bash
brew install postgresql@16
brew services start postgresql@16
```

### Step 2: Create the Database

```bash
createdb ai_cold_email_factory
```

### Step 3: Clone & Navigate

```bash
cd ai-cold-email-factory
```

### Step 4: Set Up the Backend

```bash
cd backend
npm install
```

### Step 5: Configure Environment

Edit `.env` in the project root. Full configuration reference:

```env
# Required: Database
DATABASE_URL=postgresql://localhost:5433/ai_cold_email_factory
PORT=5002

# Required (pick at least one AI provider):
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=gsk_your_groq_api_key

# Optional: Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b

# Optional: SMTP for sending test emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_char_app_password
EMAIL_TO=your_email@gmail.com

# Optional: Groq model fallback (default: chosen in UI)
# GROQ_MODEL=llama-3.1-8b-instant
```

### Step 6: Run Database Schema

```bash
psql -p 5433 -d ai_cold_email_factory -f backend/schema.sql
```

### Step 7: (Optional) Load Sample Data

```bash
psql -p 5433 -d ai_cold_email_factory -f backend/seed.sql
```

### Step 8: Set Up the Frontend

```bash
cd frontend
npm install
```

### Step 9: Build the Frontend

```bash
cd frontend
npm run build
```

### Step 10: Start the Application

```bash
cd backend
node server.js
```

The app will be available at **http://localhost:5002**.

### Development Mode (with hot-reload)

**Terminal 1 — Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 — Frontend dev server:**
```bash
cd frontend
npm start
```

In dev mode, the React dev server runs on **http://localhost:3000** and proxies API requests to port 5002.

### Demo via ngrok

```bash
cd backend && node server.js

# In another terminal
ngrok http 5002
```

## SMTP Setup (Send Test Emails)

To send test emails from the app to your inbox:

1. **Enable 2-Step Verification** on your Google account at https://myaccount.google.com/security
2. **Generate an App Password** at https://myaccount.google.com/apppasswords
   - Select app: "Mail", device: "Other" → name it "AI Cold Email Factory"
   - Copy the 16-character password
3. Add to `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=the_16_character_app_password
   EMAIL_TO=your_email@gmail.com
   ```

All sent emails go to `EMAIL_TO` only — no actual cold outreach happens.

## AI Providers

### Gemini (Cloud, Free Tier)
- Model: `gemini-3.5-flash`
- Rate limits: ~10 RPM, 1,500 RPD
- Get key: https://aistudio.google.com/

### Groq — Llama 3.1 8B / 3.3 70B (Cloud, Free Tier)
- **Llama 3.1 8B** (Fast) — `llama-3.1-8b-instant` — 560 t/s, 14,400 RPD, $0.05/$0.08 per 1M tokens
- **Llama 3.3 70B** (Best Quality) — `llama-3.3-70b-versatile` — 280 t/s, 1,000 RPD, $0.59/$0.79 per 1M tokens
- Get key: https://console.groq.com
- Both models available on free tier (no credit card required)
- On rate limit (429): auto-retries with exponential backoff using the `retry-after` header

### Ollama — Llama 3.2 1B (Local)
- Runs entirely on your machine
- Requires: `ollama pull llama3.2:1b` and `ollama serve`

## Rate Limit Handling

All cloud AI providers implement retry logic for rate limits:

| Provider | Detection | Strategy |
|----------|-----------|----------|
| **Gemini** | 429 status or error message match | Exponential backoff (1s, 2s, 4s + jitter), max 3 retries |
| **Groq** | 429 status + `retry-after` header | Uses `retry-after` value from response, max 3 retries |
| **Ollama** | Local — no rate limits | N/A |

After retries are exhausted, the batch continues with remaining emails (graceful degradation).

## Usage Guide

1. **Dashboard** (`/`) — View company stats, Quick Start seed data
2. **Setup** (`/setup`) — Enter your company info, services, case studies, pricing, and target industries
3. **Generate** (`/generate`) — Pick AI model, target industry, count, and start generation
4. **Batches** (`/batches`) — View all batches with progress and status
5. **Results** (`/emails/:batchId`) — View emails, **check boxes to select**, click **"Send Selected"** to send to your inbox, or click **"View"** → **"Send Test Email"** for individual sends

### Sending Test Emails Flow

1. Go to any batch results
2. Check the emails you want to preview
3. Click **"Send Selected (N)"** in the top bar
4. All selected emails arrive in your inbox at `EMAIL_TO`
5. Or click **"View"** on any email → **"Send Test Email"** button in the modal

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/company` | Create company |
| GET | `/api/company` | Get latest company |
| PUT | `/api/company/:id` | Update company |
| DELETE | `/api/company/:id` | Delete company |
| POST | `/api/services` | Add service |
| GET | `/api/services?company_id=X` | List services |
| PUT | `/api/services/:id` | Update service |
| DELETE | `/api/services/:id` | Delete service |
| POST | `/api/case-studies` | Add case study |
| GET | `/api/case-studies?company_id=X` | List case studies |
| PUT | `/api/case-studies/:id` | Update case study |
| DELETE | `/api/case-studies/:id` | Delete case study |
| POST | `/api/pricing` | Add pricing plan |
| GET | `/api/pricing?company_id=X` | List pricing plans |
| PUT | `/api/pricing/:id` | Update pricing plan |
| DELETE | `/api/pricing/:id` | Delete pricing plan |
| POST | `/api/industries` | Add target industry |
| GET | `/api/industries?company_id=X` | List industries |
| PUT | `/api/industries/:id` | Update industry |
| DELETE | `/api/industries/:id` | Delete industry |
| POST | `/api/generate` | Start email generation |
| GET | `/api/generate/status/:batchId` | Get generation progress |
| GET | `/api/batches` | List all batches |
| DELETE | `/api/batches/:id` | Delete batch |
| GET | `/api/emails/:batchId` | Get emails for batch (with search, cta, hook filters) |
| GET | `/api/emails/:batchId/csv` | Download batch as CSV |
| GET | `/api/emails/detail/:id` | Get single email detail |
| PUT | `/api/emails/:id` | Update email (mark as sent) |
| DELETE | `/api/emails/:id` | Delete email |
| POST | `/api/emails/send/:id` | Send single test email via SMTP |
| POST | `/api/emails/send-batch` | Send multiple selected test emails |
| GET | `/api/health` | Health check endpoint |
| POST | `/api/seed-demo` | Seed sample data for quick start |

## Database Access

```bash
# Quick queries
psql -p 5433 -d ai_cold_email_factory -c "SELECT COUNT(*) FROM generated_emails;"
psql -p 5433 -d ai_cold_email_factory -c "SELECT id, recipient_name, subject_line FROM generated_emails LIMIT 10;"

# Interactive shell
psql -p 5433 -d ai_cold_email_factory
  \dt             # List all tables
  SELECT * FROM companies;
  SELECT * FROM generated_emails ORDER BY id DESC LIMIT 20;
  \q              # Quit
```

## License

MIT
