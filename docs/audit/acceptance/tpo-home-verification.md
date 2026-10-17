# TPO Home — verified gap coverage (chat-4)

Audit: `docs/audit/pages/tpo/home.md`. Unit tests are authored but NOT RUN by this builder.
Further live provider/permission/integration acceptance is owned by the orchestrator.

| ID | Status | Evidence |
|---|---|---|
| TPO-home-01 | DONE | `src/modules/placements/tpo-home-greeting-model.ts`, `src/app/(authenticated)/tpo/home/page.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-01` |
| TPO-home-05 | DONE | `src/modules/placements/tpo-home-legacy-rows.ts`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-05` |
| TPO-home-06 | DONE | `src/modules/placements/tpo-home-legacy-rows.ts`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-06` |
| TPO-home-08 | DONE | `src/modules/placements/tpo-home-legacy-rows.ts`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-08` |
| TPO-home-13 | DONE | `src/modules/placements/tpo-home-next-up.ts`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-13` |
| TPO-home-42 | DONE | `src/components/shell/sidebar-nav.tsx` (verification only; owned by chat-9); `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-42` |
| TPO-home-43 | DONE | `src/components/tpo/tpo-mobile-footer.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-43` |
| TPO-home-17 | DONE | `src/app/(authenticated)/tpo/home/page.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-17` |
| TPO-home-36 | DONE | `src/components/tpo/tpo-bell-panel.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-36` |
| TPO-home-39 | DONE | `src/components/tpo/tpo-bell-panel.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-39` |
| TPO-home-41 | DONE | `src/components/tpo/tpo-keyboard-shortcuts.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-41` |
| TPO-home-10 | DONE | `src/app/(authenticated)/tpo/home/page.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-10` |
| TPO-home-18 | DONE | `src/app/(authenticated)/tpo/home/page.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-18` |
| TPO-home-20 | DONE | `src/app/(authenticated)/tpo/home/loading.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-20` |
| TPO-home-21 | DONE | `src/app/(authenticated)/tpo/home/error.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-21` |
| TPO-home-23 | DONE | `src/app/(authenticated)/tpo/home/page.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-23` |
| TPO-home-24 | DONE | `src/app/(authenticated)/tpo/home/page.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-24` |
| TPO-home-29 | DONE | `src/app/(authenticated)/tpo/find/page.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-29` |
| TPO-home-30 | DONE | `src/components/tpo/tpo-topbar-new-menu.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-30` |
| TPO-home-33 | DONE | `src/components/tpo/tpo-header-indicators.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-33` |
| TPO-home-34 | DONE | `src/components/tpo/tpo-header-indicators.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-34` |
| TPO-home-35 | DONE | `src/components/tpo/tpo-bell-panel.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-35` |
| TPO-home-38 | DONE | `src/components/tpo/tpo-bell-panel.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-38` |
 
Remaining TPO Home gaps continue in `docs/orchestrator/queues/gap-closure-chat-4.md`. Live numbers remain conditional on persisted data. TPO-home-07 and TPO-home-09 remain OPEN because the recruiter-access and team-ask/overdue signals are not yet wired. Tests are source-backed and have not been executed.


### New TPO Home refresh and deep-link acceptance

| Gap | Status | Evidence |
|---|---|---|
| TPO-home-19 | DONE | `src/components/tpo/tpo-home-return-refresh.tsx`, `src/app/(authenticated)/tpo/home/page.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts` test `TPO-home-19`. |
| TPO-home-37 | DONE | `src/components/tpo/tpo-bell-panel.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts` test `TPO-home-37`. |
| TPO-home-R07 | PARTIAL | `src/app/(authenticated)/tpo/find/page.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts` test `TPO-home-R07`. Student link now uses `q` and membership drawer, but roll-number searching and full command palette remain open. |

### Round 4: module controls, live finder and unread refresh (tests NOT RUN)

| ID | Status | Evidence |
|---|---|---|
| TPO-home-26 | DONE | `src/app/(authenticated)/tpo/home/page.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts` test `TPO-home-26`: resolved module switch blocks Home reads and shows exact legacy module-off heading |
| TPO-home-28 | DONE | `src/components/tpo/tpo-find-shortcut.tsx`, `src/app/api/tpo/find-suggestions/route.ts`; `tests/unit/chat4-tpo-home-gap-closure.test.ts` test `TPO-home-28`: Ctrl K palette, 200ms live search after two characters, bounded grouped results, in-session recents, keyboard navigation |
| TPO-home-34 | DONE | `src/components/tpo/tpo-bell-panel.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts` test `TPO-home-34`: unread badge refresh every 30s while visible and when returning to the tab; failures retain the previous count |
| TPO-home-39 | DONE (test assertion reconciled) | `src/components/tpo/tpo-bell-panel.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts` test `TPO-home-39`: test expects the actual `changeOpen` state-aware callback, not a stale `setOpen` reference |
| TPO-home-04 | DONE | `src/app/(authenticated)/tpo/home/page.tsx` reads the first batch’s persisted eligibility and registration summaries plus a cohort-scoped placed summary instead of null; `tests/unit/chat4-tpo-home-gap-closure.test.ts` test `TPO-home-04` checks legacy status and attention. |

