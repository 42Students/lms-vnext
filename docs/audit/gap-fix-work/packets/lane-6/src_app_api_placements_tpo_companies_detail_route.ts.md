# Work packet: edit src/app/api/placements/tpo/companies/detail/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l11-u026-public-bug-tracker-controller.md, docs/audit/gap2/lane-11/tpo-companies.md

## G2-11-026-022  [P1] GAP  facet F11  effort M
- Legacy: Public /api/v1/public path excluded from JwtAuthenticationFilter; manager mutations explicitly moved away (PublicBugTrackerController.java:54-56).
- vNext now: Every list/create/get requires getCurrentRequestContext (issues/route.ts:19-23,39-47; detail/route.ts:20-31).
- Fix: Preserve new security; provide reporter tokens/short-lived sessions rather than unauthenticated public exposure.

## G2-11-007-044  [P2] GAP  facet F07  effort M
- Legacy: Legacy company load rejection uses response message/error or fallback `Company not found`. `docs/legacy-source/frontend/src/pages/tpo/companies.js:46`
- vNext now: vNext public memory GET may return 503 `TPO_CRM_SCHEMA_NOT_REGISTERED`; UI generic error except enumerated pending codes. `src/app/api/placements/tpo/companies/detail/route.ts:16`
- Fix: Map server 503 schema error to explicit unavailable/migration-pending state and Retry.
