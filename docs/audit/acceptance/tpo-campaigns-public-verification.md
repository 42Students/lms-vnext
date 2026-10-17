# TPO campaigns-public

## Chat-2 gap closure current round

| ID | Status | Evidence |
|---|---|---|
| TPO-campaigns-public-09 | DONE (source, tests not run) | Bad batch IDs cause Next.js 404 before Zod parse/DB access, in `campaigns/[batchId]/page.tsx`. Named test `tests/unit/chat2-campaign-history-routes.test.ts`. |
| TPO-campaigns-public-10 | PARTIAL — OPEN | Emails title, truthful empty message, sent/skipped labels in `campaigns/page.tsx`. Delivery receipt vs successful delivery semantics remain explicit, and other copy gaps remain. Named unit test in same file. |

| TPO-campaigns-public-24 | DONE (source, unrun) | `PublicJoinPreviewRetry` now says exact "We couldn't load this page" and Retry; invalid link remains distinct. Named `tests/unit/chat2-public-join-states.test.ts`. |
| TPO-campaigns-public-30 | DONE (source, unrun) | Company join route shares verified distinct error/retry state, plus success/invalid copy; named test. |
| TPO-campaigns-public-R03 | DONE (source, unrun) | ALREADY_JOINED uses "You already have access to {college}", server `signInEmail` preserved; named test. |
| TPO-campaigns-public-R01 | DONE (source verified) | Real `join-service` stores normalized optional mobile in registered `placement_recruiter_public_contacts`; refuses to accept with a phone when storage is missing, no silent drop; named test. |
| TPO-campaigns-public-R02 | PARTIAL — OPEN | Existing per-code error copy and phone/network guards verified, but field-specific placement pending; named test. |
| TPO-campaigns-public-R07 | DONE (source verified) | Existing registrable work-domain matching and subdomain guards, with named test. |

| TPO-campaigns-public-35 | DONE (source, unrun) | Unknown host / explicitly unpublished college page returns real Next 404, with legacy unavailable text in `src/app/placements/not-found.tsx`; transient read outage remains separate. Named `tests/unit/chat2-public-placements-page.test.ts`. |
| TPO-campaigns-public-36 | PARTIAL — OPEN | Replaced platform eyebrow, college heading and footer with legacy public placements framing; exact Recruit from us body still subject to legacy verification, named test. |

| TPO-campaigns-public-16 | DONE (source, tests not run) | Unsubscribe confirmation now guarded client POST with inline retry instead of raw JSON navigation; unknown used tokens get non-enumerating success response. Named `tests/unit/chat2-unsubscribe-graceful.test.ts`. |
| TPO-campaigns-public-R09 | DONE (source, tests not run) | Missing storage and network failures preserve confirmation page and show retry rather than raw JSON; same named test. |

| TPO-campaigns-public-R10 | DONE (source; unrun) | Engagement audience count by segment is now one tenant-scoped aggregate SQL query instead of unbounded JS roster, and selected preview uses SQL IN with <=100 IDs; named `tests/unit/chat2-engage-sql-audience-preview.test.ts`. |
