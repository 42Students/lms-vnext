# Work packet (wave 2): edit src/app/college-join/[token]/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/college-join-token.md

## G2-1-027-033  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:92: loading Skeleton active paragraph rows4.
- vNext now: src/app/college-join/[token]/page.tsx:10-11: SSR preview and PublicJoinPreviewRetry; no identical four-row skeleton.
- Fix: Add same skeleton for SSR loading.tsx.

## G2-1-027-034  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-join/[token].js:93-98: load_error Result warning title + Retry; invalid Result info + Sign in.
- vNext now: src/app/college-join/[token]/page.tsx:10-20, V:124-133: retry wrapper and invalid message; no invalid Sign in link in form.
- Fix: Restore invalid link Sign in CTA and exact subtitle.
