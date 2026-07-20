# Project: Restaurant Inventory Service (working name)

## What this is
A trilingual (ZH/FR/EN) inventory web app for small restaurants.
Pipeline: photo intake → GLM-OCR extraction → normalization →
deterministic ledger (Postgres) → weekly reports + rule-based alerts.
Solo founder, non-expert programmer, learning as we build.

## Interaction rules — IMPORTANT
- Before writing ANY code for a new task, ask me 2-5 clarifying
  questions, even if the task seems clear. Ask about: edge cases,
  what happens on failure, what the user sees, and anything I
  haven't specified. Never assume — surface every assumption as
  a question.
- Always use plan mode workflow: explore, present a plan with
  your open questions, wait for my approval, then implement.
- Explain what you did in plain language after each change, as if
  teaching a strong math student who is new to web development.
- If I ask for something that conflicts with the architecture
  rules below, stop and ask before proceeding.

## Architecture rules (non-negotiable)
- LLMs NEVER do arithmetic. All numbers customers see come from
  deterministic code reading the Postgres ledger.
- Model calls go through the abstraction layer (config-driven
  model names, OpenAI-compatible). Never hardcode a provider.
- Unit conversions live in hand-written tables, never generated
  at runtime by a model.
- Every extraction result is validated (line totals sum to
  invoice total; all numerics parse) before entering the ledger.
- All user-facing strings go through the i18n system (ZH/FR/EN).
  No hardcoded English strings.
- Strip personal data (names, emails) before any external
  model API call.

## Engineering standards
- Write tests for all ledger math and normalization logic.
  Run the test suite after changes and show me the output.
- Small commits with descriptive messages after each working step.
- Never commit secrets. API keys live in .env (gitignored).
- Prefer boring, readable code over clever code.

## Current milestone
Stage 3: review/confirm UI (done); next: Stage 4 photo upload + GLM-OCR extraction
