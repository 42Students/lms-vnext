# Work packet: edit src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-overview.md

## G2-9-011-004  [P1] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:103-109` — No college context shows Admin not assigned to a college warning
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:18-20` — Missing membership redirects /dashboard
- Fix: Use explicit unassigned-college warning and recovery

## G2-9-011-025  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:59-65` — Job fetch error Could not load this drive.; metric error Could not load pipeline metrics.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:21-25` — Promise.all rejects entire page if any overview/funnel/attention call fails
- Fix: Isolate optional funnel/attention errors and render section-specific messages

## G2-9-011-029  [P1] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:230-236` — Metric load warning Could not load pipeline metrics with failure description
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:21-25` — No section-local metric warning on rejected Promise.all
- Fix: Render metric warning independently of job header

## G2-9-011-033  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:50-65` — GET job and hiring metrics independently with Promise.allSettled
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:21-25` — Server Promise.all job overview, whole job funnel and college attention
- Fix: Use settled results and retain successful job header if metrics/attention fail

## G2-9-011-037  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:114-116` — ModuleGroupGuard placements shows disabled screen for bookmarked links
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:18-25` — Only context membership check visible; permission resolved inside services
- Fix: Add explicit friendly module-disabled state before fetching

## G2-9-011-039  [P1] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:197-206` — Draft/Open/Expired/Closed status calculated from isDraft/isActive and UTC deadline
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:37-39` — Literal persisted DRAFT/PUBLISHED/CANCELLED badge
- Fix: Implement old presentation transitions and date-sensitive Expired label

## G2-9-011-045  [P1] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:92-94` — Attention fetch errors intentionally nonfatal and ignored
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:21-25` — Attention error rejects Promise.all and hides whole overview
- Fix: Catch attention query errors and keep drive visible

## G2-9-011-046  [P1] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:230-236` — Metric fetch error renders warning card instead of zero
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:21-25` — Metric query error rejects page; no distinct metric unavailable fallback
- Fix: Show Could not load pipeline metrics in stats area

## G2-9-011-056  [P1] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:51-54` — Job and metrics fetched concurrently allSettled, attention later separately
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:21-25` — Three services requested concurrently but all are required by Promise.all
- Fix: Use Promise.allSettled with independent fallback and stream main header early

## G2-9-011-059  [P1] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:197-205` — Expired badge based on parsePlacementUtcDateTime and current time
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:37-39` — Status frozen at DB status, not deadline recalculated
- Fix: Check expiry against IST/inclusive deadline during SSR and UI refresh

## G2-9-011-026  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:103-107` — No college error exact Admin not assigned to a college
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:18-20` — Redirect without error copy
- Fix: Use exact no-college heading and recovery guidance
