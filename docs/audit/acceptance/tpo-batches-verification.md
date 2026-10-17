# TPO Batches — chat-5 verified gap closure

Origin: `docs/audit/pages/tpo/batches.md`, `docs/audit/pages/tpo/batches-review.md`.
All names below appear in `tests/unit/tpo-batches-chat5-round3.test.ts`. Tests have been authored, **not run**; orchestrator verifies on PostgreSQL and in CI. A source contract test is not a substitute for database acceptance.

| ID | Status | Evidence (file + named test) |
|---|---|---|
| TPO-batches-19 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-19: verifies persisted batch workflow contract`. |
| TPO-batches-31 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-31: verifies persisted batch workflow contract`. |
| TPO-batches-01 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-01: verifies persisted batch workflow contract`. |
| TPO-batches-02 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-02: verifies persisted batch workflow contract`. |
| TPO-batches-04 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-04: verifies persisted batch workflow contract`. |
| TPO-batches-05 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-05: verifies persisted batch workflow contract`. |
| TPO-batches-06 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-06: verifies persisted batch workflow contract`. |
| TPO-batches-08 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-08: verifies persisted batch workflow contract`. |
| TPO-batches-10 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-10: verifies persisted batch workflow contract`. |
| TPO-batches-22 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-22: verifies persisted batch workflow contract`. |
| TPO-batches-30 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-30: verifies persisted batch workflow contract`. |
| TPO-batches-38 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-38: verifies persisted batch workflow contract`. |
| TPO-batches-41 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-41: verifies persisted batch workflow contract`. |
| TPO-batches-42 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-42: verifies persisted batch workflow contract`. |
| TPO-batches-58 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-58: verifies persisted batch workflow contract`. |
| TPO-batches-59 | DONE | Existing college-scoped behavior checked against page and model; see named test; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-59: verifies persisted batch workflow contract`. |
| TPO-batches-21 | OPEN | Actions exist, but full contextual Next step card and student link parity are incomplete; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-21: verifies persisted batch workflow contract`. |
| TPO-batches-29 | OPEN | Tab strip exists; ?tab= legacy URL aliases still not verified; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-29: verifies persisted batch workflow contract`. |
| TPO-batches-32 | OPEN | Bulk selection is present, but whole-view selection and complete legacy undo/preview parity still require work; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-32: verifies persisted batch workflow contract`. |
| TPO-batches-33 | OPEN | Full-roster search is implemented, while decision filters still operate on a loaded 25-student slice; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-33: verifies persisted batch workflow contract`. |
| TPO-batches-34 | OPEN | Roll, class, branch and program render, but contact, marks and placement columns are incomplete; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-34: verifies persisted batch workflow contract`. |
| TPO-batches-36 | OPEN | Summary journey exists, but missing invited and resume gap metrics remain; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-36: verifies persisted batch workflow contract`. |
| TPO-batches-37 | OPEN | Quoted 5000-row CSV works; XLSX upload is not supported; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-37: verifies persisted batch workflow contract`. |
| TPO-batches-39 | OPEN | Review tabs, skip and paging exist; no-change classification and modal detail remain partial; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-39: verifies persisted batch workflow contract`. |
| TPO-batches-40 | OPEN | Raw UUID/error copy removed but inline section/legacy button wording remain; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-40: verifies persisted batch workflow contract`. |
| TPO-batches-48 | OPEN | Finished page hides edit controls, but server write rejection still needs verification; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-48: verifies persisted batch workflow contract`. |
| TPO-batches-03 | OPEN | Legacy display labels exist; state filter semantics still describe lifecycle rather than eligibility; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-03: verifies persisted batch workflow contract`. |

The underlying sources examined in this batch include `src/app/(authenticated)/tpo/batches/page.tsx`, `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx`, `src/app/(authenticated)/tpo/batches/[batchId]/history/page.tsx`, `src/modules/placements/tpo-batch-workspace-read-service.ts`, `src/modules/placements/tpo-eligibility-sheet-model.ts`, `src/modules/placements/tpo-participation-service.ts`, and `src/modules/placements/tpo-batch-state-label-model.ts`.

Pending graceful-operation dependency: `src/lib/friendly-error.ts`, `src/lib/api-fetch.ts` and guarded-action hook are not on origin/main this round; no fake import of those helpers. `src/components/tpo/tpo-batch-eligibility-import.tsx` now suppresses raw server error codes and action UUIDs and retains the import on 409.

## Round 3 — exact legacy card copy additions

| ID | Status | Evidence (file + named test) |
|---|---|---|
| TPO-batches-13 | DONE | `src/modules/placements/tpo-batch-deadline-label-model.ts` and `src/app/(authenticated)/tpo/batches/page.tsx`; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-13: shows register-by date only while a batch is not finished`. |
| TPO-batches-14 | DONE | `src/app/(authenticated)/tpo/batches/page.tsx`; `tests/unit/tpo-batches-chat5-round3.test.ts` — `TPO-batches-14: uses the exact legacy placement-eligibility subtitle`. |

