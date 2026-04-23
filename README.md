# AI Trade Platform 🇮🇳📈

An algorithmic trading platform built for the Indian stock market (NSE/BSE). This project was a personal deep-dive into combining real-time market data, AI-generated signals, and a clean UI — all wired together into something that actually trades (or paper-trades, which is probably safer).

---

## 🔗 Live Demo link : https://trading-frontend-173548921894.asia-south1.run.app



The live version runs in paper trading mode — no real orders, but all the data and signals are live. Feel free to explore the dashboard.


## What this project does

At its core, it's a full-stack trading system where you can run both AI-driven and manual strategies against live NSE/BSE data. I built it to explore how LLMs can assist with technical analysis, and whether you can realistically automate decision-making around market signals.

what is  working end-to-end:

- Pulls real-time quotes and OHLCV history via **Angel One SmartAPI**
- Runs **SMA crossover** and other rule-based strategies on a cron schedule
- Sends trade signals and portfolio updates live via **WebSockets (Socket.IO)**
- Uses **Gemini / Groq** to generate AI commentary on signals and market conditions (with a fallback heuristic layer so nothing breaks if the API is down)
- Tracks holdings, P&L, and trade history in **PostgreSQL via Prisma ORM**
- Displays everything on a **React dashboard** with charts, filters, and live updates

---

## Screenshots
<img width="1674" height="895" alt="image" src="https://github.com/user-attachments/assets/092563d1-8c2e-4ddf-a81e-17f17f51fb23" />

---

## Tech Stack

**Backend** — Node.js · Express · Prisma · PostgreSQL · Socket.IO · Zod · Winston  
**Frontend** — React · Vite · TailwindCSS · Zustand · React Query · Recharts  
**Infra** — Docker · Nginx · Google Cloud Run

---

## Project Layout

```
trading-backend/    → Node.js API server (Express, Prisma, Socket.IO, cron jobs)
trading-frontend/   → React app (Vite, Tailwind, real-time dashboard)
Dockerfile.backend  → Backend container
Dockerfile.frontend → Frontend container (served via Nginx)
```

---

## Running it locally

### What you'll need
- Node.js 20+
- A PostgreSQL instance
- Angel One SmartAPI credentials (for live data)

### Backend

```bash
cd trading-backend
npm install
npx prisma db push   # initializes the schema
npm run dev          # runs on http://localhost:3000
```

### Frontend

```bash
cd trading-frontend
npm install
npm run dev          # runs on http://localhost:5173
```

Both folders have a `.env.example` — just copy and fill in your keys.

---

## Docker setup

If you'd rather run everything containerized:

```bash
# Backend
docker build -f Dockerfile.backend -t ai-trade-backend .
docker run -p 3000:3000 --env-file trading-backend/.env ai-trade-backend

# Frontend
docker build -f Dockerfile.frontend -t ai-trade-frontend .
docker run -p 8080:8080 ai-trade-frontend
```

---

## A few things worth calling out

**AI analysis with graceful fallback** — The AI signal layer hits Gemini or Groq to generate a summary of market conditions, but if either is unavailable, the system falls back to hardcoded heuristics. Nothing crashes silently.

**Paper trading mode** — You can run the whole thing without placing real orders. Good for testing strategies without stress.

**Cron-based strategy engine** — Strategies are scheduled jobs, not just one-off triggers. The system scans the market on a timer and reacts accordingly.

**Real-time everything** — Portfolio value, signals, and trade status all update over WebSockets so the dashboard stays live without refreshing.

---

## License

ISC
