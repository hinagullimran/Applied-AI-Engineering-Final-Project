# Catalyst: Next-Gen E-Commerce Intelligence Engine

Catalyst is an advanced, AI-driven E-commerce Intelligence platform designed to identify market gaps, evaluate consumer sentiment shifts, generate optimized high-converting product listings, and coordinate supplier sourcing. It features a fully automated modular agentic pipeline and is integrated with a local n8n WhatsApp automation server.

---

## 🚀 Key Features

*   **🔍 Trend & Gap Discovery**: Leverages multi-platform social media scraping (Reddit, TikTok, Instagram) to find real-time consumer complaints and product failure points.
*   **🧠 Multi-Agent Orchestration**: Features five specialized AI agents coordinating via a Central Manager:
    *   **Research Agent**: Scrapes and synthesizes social trends.
    *   **Analysis Agent**: Extracts high-opportunity market gaps and engineers solutions.
    *   **Creative Agent**: Generates e-commerce copies and simulates A/B testing.
    *   **Logistics Agent**: Assesses supplier viability and profit margins.
    *   **Sentiment Agent**: Processes unstructured sentiment shifts.
*   **📊 Sourcing Leads Pipeline**: One-click action to save factory leads, search Alibaba, and manage logistics contacts.
*   **📱 WhatsApp Calendar Assistant (n8n)**: Manage appointments and sync with Google Calendar using LangChain agents via a local n8n server.
*   **🧮 Profitability Calculator**: Real-time margin estimation, marketplace fees, and ROI calculations.
*   **✨ Premium Visuals**: Beautifully crafted dark-themed interface built with Next.js, Tailwind CSS, Glassmorphism elements, and smooth Framer Motion micro-animations.

---

## 🛠️ Technology Stack

*   **Frontend**: Next.js (React), Tailwind CSS, Framer Motion, Lucide Icons
*   **Backend**: FastAPI (Python), Uvicorn, Pydantic, PRAW
*   **Database & Auth**: Supabase (PostgreSQL with Row-Level Security)
*   **AI Engine**: Google Gemini API (`google.genai` SDK, `gemini-1.5-flash`) & OpenAI API
*   **Orchestration**: n8n local automation server (LangChain nodes)
*   **Package Management**: `uv` (Fast Python package manager)

---

## 📂 Project Structure

```text
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── agents/          # AI Agent Network (Research, Analysis, Creative, Logistics, Sentiment)
│   │   ├── api/routes/      # Endpoint routers (Market Data, Analysis, Products, WebSockets)
│   │   ├── core/            # System configuration & logging
│   │   ├── middleware/      # Safety and security interceptors
│   │   ├── services/        # Third-party integrations (Embeddings, Scrapers, Vector Search)
│   │   └── main.py          # Application entrypoint
│   ├── .venv/               # Virtual environment managed by uv
│   ├── .env                 # Backend keys (Supabase, Gemini, OpenAI, Bright Data)
│   └── requirements.txt     # Python dependencies
│
├── frontend/                 # Next.js Application
│   ├── src/
│   │   ├── app/             # Page routes and layout styles
│   │   ├── components/      # Glassmorphic UI & Interactive Dashboard components
│   │   └── lib/             # Third-party clients (Supabase, API client)
│   ├── .env.local           # Frontend environment keys
│   └── package.json         # Node.js configurations
│
├── n8n/                      # Automation Workflows
│   └── WhatsApp Calendar Assistant.json  # Google Calendar + WhatsApp LangChain agent
│
└── supabase/
    └── schema.sql            # Database tables, triggers, and Row-Level Security policies
```

---

## 🔌 Environment Setup

### Backend Environment (`backend/.env`)
Create a file named `.env` in the `backend/` directory:
```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-anon-or-service-key"
GOOGLE_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key" # Optional fallback
BRIGHTDATA_TOKEN="your-bright-data-token" # Optional social scraping token
REDDIT_CLIENT_ID="your-reddit-id"
REDDIT_CLIENT_SECRET="your-reddit-secret"
```

### Frontend Environment (`frontend/.env.local`)
Create a file named `.env.local` in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-public-anon-key"
```

---

## ⚙️ Running the Applications

Ensure your environment keys are set up. Run each command in a separate terminal:

### 1. Start the Backend API Server
```bash
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
API docs will be available at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

### 2. Start the Frontend Dev Server
```bash
cd frontend
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Start the n8n Automation Server
```bash
n8n start
```
Access the n8n dashboard at **[http://localhost:5678](http://localhost:5678)** to import and run your WhatsApp workflow.

---

## 🔒 Row-Level Security (RLS) Configuration
To ensure seamless read/write functionality with Supabase during local development, ensure these policies are applied via the Supabase SQL editor:
```sql
CREATE POLICY "Allow all on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on competitor_reviews" ON public.competitor_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sourcing_leads" ON public.sourcing_leads FOR ALL USING (true) WITH CHECK (true);
```
