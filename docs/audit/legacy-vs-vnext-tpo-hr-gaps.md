# TPO / Recruiter legacy-to-vNext parity register

Source inventory: `docs/audit/legacy-inventory-B.md` (lms-dev-2026 and origin/prod-2026 static inspection). Exact labels: `docs/audit/legacy-copy-B.md`. Scope: TPO and HR/Recruiter, as assigned to chat-15 and chat-12. Snapshot: 18 October 2026. This is a **source-level register**, not a claim of live legacy parity or successful end-to-end execution. The owner has not supplied a usable authenticated legacy session for a live walk.

## Verified mapping ambiguities

| ID | Legacy page/action | vNext source-level status | Severity | Evidence, limitation and next gate |
|---|---|---|---|---|
| HR-PARITY-54 | `/recruiter/drives?tab=closed` — the legacy Closed segment | MAPPED (source), legacy inventory currently says UNKNOWN | S2 | `src/app/(authenticated)/recruiter/drives/page.tsx` exports the protected `/hr/drives` page. `hr/drives/page.tsx` maps legacy `tab=closed` through `legacyDriveTab()` to `CLOSED`; `recruiterDriveListQuerySchema` accepts CLOSED. Unit evidence: `tests/unit/chat15-hr-legacy-parity-54-55.test.ts`. Live account navigation and counts remain unverified. |
| HR-PARITY-55 | `/recruiter/drives/[jobId]?tab=requests` — company drive change requests | MAPPED (source), legacy inventory currently says UNKNOWN | S1 | `hr/placements/jobs/[jobId]/page.tsx` preserves `query.tab===\"requests\"`, scopes `getDriveChangeRequests(context,workspace.job.id)`, renders a Requests tab and the `TpoDriveChangeRequests` widget for `party===\"COMPANY\"` only. Route alias `recruiter/drives/[jobId]/page.tsx` uses the same protected page; separate route `recruiter/drives/[jobId]/change-requests/page.tsx` rejects a non-COMPANY party. Unit evidence: `tests/unit/chat15-hr-legacy-parity-54-55.test.ts` and `HR-BREAK-chat15-recruiter-change-requests-page-40.test.tsx`. Real pending/accepted/rejected requests and revoked-session browser verification remain open. |

## Outstanding acceptance and risk

| Area | Status | Severity | Required follow-up |
|---|---|---|---|
| TPO academic batch, student and recruiter workflows | SOURCE MAPPED, BEHAVIOR AUDIT OPEN | S1 | Compare every legacy action in inventory B against actual TPO service/route status transitions, tenant matrix and exact copy; execute PostgreSQL tests on distinct colleges |
| Recruiter employer scope, offers, applicants, rounds and company reporting | SOURCE MAPPED, LIVE AUDIT OPEN | S1 | E2E as recruiter with two colleges and two companies; attempt cross-tenant IDs, revoked grants, expired `valid_until`, concurrent round/slot mutations, stale tabs and after-archive URLs |
| Recruiter menu, loading, denied, empty, retry, 320px/keyboard layouts | SOURCE CODE AUDITED, BROWSER OPEN | S2 | Cross-check 17 recruiter aliases and canonical HR pages with `UX-CHAT15-ROUTES-41`, then run seeded Playwright phone + desktop |
| Legacy-only dev actions / production differences | OWNER LEGACY SIGN-IN BLOCKED | S2 | Use both lms-dev-2026 and prod-2026 role sessions to validate legacy labels and hidden actions. Static inventory explicitly records dev-only differences, so source similarity is not proof of matching business behavior |

**Policy:** Do not describe these as release-certified. Source-level assertions were authored but not executed in chat-15; orchestrator/cloud CI and authenticated PostgreSQL/browser acceptance are required before closing the outstanding rows. 
