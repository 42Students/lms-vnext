# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-16-023-036 [P1] GAP facet F12
- Files: src/modules/placements/learner-journey-service.ts
- Legacy: LearnerJourneyService.java:129-140 expected schedule for upcoming unbooked next round; talk rounds visible.
- Expected fix: Include expected vs confirmed flag and room/slot fields.

## G2-17-018-014 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: src/app/api/courses/lesson-contents/order/route.ts:17-24 — Migration pending returns 503 with code.
- Expected fix: Ship registered migration or show clear disabled copy with ops recovery.

## G2-17-012-011 [P1] GAP facet F04
- Files: src/modules/placements/report-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:187-198 — Metrics: applied/shortlisted/interview/offered/rejected/hired and avgTimeToShortlistMs.
- Expected fix: Map exact metrics keys/units to report model with separate snapshot.

## G2-17-012-012 [P1] GAP facet F04
- Files: src/modules/placements/report-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:202-219 — Funnel counts every application that ever reached stage.
- Expected fix: Add historical cumulative funnel distinct from current snapshot.

## G2-17-012-038 [P1] GAP facet F12
- Files: src/modules/placements/report-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:202-219 — Funnel monotonic historical accumulation, not snapshot.
- Expected fix: Compute ever-reached stages from audited transitions.

## G2-18-011-014 [P1] GAP facet F04
- Files: src/components/placements/learner-placement-offers.tsx, src/db/schema/placements.ts
- Legacy: Legacy offer response accepts OFFERED only; maps accepted HIRED and declined REJECTED (`JobServiceImpl.java:1168-1196`).
- Expected fix: Define old HIRED/REJECTED vs new offer+joining state crosswalk, preserve downstream triggers.

## G2-18-011-047 [P1] GAP facet F12
- Files: src/components/placements/learner-placement-offers.tsx, src/db/schema/placements.ts
- Legacy: Legacy offer decline from OFFERED sets REJECTED, clears offer letter and remains visible (`JobServiceImpl.java:1025-1050`).
- Expected fix: Ensure declined offer hides valid letter/action while retaining history and application stage.

## G2-18-005-024 [P1] GAP facet F05
- Files: src/modules/placements/learner-dashboard-model.ts
- Legacy: Legacy open offers status `RELEASED` in journey. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:58-60`
- Expected fix: Map status RELEASED→ISSUED and ensure issued but not expiring still gets hero.

## G2-18-005-054 [P1] GAP facet F12
- Files: src/modules/placements/learner-dashboard-model.ts, src/modules/placements/learner-waiting-on-you-model.ts
- Legacy: Legacy pending move request suppresses confirm todo. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:65-76`
- Expected fix: Feed pending move requests to waiting model to avoid invalid Confirm action.

## G2-18-005-082 [P1] GAP facet F20
- Files: src/app/(authenticated)/learn/my-placements/page.tsx
- Legacy: Legacy offered `countsAsPlaced=false` excluded from placed state. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:58-61`
- Expected fix: Gate by `countsAsPlaced`, eliminate false placed state.

## G2-18-005-087 [P1] GAP facet F22
- Files: src/modules/placements/learner-dashboard-model.ts, src/app/(authenticated)/learn/my-placements/page.tsx
- Legacy: Legacy offers RELEASED/ACCEPTED and countsAsPlaced flags. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:58-60`
- Expected fix: Maintain status transition and placement eligibility equivalence.

## G2-19-005-010 [P1] GAP facet F04
- Files: src/components/placements/learner-career-calendar.tsx
- Legacy: Old redirected Calendar displays booking `ScheduleCard` full metadata (room, platform, bring) in day Drawer `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-170` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:74-85`
- Expected fix: Use rich ScheduleCard for selected day's entries, not only event metadata.

## G2-19-005-026 [P1] GAP facet F09
- Files: src/components/placements/learner-career-calendar.tsx
- Legacy: Legacy Schedule calendar day Drawer opens width440 and title `dddd D MMMM` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-175`
- Expected fix: Restore date-titled day Drawer, 440px wide.

