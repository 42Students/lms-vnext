# TPO Home — verified gap coverage (chat-4)

Audit: `docs/audit/pages/tpo/home.md`. Unit tests are authored but NOT RUN by this builder.
Further live provider/permission/integration acceptance is owned by the orchestrator.

| ID | Status | Evidence |
|---|---|---|
| TPO-home-01 | DONE | `src/modules/placements/tpo-home-greeting-model.ts`, `src/app/(authenticated)/tpo/home/page.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-01` |
| TPO-home-05 | DONE | `src/modules/placements/tpo-home-legacy-rows.ts`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-05` |
| TPO-home-06 | DONE | `src/modules/placements/tpo-home-legacy-rows.ts`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-06` |
| TPO-home-07 | DONE | `src/modules/placements/tpo-home-legacy-rows.ts`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-07` |
| TPO-home-08 | DONE | `src/modules/placements/tpo-home-legacy-rows.ts`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-08` |
| TPO-home-09 | DONE | `src/modules/placements/tpo-home-legacy-rows.ts`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-09` |
| TPO-home-13 | DONE | `src/modules/placements/tpo-home-next-up.ts`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-13` |
| TPO-home-42 | DONE | `src/components/shell/sidebar-nav.tsx` (verification only; owned by chat-9); `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-42` |
| TPO-home-43 | DONE | `src/components/tpo/tpo-mobile-footer.tsx`; `tests/unit/chat4-tpo-home-gap-closure.test.ts`, `TPO-home-43` |

Remaining TPO Home gaps continue in `docs/orchestrator/queues/gap-closure-chat-4.md`.
Live numbers in legacy row fields remain conditional on available persisted data;
tests prove presentation policy rather than claiming unavailable provider data exists.
