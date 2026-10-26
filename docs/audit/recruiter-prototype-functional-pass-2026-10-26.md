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
| 06 Rounds | `/recruiter/drives/[jobId]?tab=rounds` and `/interview-slots` | Candidate-specific booked panel read added (`839e870`), including TPO and learner confirmation and active shortlist scope; print/resume controls added (`78bb4df`). Proposals and official bookings remain separate. Needs real database and browser acceptance. |
| 07 Offers/joining | `/recruiter/drives/[jobId]?tab=offers` | Selection composer, offer history/export exist. Accepted-offer joining reports (`f901bda`) are sent to the placement cell without changing official outcomes. Eligible-only CSV (`961e9c1`) and direct bounded XLSX upload/parser (`a701c9d`, `be07364`, `807ee59`, `34aa3bc`) now exist. Excel IDs remain subject to the recruiter-visible eligibility allowlist; uploaded files never issue offers. Verify real Excel fixture, DB approval and TPO joining writes. Verify actual offer/letter release and TPO joining writes. |
| 08 Talk | `?tab=discussion`, `TpoDriveChangeRequests` | Existing persisted requests and replies retained. Commit `4f83af1` adds five prototype quick choices opening ASK dialog. Verify actual decision side effects and notifications. |
| 09 Calendar | `/hr/calendar` | Round, slot, deadline and result-due sources exist. Verify event/college filters, week/month layouts and exact deep-link destinations. |
| 10 Messages | `/hr/conversations` | Commit `4719f7b` adds two-pane inbox, reply, search and scoped thread selection; `bf87075` fixes chronology, `a41daee` opens first general thread. Retains advanced inbox. Requires browser/database acceptance. |
| 11 Company & Team | `/hr/company` | About/hiring roles (`b570387`), colleague invite request (`48db25d`), cleared round aggregate (`d9c59f8`). Verify permissions, company-wide reports, multiple colleges and full export. |
| 12 Bell/search/profile/picker | `/hr/profile`, recruiter topbar, notifications | Notifications and scoped search sources exist. Exercise unread/read, restricted data, cross-college choice, profile save/reload and keyboard dismissals. |
| 13 Public Invitation | `/recruiter-invite/[token]` | OTP/join/consent source present; optional not-hiring note captured and capped to registered CRM field (`4a770a9`,`16b5460`). Verify real provider delivery, wrong/expired/replayed codes, company domain, revoked/expired invite and sign-in. |
| 14 Public shared applicants | `/company-share/[token]` | Code gate, expiry, CSV and selected columns present; `8f7bb06` accepts prototype alphanumeric and legacy numeric codes. Six-cell paste/autofill UI (`3b6a3a5`) added. Verify real delivery, expiry, CSV scope and revoked proof. |

## Actual changes in this continuation

- `4719f7b`, `bf87075`, `a41daee`: two-pane messaging, chronology, initial general thread.
- `4f83af1`: drive Talk shortcuts connected to existing TPO-authorized change-request composer.
- `d9c59f8`: completed evaluative round PASS totals on Company & Team; unresolved counts remain blank.
- `872c1df`: browser acceptance cases for Messages/Company role gates.

## Second implementation batch — 2026-10-26
- `839e870`: scoped booked interview panel read, TPO/learner confirmation projection and pure tests.
- `f901bda`: accepted-offer joining report to the authorized drive discussion (does not apply outcomes).
- `3b6a3a5`, `4c867ff`: six-position code entry and hardened interview time display.
- `4a770a9`, `16b5460`, `491e600`: optional not-hiring reason, 200-character bound to 255-character CRM column, compatibility.
- `961e9c1`, `ee77bc2`: Excel-compatible CSV selection list import, strict eligible allowlist, formula escaping, explicit XLSX limitation.
- `78bb4df`: print panel action and existing capped authorized resume export on the Rounds view.
- `77ebd02`: seeded browser acceptance spec for Rounds and Offers; it must execute with eligible fixtures to count.
- `a701c9d`, `be07364`, `807ee59`, `34aa3bc`: authenticated bounded XLSX ZIP/XML parser, first-column UUID allowlist validation, compressed/shared-string unit cases, and two primary Offers actions matching the prototype. This is **committed**, not accepted until CI plus an actual Excel and recruiter/TPO review flow pass.