## G2-19-005-027 [P1] GAP facet F09
- Files: src/components/placements/learner-career-calendar.tsx
- Legacy: Old day Drawer holds all schedule events, deadlines and blocked events `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-171`
- Expected fix: Show complete day's multi-source agenda within one drawer.

## G2-19-005-067 [P1] GAP facet F23
- Files: src/components/placements/learner-career-calendar.tsx
- Legacy: Old Schedule offers direct confirm/reschedule inside day Drawer `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-170` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:90-119`
- Expected fix: Restore direct booked-round actions in calendar detail with appropriate gates.

## G2-19-005-068 [P1] GAP facet F23
- Files: src/components/placements/learner-career-calendar.tsx
- Legacy: Old Calendar shows blocked days and application deadlines in same month `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:197-227`
- Expected fix: Prioritize missing factual event types before enhanced mode parity.

## G2-19-004-024 [P1] GAP facet F06
- Files: src/components/placements/learner-schedule-reschedule.tsx
- Legacy: Legacy reschedule modal requires 3+ character reason and optional free-text Times that work for you `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:109-119`
- Expected fix: Support optional free-text preferred windows while preserving structured approvals.

## G2-19-004-030 [P1] GAP facet F07
- Files: src/components/placements/learner-schedule-reschedule.tsx
- Legacy: Legacy validates preferred reason 3 chars, free-text times optional `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:43-47` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:109-117`
- Expected fix: Reconcile validation contracts so users can ask reschedule without exact slot.

## G2-19-004-035 [P1] GAP facet F08
- Files: src/app/(authenticated)/learn/my-placements/schedule/page.tsx, src/components/placements/learner-schedule-reschedule.tsx
- Legacy: Legacy pending reschedule chip `Reschedule asked` and answered reply text `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:21-23` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:72` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:86-88`
- Expected fix: Show pending, approved, rejected and response note from request state.

## G2-19-004-036 [P1] GAP facet F09
- Files: src/components/placements/learner-career-calendar.tsx
- Legacy: Legacy calendar click opens 440px Drawer titled `dddd D MMMM`, displaying ALL day events and blocked/deadlines `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-175`
- Expected fix: Implement day detail drawer showing all date events/deadlines/blocked notes at width440.

## G2-19-004-049 [P1] GAP facet F12
- Files: src/app/(authenticated)/learn/my-placements/schedule/page.tsx
- Legacy: Legacy excludes TALK round from needsConfirm count and confirm control `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:124` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:17-22`
- Expected fix: Exclude TALK and pending reschedule requests from alert counts.

## G2-19-004-084 [P1] GAP facet F22
- Files: src/components/placements/learner-schedule-reschedule.tsx, src/modules/placements/request-service.ts
- Legacy: Legacy reschedule request stores free-text preferredTimes and statuses `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:21-23` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:43-47`
- Expected fix: Migrate historic preferredTimes/reply payload and render pending/decided states.

## G2-19-004-086 [P1] GAP facet F23
- Files: src/components/placements/learner-schedule-reschedule.tsx
- Legacy: Legacy offers optional-text reschedule without fixed new slot `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:109-119`
- Expected fix: Owner decision on whether structured reschedule request may replace flexible suggestions.

## G2-19-012-014 [P1] GAP facet F06
- Files: src/app/api/placements/learner/saved-jobs/[jobId]/route.ts
- Legacy: Legacy service method accepts learnerId and jobId integers `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/LearnerSavedJobService.java:13-36`
- Expected fix: Migrate numeric route IDs to UUID and remove spoofable learnerId.

## G2-2-006-031 [P1] MISSING facet F09
- Files: (none, new feature)
- Legacy: LF:149-181 upload control and UploadFromLinkButton import
- Expected fix: Add upload/from-link UI with safe server attestation.
