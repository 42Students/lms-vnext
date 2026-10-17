# TPO / Students — chat-12 verification

Source reviewed on `main` at `a56fd84fdbe4e2c9bc11758b290d1f1845cac991`. Tests were authored but not executed by this builder; the orchestrator must independently execute them.

| ID | Status | Evidence (implementation; test with gap ID in name) |
|---|---|---|
| TPO-students-46 | DONE | `src/app/(authenticated)/tpo/students/page.tsx`; `tests/unit/chat12-tpo-students-copy.test.ts` — `TPO-students-46` |
| TPO-students-47 | DONE | `page.tsx` and `error.tsx`; `tests/unit/chat12-tpo-students-copy.test.ts` — `TPO-students-47` |
| TPO-students-R05 | DONE | `page.tsx` no developer status text; `tests/unit/chat12-tpo-students-copy.test.ts` — `TPO-students-R05` |
| TPO-students-R06 | DONE | `src/modules/placements/tpo-student-display-label.ts`, roster, panel; `tests/unit/chat12-tpo-students-copy.test.ts` — `TPO-students-R06` |

| TPO-students-08 | DONE | tpo/students/page.tsx and tpo-roster-verification-bulk.tsx: VERIFY; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-08` |
| TPO-students-09 | DONE | tpo-roster-verification-bulk.tsx: SEND_BACK requires a reason; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-09` |
| TPO-students-11 | DONE | tpo-student-note-editor.tsx: note API, per-student and bulk; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-11` |
| TPO-students-18 | DONE | tpo/students/page.tsx: Batch, Program, Branch, Class; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-18` |
| TPO-students-27 | DONE | tpo-students-spreadsheet.tsx: Program · Batch, finished badge; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-27` |
| TPO-students-30 | DONE | tpo-student-verification-facts.ts: waiting sections and status; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-30` |
| TPO-students-37 | DONE | tpo-student-clipboard-actions.tsx: safe clipboard; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-37` |
| TPO-students-38 | DONE | tpo-student-clipboard-actions.tsx: paste roll numbers; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-38` |
| TPO-students-40 | DONE | tpo-students-spreadsheet.tsx: numeric sorting; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-40` |
| TPO-students-41 | DONE | tpo-students-spreadsheet.tsx, tpo-student-note-editor.tsx: keyboard; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-41` |
| TPO-students-42 | DONE | tpo-student-quick-panel.tsx: Requests with decision; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-42` |
| TPO-students-44 | DONE | tpo-student-quick-panel.tsx: team activity timeline; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-44` |
| TPO-students-R02 | DONE | tpo/students/page.tsx: bulk-add query-key resets selection; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-R02` |
| TPO-students-R08 | DONE | tpo-students-spreadsheet.tsx: student-specific action names; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-R08` |
| TPO-students-R07 | DONE | tpo-students-service.ts: summary from filter-matched rows; `tests/unit/chat12-tpo-students-contract.test.ts` — `TPO-students-R07` |

| TPO-students-25 | DONE | Legacy ?q= alias validates duplicates and length; `tests/unit/chat12-students-round2.test.ts` test `TPO-students-25` |
| TPO-students-R04 | DONE | Single Journey and Branch controls retained in roster form; duplicate selects removed from spreadsheet filters; `tests/unit/chat12-students-round2.test.ts` test `TPO-students-R04` |
| TPO-students-43 | DONE | Student panel needs-attention for ineligible, pending verification and waiting offers, with Team and Placement eligibility links; `tests/unit/chat12-students-round2.test.ts` test `TPO-students-43` |
| TPO-students-54 | DONE | Roster outcome pill shows final after-college choice and hover detail; `tests/unit/chat12-students-round2.test.ts` test `TPO-students-54` |

| TPO-students-19 | DONE | Journey steps distinguish eligible working-set population from registration and expose contextual caption; `tests/unit/chat12-tpo-journey-export.test.ts` test `TPO-students-19` |
| TPO-students-48 | DONE | Announced in-view count and visible selected count; `tests/unit/chat12-tpo-journey-export.test.ts` test `TPO-students-48` |
| TPO-students-52 | DONE | Student panel shows profile check, stage, outcome, placement decision, offers and explicit unavailable prep metric; `tests/unit/chat12-tpo-journey-export.test.ts` test `TPO-students-52` |
| TPO-students-53 | DONE | Issued offers map to legacy released/waiting-on-answer, with exact display wording; `tests/unit/chat12-tpo-journey-export.test.ts` test `TPO-students-53` |

TPO-students-36: the authorized filtered CSV is now downloaded through a guarded client control; selection-only export and XLSX parity remain open. `tests/unit/chat12-tpo-safe-export.test.ts` test `TPO-students-36`.