## Recruiter continuation — latest implementation and adversarial checks

- `1c33c99`: added the three-step Offers explainer (selection, student response, joining) shown in screenshot 07, backed by existing recorded counts and truthful placement-cell authority; corrected the misplaced empty-state instruction.
- `bb36ee3`: fixed a real TypeScript failure in the booked-interview grant join. The grant schema has no `collegeId`: the read now joins the exact employer-college relationship and rechecks active, verified, unexpired `DRIVES` capability. Confirm the subsequent typecheck passes before closing this defect.
- `6d22fc4`, `c048c0d`: group the booked interview list by round, panel and room, order bookings by the actual timestamp and test the boundaries; aligns screenshot 06 without inventing confirmation.
- `52ccbaa`, `b7bb129`: bound the full multipart upload stream before parsing XLSX, including chunked requests without Content-Length; added oversized-envelope tests.
- A completed older CI run `40233488111` exposed the booked-interview missing-column error and an unrelated Faculty type error. It cannot be counted as green. Main CI/browser runs continue to be interrupted by concurrent pushes.

**Known remaining gaps**: confirm PostgreSQL and browser behavior for all 14 Recruiter/public screens, real provider OTP delivery/replay, workbook upload with an actual Excel file, authoritative TPO offer letter attachments and joining, candidate booking/reschedule lifecycle, and complete two-role (employer/placement cell) transitions. The visual screenshot audit remains deliberately deferred.

## Current continuation — source and CI evidence

- Last completed CI result checked on `78a4e32`: **Typecheck PASS**, **build PASS**; unit, database and UX lint jobs failed. See Actions run `40235009339`. Unit failures included outdated Recruiter message layouts, legacy Requests JSX shape, and pre-prototype numeric-only public code expectations; non-Recruiter failures were also present.
- `43c767d`, `9ef880c`: Recruiter two-pane Messages now performs a second live scoped inbox read before disclosure. Failed revalidation suppresses message previews, replies and independent decision-notice content. The single page still handles filtered advanced directory, archived links, and notification access.
- `3767203`, `5291ab5`: refreshed Recruiter unit tests for prototype-compatible alphanumeric public share codes and two-pane access checks, including fail-closed grant revocation with an independently successful notice lookup.
- `9b2fd7d`: scoped previous-year CLOSED-drive offer table matching prototype screenshot 07, with TPO-recorded joining labels and honest unavailable/empty/capped states.
- `5b43216`: restored explicit authorized multi-college choices in Messages.
- **Not signed off:** the latest commits still need stable CI+seeded browser/PostgreSQL acceptance; do not infer green from tests authored but not run. Faculty/TPO/Projects failures remain separate lanes.

## Acceptance gate (not yet passed)

1. Run strict typecheck and unit tests at a stable HEAD, including the newly added models.
2. Run seeded Browser + per-screen Recruiter E2E and actual DB integration across correct/wrong college and employer roles.
3. Confirm permission and privacy invariants before making applicant or joining flows more permissive.
4. Compare screenshots after the functional green baseline; visual matching is intentionally deferred, **not waived**.
5. The regular main CI and Browser workflows have been repeatedly cancelled by concurrent branch updates. Cancellation is **not** success.

Do not mark all 15 references complete on source presence, newly written tests,
or an unverified deployment. This ledger is designed for adversarial closure.

## Third implementation pass — 2026-10-26
- Removed a duplicate previous-offer panel produced by parallel Recruiter development. Retained `getRecruiterHistoricalOffers` with bounded previous-calendar-year official joining outcomes.
- Fixed an inconsistent recruiter-portfolio permission predicate: a NULL grant expiry is **not** a runtime authorization, as explicitly required by `recruiterGrantEffectiveAt`. Interview and canonical drive reads already require finite future expiry.
- Recruiter acceptance remains OPEN; stable-head CI/browser/real PostgreSQL verification is not yet available.
