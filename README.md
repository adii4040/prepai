# prepai-backend ⚡

This repository houses the core AI analytical engine and REST API orchestration layer for `prepai`. The service processes complex raw text inputs (resumes and target job descriptions) and leverages advanced generative models to output highly structured, production-ready JSON payloads.

Built with a focus on strict runtime validation, the engine ensures that loose LLM token outputs are guaranteed to match expected data structures before touching any database or client layer.

## 🛠️ Core Services & Architecture

- **Structured Content Processing:** Implements the latest `@google/genai` SDK alongside nested `responseFormat` JSON schemas to enforce structural layout formatting directly within the LLM compilation phase.
- **Bifurcated Question Synthesis Engine:** Independently routes and curates exactly 5 targeted technical interview queries and 5 behavioral interview frameworks per request.
- **Fail-Safe Validation Interceptor:** Utilizes Zod schemas on runtime object responses as an authoritative data-bouncer, safeguarding downstream applications from schema drift or sequencing variations.
- **Dynamic Timeline Compiler:** Programmatically evaluates calendar-aware date intervals to generate structural daily prep sprints complete with hour pacing metrics.

## 📦 Tech Stack

- **Runtime:** Node.js (ES6+ / Express)
- **AI Orchestration:** Google GenAI SDK (`@google/genai` / Gemini 2.5 & 3.5 Models)
- **Data Guardrails & Schema Mapping:** Zod + `zod-to-json-schema`
- **Testing Suite:** Postman