## Round 4 — working set, retirement, and graceful handling

| ID | Status | Evidence |
|---|---|---|
| TPO-batches-07 | DONE | `src/modules/placements/tpo-batch-working-set-model.ts` and `src/app/(authenticated)/tpo/batches/page.tsx`; `tests/unit/tpo-batches-working-set-chat5.test.ts` — `TPO-batches-07 hides finished and uninvited past batches until Show older is selected`. Explicit filters/search preserve access to older records. |
| TPO-batches-26 | OPEN | `src/modules/placements/tpo-batch-lifecycle-service.ts`, `tpo-batch-lifecycle-model.ts`, `src/db/schema/placement-batches.ts`, and `src/components/tpo/tpo-batch-lifecycle-control.tsx`; `tests/unit/tpo-batches-lifecycle-chat5-round4.test.ts` — `TPO-batches-26 permits never-invited retirement without forging an invite`. Database registration/replay of `docs/proposed-migrations/tpo-batches-finish-without-invite.sql` still required. |
| TPO-batches-39 | OPEN | `src/components/tpo/tpo-batch-eligibility-import.tsx` uses shared `apiFetch`, retains CSV and preview on failure, and requires explicit review; `tests/unit/tpo-chat5-graceful-adoption-round4.test.ts` — `GR-32 retains user edits after a changed import or failed write`. Full legacy review modal remains open. |
| TPO-batches-40 | OPEN | The import no longer exposes raw UUIDs or provider errors and no longer uses a native confirmation; `tests/unit/tpo-chat5-graceful-adoption-round4.test.ts` — `GR-35 uses an inline consequence acknowledgement rather than native confirm`. Exact legacy button/modal copy still incomplete. |

## Round 4 — effective state, priority and partial-failure improvements

| ID | Status | Evidence |
|---|---|---|
| TPO-batches-03 | DONE | `src/modules/placements/tpo-batch-state-label-model.ts`, `tpo-batch-directory-filter-model.ts`, and `src/app/(authenticated)/tpo/batches/page.tsx`; `tests/unit/tpo-batches-working-set-chat5.test.ts` — `TPO-batches-03 filters using effective eligibility rather than invitation lifecycle`. Supersedes the partial status in the earlier round. |
| TPO-batches-04 | DONE | The same directory now counts "Open for placements" using persisted effective eligibility; `tests/unit/tpo-batches-working-set-chat5.test.ts` — `TPO-batches-04 counts only batches with eligible learners as open for placements`. |
| TPO-batches-09 | DONE | `src/modules/placements/tpo-batch-priority-sort-model.ts` and directory sort switch; `tests/unit/tpo-batches-chat5-round4-fallback.test.ts` — `TPO-batches-09 ranks active eligible batches before nonempty, empty and finished`. |
| TPO-batches-15 | DONE | `src/app/(authenticated)/tpo/batches/page.tsx` suppresses internal lifecycle migration jargon; `tests/unit/tpo-batches-chat5-round4-fallback.test.ts` — `TPO-batches-15 never displays internal migration names when lifecycle data is unavailable`. |
| TPO-batches-28 | DONE | Secondary counts now fail independently, preserving the main directory and explaining unavailable evidence; `tests/unit/tpo-batches-chat5-round4-fallback.test.ts` — `TPO-batches-28 treats optional counts as independently fallible without hiding the batch list`. |
