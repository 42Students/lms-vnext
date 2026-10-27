# TPO general-request bulk and authenticated record-search Enter (2026-10-28)

**Implementation evidence, not global Implementation Green.** This change extends the existing vNext workflow; it does not count new standalone pages, mark a tracker item done, or close the full prototype comparison.

## Before → after

- **Before:** `/tpo/requests` had specialized request bulk actions, while the separately mounted `TpoGeneralRequestsPanel` reviewed only one general request at a time. The pinned legacy `RequestsPanel.js` supports same-kind batch review and proof-sensitive skip behavior.
- **After:** the general panel offers bounded (1–10) same-kind decisions for waiting requests. Positive decisions are offered only for the three already-backed transactional effects: verified off-campus offer, registration change and absence dispute. Where proof is required by the general review model, invalid/missing HTTPS evidence blocks bulk approval; the operator must inspect and decide individually. Rejection requires one explicit reason, which the server separately records and notifies to each learner. Unsupported positive effects (correction, PAP, acceptance dispute) remain **disabled**, not silently simulated.
- **Safety boundary:** each chosen request is posted sequentially to the already-authenticated, same-origin `/api/placements/tpo/requests/general/[requestId]/decision` route using the current request version, and the server independently checks a live TPO actor, tenant, target and `PENDING` CAS state. Per-request event/audit and learner notice still happen in the authoritative transaction. The UI does **not** promise a single atomic batch, automatically retry an uncertain write, or claim a batch-summary ledger comparable to the specialized bulk-audit endpoint. After the attempt it reloads the authoritative queue and enumerates confirmed versus uncertain results.
- **Search keyboard gap:** the global authenticated topbar displayed real tenant-scoped TPO and recruiter search suggestions, but pressing Enter used general navigation first rather than choosing the first live record. Enter now clicks the visible validated result button when available. The search still falls back to scoped portal navigation when no result is ready; the existing Faculty shortcut behavior is retained.

## Sources

- Legacy `42Students/lms2-fe@9d56bb7a347b06f242ef615c19fdc298f83329e0`, `src/components/tpo/RequestsPanel.js`: request kinds L24–26; proof-sensitive bulk skip L264–266.
- vNext general-request decisions `src/modules/placements/tpo-general-request-service.ts` and HTTP route `src/app/api/placements/tpo/requests/general/[requestId]/decision/route.ts`.
- vNext client feature `src/components/placements/tpo-general-requests-bulk-decision.tsx` with testable eligibility `src/modules/placements/tpo-general-request-bulk-model.ts`; independent `TpoGeneralRequestsPanel` remains the existing owning family.
- Topbar `src/components/shell/topbar/command-search.tsx`, `tpo-find-suggestions.tsx`, `recruiter-find-suggestions.tsx`.
- Authored unit regression `tests/unit/tpo-general-requests-bulk-and-topbar-enter.test.ts`.

## Still unverified

This connector-only commit did **not** execute Vitest, TypeScript typecheck, E2E, disposable PostgreSQL or provider tests. To accept the family, exercise the exact same-kind selection, proof rejection, loss of a response after a persisted decision, stale version, revoked TPO membership, cross-college denial, effect consistency, student notice/audit and keyboard Enter behavior on authorized real-browser fixtures. The general-request bulk feature uses per-request audit events; a dedicated batch-run audit identifier was **not** added and must be explicitly disposed against the legacy contract. The global project tracker remains `docs/tracker.json`.