| TPO-home-R06 | DONE | `src/modules/placements/tpo-home-legacy-rows.ts` eliminates fabricated placeholder copy; displays known counts with exact legacy wording and leaves unknown count status blank; `tests/unit/chat4-tpo-home-gap-closure.test.ts` test `TPO-home-R06`. |

| TPO-home-22 | DONE | Client `tpo-home-return-refresh.tsx` preflights the dynamic Home route on return, keeps previous snapshot if GET fails, announces Refreshing placement home… and exact failure alert with Retry. `tests/unit/chat4-tpo-home-gap-closure.test.ts` test `TPO-home-22`. |

### Owner decision and functional source evidence (2026-10-18)

| TPO-home-25 | NOT-A-GAP | Intentional, audited vNext improvement: College TPO Home surfaces an all-college work queue filtered by the authenticated membership college, not the legacy `team=false` mine-plus-unowned filter. Operational ownership remains visible within the college; hiding colleagues' outstanding rounds would cause missed handoffs. `src/app/(authenticated)/tpo/home/page.tsx`, `src/modules/placements/tpo-operations-service.ts`; `tests/unit/chat4-gap-ux-freeze-product-decisions.test.ts` test `TPO-home-25`. Scope and runtime still require orchestrator tests. |

| TPO-home-27 | NOT-A-GAP (owner-directed safer vNext decision) | A Faculty account gains placement authority only through an explicit persisted TPO membership/permission, not because it is listed as a member of a team. The college-specific permission checker `src/modules/placements/tpo-workspace-access-model.ts` delegates to `can(context,"placements.manage",{collegeId,organizationId})`; `hasTpoTooling` requires TPO role. `tests/unit/chat4-tpo-faculty-access-decision.test.ts` test `TPO-home-27`. This intentionally refuses broad legacy Faculty access, avoiding accidental cross-role placement writes. Tests authored, not run. |

| TPO-home-07 | DONE (source; execution pending) | `src/app/(authenticated)/tpo/home/page.tsx` supplies persisted recruiter CRM leads, due follow-ups, and pending recruiter access to `src/modules/placements/tpo-home-legacy-rows.ts`; Engage text and scoped links include due follow-ups and approval attention. `tests/unit/chat4-gap-verified-cross-role-round2.test.ts` test `TPO-home-07`. |

| TPO-home-32 | DONE (source) | `src/components/tpo/tpo-topbar-new-menu.tsx` uses the current company search context to create a matching recruiter lead or drive with encoded parameters, divider and scoped Follow-up modal; `src/app/(authenticated)/tpo/layout.tsx` wires menu. `tests/unit/chat4-tpo-home-secondary-revalidation.test.ts` test `TPO-home-32`. No browser test executed. |
| TPO-home-R05 | DONE (source) | `src/app/(authenticated)/tpo/home/page.tsx` fetches the next 7 days of authorized calendar events, filters ROUND / APPLICATION_DEADLINE, creates Company · event labels, and passes availability separately; `tpo-home-legacy-rows.ts` renders IST Today/Tomorrow labels. `tests/unit/chat4-tpo-home-secondary-revalidation.test.ts` test `TPO-home-R05`. No executed acceptance. |

| TPO-home-R04 | PARTIAL | `src/app/(authenticated)/tpo/home/page.tsx` now ranks persisted team messages at priority 1 alongside requests/closing deadlines rather than priority 4; `src/modules/placements/tpo-home-deadline-signals.ts` preserves IST deadline priority 0/1; `tests/unit/chat4-tpo-next-up-priority-r04.test.ts` test `TPO-home-R04`. Exact historical subtypes TEAM_ASKS and all tie-breaking rules are not fully represented in vNext. |

## chat-13 final sprint
| TPO-home-R08 | DONE (source) | `src/app/(authenticated)/tpo/home/page.tsx` independently schedules all Home reads with `Promise.all`; full-operation and batch errors are isolated and yield explicit unavailable signals without fabricated zero counts. `tests/unit/chat13-final-sprint-tpo-home-r08.test.ts` test `TPO-home-R08`. Live timing and failure-injection verification pending orchestrator. |
