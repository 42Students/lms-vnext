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
