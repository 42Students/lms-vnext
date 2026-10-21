# Work packet (wave 2): edit src/app/(authenticated)/admin/not-found.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/404.md

## G2-20-001-026  [P2] GAP  facet F12  effort S
- Legacy: Role home mappings explicit per ROLE_CONFIG: seven role homes; `docs/legacy-source/frontend/src/config/roles.js:24-32`
- vNext now: Portal fallbacks route to `/admin`, `/learn`, `/teacher`, etc.; `src/app/(authenticated)/admin/not-found.tsx:8`, `src/app/(authenticated)/learn/not-found.tsx:9`, `src/app/(authenticated)/teacher/not-found.tsx:9`
- Fix: Replace portal-root shortcuts with verified role landing routes or verify these roots redirect identically.
