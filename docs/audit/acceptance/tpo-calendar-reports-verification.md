# TPO calendar and reports: gap verification (builder chat-9)

Status reflects committed source and authored test evidence. Tests are **not run** by this lane; orchestrator executes and confirms them.

| ID | Status | Evidence (source + test name) |
|---|---|---|
| TPO-calendar-reports-01 | DONE | `src/modules/placements/tpo-blocked-calendar-model.ts`, `src/components/placements/placement-calendar-workspace.tsx`; `tests/unit/chat9-tpo-calendar-blocked-events.test.ts` — `TPO-calendar-reports-01 projects only the selected inclusive date window as IST all-day blocked events`, `TPO-calendar-reports-01 blocked dates do not inflate recruiter round or follow-up counts` |
| TPO-calendar-reports-02 | DONE | `src/modules/placements/tpo-round-calendar-service.ts`, `src/modules/placements/tpo-blocked-day-decision.ts`; `tests/unit/chat9-tpo-calendar-blocked-policy.test.ts` — `TPO-calendar-reports-02 fails closed when blocked-day ledger is unavailable`, `TPO-calendar-reports-02 requires explicit confirmation for a blocked exam date` |
