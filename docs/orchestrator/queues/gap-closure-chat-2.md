# Gap closure queue: chat-2

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round). Branch: `chatgpt/chat-2-b`. 198 gaps on 5 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## tpo/inbox-team (69: OPEN 45, FIXED-ON-MAIN 21, UNCONFIRMED 3)

Audit: `docs/audit/pages/tpo/inbox-team.md` (and `inbox-team-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-inbox-team-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-inbox-team-15 | S1 | MISSING-ACTION | IN-BRANCH |
| TPO-inbox-team-04 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-inbox-team-05 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-inbox-team-06 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-inbox-team-07 | S2 | MISSING-TAB | OPEN |
| TPO-inbox-team-08 | S2 | SIDE-EFFECT | BLOCKED |
| TPO-inbox-team-10 | S2 | COPY | IN-BRANCH |
| TPO-inbox-team-16 | S2 | MISSING-TAB | OPEN |
| TPO-inbox-team-17 | S2 | MISSING-FIELD | OPEN |
| TPO-inbox-team-18 | S2 | MISSING-COLUMN | OPEN |
| TPO-inbox-team-19 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-inbox-team-20 | S2 | MISSING-ACTION | OPEN |
| TPO-inbox-team-21 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-inbox-team-22 | S2 | MISSING-ACTION | OPEN |
| TPO-inbox-team-24 | S2 | MISSING-ACTION | OPEN |
| TPO-inbox-team-28 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-inbox-team-31 | S2 | MISSING-COLUMN | OPEN |
| TPO-inbox-team-33 | S2 | MISSING-ACTION | IN-BRANCH |
| TPO-inbox-team-35 | S2 | MISSING-ACTION | NOT-A-GAP |
| TPO-inbox-team-36 | S2 | MISSING-ACTION | OPEN |
| TPO-inbox-team-39 | S2 | STATE | IN-BRANCH |
| TPO-inbox-team-44 | S2 | MISSING-FIELD | IN-BRANCH |
| TPO-inbox-team-45 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-inbox-team-46 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-inbox-team-47 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-inbox-team-48 | S2 | STATE | FIXED-ON-MAIN |
| TPO-inbox-team-54 | S2 | MISSING-FIELD | OPEN |
| TPO-inbox-team-55 | S2 | VALIDATION | FIXED-ON-MAIN |
| TPO-inbox-team-60 | S2 | SIDE-EFFECT | OPEN |
| TPO-inbox-team-63 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-inbox-team-09 | S3 | STATE | IN-BRANCH |
| TPO-inbox-team-11 | S3 | STATE | IN-BRANCH |
| TPO-inbox-team-13 | S3 | RESPONSIVE | IN-BRANCH |
| TPO-inbox-team-14 | S3 | STATE | IN-BRANCH |
| TPO-inbox-team-23 | S3 | MISSING-ACTION | IN-BRANCH |
| TPO-inbox-team-25 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-inbox-team-26 | S3 | MISSING-FIELD | OPEN |
| TPO-inbox-team-27 | S3 | STATE | IN-BRANCH |
| TPO-inbox-team-29 | S3 | SIDE-EFFECT | OPEN |
| TPO-inbox-team-30 | S3 | STATE | OPEN |
| TPO-inbox-team-32 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-inbox-team-34 | S3 | MISSING-ACTION | IN-BRANCH |
| TPO-inbox-team-37 | S3 | COPY | IN-BRANCH |
| TPO-inbox-team-38 | S3 | PERMISSION | IN-BRANCH |
| TPO-inbox-team-40 | S3 | COPY | IN-BRANCH |
| TPO-inbox-team-49 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-inbox-team-50 | S3 | MISSING-MODAL | FIXED-ON-MAIN |
| TPO-inbox-team-51 | S3 | MISSING-FIELD | OPEN |
| TPO-inbox-team-52 | S3 | STATE | IN-BRANCH |
| TPO-inbox-team-53 | S3 | STATE | FIXED-ON-MAIN |
| TPO-inbox-team-56 | S3 | COPY | IN-BRANCH |
| TPO-inbox-team-57 | S3 | PERMISSION | IN-BRANCH |
| TPO-inbox-team-59 | S3 | MISSING-FIELD | OPEN |
| TPO-inbox-team-64 | S3 | COPY | IN-BRANCH |
| TPO-inbox-team-65 | S3 | COPY | IN-BRANCH |
| TPO-inbox-team-R01 | S3 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-inbox-team-R02 | S3 | PERMISSION | OPEN |
| TPO-inbox-team-R03 | S3 | STATE | IN-BRANCH |
| TPO-inbox-team-R05 | S3 | STATE | IN-BRANCH |
| TPO-inbox-team-12 | S4 | PERFORMANCE | FIXED-ON-MAIN |
| TPO-inbox-team-41 | S4 | STATE | IN-BRANCH |
| TPO-inbox-team-42 | S4 | RESPONSIVE | OPEN |
| TPO-inbox-team-58 | S4 | VALIDATION | IN-BRANCH |
| TPO-inbox-team-66 | S4 | A11Y | FIXED-ON-MAIN |
| TPO-inbox-team-67 | S4 | STATE | IN-BRANCH |
| TPO-inbox-team-68 | S4 | STATE | IN-BRANCH |
| TPO-inbox-team-R04 | S4 | STATE | IN-BRANCH |
| TPO-inbox-team-R06 | S4 | STATE | OPEN |
| TPO-inbox-team-R07 | S4 | A11Y | FIXED-ON-MAIN |

## recruiter/calendar-messages-profile (36: OPEN 13, UNCONFIRMED 1, FIXED-ON-MAIN 20, IN-BRANCH 2)

Audit: `docs/audit/pages/recruiter/calendar-messages-profile.md` (and `calendar-messages-profile-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| REC-calendar-messages-profile-25 | S2 | MISSING-FIELD | OPEN |
| REC-calendar-messages-profile-46 | S2 | MISSING-ACTION | UNCONFIRMED |
| REC-calendar-messages-profile-R01 | S2 | SIDE-EFFECT | OPEN |
| REC-calendar-messages-profile-03 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-05 | S3 | COPY | FIXED-ON-MAIN |
| REC-calendar-messages-profile-06 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-09 | S3 | COPY | FIXED-ON-MAIN |
| REC-calendar-messages-profile-10 | S3 | COPY | FIXED-ON-MAIN |
| REC-calendar-messages-profile-11 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| REC-calendar-messages-profile-12 | S3 | STATE | IN-BRANCH |
| REC-calendar-messages-profile-13 | S3 | SIDE-EFFECT | FIXED-ON-MAIN |
| REC-calendar-messages-profile-14 | S3 | STATE | FIXED-ON-MAIN |
| REC-calendar-messages-profile-15 | S3 | VALIDATION | FIXED-ON-MAIN |
| REC-calendar-messages-profile-16 | S3 | STATE | OPEN |
| REC-calendar-messages-profile-18 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-23 | S3 | STATE | OPEN |
| REC-calendar-messages-profile-24 | S3 | MISSING-FIELD | OPEN |
| REC-calendar-messages-profile-26 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-27 | S3 | VALIDATION | OPEN |
| REC-calendar-messages-profile-28 | S3 | COPY | OPEN |
| REC-calendar-messages-profile-29 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-30 | S3 | PERMISSION | FIXED-ON-MAIN |
| REC-calendar-messages-profile-32 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-34 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| REC-calendar-messages-profile-35 | S3 | COPY | IN-BRANCH |
| REC-calendar-messages-profile-36 | S3 | COPY | IN-BRANCH |
| REC-calendar-messages-profile-41 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-R02 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-R03 | S3 | COPY | IN-BRANCH |
| REC-calendar-messages-profile-07 | S4 | STATE | FIXED-ON-MAIN |
| REC-calendar-messages-profile-20 | S4 | A11Y | FIXED-ON-MAIN |
| REC-calendar-messages-profile-33 | S4 | PERMISSION | FIXED-ON-MAIN |
| REC-calendar-messages-profile-37 | S4 | STATE | NOT-A-GAP |
| REC-calendar-messages-profile-42 | S4 | COPY | IN-BRANCH |
| REC-calendar-messages-profile-47 | S4 | STATE | OPEN |
| REC-calendar-messages-profile-48 | S4 | COPY | IN-BRANCH |

## tpo/recruiters (34: FIXED-ON-MAIN 18, OPEN 15, UNCONFIRMED 1)

Audit: `docs/audit/pages/tpo/recruiters.md` (and `recruiters-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-recruiters-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-recruiters-05 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-recruiters-06 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| TPO-recruiters-07 | S2 | COPY | OPEN |
| TPO-recruiters-10 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-recruiters-11 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-recruiters-15 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-recruiters-16 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-recruiters-17 | S2 | SIDE-EFFECT | OPEN |
| TPO-recruiters-18 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-recruiters-20 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-recruiters-21 | S2 | VALIDATION | FIXED-ON-MAIN |
| TPO-recruiters-25 | S2 | STATE | FIXED-ON-MAIN |
| TPO-recruiters-26 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-recruiters-33 | S2 | STATE | FIXED-ON-MAIN |
| TPO-recruiters-R01 | S2 | MISSING-FIELD | IN-BRANCH |
| TPO-recruiters-22 | S3 | VALIDATION | IN-BRANCH |
| TPO-recruiters-24 | S3 | COPY | IN-BRANCH |
| TPO-recruiters-27 | S3 | COPY | FIXED-ON-MAIN |
| TPO-recruiters-28 | S3 | COPY | FIXED-ON-MAIN |
| TPO-recruiters-29 | S3 | STATE | FIXED-ON-MAIN |
| TPO-recruiters-30 | S3 | VALIDATION | OPEN |
| TPO-recruiters-31 | S3 | VALIDATION | FIXED-ON-MAIN |
| TPO-recruiters-32 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-recruiters-34 | S3 | PERMISSION | NOT-A-GAP |
| TPO-recruiters-36 | S3 | RESPONSIVE | OPEN |
| TPO-recruiters-37 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-recruiters-38 | S3 | VALIDATION | IN-BRANCH |
| TPO-recruiters-39 | S3 | COPY | IN-BRANCH |
| TPO-recruiters-40 | S3 | COPY | IN-BRANCH |
| TPO-recruiters-41 | S3 | MISSING-ACTION | IN-BRANCH |
| TPO-recruiters-R05 | S3 | SIDE-EFFECT | OPEN |
| TPO-recruiters-42 | S4 | STATE | IN-BRANCH |
| TPO-recruiters-43 | S4 | COPY | IN-BRANCH |
| TPO-recruiters-R06 | S4 | COPY | IN-BRANCH |

## tpo/companies (30: UNCONFIRMED 3, OPEN 10, FIXED-ON-MAIN 17)

Audit: `docs/audit/pages/tpo/companies.md` (and `companies-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-companies-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-companies-04 | S2 | SIDE-EFFECT | NOT-A-GAP |
| TPO-companies-05 | S2 | MISSING-TAB | OPEN |
| TPO-companies-06 | S2 | MISSING-FIELD | IN-BRANCH |
| TPO-companies-08 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-companies-10 | S2 | MISSING-PAGE | FIXED-ON-MAIN |
| TPO-companies-11 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-companies-12 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-companies-13 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-companies-15 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-companies-16 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-companies-17 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-companies-19 | S2 | STATE | IN-BRANCH |
| TPO-companies-25 | S2 | STATE | IN-BRANCH |
| TPO-companies-03 | S3 | COPY | IN-BRANCH |
| TPO-companies-07 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-companies-09 | S3 | COPY | IN-BRANCH |
| TPO-companies-18 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-companies-20 | S3 | STATE | OPEN |
| TPO-companies-21 | S3 | COPY | OPEN |
| TPO-companies-22 | S3 | COPY | IN-BRANCH |
| TPO-companies-24 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-companies-26 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-companies-27 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-companies-R02 | S3 | COPY | FIXED-ON-MAIN |
| TPO-companies-R03 | S3 | PERMISSION | NOT-A-GAP |
| TPO-companies-R05 | S3 | STATE | FIXED-ON-MAIN |
| TPO-companies-14 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-companies-23 | S4 | COPY | IN-BRANCH |
| TPO-companies-28 | S4 | PERMISSION | FIXED-ON-MAIN |
| TPO-companies-29 | S4 | RESPONSIVE | IN-BRANCH |

## tpo/campaigns-public (29: FIXED-ON-MAIN 9, OPEN 17, UNCONFIRMED 3)

Audit: `docs/audit/pages/tpo/campaigns-public.md` (and `campaigns-public-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-campaigns-public-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-campaigns-public-03 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-campaigns-public-04 | S2 | STATE | OPEN |
| TPO-campaigns-public-05 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-campaigns-public-06 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| TPO-campaigns-public-07 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-campaigns-public-14 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-campaigns-public-16 | S2 | STATE | IN-BRANCH |
| TPO-campaigns-public-17 | S2 | VALIDATION | IN-BRANCH |
| TPO-campaigns-public-22 | S2 | VALIDATION | IN-BRANCH |
| TPO-campaigns-public-23 | S2 | SIDE-EFFECT | OPEN |
| TPO-campaigns-public-33 | S2 | MISSING-FIELD | IN-BRANCH |
| TPO-campaigns-public-34 | S2 | MISSING-FIELD | IN-BRANCH |
| TPO-campaigns-public-35 | S2 | STATE | IN-BRANCH |
| TPO-campaigns-public-R08 | S2 | SIDE-EFFECT | IN-BRANCH |
| TPO-campaigns-public-08 | S3 | STATE | FIXED-ON-MAIN |
| TPO-campaigns-public-09 | S3 | STATE | IN-BRANCH |
| TPO-campaigns-public-10 | S3 | COPY | IN-BRANCH |
| TPO-campaigns-public-24 | S3 | COPY | IN-BRANCH |
| TPO-campaigns-public-25 | S3 | STATE | IN-BRANCH |
| TPO-campaigns-public-27 | S3 | VALIDATION | FIXED-ON-MAIN |
| TPO-campaigns-public-28 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-campaigns-public-30 | S3 | COPY | IN-BRANCH |
| TPO-campaigns-public-36 | S3 | COPY | IN-BRANCH |
| TPO-campaigns-public-37 | S3 | STATE | OPEN |
| TPO-campaigns-public-R04 | S3 | MISSING-FIELD | IN-BRANCH |
| TPO-campaigns-public-R09 | S3 | STATE | IN-BRANCH |
| TPO-campaigns-public-11 | S4 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-campaigns-public-12 | S4 | MISSING-FIELD | IN-BRANCH |
| TPO-campaigns-public-R10 | S4 | PERFORMANCE | IN-BRANCH |

## Notes (blockers, one line each)
- TPO-inbox-team-08 BLOCKED: recruiter email relay and reply-by-email need verified provider credentials plus registered inbound webhook; no live email delivery attempted.


## Needs shell (chat-9 only)
- TPO-inbox-team-28 / TPO-inbox-team-63: chat-9 owns `src/components/shell`; add scoped Team, Messages and Announcements unread counters to TPO navigation (chat-2 cannot edit shell).



## Chat-2 current-round status (2026-10-17)
- This round verified and pushed source-backed fixes to `chatgpt/chat-2-b`; IN-BRANCH means named tests are written but not executed, and unregistered proposed migrations still require orchestrator registration.
- First 25 initially OPEN entries under tpo/inbox-team: 7 have source-level DONE evidence, 8 have partial progress, 10 remain open with substantial missing workflows. See `docs/audit/acceptance/tpo-inbox-team-verification.md` for evidence; do not treat partial or unrun PostgreSQL cases as runtime certified.
- Other OPEN items with source-level closure on branch are marked IN-BRANCH above. No source-only claim is upgraded to production verified.

## Chat-2 round 5 review — 27 remaining inbox-team OPEN entries
- Read and assessed all 27 rows in the acceptance file above (25 requested plus two); 19 have a source-level partial improvement or verified core behavior and 8 still require larger workflows. OPEN statuses are intentionally retained for incomplete legacy parity.
- Authenticated thread correction, optimistic decisions, away-until, From 42 global unread, Team pagination and drive Discussion were pushed with gap-named unit tests, not executed. The orchestrator must register `docs/proposed-migrations/tpo-inbox-team-away-until.sql`.
- TPO-settings-audit-01/55, T-S2-08, TPO-inbox-team-R05 and TPO-inbox-team-07 unit-failures-r1 regressions were addressed on branch. Verification is pending the orchestrator test run.
- Next work: object Team conversations and asks, role policy (R02/38), workload assignment/handover, delivery producers and student-facing notice consequences. Do not move any partial item to DONE without full tests.

## Chat-2 round 6 — source closure review and next work
- Synced with origin/main at start. Repaired three chat-2 unit-failures-r1 contract mismatches: TPO-home-33/TPO-inbox-team-62 bell snapshot state; TPO-home-35/TPO-inbox-team-61 guarded POST acknowledgement; TPO-inbox-team-54 full From 42 unread count. They are fixed by source changes or updated assertions; run tests in orchestrator before accepting.
- Reassessed all 27 OPEN TPO inbox-Team gaps from round 5, plus 7 recruiter/calendar/profile and recruiter-leads gaps (34 reviewed, 25+ target met for triage but **not all closed**). The gap IDs marked IN-BRANCH above have source implementations and named tests, not completed CI acceptance. Gaps with missing legacy functionality remain OPEN.
- Implemented: TPO-inbox-team-22 first-class member-scoped asks (create, idempotent retry, due/overdue, mark done with reply, cancel, audit, in-app notifications, deep links); -23 send-time decisions and Decisions filter; -18 Asks/ask-assignee chips; -31/-32 persisted ask counts and overdue sort; -34 away warning; R04 author notices with college handover view; REC-calendar-messages-profile-28 profile copy; -37 reports deep-link NOT-A-GAP; -42 invite decline verification; -47 explicit alias redirects; TPO-recruiters-38 email-provider inference, -39/-40/-43 source copy.
- Proposed `docs/proposed-migrations/tpo-team-asks.sql` needs orchestrator registration. `tests/integration/tpo-team-asks-chat2.test.ts` requires disposable DB and is **not run by builder**. Do not claim HOME ask integration, full @mention handling, multi-person/object threads, member handover, or complete CRM parity.
- Remaining major TPO-inbox-team OPEN IDs: 07,16,17,18,20,22,24,31,33,36,44,54,60,26,29,30,34,37,38,51,52,59,R02,42,R06. Recruiter profile mobile/combined save and TPO recruiter lifecycle/duplicate handling also remain.

## Chat-2 latest round — 2026-10-17, reconcile at origin/main merge
- Read main's `docs/orchestrator/unit-failures-r1.md` before work. Three chat-2-region failures (TPO-home-33, TPO-home-35, TPO-inbox-team-54) have already been repaired in the chat-2 branch's tests and bell/announcement code: source examined, no weakening or deletion. **Orchestrator CI must run tests; builder did not execute tests.**
- Reviewed 30+ remaining OPEN gaps across tpo/inbox-team, recruiter/calendar-messages-profile, tpo/recruiters, tpo/companies, and tpo/campaigns-public. This round implements/verifies the core of the IN-BRANCH IDs above, with corresponding gap-named unit tests and acceptance table evidence. Entries left OPEN remain **partial or untouched**; this was not 30 fully verified closures.
- TPO Recruiters: -07 persisted nonzero attention strips PARTIAL; -22 duplicate contact link DONE; -24 sources DONE; -30 error/detail copy PARTIAL; -36 keyboard trap PARTIAL; -39 view count and first-empty copy DONE; -41 audited restore-to-NEW and five-minute undo DONE; -42 independent snapshot reloading DONE; -R06 exact opted-out invite warning DONE.
- TPO Companies: -09 status copy DONE, -19 stale snapshot PARTIAL, -21 friendly errors PARTIAL, -22 numbers and date labels DONE, -23 actor/type/note/timestamp DONE.
- Recruiter: -12 guarded Discard / Keep writing DONE, -16 permission-aware access copy PARTIAL, -48 no-college address help DONE, -R03 misleading notification footer DONE; profile-edit mobile, comprehensive inbox and provider email relay remain OPEN.
- TPO campaigns/public: -09 batch invalid UUID 404 DONE, -10 history copy PARTIAL, -16 and -R09 nonenumerating unsubscribes and inline retry DONE, -24 and -30 public invitation retry copy DONE, -35 unpublished 404 DONE, -36 legacy heading partial; -R01 stored optional phone, -R03 ALREADY_JOINED and -R07 company subdomains verified DONE outside this queue; -R02 field-level errors partial.
- Shared caveats: storage/proxy/provider deployment checks remain required; never advertise delivery success without receipts. No numbered migrations added or scripts/auth/security/shell edited. Unit tests were added/updated but NOT RUN by this builder; orchestrator must run typecheck, lint, unit and disposable PostgreSQL before production.

## Chat-2 verified-closure follow-up — October 17

- Main was a strict descendant of this lane branch (562 commits ahead), so `chatgpt/chat-2-b` was fast-forwarded to main before this round; all later commits are on `chatgpt/chat-2-b` only.
- Respect `docs/orchestrator/queues/reassignments.md`: recruiter/calendar-messages-profile OPEN gaps now belong to chat-14, so this lane does not edit them.
- Tests in `docs/orchestrator/unit-failures-r1.md` rechecked on code: public join "One more step", exact Retry, recruiter edit Save, Teams filtered counts and bell slice, company-name capitalization, and guarded read action. Corrected code or stale source assertions without deleting test cases.
- Source-closed with regression coverage: TPO-inbox-team-34, TPO-inbox-team-38, TPO-companies-03; source-verified TPO-companies-22, TPO-campaigns-public-24/30, TPO-recruiters-38; partial/OPEN: TPO-inbox-team-18/22/29/54/60, TPO-companies-20, TPO-recruiters-40, TPO-campaigns-public-R06. See the four acceptance documents for precise tests and evidence.
- Remaining hard gaps include multiperson/object threads, mentions, announcement recipient delivery/receipts, college team handover, bell event producers, and company experience consolidation. Nothing marked DONE is claimed runtime-certified; CI and PostgreSQL were not run.

- Source evidence already on main and re-verified this round, now marked IN-BRANCH (not runtime-certified): TPO-recruiters-R01 (`tests/unit/chat2-engage-company-communication.test.ts`), TPO-campaigns-public-22 (`tests/unit/chat2-business-email-safety.test.ts`), -33/34 (`tests/unit/chat2-public-content-metrics.test.ts`, proposed migration not registered), -R04 (`tests/unit/chat2-public-join-known-company.test.ts`), -R10 (`tests/unit/chat2-engage-sql-audience-preview.test.ts`). Remain subject to orchestrator CI, migration registration, and deployment verification.


## Chat-2 large continuation — campaign history, company phone layouts, exact copy
- Checked latest main and fast-forwarded lane branch before edits. The branch's GitHub commits persist directly on `chatgpt/chat-2-b`; no writes to main.
- TPO-campaigns-public-04 remains OPEN for full campaign/non-campaign provider history. Campaign dispatch now creates an opaque delivery batch and records actual receipt outcomes. TPO-companies-21 remains OPEN for independent count-retry behavior.
- IN-BRANCH source closure this round: TPO-inbox-team-52, TPO-recruiters-40, TPO-companies-29, TPO-campaigns-public-10/12/36. Tests and paths in acceptance files; unit/integration and typecheck have NOT been run by builder.
## Chat-2 current branch round — 2026-10-17 (after 0133/0134)
- Fast-forwarded `chatgpt/chat-2-b` to `main` at `1b41f799c02ae0576e0c8a9558f93f0852e04e4b` (branch was behind, not divergent); all subsequent commits were made directly on the lane branch.
- Repaired chat-2 failing unit contracts without deleting test coverage: exact Settings labels, recruiter draft shared confirm, Company Memory real placed count, scoped notification-edit opt-in, drive Discussion link, Team notification title, People derived sorting, and 0133 registered SQL assertions for Team reads, asks, away, topic limit.
- `TPO-inbox-team-44`: added required searchable published-drive picker in addition to the existing multiple batch/branch selection, scoped service and empty states; named tests in `tests/unit/chat2-tpo-inbox-audience-44.test.ts`. IN-BRANCH, pending orchestrator test/DB verification.
- `TPO-inbox-team-33`: unowned assignment now requires explicit confirm/cancel before guarded scoped DB mutation; named tests in `tests/unit/chat2-tpo-unowned-confirm-33.test.ts`. The owner-column proposal `docs/proposed-migrations/tpo-team-drive-owner.sql` is not present in 0133/0134, so registration is still needed before the assignment can work in production.
- `TPO-companies-06`: Companies list now computes distinct placed members using college policy and recorded offers (never invents the SELECTED ledger); named existing unit test `tests/unit/chat2-company-placed-policy.test.ts`.
- `TPO-inbox-team-51`: restored the opt-in edit checkbox, but unsent audience-change parity is still outstanding; keep OPEN. No numbered migrations were added. Builder could not run tests or typecheck; orchestrator must validate.

## Chat-2 delegated UNCONFIRMED decisions — October 17, 2026
- TPO-inbox-team-08: BLOCKED real email relay until outbound/inbound provider credentials exist; never claim unverified send.
- TPO-inbox-team-11: safer distinct unavailable recruiter inbox instead of notification-as-chat fallback; implemented and named test.
- TPO-inbox-team-35: NOT-A-GAP for TPO self-grant; only audited College Admin may grant placement-team permissions.
- TPO-recruiters-34 and TPO-companies-R03: NOT-A-GAP intentional TPO role + persisted placement permission on sensitive writes; prevent implicit admin/faculty role expansion.
- TPO-companies-04: NOT-A-GAP trust is not approval for a drive; require registered TPO policy.
- TPO-companies-25: replace DB09 env gate with dynamic CRM table-readiness checks, preserving 503 when tables are absent.
- TPO-campaigns-public-17: use signed, scoped, long-lived TPO unsubscribe claims even for historic email; separate global optout remains expiring.
- TPO-campaigns-public-25: audited enabled/on/off/replacement on effectively perpetual link, revocable and college/domain scoped.
- TPO-campaigns-public-R08: record verified public/company-link provenance in immutable join event, never assume approval or broaden grants.
- REC-calendar-messages-profile-46 is reassigned to chat-14 in `docs/orchestrator/queues/reassignments.md`; do not edit recruiter-area code.
- Decision evidence and one named test per ID in the corresponding acceptance docs. No tests executed by this GitHub-only builder.
