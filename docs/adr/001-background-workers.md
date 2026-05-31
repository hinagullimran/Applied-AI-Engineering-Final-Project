# ADR 001: Background Worker Architecture for Catalyst

## Status
Proposed

## Context
Catalyst involves complex, long-running AI tasks such as trend ingestion, multi-agent market scoring, and multimodal sentiment analysis. These tasks can take anywhere from several seconds to several minutes, exceeding the standard HTTP request-response cycle.

## Decision
We will implement a distributed task queue architecture using **Celery** with **Redis** as the message broker.

### Key Components:
- **FastAPI (API Layer):** Receives requests and dispatches tasks to the queue.
- **Redis (Broker):** Acts as the transport layer for messages between the API and workers.
- **Celery Workers (Business Logic Layer):** Executes the heavy-lifting AI agents and data processing.
- **Supabase (Result Store):** Persists the final state and insights for retrieval by the UI via WebSockets or Polling.

## Rationale
1. **Responsiveness:** Allows the UI to remain interactive while heavy tasks run in the background.
2. **Scalability:** Workers can be scaled independently of the API layer to handle bursts in traffic.
3. **Reliability:** Built-in retry mechanisms for transient failures (e.g., API rate limits from LLM providers).
4. **Visibility:** Task status (Pending, Started, Success, Failure) can be tracked systematically.

## Consequences
- **Complexity:** Adds Redis as a infrastructure dependency.
- **Eventual Consistency:** The UI must handle asynchronous state updates (implemented via WebSockets).
- **Resource Management:** Requires careful monitoring of worker memory usage, especially for multimodal processing.
