# Work packet (wave 2): edit src/app/company-join/[token]/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/company-join-token.md

## G2-1-028-032  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-join/[token].js:90: active four-row Skeleton during preview.
- vNext now: src/app/company-join/[token]/page.tsx:10-11: SSR preview, retry component; no exact four-row skeleton.
- Fix: Add matching loading skeleton.
