# backend

Server-side code: the OCR pipeline (photo intake → GLM-OCR extraction →
normalization), the deterministic Postgres ledger, report generation,
and rule-based alerts.

Key rules (see root CLAUDE.md):
- All arithmetic happens here in deterministic code, never in an LLM.
- Model calls go through the config-driven abstraction layer.
- Extraction results are validated before entering the ledger.
