# Work packet: edit src/components/public/graceful-screen.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/404.md

## G2-20-001-020  [P1] GAP  facet F10  effort S
- Legacy: Home click performs client-side `next/link` route change to derived role home; `docs/legacy-source/frontend/src/pages/404.js:41-43,73-76`
- vNext now: Home click performs Next Link navigation to hardcoded route; `src/app/not-found.tsx:4-6`, `src/components/public/graceful-screen.tsx:43`
- Fix: Derive home destination from server membership in authenticated shell, or use centralized role-aware home redirect.
