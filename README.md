# AI Cold Email Factory

A web application that generates highly personalized cold outreach emails at scale using AI. Built with React, Express, Node.js, PostgreSQL, and Google Gemini API.

## Features

- **Company Profile Management** — CRUD for company info, services, case studies, pricing, and target industries
- **AI Email Generation** — Generate up to 500 unique cold emails with varied subject lines, hooks, CTAs, and body structures
- **Real-time Progress Tracking** — Polling-based progress indicator during generation
- **Smart Variety** — Emails differ across 5 subject patterns, 5 hook styles, 5 CTA types, and 5 body structures
- **CSV Export** — Download generated emails as CSV for import into email tools
- **Search & Filter** — Filter emails by CTA type, opening hook, or keyword search
- **Clean Responsive UI** — Mobile-friendly design with plain CSS

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  React App  │────▶│  Express API │────▶│ PostgreSQL │
│  (Port 3000)│     │  (Port 5001) │     │   Database  │
└─────────────┘     └──────┬───────┘     └────────────┘
                           │
                    ┌──────▼───────┐
                    │  Google      │
                    │  Gemini API  │
                    └──────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, React Router, Axios, Plain CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL 16 (port 5433 — Homebrew default) |
| AI | Google Gemini API (`gemini-3.5-flash` via `@google/genai`) |
| Ports | Frontend: 3000, Backend: 5001 |

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 16+ (installed via Homebrew)
- Google Gemini API key (get one at https://aistudio.google.com/)

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

Edit `.env` in the project root and set your Gemini API key:

```
GEMINI_API_KEY=your_actual_api_key_here
DATABASE_URL=postgresql://localhost:5433/ai_cold_email_factory
PORT=5001
```

### Step 6: Run Database Schema

```bash
psql -p 5433 -d ai_cold_email_factory -f backend/schema.sql
```

### Step 7: (Optional) Load Sample Data

```bash
psql -p 5433 -d ai_cold_email_factory -f backend/seed.sql
```

This loads dummy data for "TechForge Solutions" — a fictional IT consulting company.

### Step 8: Set Up the Frontend

```bash
cd frontend
npm install
```

### Step 9: Start the Application

**Terminal 1 — Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
```

The app will be available at **http://localhost:3000**.

## Git & GitHub Setup

If you'd like to push this project to GitHub for submission or collaboration:

```bash
# 1. Create a new repository on GitHub (e.g. "ai-cold-email-factory")
#    Do NOT initialize it with README, .gitignore, or license.

# 2. Link your local repo to GitHub (replace USER/REPO with your values)
git remote add origin https://github.com/YOUR_USERNAME/ai-cold-email-factory.git

# 3. Stage all current files and commit
git add .
git commit -m "Complete AI Cold Email Factory with Gemini 3.5 Flash"

# 4. Push to GitHub
git push -u origin main
```

**Important:** The `.gitignore` already excludes `node_modules/`, `.env`, and `build/` folders. Your API key stays safe locally.

## Database Access

PostgreSQL was installed via Homebrew and runs on port 5433. Here's how to inspect the data:

```bash
# Quick queries (no interactive shell)
psql -p 5433 -d ai_cold_email_factory -c "SELECT COUNT(*) FROM generated_emails;"
psql -p 5433 -d ai_cold_email_factory -c "SELECT id, recipient_name, subject_line FROM generated_emails LIMIT 10;"
psql -p 5433 -d ai_cold_email_factory -c "SELECT * FROM email_batches ORDER BY id DESC;"

# Interactive psql shell
psql -p 5433 -d ai_cold_email_factory

  # Inside psql, useful commands:
  \dt             # List all tables
  \d+ companies   # Show table schema and columns
  SELECT * FROM companies;
  SELECT * FROM target_industries;
  SELECT * FROM generated_emails ORDER BY id DESC LIMIT 20;
  \q              # Quit

# pgAdmin (GUI alternative):
# Open the pgAdmin app → Add Server
#   Name: AI Cold Email Factory
#   Host: localhost, Port: 5433
#   Database: ai_cold_email_factory
#   Username: (your macOS username), Password: (leave blank)
# No password needed — Homebrew PostgreSQL uses peer/trust authentication by default.
```

## Usage Guide

1. **Dashboard** (`/`) — View company stats and quick actions
2. **Setup** (`/setup`) — Enter your company name, description, services, case studies, pricing, and target industries
3. **Generate** (`/generate`) — Select target industry, set email count (1-500), and start generation
4. **Batches** (`/batches`) — View all generation batches with progress
5. **Results** (`/emails/:batchId`) — View, filter, search, and download generated emails as CSV

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
| GET | `/api/health` | Health check endpoint |

## AI Model Selection: Why Gemini 3.5 Flash

We evaluated all free-tier Gemini models and selected `gemini-3.5-flash` (released May 2026) as the best balance of quality, speed, and rate limits:

| Model | RPM | RPD | Output Limit | Quality | Verdict |
|-------|-----|-----|-------------|---------|---------|
| **gemini-3.5-flash** | ~10 | 1,500 | 65,536 tokens | ★★★★★ Best | ✅ Selected |
| gemini-3.1-flash-lite | ~15 | 1,500 | 8,192 tokens | ★★★★☆ | Lower output limit |
| gemini-2.0-flash-lite | ~30 | 1,500 | 8,192 tokens | ★★★☆☆ | Older, lower quality |

**Why not Flash-Lite?** Its 8K output token limit caused JSON truncation during testing — emails were cut off mid-generation. Gemini 3.5 Flash's 65K output limit eliminates this issue entirely.

**Rate limit strategy:** At ~10 RPM with 5 emails per call, we can generate ~7,500 emails per day on the free tier. The app splits large batches into concurrent sub-batches of 5, with exponential backoff on retries.

## Prompt Engineering Strategy

The Gemini prompt is carefully engineered to ensure variety across 5 dimensions:

1. **Subject Lines** — Question, Benefit, Curiosity Gap, Personalized, Urgency
2. **Opening Hooks** — Industry Stat, Pain Point, Compliment, Question, Story
3. **CTAs** — Schedule Call, Request Demo, Free Consultation, Download Resource, Reply
4. **Body Structures** — Problem-Solution, AIDA, Storytelling, Value-First, Social Proof
5. **Tone & Length** — Formal, Semi-formal, Conversational; Short, Medium, Long

## Assumptions Made

- Single company per deployment (no multi-tenancy)
- PostgreSQL runs locally on port 5433 (Homebrew PostgreSQL 16 default)
- Gemini 3.5 Flash (`gemini-3.5-flash`) is the generation model — the fastest, cheapest Gemini model as of May 2026 with 1,500 requests/day on the free tier
- Email generation happens asynchronously via `setImmediate` with polling-based progress tracking
- Maximum 500 emails per batch to stay within daily free-tier API quotas
- Sub-batches of 5 emails per API call for reliable JSON responses
- Three concurrent Gemini API calls maximum to avoid hitting the 10 RPM rate limit
- Single-page application served separately from the API backend

## Features to Add With More Time

### Email Operations
- **Email Sending Integration** — Connect SendGrid, AWS SES, or SMTP to send campaigns directly from the app
- **Reply Detection** — Auto-detect replies via webhooks and mark engaged leads
- **Scheduled Sending** — Timezone-aware delivery queues with daily sending caps per industry (following CAN-SPAM best practices)
- **Bounce & Spam Tracking** — Parse delivery webhooks to remove invalid addresses

### Content & Quality
- **A/B Testing** — Generate multiple subject line / CTA variants per recipient, track which performs best
- **Spam Score Checker** — Pre-send checks using SpamAssassin or similar
- **Email Template Editor** — Drag-and-drop editor to customize the email HTML layout
- **Language & Tone Customization** — Adjust formality, length, and cultural references per recipient persona

### Analytics & CRM
- **Analytics Dashboard** — Open rates, reply rates, bounce rates, and conversion tracking
- **Lead Scoring** — Score recipients based on engagement signals
- **CRM Integration** — Import leads from HubSpot, Salesforce, or CSV; sync sent emails and replies back
- **Pipeline Tracking** — Track email → reply → meeting → deal conversion

### Platform & Scale
- **User Authentication** — Multi-tenant accounts with team collaboration
- **Batch API** — Use Gemini's Batch API endpoint for higher throughput (avoids 10 RPM limit)
- **Rate Limit Mgmt** — Adaptive rate limiter that respects daily quotas and backs off on 429s
- **CSV Lead Import** — Bulk upload recipient lists with merge tag mapping
- **Deployment** — Docker setup for one-command deployment to any cloud provider

## License

MIT
