# Graceful operation — chat-5 adoption

Scope: TPO Drive Workspace and TPO Batches only. Shared helpers are authored by chat-14 and were merged from `main` during round 4. All tests listed here were **written but not run**; the orchestrator owns execution and global acceptance.

| ID | Status | Evidence |
|---|---|---|
| GR-04 | DONE on touched forms | `src/components/placements/tpo-drive-cancel-form.tsx`, `tpo-drive-lifecycle-controls.tsx`, `src/components/tpo/tpo-batch-lifecycle-control.tsx`, `tpo-batch-eligibility-import.tsx` use `src/lib/api-fetch.ts`; `tests/unit/tpo-chat5-graceful-adoption-round4.test.ts` — `GR-04 uses guarded JSON fetch in all four changed mutating forms`. |
| GR-30 | DONE on touched critical actions | The two drive lifecycle controls and batch lifecycle form call `useGuardedAction`; same test file — `GR-30 relies on the synchronous guarded-action hook for critical state changes`. |
| GR-31 | DONE on those actions | Per-action guarded ref and disabled controls protect duplicate clicks/Enter; same test file — `GR-31 protects duplicate Enter and click during cancellation and publishing`. The Batches CSV importer still has local `busy` checks and is not yet globally audited for all key-repeat cases. |
| GR-32 | DONE on touched import | The CSV import retains file/preview on failed writes and shows a plain 409 message; same test file — `GR-32 retains user edits after a changed import or failed write`. |
| GR-35 | DONE on touched controls | Native `window.confirm` replaced in drive cancellation, publish/reopen, batch lifecycle and batch CSV commit with explicit reviewed checkboxes; same test file — `GR-35 uses an inline consequence acknowledgement rather than native confirm`. |
| GR-38 | DONE on TPO Batches directory | Unavailable KPI sources show a dash, never misleading zero; `tests/unit/tpo-batches-chat5-round4-fallback.test.ts` — `GR-38 does not show zero when a KPI could not be loaded`. |
| GR-71 | DONE on TPO Batches directory and Discussion | Recoverable empty/filtered/older records states; `tests/unit/tpo-batches-working-set-chat5.test.ts` — `GR-71 shows a useful current working set without losing older batches`. |
| GR-72 | DONE on TPO Batches directory | Secondary count reads degrade independently instead of hiding primary academic batch list; `tests/unit/tpo-batches-chat5-round4-fallback.test.ts` — `GR-72 keeps the academic batch directory usable on secondary-service failure`. |
| GR-90 | DONE on touched controls | Explicit `role="alert"` for action failures; `tests/unit/tpo-chat5-graceful-adoption-round4.test.ts` — `GR-90 announces failures through role alert in all affected forms`. |
| GR-91 | DONE on touched controls | Keyboard-reachable reviewed checkboxes and buttons; same test file — `GR-91 keeps explicit acknowledgement and retry controls keyboard-operable`. |

Not claimed: global GR-31 coverage across every action, GR-33/34/40, application-wide GR-70, all failure-injection Playwright GR-80 and provider-outbox recovery. These require orchestrator and/or other lane acceptance.

## Next-round graceful adoption — scoped, not app-wide

| ID | Status | Evidence |
|---|---|---|
| GR-04 | DONE on touched offer, applicant-review and batch-decision actions | `src/components/placements/tpo-offer-lifecycle-panel.tsx`, `placement-offer-controls.tsx`, `tpo-applicant-review-form.tsx`, `src/components/tpo/tpo-batch-inline-decision.tsx`, and `tpo-batch-undo-control.tsx` use `apiFetch`; `tests/unit/tpo-drive-workspace-chat5-next-round.test.ts` — `GR-04 GR-30 GR-31 handles offer API failures and double submissions through shared guards`. |
| GR-30 / GR-31 | DONE on same actions | `useGuardedAction` plus pending states; `tests/unit/tpo-batches-chat5-next-round.test.ts` — `GR-04 GR-30 GR-32 prevent raw errors and double submissions in batch decision editor`. |
| GR-35 | DONE on the newly touched offer and batch-undo actions | No native `window.confirm` in these forms; explicit consequence checkbox. `tests/unit/tpo-drive-workspace-chat5-next-round.test.ts` — `GR-35 GR-90 GR-91 uses an explicit check and announced error for offer confirmations`. |
| GR-39 / GR-91 | DONE on Drive navigation | Mobile select has minimum size and usable keyboard target. `tests/unit/tpo-drive-workspace-chat5-next-round.test.ts` — `GR-39 prevents an overlong drive-navigation name from breaking the mobile selector`. |
| GR-71 | DONE on the Batches loading fragment | Accessible skeleton and recovery route; `tests/unit/tpo-batches-chat5-next-round.test.ts` — `TPO-batches-50 has a complete keyboard-safe loading and recovery state`. |
| GR-90 | DONE on touched inline errors | `role="alert"` messages retained while forms keep their input; `tests/unit/tpo-batches-chat5-next-round.test.ts` — `GR-35 GR-90 avoids native confirmation and exposes an alert for failed batch undo`. |

Tests are **not run** by chat-5; this is authored contract evidence only.
