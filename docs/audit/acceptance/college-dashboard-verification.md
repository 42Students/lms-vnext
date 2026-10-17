# College Admin dashboard — chat-6 verified gap closure

Audit: `docs/audit/pages/college/dashboard.md`; tests authored, **not executed** by this builder. The orchestrator must run the relevant DB and browser checks before final acceptance.

| ID | Status | Evidence and named test |
|---|---|---|
| COL-dashboard-03 | DONE | `src/app/(authenticated)/college/page.tsx`, `src/modules/admin-ui/college-dashboard-attendance-service.ts`; `tests/unit/chat6-college-dashboard-verified.test.ts` → `COL-dashboard-03 shows today scheduled held and marked class counters` |
| COL-dashboard-04 | DONE | `src/app/(authenticated)/college/page.tsx`, `src/modules/admin-ui/college-dashboard-attendance-service.ts`; `tests/unit/chat6-college-dashboard-verified.test.ts` → `COL-dashboard-04 flags held sessions missing marked attendance for 7 days` |
| COL-dashboard-05 | DONE | `src/app/(authenticated)/college/page.tsx`, `src/modules/admin-ui/college-dashboard-risk-service.ts`; `tests/unit/chat6-college-dashboard-verified.test.ts` → `COL-dashboard-05 checks attendance below the college policy threshold over 30 days` |
| COL-dashboard-06 | DONE | `src/app/(authenticated)/college/page.tsx`, `src/modules/admin-ui/college-dashboard-grading-service.ts`; `tests/unit/chat6-college-dashboard-verified.test.ts` → `COL-dashboard-06 shows waiting-to-be-graded submissions per course` |
| COL-dashboard-07 | DONE | `src/app/(authenticated)/college/page.tsx`, `src/modules/admin-ui/college-dashboard-staffing-service.ts`; `tests/unit/chat6-college-dashboard-verified.test.ts` → `COL-dashboard-07 reports current unstaffed active course deliveries` |
| COL-dashboard-08 | DONE | `src/app/(authenticated)/college/page.tsx`, `src/modules/admin-ui/college-dashboard-setup-gaps-service.ts`; `tests/unit/chat6-college-dashboard-verified.test.ts` → `COL-dashboard-08 surfaces specific persisted setup relationship gaps` |
| COL-dashboard-09 | DONE | `src/components/admin/college-closing-quizzes-card.tsx`, `src/modules/admin-ui/college-dashboard-quizzes-service.ts`; `tests/unit/chat6-college-dashboard-verified.test.ts` → `COL-dashboard-09 shows published quizzes closing in the next seven days` |
| COL-dashboard-14 | DONE | `src/components/admin/admin-dashboard-actions.tsx`, `src/components/admin/college-dashboard-cards.tsx`; `tests/unit/chat6-college-dashboard-verified.test.ts` → `COL-dashboard-14 removes developer-only vNext status copy` |
| COL-dashboard-15 | DONE | `src/app/(authenticated)/college/page.tsx`; `tests/unit/chat6-college-dashboard-verified.test.ts` → `COL-dashboard-15 handles a missing college membership with the legacy warning` |
| COL-dashboard-16 | DONE | `src/components/admin/college-dashboard-cards.tsx`, `src/components/admin/college-setup-checklist.tsx`; `tests/unit/chat6-college-dashboard-verified.test.ts` → `COL-dashboard-16 keeps links keyboard accessible and avoids noisy row live regions` |

Historical note: dashboard independent failure states have separate source tests. COL-dashboard-17 still requires a 375px browser acceptance run.

| COL-dashboard-10 | DONE (source authored; runtime and injected-failure e2e pending) | `src/app/(authenticated)/college/page.tsx`, `src/components/admin/college-dashboard-section-failure.tsx`; `tests/unit/chat6-college-dashboard-graceful-round3.test.ts` → `COL-dashboard-10 isolates dashboard data sources with independent failed card states` |

| COL-dashboard-17 | DONE (responsive source authored; 375px browser acceptance pending) | `src/components/admin/college-dashboard-cards.tsx`, `college-setup-checklist.tsx`, `admin-dashboard-actions.tsx`; `tests/unit/chat6-people-phone-session-and-mobile-round6.test.ts` → `COL-dashboard-17 uses wrapped count labels and a mobile-safe setup checklist with accessible links`. |


| COL-dashboard-17 | DONE (source-level; browser at 375px pending) | Prefer responsive wrap and 2-count-card layout at 375px to truncating long legacy headings. `src/components/admin/college-dashboard-cards.tsx` and `src/components/admin/college-setup-checklist.tsx`; `tests/unit/chat11-college-unconfirmed-decisions-round10.test.ts` — `COL-dashboard-17 exposes 375px-safe cards and a single-column first checklist`. |

| COL-dashboard-12 | DONE (source contract, tests not executed) | `src/modules/admin-ui/admin-dashboard-navigation.ts`; `tests/unit/admin-dashboard-navigation.test.ts` and `tests/unit/chat11-college-setup-integrity-round11.test.ts`: legacy 14 steps remain in their original order, with a real academic-period prerequisite after semester mappings. Global Super Admin recruiter access remains separate from the college setup guide. |
