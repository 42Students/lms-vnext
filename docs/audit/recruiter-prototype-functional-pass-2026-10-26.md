# Recruiter prototype functional pass — 2026-10-26

**Scope:** newest uploaded `42LMS pages prototype-png-recruiter.zip`, 15 PNGs.
**North star:** implement and verify every functional contract before final visual acceptance.
**Status: OPEN.** Existing production code is substantial; a path or component
being present is not test or acceptance evidence.

## Reference crosswalk

| Screenshot | Route / code | Functional audit and acceptance next |
| --- | --- | --- |
| 00 Companies Today | Related TPO/company surfaces | Out-of-recruiter supporting reference. Do not mark recruiter acceptance from this asset. |
| 01 Recruiter Today | `/hr/home`, `recruiter-today-prototype` | Recheck action urgency, pending decisions, weekly events, empty/partial data and Later persistence against seed and clock. |
| 02 Drives | `/hr/drives`, request and scoped search services | Verify waiting/live/completed counts, multi-college choice, filters, request lifecycle and URL preservation with real jobs. |
| 03 Request a drive | `/hr/drives/new`, `hr-drive-draft-form`, drive request POST/PATCH | Formal request/draft/save/edit/resubmit exists. Verify round template, pay/CGPA/branch warnings, upload receipt, TPO acknowledgment and concurrency under PostgreSQL. |
| 04 Overview | `/recruiter/drives/[jobId]` | Verify drive progress, next action, live applicant/funnel counts, closed read-only links and TPO authorization. |
| 05 Applicants | `/recruiter/drives/[jobId]?tab=applicants` | Verify only shared shortlist, focused keyboard controls, notes/private ratings, resume access and result staging. |
| 06 Rounds | `/recruiter/drives/[jobId]?tab=rounds` and `/interview-slots` | Slot proposals exist; candidate-specific panel schedules and confirmations are not proven equivalent to prototype. Require TPO booking integration and browser fixtures. |
| 07 Offers/joining | `/recruiter/drives/[jobId]?tab=offers` | Selection composer, offer history and export exist. Recruiter direct joining action is not implemented; TPO authority, offer letters and completion flow need owner-safe verification. |
| 08 Talk | `?tab=discussion`, `TpoDriveChangeRequests` | Existing persisted requests and replies retained. Commit `4f83af1` adds five prototype quick choices opening ASK dialog. Verify actual decision side effects and notifications. |
| 09 Calendar | `/hr/calendar` | Round, slot, deadline and result-due sources exist. Verify event/college filters, week/month layouts and exact deep-link destinations. |
| 10 Messages | `/hr/conversations` | Commit `4719f7b` adds two-pane inbox, reply, search and scoped thread selection; `bf87075` fixes chronology, `a41daee` opens first general thread. Retains advanced inbox. Requires browser/database acceptance. |
| 11 Company & Team | `/hr/company` | About/hiring roles (`b570387`), colleague invite request (`48db25d`), cleared round aggregate (`d9c59f8`). Verify permissions, company-wide reports, multiple colleges and full export. |
| 12 Bell/search/profile/picker | `/hr/profile`, recruiter topbar, notifications | Notifications and scoped search sources exist. Exercise unread/read, restricted data, cross-college choice, profile save/reload and keyboard dismissals. |
| 13 Public Invitation | `/recruiter-invite/[token]` | OTP/join/consent source present. Verify real delivery, wrong/expired/replayed codes, company domain, revoked/expired invite and sign-in. |
| 14 Public shared applicants | `/company-share/[token]` | Code gate, expiry, CSV and selected columns present; `8f7bb06` accepts prototype alphanumeric code and historical numeric codes. Verify real delivery, expiry, CSV scope and revoked proof. |

## Actual changes in this continuation

- `4719f7b`, `bf87075`, `a41daee`: two-pane messaging, chronology, initial general thread.
- `4f83af1`: drive Talk shortcuts connected to existing TPO-authorized change-request composer.
- `d9c59f8`: completed evaluative round PASS totals on Company & Team; unresolved counts remain blank.
- `872c1df`: browser acceptance cases for Messages/Company role gates.

## Acceptance gate (not yet passed)

1. Run strict typecheck and unit tests at a stable HEAD, including the newly added models.
2. Run seeded Browser + per-screen Recruiter E2E and actual DB integration across correct/wrong college and employer roles.
3. Confirm permission and privacy invariants before making applicant or joining flows more permissive.
4. Compare screenshots after the functional green baseline; visual matching is intentionally deferred, **not waived**.
5. The regular main CI and Browser workflows have been repeatedly cancelled by concurrent branch updates. Cancellation is **not** success.

Do not mark all 15 references complete on source presence, newly written tests,
or an unverified deployment. This ledger is designed for adversarial closure.
