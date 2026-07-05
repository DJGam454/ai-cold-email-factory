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
| Frontend | React 19, React Router, Axios, Plain CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL 16 |
| AI | Google Gemini API (`@google/generative-ai`) |
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
DATABASE_URL=postgresql://localhost/ai_cold_email_factory
PORT=5001
```

### Step 6: Run Database Schema

```bash
psql ai_cold_email_factory -f backend/schema.sql
```

### Step 7: (Optional) Load Sample Data

```bash
psql ai_cold_email_factory -f backend/seed.sql
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
| GET | `/api/emails/:batchId` | Get emails (with filters) |
| GET | `/api/emails/:batchId/csv` | Download CSV |
| GET | `/api/emails/detail/:id` | Get single email |
| PUT | `/api/emails/:id` | Update email (mark sent) |
| DELETE | `/api/emails/:id` | Delete email |

## AI Prompt Strategy

The Gemini prompt is carefully engineered to ensure variety across 5 dimensions:

1. **Subject Lines** — Question, Benefit, Curiosity Gap, Personalized, Urgency
2. **Opening Hooks** — Industry Stat, Pain Point, Compliment, Question, Story
3. **CTAs** — Schedule Call, Request Demo, Free Consultation, Download Resource, Reply
4. **Body Structures** — Problem-Solution, AIDA, Storytelling, Value-First, Social Proof
5. **Tone & Length** — Formal, Semi-formal, Conversational; Short, Medium, Long

## Assumptions Made

- Single company per deployment (no multi-tenancy)
- PostgreSQL runs locally on default port (5432)
- Gemini 2.0 Flash model is used for generation
- Email generation happens asynchronously with polling-based progress
- A maximum of 500 emails per batch to respect API rate limits
- Three concurrent Gemini API calls maximum to avoid throttling

## Features to Add With More Time

- **Email Sending Integration** (SendGrid, AWS SES, SMTP)
- **A/B Testing** for subject lines and CTAs
- **Spam Score Checker** before finalizing emails
- **Rate Limiting** — Daily sending quotas per industry
- **User Authentication** for multi-tenant use
- **Email Template Editor** with drag-and-drop
- **Analytics Dashboard** — Track open rates, reply rates, bounce rates
- **Scheduled Sending** with timezone-aware delivery
- **Lead Import** from CSV/CRM integration (HubSpot, Salesforce)
- **Language & Tone Customization** per recipient

## License

MIT
