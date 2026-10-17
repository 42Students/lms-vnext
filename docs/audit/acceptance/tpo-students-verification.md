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
| TPO-students-43 | OPEN (partial implementation) | Student panel needs-attention for ineligible, pending verification and waiting offers, with Team and Placement eligibility links; `tests/unit/chat12-students-round2.test.ts` test `TPO-students-43` |
| TPO-students-54 | OPEN (partial implementation) | Roster outcome pill shows final after-college choice and hover detail; `tests/unit/chat12-students-round2.test.ts` test `TPO-students-54` |

| TPO-students-19 | OPEN (partial implementation) | Journey steps distinguish eligible working-set population from registration and expose contextual caption; `tests/unit/chat12-tpo-journey-export.test.ts` test `TPO-students-19` |
| TPO-students-48 | OPEN (partial implementation) | Announced in-view count and visible selected count; `tests/unit/chat12-tpo-journey-export.test.ts` test `TPO-students-48` |
| TPO-students-52 | OPEN (partial implementation) | Student panel shows profile check, stage, outcome, placement decision, offers and explicit unavailable prep metric; `tests/unit/chat12-tpo-journey-export.test.ts` test `TPO-students-52` |
| TPO-students-53 | DONE | Issued offers map to legacy released/waiting-on-answer, with exact display wording; `tests/unit/chat12-tpo-journey-export.test.ts` test `TPO-students-53` |

TPO-students-36: the authorized filtered CSV is now downloaded through a guarded client control; selection-only export and XLSX parity remain open. `tests/unit/chat12-tpo-safe-export.test.ts` test `TPO-students-36`.

**Source-only partials remain OPEN:** TPO-students-19 (missing attention extras and not-placed filter), 43 (debarments and eligibility decision provenance), 48 (selection not yet unified across bulk tools), 52 (real prep percentage and decider provenance), 54 (outcome detail beyond recorded choice). They do not qualify as complete legacy closure.

| TPO-students-33 | DONE (friendly-error adoption; prior scope unchanged) | academic import preview and apply handle network/HTML/409 with apiFetch; `tests/unit/chat12-round3-api-fetch.test.ts` named test `TPO-students-33` |
| TPO-students-07 | DONE (friendly-error adoption; prior scope unchanged) | student nudge call is protected by apiFetch; `tests/unit/chat12-round3-api-fetch.test.ts` named test `TPO-students-07` |
| TPO-students-08 | DONE (friendly-error adoption; prior scope unchanged) | bulk verify retries safely without exposing error codes; `tests/unit/chat12-round3-api-fetch.test.ts` named test `TPO-students-08` |
| TPO-students-09 | DONE (friendly-error adoption; prior scope unchanged) | bulk send-back protects private review result; `tests/unit/chat12-round3-api-fetch.test.ts` named test `TPO-students-09` |
| TPO-students-11 | DONE (friendly-error adoption; prior scope unchanged) | private notes post never displays server error body; `tests/unit/chat12-round3-api-fetch.test.ts` named test `TPO-students-11` |
| TPO-students-35 | DONE (friendly-error adoption; prior scope unchanged) | saved views GET/POST use apiFetch and keep edits on failure; `tests/unit/chat12-round3-api-fetch.test.ts` named test `TPO-students-35` |
| TPO-students-42 | DONE (friendly-error adoption; prior scope unchanged) | student Requests quick panel protects failed lookups; `tests/unit/chat12-round3-api-fetch.test.ts` named test `TPO-students-42` |
| TPO-students-54 | DONE (friendly-error adoption; prior scope unchanged) | single and bulk outcome editors keep drafts on failure; `tests/unit/chat12-round3-api-fetch.test.ts` named test `TPO-students-54` |

| TPO-students-14 | OPEN (remaining ineligible include override / whole-view cap) | Dialog confirmation, no native confirm, per-row eligibility; `tests/unit/chat12-students-bulk-drive-round3.test.ts` `TPO-students-14` |
| TPO-students-15 | OPEN (remaining 48-hour opt-out, TPO summary bell) | New additions notify each affected learner transactionally, with activity-linked idempotent notification; `tests/unit/chat12-students-bulk-drive-round3.test.ts` `TPO-students-15` |

| TPO-students-39 | OPEN (partial implementation) | Column chooser now reorders displayed columns with keyboard Earlier/Later, Reset columns; width, pin and browser persistence remain; `tests/unit/chat12-grid-columns-round3.test.ts` `TPO-students-39` |
| TPO-students-51 | OPEN (partial implementation) | Mobile cards contain collapsible Actions picker; desktop spreadsheet preserved; mobile bottom-sheet filters still needed; `tests/unit/chat12-grid-columns-round3.test.ts` `TPO-students-51` |

| TPO-students-06 | OPEN (bulk, live PG acceptance pending) | TPO timed/date/drive debar and reasoned lift wired to existing DB08 services with tenant-checked API; `tests/unit/chat12-timed-debar-round3.test.ts` `TPO-students-06` |
| TPO-students-07 | OPEN (student notification, dispute and BULK_RUN pending) | Existing immutable DB trigger history and collision-safe active ban checked; `tests/unit/chat12-timed-debar-round3.test.ts` `TPO-students-07` |

| TPO-students-32 | DONE (batch lifecycle source, runtime acceptance pending) | Filter-scoped uninvited count and legacy banner with eligibility link; `tests/unit/chat12-registration-invitation-round3.test.ts` `TPO-students-32` |
| TPO-students-50 | OPEN (historic applications and outcomes remain) | Missing registration row falls back to current persisted application; explicit choice remains authoritative; `tests/unit/chat12-registration-invitation-round3.test.ts` `TPO-students-50` |

| TPO-students-06 | OPEN (timed workflow implemented, original tagged restriction retained) | Legacy learner-level Debar form now also uses shared apiFetch, preserving typed reason on 409; `tests/unit/chat12-debar-error-round3.test.ts` `TPO-students-06` |
