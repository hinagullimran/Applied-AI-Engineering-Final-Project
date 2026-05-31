# Catalyst Project Map

## 🏗️ Architecture Overview
Catalyst is built on a "Manager-Agent" pattern with clear separation of concerns.

### 1. Backend Layers (FastAPI)
- **API Layer (`app/api`):** REST & WebSocket endpoints, input validation, safety middleware.
- **Business Logic Layer (`app/agents` & `app/services`):** Multi-agent orchestration, trend analysis, sentiment scoring.
- **Data Access Layer (`app/db`):** Supabase (PostgreSQL) repository, Pinecone (Vector) storage.
- **Worker Layer (`app/worker`):** Celery tasks for background processing.

### 2. Multi-Agent System
- **Manager Agent:** Orchestrates sub-agents and synthesizes final reports.
- **Research Agent:** Scrapes trend data (via n8n) and market gaps.
- **Creative Agent:** Generates optimized copy and A/B test simulations.
- **Logistics Agent:** Validates manufacturers and margin viability.

### 3. Safety & Reliability
- **Defense-in-Depth:** Safety middleware for input sanitization and PII filtering.
- **Evaluation:** Systematic evals against ground-truth datasets.
- **Observability:** Structured logging with correlation IDs and token usage monitoring.

### 4. Frontend (Next.js)
- **Real-time:** WebSocket integration for streaming AI responses.
- **Premium UI:** Progressive disclosure and micro-interactions using Vanilla CSS/Tailwind.
