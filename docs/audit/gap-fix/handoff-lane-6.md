# Lane 6 — cross-owner handoffs

- src/db/schema/placement-drive-change-requests.ts + drizzle migration | G2-16-025-012 G2-16-025-047 G2-5-023-043 G2-5-023-059 | Enforce partial unique index on (job_id,proposer_party,field) for OPEN and field <> OTHER; service serializes but uniqueness also needs DB enforcement.
- src/db/schema/placement-drive-change-requests.ts + migration | G2-5-023-011 | Store immutable currentValue at CREATE and distinct response fields; service reports null instead of fabricating past values.
- src/db/schema/placements.ts + migration | G2-5-023-037 G2-16-025-023 G2-16-025-040 | Add changesMadeAt priority/readiness column and use it in TPO queue; service signals review-ready via activity and notification.
- src/components/placements/tpo-drive-change-requests.tsx + src/modules/placements/tpo-drive-change-request-model.ts | G2-5-023-044 G2-5-023-027 | UI should force OTHER to ASK, only allow ACCEPT on SUGGEST, ANSWER on ASK and preserve exact legacy error copy; service enforces transitions.
- src/app/api/placements/jobs/[jobId]/change-requests/route.ts + request list UI | G2-5-023-014 G2-5-023-056 | Wire service's cursor argument, totalCount/nextCursor and accessible history pagination.
- src/lib/api-error.ts + src/lib/friendly-error.ts | G2-16-025-020 G2-16-025-021 G2-16-025-022 | Service raises conflict/stale 409 codes; API response currently replaces detailed legacy errors with generic copy.
- Product owner / applicant change pipeline | G2-5-023-035 G2-5-023-036 G2-5-023-061 G2-16-025-049 | Accepted/answered requests intentionally do NOT edit placementJobs under vNext 0114. Legacy auto-apply, applicant notice/recheck and invites need signed-off product change and safe integration.
- src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx | G2-5-023-041 | Add controlled COLLEGE_ADMIN page delegation matching server requireTpoJobCollege.
- src/modules/placements/tpo-drive-change-request-service.ts | G2-5-023-038 | Service mirrors lifecycle events to canonical company Discussion but internal-notes Team DRIVE message read/write still needs integration with TPO thread API.
