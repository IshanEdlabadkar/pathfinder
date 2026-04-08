# PathFinder

AI-powered college counseling intelligence platform. Built as a student database management system with integrated AI features for session note parsing, pre-session briefing generation, and caseload management.

## What It Does

PathFinder helps college counselors manage their caseload by combining structured student data management with AI-powered automation:

- **AI Session Note Parsing** — Enter free-form session notes, the AI extracts structured operations (add schools, create tasks, update statuses), counselor reviews and confirms in a single atomic transaction
- **Pre-Session Briefings** — Generate a scannable 3-minute briefing before any student meeting with overdue items, upcoming deadlines, school updates, and suggested focus
- **Priority Queue Dashboard** — Students ranked by urgency based on overdue items, time since last session, and approaching deadlines
- **College List Management** — Track schools with classification, round, status, deadlines; auto-enrichment populates admissions data when schools are added
- **Essay Tracker** — Auto-populated essay requirements grouped by school with status tracking, Google Doc links, and review-ready highlighting
- **Student Chat** — Ask questions about any student and get answers grounded in their complete record
- **Calendar** — Unified view of all sessions, deadlines, tasks, and scheduled events across the caseload
- **Nudge Messages** — AI-generated reminder messages for overdue action items, ready to copy and send

## Architecture
Counselor → Next.js Frontend → API Routes → LLM (OpenRouter) → Changeset → Prisma → PostgreSQL

Key design decisions:

- **Changeset pattern**: AI never writes to the database directly. It proposes operations, the counselor confirms, a single atomic transaction executes. This prevents AI errors from corrupting student data.
- **School resolver with alias table**: Maps informal school names ("NU", "UPenn") to canonical records, preventing duplicates.
- **Auto-enrichment**: Adding a school triggers LLM-based population of deadlines, requirements, stats, and essay entries.
- **Single-shot JSON over agentic loops**: Free-tier models don't reliably support tool-use chains. The architecture uses one request in, structured JSON out, which is simpler, cheaper, and more reliable.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL (Neon), Prisma ORM
- **AI**: OpenRouter (swappable to Claude, GPT, etc.)
- **Deployment**: Vercel

## Setup

### Prerequisites

- Node.js 18+
- A Neon account (free tier works)
- An OpenRouter API key

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/pathfinder.git
cd pathfinder
npm install
```

### Environment Variables

Create `.env.local`:
DATABASE_URL="your-neon-connection-string"
OPENROUTER_API_KEY="your-openrouter-key"
### Database Setup

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### Run

```bash
npm run dev
```

Open http://localhost:3000

## Project Structure
src/
├── app/                    # Next.js pages and API routes
│   ├── dashboard/          # Priority queue, stats, upcoming week
│   ├── students/[id]/      # Student profile with all tabs
│   ├── calendar/           # Full calendar view
│   └── api/                # All backend endpoints
├── agents/                 # LLM prompt definitions and orchestration
│   ├── noteParser/         # Session note parsing
│   └── briefing/           # Pre-session briefing generation
├── components/             # React components
│   ├── EssayTracker.tsx    # Essay management grouped by school
│   ├── CalendarView.tsx    # Month calendar with event types
│   ├── NotesForm.tsx       # Session notes with changeset confirmation
│   ├── BriefingView.tsx    # AI briefing display
│   ├── StudentChat.tsx     # Conversational Q&A about a student
│   └── ...
├── lib/                    # Shared utilities
│   ├── changesetExecutor.ts # Atomic changeset execution with audit logging
│   ├── schoolEnricher.ts   # Auto-enrichment for school data and essays
│   ├── schoolResolver.ts   # Alias-based school name resolution
│   └── openrouter.ts       # LLM client
└── types/                  # TypeScript type definitions

## Design Decisions

### Why a changeset pattern instead of direct AI writes?

LLMs are probabilistic. A session note parser that writes directly to the database will occasionally misinterpret "we discussed maybe looking at Georgetown" as "add Georgetown to the list." The changeset pattern — propose, review, confirm — keeps the counselor in control while still automating 90% of the data entry work.

### Why single-shot JSON instead of agentic tool-use?

Free-tier models on OpenRouter don't reliably support multi-step tool-use chains. Rather than build complex orchestration that fails unpredictably, the architecture sends all context upfront and asks for one structured JSON response. This is simpler, cheaper, faster, and works with any model. When upgrading to Claude or GPT-4, switching to tool-use is a straightforward refactor of the agent files without changing the changeset executor or any frontend code.

### Why auto-enrich on school addition?

Counselors shouldn't have to manually enter deadlines and essay requirements for every school — that's exactly the kind of busywork this tool eliminates. When a school is added (either manually or through the note parser), the system fetches admissions data and creates essay skeleton records automatically. Data is flagged as unverified so counselors know to confirm important dates.

### Why global schools with an alias table?

Every counselor is talking about the same Northwestern with the same deadlines. Making schools global entities with cached research data means enrichment runs once per school, not once per student. The alias table handles the inevitable variation in how people refer to schools.

## What I'd Build Next

1. **CSV import** — Onboarding counselors from spreadsheets
2. **Real authentication** — Email/password login
3. **Outcome analytics** — Track admit/reject/waitlist outcomes to help counselors market their services
4. **Student portal** — Let students self-report progress and view their tasks
5. **Multi-counselor support** — Team features for boutique firms