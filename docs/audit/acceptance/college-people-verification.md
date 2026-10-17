# College People — gap verification evidence

Source audit: `docs/audit/pages/college/people.md`; queue `docs/orchestrator/queues/gap-closure-chat-3.md`; protocol `docs/orchestrator/briefs/gap-closure-lane.md`.

Tests authored, **not executed**, for every source-checked gap below: `tests/unit/college-people-gap-closure.test.ts` (22 named cases) and disposable-PostgreSQL gated `tests/integration/college-people-gap-closure.test.ts` (4 named, tenant-aware cases). Each new source check names the audit ID. Earlier acceptance remains subject to the orchestrator's runtime run.

| ID | Status | Source evidence and test |
| --- | --- | --- |
| COL-people-01 | OPEN | Faculty registration additional legacy personal fields require UI parity check; role creation exists |
| COL-people-02 | OPEN | Faculty editable profile exists; canonical shared login name/email/mobile intentionally protected |
| COL-people-03 | DONE | Faculty five-column CSV template, validation preview, confirmed import, downloadable per-row report; tests/unit/college-people-gap-closure.test.ts, test COL-people-03 |
| COL-people-04 | DONE | Program/Batch/Class student registration with roll, gender, DOB and address; college-student-registration-service.ts; unit test COL-people-04 |
| COL-people-05 | DONE | 500-row student CSV, exact five-column legacy header, college-scoped academic defaults/section assignment, neutralized per-row report; unit test COL-people-05 |
| COL-people-06 | DONE | Recorded bulk student import history with When/Students/Imported/Partial/Failed, server pagination; unit test COL-people-06 |
| COL-people-07 | OPEN | Student editable profile exists; canonical login identity and program/class edit parity remain incomplete |
| COL-people-08 | DONE | Faculty Suspend/Reactivate and Student Suspend/Reactivate on own roster surfaces; guarded APIs; unit and PG tests COL-people-08 |
| COL-people-09 | NOT-A-GAP (approved redesign) | Owner decision OD-23 explicitly replaces permanent deletion with suspend/end membership and session-safe lifecycle. Faculty and learner lifecycle actions only offer Suspend/Reactivate; `tests/unit/college-people-gap-closure.test.ts` — `COL-people-09 is an approved non-destructive membership lifecycle instead of permanent delete`. Avoid destructive deletion of attendance and historical records. |
| COL-people-10 | DONE | College-scoped person audit and rich profile modal covering education/skills/publications/identity summaries; unit and PG tests COL-people-10 |
| COL-people-11 | DONE | Upcoming faculty schedule reassignment transaction, overlapping-session skip, result breakdown and activity audit; unit test COL-people-11; DB writer acceptance not run |
| COL-people-12 | OPEN | OTP per-user lockout may not exist; confirm before adding unsafe bypass |
| COL-people-13 | OPEN | Legacy Name/Mobile/Gender/Status column arrangement is not fully mirrored |
| COL-people-14 | DONE | All twelve exact legacy Faculty Type labels in select, normalizer keeps unrecognized persisted variants; unit test COL-people-14 |
| COL-people-15 | OPEN | Legacy three-select filter layout and suggestions not complete |
| COL-people-16 | OPEN | Visible CSV is implemented; learner mobile is intentionally blank under privacy policy; exact legacy export parity incomplete |
| COL-people-17 | DONE | People Directory redirects to read-only Contacts categories All/Faculty/Students with account links and pagination; unit and PG tests COL-people-17 |
| COL-people-18 | OPEN | Student contact unmasking is a privacy-sensitive owner rule; currently masked |
| COL-people-19 | OPEN | Contact labels / filter structure differ from legacy; read-only categories do exist |
| COL-people-20 | OPEN | College Admin authorization permits privileged role changes; owner legacy role boundaries need verified policy |
| COL-people-21 | OPEN | Mentor workload and risk band UI not yet demonstrated on this page |
| COL-people-22 | OPEN | Reassign mentor filter / already-this-mentor count and preview need inspection |
| COL-people-23 | OPEN | Outgoing mentor task assignments/notification side effects need DB evidence |
| COL-people-24 | DONE (source verified; tests not run) | `project-mentor-reassignment.tsx` uses accessible ConfirmDialog with selected/count/mentor wording; action lock, no raw errors, exact reassignment/no-change feedback, and failed-only selection retained for retry. `project-admin-reassign-mentor-page.tsx` restores subtitle/Back to workspaces. `tests/unit/college-people-gap-closure.test.ts` — `COL-people-24 mentor reassignment preserves selection and uses explicit confirmed legacy copy`. |
| COL-people-25 | OPEN | Mobile validation and CSV duplicate detection exist; full identity duplicate messages and field-level parity remain |
| COL-people-26 | OPEN | Inline faculty lifecycle confirmation exists, but full Popconfirm wording/state parity remains |
| COL-people-27 | OPEN | Mobile cards exist; 375px behavior and 12-filter layout remain unverified |

## Notes

Canonical `users` login email/phone/name cannot be mutated by a College Admin membership editor without a verified identity workflow. Contact privacy remains restrictive pending the owner's explicit contact-unmasking decision; a student contact cell is never filled with a guessed phone number. The mentor workload/reassign side effects remain OPEN until scoped service and persisted notification evidence is independently verified.

## Round 3 — graceful handling and safety hardening (tests not run)

- `COL-people-03`: Faculty CSV PREVIEW/IMPORT now uses `apiFetch` and `useGuardedAction`; malformed HTML, timeout and network errors cannot become raw alerts. Additional test `COL-people-03 import preview/import use the guarded request helper without echoing API codes`.
- `COL-people-04`: Student registration now uses `apiFetch` and in-flight action guard, preserving draft on failure. Test `COL-people-04 student register uses guarded network calls and keeps the form after failed submit`.
- `COL-people-05`: Student CSV preview/import is guarded and still exports its per-row report. Test `COL-people-05 learner CSV preview and import use safe JSON, with per-row report retained`.
- `COL-people-25` remains **OPEN**: partial-registration failures are now summarized rather than leaking raw server codes, but exact identity duplicate/field validation parity is not yet complete. Test `COL-people-25 untrusted partial registration failures are never shown verbatim to learners`.
