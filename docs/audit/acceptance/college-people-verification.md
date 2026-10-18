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
| COL-people-13 | OPEN | Legacy Name/Mobile/Gender/Status column arrangement is not fully mirrored |
| COL-people-14 | DONE | All twelve exact legacy Faculty Type labels in select, normalizer keeps unrecognized persisted variants; unit test COL-people-14 |
| COL-people-15 | OPEN | Legacy three-select filter layout and suggestions not complete |
| COL-people-16 | OPEN | Visible CSV is implemented; learner mobile is intentionally blank under privacy policy; exact legacy export parity incomplete |
| COL-people-17 | DONE | People Directory redirects to read-only Contacts categories All/Faculty/Students with account links and pagination; unit and PG tests COL-people-17 |
| COL-people-18 | NOT-A-GAP (privacy improvement) | Learner contact email/mobile intentionally masked in generic college Contacts views and exports; no need-to-know authorization has been granted to the generic directory. `college-contacts-privacy.ts` enforces maskedEmail and maskedPhone, with tests/unit/college-people-gap-closure.test.ts case COL-people-18. A separate authorization workflow is required before exposing private details. |
| COL-people-19 | DONE (source verified; tests not run) | `college/contacts/page.tsx` now shows a single primary Name or email search with Search contacts action and existing All/Faculty/Student tabs, while the full advanced filters remain available in an accessible disclosure (opened for active filters). Masked student contact policy is preserved. `tests/unit/college-people-gap-closure.test.ts` — `COL-people-19 contact directory presents legacy search and tabs before advanced filters`. |
| COL-people-20 | DONE (source verified; tests not run) | `membership-service.ts` centrally requires `admin-scope.select` for `COLLEGE_ADMIN` grant **and** revoke before repository writes; this permission is restricted to active Super Admins in `permissions/policy.ts`. Other college-scoped role edits retain normal membership permission checks. `person-membership-actions.tsx` now explains the restriction and presents a clear denial. `tests/unit/college-people-gap-closure.test.ts` — `COL-people-20 Super Admin permission guards COLLEGE_ADMIN grant and revoke before writes`. |
| COL-people-21 | DONE (source verified; tests not run) | `project-admin-reassign-mentor-page.tsx` renders actual persisted mentor active workspace/at-risk counts, overload badges and per-mentor links including Unassigned; `mentor-reassignment-workload-service.ts`; `tests/unit/college-people-gap-closure.test.ts`: COL-people-21 shows persisted mentor workload risk and an Unassigned filter. |
| COL-people-22 | DONE (source verified; tests not run) | `project-admin-reassign-mentor-page.tsx` accepts/fromMentorId deep link, filter by current mentor and cross-page matching workspaces; `project-mentor-reassignment.tsx` shows Already this mentor — will skip, skip counts and selected across pages; `tests/unit/college-people-gap-closure.test.ts`: COL-people-22 preserves current-mentor filters and skips already-assigned workspace selection. |
| COL-people-23 | DONE (source verified; PostgreSQL tests not run) | `member-service.ts` reassigns within transaction, clears outgoing mentor task assignee, cancels meetings, writes immutable activity, notifies both mentors via `notifyProjectMemberships` and learners via `notifyActiveProjectMembers`; `tests/unit/college-people-gap-closure.test.ts`: COL-people-23 server atomically clears outgoing tasks and notifies mentors and project learners. Integration still unexecuted. |
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


## Round 6 — October 17, source-level (unexecuted tests)

| ID | Status | Evidence |
| --- | --- | --- |
| COL-people-15 | DONE | Primary Faculty filters are search, status, Department, Employment type; primary Student filters are search, status, Class, Program, Batch. Technical filters remain under a native accessible Advanced filters disclosure, preserving deep links and server scopes. `college-role-directory-workspace.tsx`; `tests/unit/college-people-gap-closure.test.ts`, case COL-people-15. |
| COL-people-27 | DONE (source verified) | Mobile card list at widths below md, bounded desktop overflow and responsive advanced filter grid remain; `college-role-directory-workspace.tsx`; named COL-people-27 test. Browser viewport measurement unexecuted. |
| COL-people-13 | OPEN | Headings now use person-facing language; legacy Mobile, Gender, and live presence metrics require authorized source data and are not fabricated. |


## Chat-11 delegated permission decisions — 2026-10-18

| COL-people-12 | NOT-A-GAP | Do not provide a College Admin 'Clear OTP lockout': the five-minute challenge caps verification attempts, not a permanent user-account lock, so a manual unlock would create an unsafe bypass. `src/modules/auth/login-service.ts`; `tests/unit/chat11-college-unconfirmed-decisions-round10.test.ts` — `COL-people-12 does not add unsafe permanent OTP account unlock for five-minute challenges`. |
| COL-people-20 | DONE (source-level) | Require active Super Admin permission before both grant and revoke of COLLEGE_ADMIN, even when the actor can edit other scoped college roles. `src/modules/people/membership-service.ts`; `tests/unit/chat11-college-unconfirmed-decisions-round10.test.ts` — `COL-people-20 requires Super Admin for granting or revoking the college admin role`. |


## Chat-11 CSV audit and partial-failure hardening (2026-10-18)

| COL-people-05 | DONE (source-level, test unexecuted) | `src/modules/people/college-student-csv-service.ts` inserts the import audit using the actual current membership only when its college and organization equal the import scope; avoids the reported union-property type error. `tests/unit/chat11-college-student-csv-audit-round10.test.ts` — `COL-people-05 writes a typed same-college actor membership instead of an unknown union property`. |
| COL-people-25 | PARTIAL — OPEN | `src/modules/people/college-student-csv-service.ts` now strips raw class-placement exception messages from imported-row receipts; `tests/unit/chat11-college-student-csv-audit-round10.test.ts` — `COL-people-25 does not leak database error messages in partial CSV row receipts`. Existing-account duplicate detection and full field-level identity error parity are not complete. |

## Chat-3 round 13 — audited faculty suspension interaction

| ID | Disposition | Evidence |
| --- | --- | --- |
| COL-people-26 | DONE (source, browser test pending) | Accessible, explicit two-step `ConfirmDialog` and pending state for faculty lifecycle changes, with success notices and no browser `window.confirm`. `src/components/college/college-faculty-lifecycle-action.tsx` and `tests/unit/college-people-gap-closure.test.ts` case COL-people-26. |

## Chat-3 COL-people-20 service behavior (authored tests; CI pending)

| ID | Disposition | Evidence |
| --- | --- | --- |
| COL-people-20 | DONE (source + service mock contracts, not runtime certified) | `tests/unit/chat3-col-people-20-role-authorization.test.ts` invokes actual `addMembershipRole` and `removeMembershipRole`: cross-role grant/revoke refusals before reads, disabled Super Admin rejection, foreign admin-scope rejection before writes, same-college Super Admin grant and revoke with existing role, and ordinary same-college role assignment. Retains original legacy copy and `tests/unit/college-people-gap-closure.test.ts`. PostgreSQL/CI and browser permission journeys not run. |
## Chat-3 round 14 — COL-people-13 corrected metrics without leaking PII

| ID | Disposition | Evidence |
| --- | --- | --- |
| COL-people-13 | PARTIAL | Registered, active and suspended counts are now derived from persisted membership/role/user rows scoped to the same college, independently of visible paginated results. `Visible now` is explicitly `Not tracked`; the app does not fabricate presence or expose unmasked mobile numbers to every directory viewer. Remaining missing roll/gender/class columns need role-scoped access review. `tests/unit/chat3-people-metrics-round14.test.ts`. |
