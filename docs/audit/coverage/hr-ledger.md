# HR/Recruiter/Tracker coverage ledger — chat-15

**Status: OPEN — not release certified.** Coverage task HR-COV-15. Source and test links below are an evidence inventory, not proof that the exhaustive behaviour matrix is green. Cross-lane ownership: HR/Recruiter core (chat-15), messaging/email (chat-16), independent HR review (chat-19). Projects-view roles require verification for the IIT Dharwad release.

## Behaviour matrix and high-risk exported functions

| Gap | Export or route | Existing/new behavioural evidence | Open requirements |
|---|---|---|---|
| HR-ROUND-ROLE-01 | `canRecruiterEditRound` in `hr-round-editor-model.ts` | `hr-recruiter-exhaustive-chat15-01.test.ts`; new `HR-BREAK-chat15-round-versions-02.test.ts` (including blank/mismatched actors, PENDING, results, slots) | Real DB authorization and race |
| HR-ROUND-STALENESS-01 | `matchesRecruiterRoundVersion` in `hr-round-editor-model.ts` | New `HR-BREAK-chat15-round-versions-02.test.ts`: offsets, ms mismatch, malformed/absent versions | DB round edit end-to-end |
| HR-ROUND-CAS-02 | `editHrJobRound` in `hr-round-editor-service.ts` | `hr-round-editor-concurrency.test.ts` and version-model tests | Parallel PostgreSQL UPDATE/REMOVE, audit exactly once |
| HR-ROUND-CAS-02 | `listHrRoundEditorRows` | `hr-recruiter-exhaustive-chat15-01.test.ts` covers pure eligibility; service read still untested | Revoked grant, wrong tenant, TPO-only role |
| HR-ROUND-NAMES-01 | `duplicateRecruiterRoundName` | `hr-recruiter-exhaustive-chat15-01.test.ts` (NFKC, whitespace, cancelled/self) | Race on simultaneous inserts |
| HR-ROUND-NAMES-01 | `hrRoundFormSchema` | `hr-round-command-validation.test.ts`, `HR-BREAK-chat15-round-versions-02.test.ts` | Integration error mapping |
| HR-REQUEST-CAS-01 | `updateOwnRecruiterDriveRequest` | `recruiter-drive-requests-0101.test.ts` (stale, edit, resubmit, newly added monotonic-version assertions) | Parallel browser tabs and rollback on notification failure |
| HR-REQUEST-IDEMP-01 | `createOwnRecruiterDriveRequest` | `recruiter-drive-requests-0101.test.ts`, `HR-BREAK-drives-01.test.ts` | Concurrent nonce replay, request/audit count |
| HR-REQUEST-TENANT-01 | `listOwnRecruiterDriveRequests` | `recruiter-drive-requests-0101.test.ts` and `HR-BREAK-authorization-01.test.ts` | Revoked grant and cross-organization DB fixture |
| HR-REQUEST-PAYLOAD-01 | `recruiterDriveRequestInputSchema`, `recruiterRequestUpdateSchema` | `HR-BREAK-drive-payload-01.test.ts`, `HR-BREAK-drives-01.test.ts` | HTTP body-limit matrix |
| HR-REQUEST-PAYLOAD-01 | `hrDriveDraftSchema`, `hrDriveDraftQuerySchema`, `emptyHrDriveDraft`, `hrDraftFromAuthorizedJob` | `HR-BREAK-drive-payload-01.test.ts` | Persistence, stale draft restoration |
| HR-REQUEST-ORIGIN-01 | `readRecruiterJsonBody` | `hr-recruiter-json-request-chat15-01.test.ts` (stream cap, invalid JSON) | Network cancellation errors under load |
| HR-REQUEST-ORIGIN-01 | Recruiter requests POST/PATCH/GET `src/app/api/placements/recruiter/drives/requests/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` | Real 401/403/409; GET never writes |
| HR-JOBS-01 | Recruiter job ownership `recruiterOwnJobPredicate`, `recruiterOwnJobExists` | `HR-BREAK-authorization-01.test.ts` covers shared visibility policy | Direct DB query with 2 recruiters in one company |
| HR-JOBS-02 | `job-service.ts` placement mutations | `tests/integration/placements-p8-offers.test.ts` covers related workflow | Recruiter/TPO/wrong tenant transition matrix |
| HR-APPLICANTS-01 | `hr-job-applicants-model.ts`, `hr-applicant-export-model.ts` | `HR-BREAK-applicants-01.test.ts`, `hr-applicant-export-model.test.ts` | Export/screen parity and CSV formula escaping on real data |
| HR-APPLICANTS-02 | `recruiter-applicant-resume-service.ts`, `recruiter-shared-candidate-policy.ts` | `HR-BREAK-authorization-01.test.ts`, `hr-recruiter-shared-contact-policy.test.ts` | Signed URL expiry, revoked grant, cross-job IDOR |
| HR-OFFERS-01 | `offer-service.ts` issuance, withdrawal and joining | `HR-BREAK-offers-01.test.ts`, `placements-p8-offers.test.ts` | Parallel issue/withdraw/expiry and correct actor attribution |
| HR-ROUNDS-01 | `round-service.ts` and round result staging | `hr-inline-round-results.test.ts`, `HR-BREAK-round-results-page-01.test.ts` | Shared pending results, CAS, audit/events |
| HR-ROUNDS-02 | `hr-interview-slot-service.ts` | `hr-interview-slot-model.test.ts`, `HR-BREAK-calendar-01.test.ts` | Venue overlap, TPO scheduling and stale slot capacity on PostgreSQL |
| HR-CALENDAR-01 | `recruiter-calendar-service.ts`, `placement-calendar-service.ts` | `HR-BREAK-calendar-01.test.ts`, `hr-calendar-day-model.test.ts` | Boundaries, actual 23:59 IST scheduling and role-scoped data |
| HR-MSG-01 | `hr-conversation-inbox-service.ts`, `hr-drive-conversation-service.ts` | `hr-conversation-reply-validation.test.ts`, `HR-BREAK-messaging-01.test.ts` | Wrong job, deleted grant, 2 writers, notification dedupe |
| HR-MSG-02 | Recruiter conversation open/reply/ack routes | `hr-recruiter-route-security-chat15-01.test.ts` | Behavioural 401/403/409 and exact recipient |
| HR-MSG-03 | `hr-tpo-notification-service.ts` | Existing event/inbox integration tests | Exactly-once TPO bell on rollback/retry |
| HR-PROFILE-01 | `recruiter-profile-details-service.ts`, `recruiter-designation-service.ts` | `HR-BREAK-profile-01.test.ts`, `hr-recruiter-designation.test.ts` | Revoked session, concurrent edit |
| HR-DRIVES-01 | `hr-drive-draft-form.tsx` and `recruiter-round-inline-editor.tsx` | `HR-BREAK-double-submit-01.test.ts`, `UX-hr-round-editor-chat15-01.test.ts` | Browser rapid click, failing fetch, preserved input and focus |
| UX-tracker-mine-publicId-02 | `getMyTrackerReport` + `/tracker/mine/[publicId]` page | New `HR-BREAK-tracker-detail-chat15-02.test.ts` (invalid ID, disabled/revoked reporter, 404, unavailable DB) | Live browser error boundary/friendly retry |
| UX-tracker-admin-detail-01 | `/tracker/issues/[publicId]` page | Source changed to avoid exposing DB migration/environment flag | Verify 320px states and admin role denial |
| UX-HR-PAGES-01 | `/hr/**`, `/recruiter/**` pages | `UX-hr-page-states-chat15-01.test.ts`, `UX-hr-tracker-overlays-chat15-01.test.ts` | One test per route for loading/empty/error/partial/denied + phone |
| UX-TRACKER-PAGES-01 | `/tracker/**` pages | `UX-tracker-mine-chat15-01.test.ts`, `HR-BREAK-tracker-pages-01.test.ts` | Keyboard/phone, privileged audit workflow |
| UX-SHARED-01 | `components/tracker`, `shell`, `hr`, `activity`, `verification` | `UX-chat15-shell-activity-components-01.test.ts` | Visual/accessibility keyboard/scroll and real failure-state flows |
| PROJ-BREAK-HR-01 | HR/Recruiter access to projects | `projects-iit-dharwad-hardening.md` requirements | **OPEN:** negative permissions and cross-college project data exposure tests |

## Role and resilience acceptance matrix

All listed functions/routes require **own-college HR, recruiter, TPO, wrong-college same employer, wrong organization, disabled membership and expired session** checks. Each mutation needs strict input/schema/origin, concurrency and stale-tab outcomes, allowed/forbidden transitions, rollback, a single persisted audit event, recipient-scoped notification, and safe error mapping; each page needs loading, empty, partial, denied, failure/retry, phone and keyboard assertions. Existing test-name matches do not satisfy this matrix until the actual assertions and PostgreSQL results are reviewed.

## Release blockers and next passes

- Full inventory of every exported HR/recruiter model function, all recruiter route handlers and every HR/recruiter/tracker page remains to be completed. The table above is a high-risk slice, **not** an exhaustive one-function-per-row certification.
- Strict typecheck, all unit tests, isolated PostgreSQL transaction/race tests, and real browser runs have **not** been executed from this connected GitHub-only environment.
- CI baseline `docs/orchestrator/typecheck-errors-latest.md` and `docs/orchestrator/unit-failures-latest.md` listed no chat-15-specific failures at initial review; this is not evidence that the new tests pass.
