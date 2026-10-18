# HR/Recruiter/Tracker coverage ledger — chat-15

**Status: OPEN — not release certified.** Coverage task HR-COV-15. Source and test links below are an evidence inventory, not proof that the exhaustive behaviour matrix is green. Cross-lane ownership: HR/Recruiter core (chat-15), messaging/email (chat-16), independent HR review (chat-19). Projects-view roles require verification for the IIT Dharwad release.

## Behaviour matrix and high-risk exported functions

| Gap | Export or route | Existing/new behavioural evidence | Open requirements |
|---|---|---|---|
| HR-ROUND-ROLE-01 | `canRecruiterEditRound` in `hr-round-editor-model.ts` | `hr-recruiter-exhaustive-chat15-01.test.ts`; new `HR-BREAK-chat15-round-versions-02.test.ts` (including blank/mismatched actors, PENDING, results, slots) | Real DB authorization and race |
| HR-ROUND-STALENESS-01 | `matchesRecruiterRoundVersion` in `hr-round-editor-model.ts` | New `HR-BREAK-chat15-round-versions-02.test.ts`: offsets, ms mismatch, malformed/absent versions | DB round edit end-to-end |
| HR-ROUND-CAS-02 | `editHrJobRound` in `hr-round-editor-service.ts` | `hr-round-editor-concurrency.test.ts`, `HR-BREAK-chat15-round-service-03.test.ts` (transactional role, version, event), and version-model tests | Real PostgreSQL parallel UPDATE/REMOVE and rollback |
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


## Complete source/path inventory for follow-up (not behavioural certification)

Inventory: 47 authenticated HR/recruiter/tracker pages; 28 recruiter placement API route files; 154 HR/recruiter model/service files. This inventory names paths, not necessarily each runtime export. Tests associated by filename are suggestions for inspection, never treated as proof.

### Authenticated pages

| Page | Potential test file | Missing coverage |
|---|---|---|
| `hr/activity` | `tests/unit/hr-activity-csv-model.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/calendar` | `tests/integration/hr-calendar-results-due.test.ts`, `tests/unit/hr-calendar-category-model.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/colleges` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/company` | `tests/integration/hr-company-overview.test.ts`, `tests/integration/hr-company-report-export.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/company/reports` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/conversations/[threadId]` | `tests/integration/hr-conversations-isolation.test.ts`, `tests/unit/chat16-hr-conversations-edge-02.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/conversations` | `tests/integration/hr-conversations-isolation.test.ts`, `tests/unit/chat16-hr-conversations-edge-02.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/drives/[jobId]/interview-slots` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/drives/[jobId]/messages` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/drives/[jobId]/rounds/editor` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/drives/[jobId]/rounds/editor/remove/[roundId]` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/drives/new` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/drives` | `tests/unit/hr-drives-csv-model.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/drives/proposals` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/drives/recorded-outside` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/home` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/messages` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/notifications` | `tests/integration/hr-notifications.test.ts`, `tests/unit/chat16-hr-notifications-privacy-02.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/placements/jobs/[jobId]` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/placements` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/profile` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `hr/round-results` | `tests/integration/hr-round-results.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/calendar` | `tests/unit/UX-recruiter-calendar-01.test.ts`, `tests/unit/chat2-final-sprint-recruiter-calendar.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/colleges` | `tests/unit/UX-recruiter-colleges-01.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/company` | `tests/db017-db09-recruiter-company-registration.test.mjs`, `tests/integration/recruiter-company-reports-service.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/drives/[jobId]/change-requests` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/drives/[jobId]/interview-slots` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/drives/[jobId]/messages` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/drives/[jobId]` | `tests/unit/UX-recruiter-drives-01.test.ts`, `tests/unit/UX-recruiter-drives-jobId-01.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/drives/[jobId]/rounds/editor` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/drives/[jobId]/rounds/editor/remove/[roundId]` | **Not linked** | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/drives/new` | `tests/unit/UX-recruiter-drives-new-01.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/drives` | `tests/unit/UX-recruiter-drives-01.test.ts`, `tests/unit/UX-recruiter-drives-jobId-01.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/drives/proposals` | `tests/unit/UX-recruiter-drives-proposals-01.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/drives/recorded-outside` | `tests/unit/UX-recruiter-drives-recorded-outside-01.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/home` | `tests/unit/UX-recruiter-home-01.test.ts`, `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/messages` | `tests/unit/UX-recruiter-messages-01.test.ts`, `tests/unit/chat2-final-sprint-recruiter-messages.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter` | `tests/db004-db09-recruiter-peer-review.test.mjs`, `tests/db017-db09-recruiter-company-registration.test.mjs` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `recruiter/profile` | `tests/e2e/graceful-recruiter-profile.spec.ts`, `tests/unit/UX-recruiter-profile-01.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `tracker/audit-findings/[publicId]` | `tests/unit/UX-tracker-audit-findings-01.test.ts`, `tests/unit/UX-tracker-audit-findings-publicId-01.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `tracker/audit-findings` | `tests/unit/UX-tracker-audit-findings-01.test.ts`, `tests/unit/UX-tracker-audit-findings-publicId-01.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `tracker/issues/[publicId]` | `tests/unit/UX-tracker-issues-01.test.ts`, `tests/unit/UX-tracker-issues-publicId-01.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `tracker/issues` | `tests/unit/UX-tracker-issues-01.test.ts`, `tests/unit/UX-tracker-issues-publicId-01.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `tracker/logs` | `tests/unit/UX-tracker-logs-01.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `tracker/mine/[publicId]` | `tests/unit/UX-tracker-mine-chat15-01.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `tracker/mine` | `tests/unit/UX-tracker-mine-chat15-01.test.ts` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |
| `tracker` | `tests/db-parity-db09-tracker.test.mjs`, `tests/db-parity-db10-bugtracker.test.mjs` | Auth/deny, loading, empty, partial, error/reset, 320px/keyboard must be confirmed |

### HTTP routes

| API path | Linked tests | Open checks |
|---|---|---|
| `access/[grantId]/route.ts` | `tests/integration/tpo-recruiter-access-service.test.ts`, `tests/unit/bug-tracker-access-and-attachments.test.ts` | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `activity/export/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `bell/route.ts` | `tests/unit/chat16-hr-bell-double-submit-03.test.ts`, `tests/unit/recruiter-bell-model.test.ts` | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `calendar/export/route.ts` | `tests/unit/hr-calendar-export-model.test.ts` | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `conversations/[threadId]/acknowledge/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `conversations/[threadId]/reply/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `conversations/acknowledge/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `conversations/open/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `drives/[jobId]/interview-slots/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `drives/[jobId]/rounds/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `drives/export/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `drives/proposal/route.ts` | `tests/unit/UX-recruiter-drives-proposals-01.test.ts` | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `drives/proposals/export/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `drives/requests/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `jobs/[jobId]/applicants/[applicationId]/notes/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `jobs/[jobId]/applicants/[applicationId]/private-rating/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `jobs/[jobId]/applicants/[applicationId]/resume-grant/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `jobs/[jobId]/applicants/export/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `jobs/[jobId]/offers/export/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `jobs/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `notifications/[notificationId]/read/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `notifications/drawer/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `notifications/export/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `profile/details/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `profile/name/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `profile/route.ts` | `tests/e2e/graceful-recruiter-profile.spec.ts`, `tests/unit/HR-BREAK-profile-01.test.ts` | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `reports/export/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |
| `team/export/route.ts` | `hr-recruiter-route-security-chat15-01.test.ts` (guard source contract only) | Enumerate methods, role/tenant, schema, size, GET read-only, same-origin, replay, events |

### HR/recruiter model/service files

These paths require one test row **per exported function** after parsing each file. Their inclusion here does not imply coverage.

- `src/modules/placements/hr-activity-csv-model.ts`
- `src/modules/placements/hr-applicant-drawer-model.ts`
- `src/modules/placements/hr-applicant-export-model.ts`
- `src/modules/placements/hr-calendar-category-model.ts`
- `src/modules/placements/hr-calendar-day-model.ts`
- `src/modules/placements/hr-calendar-export-model.ts`
- `src/modules/placements/hr-calendar-next-event-model.ts`
- `src/modules/placements/hr-company-report-export-model.ts`
- `src/modules/placements/hr-conversation-detail-links-model.ts`
- `src/modules/placements/hr-conversation-detail-pagination-model.ts`
- `src/modules/placements/hr-conversation-inbox-model.ts`
- `src/modules/placements/hr-conversation-inbox-service.ts`
- `src/modules/placements/hr-conversation-open-model.ts`
- `src/modules/placements/hr-conversation-reply-model.ts`
- `src/modules/placements/hr-conversation-return-url-model.ts`
- `src/modules/placements/hr-conversation-send-feedback-model.ts`
- `src/modules/placements/hr-conversation-snippet-model.ts`
- `src/modules/placements/hr-conversation-unread-model.ts`
- `src/modules/placements/hr-conversation-urls-model.ts`
- `src/modules/placements/hr-display-name-model.ts`
- `src/modules/placements/hr-display-name-service.ts`
- `src/modules/placements/hr-draft-compensation-review-model.ts`
- `src/modules/placements/hr-draft-preview-model.ts`
- `src/modules/placements/hr-draft-reset-model.ts`
- `src/modules/placements/hr-draft-round-duplicate-model.ts`
- `src/modules/placements/hr-draft-round-order-model.ts`
- `src/modules/placements/hr-drive-attention-model.ts`
- `src/modules/placements/hr-drive-conversation-model.ts`
- `src/modules/placements/hr-drive-conversation-service.ts`
- `src/modules/placements/hr-drive-draft-links.ts`
- `src/modules/placements/hr-drive-draft-model.ts`
- `src/modules/placements/hr-drive-messages-link-model.ts`
- `src/modules/placements/hr-drive-overview-model.ts`
- `src/modules/placements/hr-drive-proposal-attempt-model.ts`
- `src/modules/placements/hr-drive-proposal-export-model.ts`
- `src/modules/placements/hr-drive-proposal-history-links.ts`
- `src/modules/placements/hr-drive-proposal-history-model.ts`
- `src/modules/placements/hr-drive-proposal-history-service.ts`
- `src/modules/placements/hr-drive-proposal-links-model.ts`
- `src/modules/placements/hr-drive-proposal-model.ts`
- `src/modules/placements/hr-drive-proposal-response-model.ts`
- `src/modules/placements/hr-drive-round-presets.ts`
- `src/modules/placements/hr-drives-csv-model.ts`
- `src/modules/placements/hr-focused-review-model.ts`
- `src/modules/placements/hr-inbox-csv-model.ts`
- `src/modules/placements/hr-inline-round-results-model.ts`
- `src/modules/placements/hr-interview-slot-model.ts`
- `src/modules/placements/hr-interview-slot-service.ts`
- `src/modules/placements/hr-job-activity-model.ts`
- `src/modules/placements/hr-job-activity-service.ts`
- `src/modules/placements/hr-job-applicants-model.ts`
- `src/modules/placements/hr-job-read-service.ts`
- `src/modules/placements/hr-notification-groups-model.ts`
- `src/modules/placements/hr-notification-read-model.ts`
- `src/modules/placements/hr-notification-read-service.ts`
- `src/modules/placements/hr-notifications-model.ts`
- `src/modules/placements/hr-notifications-service.ts`
- `src/modules/placements/hr-offer-export-model.ts`
- `src/modules/placements/hr-offer-selection-read-model.ts`
- `src/modules/placements/hr-proposal-message-marker-model.ts`
- `src/modules/placements/hr-recruiter-bell-model.ts`
- `src/modules/placements/hr-recruiter-bell-service.ts`
- `src/modules/placements/hr-recruiter-grant-navigation-model.ts`
- `src/modules/placements/hr-recruiter-name-fields-model.ts`
- `src/modules/placements/hr-recruiter-open-change-counts-service.ts`
- `src/modules/placements/hr-report-page-signals-model.ts`
- `src/modules/placements/hr-result-deadline-urgency-model.ts`
- `src/modules/placements/hr-review-note-model.ts`
- `src/modules/placements/hr-round-editor-model.ts`
- `src/modules/placements/hr-round-editor-service.ts`
- `src/modules/placements/hr-round-schedule-model.ts`
- `src/modules/placements/hr-team-csv-model.ts`
- `src/modules/placements/hr-team-pagination-model.ts`
- `src/modules/placements/hr-team-roster-message-model.ts`
- `src/modules/placements/hr-team-search-model.ts`
- `src/modules/placements/hr-today-action-queue-model.ts`
- `src/modules/placements/hr-today-change-request-service.ts`
- `src/modules/placements/hr-today-conversation-model.ts`
- `src/modules/placements/hr-today-deeplink-model.ts`
- `src/modules/placements/hr-today-live-drive-model.ts`
- `src/modules/placements/hr-today-offer-actions-service.ts`
- `src/modules/placements/hr-today-open-slots-service.ts`
- `src/modules/placements/hr-today-results-due-model.ts`
- `src/modules/placements/hr-today-unread-model.ts`
- `src/modules/placements/hr-tpo-notification-service.ts`
- `src/modules/placements/hr-unsent-draft-storage-model.ts`
- `src/modules/placements/recruiter-access-defaults.ts`
- `src/modules/placements/recruiter-applicant-resume-service.ts`
- `src/modules/placements/recruiter-applicant-shared-links-model.ts`
- `src/modules/placements/recruiter-approved-draft-job-service.ts`
- `src/modules/placements/recruiter-bell-model.ts`
- `src/modules/placements/recruiter-board-view-model.ts`
- `src/modules/placements/recruiter-calendar-model.ts`
- `src/modules/placements/recruiter-calendar-service.ts`
- `src/modules/placements/recruiter-college-branch-service.ts`
- `src/modules/placements/recruiter-company-funnel-model.ts`
- `src/modules/placements/recruiter-company-overview-model.ts`
- `src/modules/placements/recruiter-company-reports-model.ts`
- `src/modules/placements/recruiter-company-reports-service.ts`
- `src/modules/placements/recruiter-company-team-service.ts`
- `src/modules/placements/recruiter-decision-notice-model.ts`
- `src/modules/placements/recruiter-decision-notice-service.ts`
- `src/modules/placements/recruiter-designation-model.ts`
- `src/modules/placements/recruiter-designation-service.ts`
- `src/modules/placements/recruiter-drive-autoapproval-policy.ts`
- `src/modules/placements/recruiter-drive-funnel-model.ts`
- `src/modules/placements/recruiter-drive-list-model.ts`
- `src/modules/placements/recruiter-drive-progress-model.ts`
- `src/modules/placements/recruiter-drive-request-model.ts`
- `src/modules/placements/recruiter-drive-request-service.ts`
- `src/modules/placements/recruiter-drive-search-service.ts`
- `src/modules/placements/recruiter-grant-expiry-policy.ts`
- `src/modules/placements/recruiter-grant-selection-model.ts`
- `src/modules/placements/recruiter-invite-alias-model.ts`
- `src/modules/placements/recruiter-invite-otp-accept-model.ts`
- `src/modules/placements/recruiter-invite-otp-accept-service.ts`
- `src/modules/placements/recruiter-invite-otp-policy.ts`
- `src/modules/placements/recruiter-invite-otp-send-model.ts`
- `src/modules/placements/recruiter-invite-otp-service.ts`
- `src/modules/placements/recruiter-invite-preview-disposition-model.ts`
- `src/modules/placements/recruiter-job-ownership.ts`
- `src/modules/placements/recruiter-job-visibility-model.ts`
- `src/modules/placements/recruiter-json-request.ts`
- `src/modules/placements/recruiter-message-email-dispatch-service.ts`
- `src/modules/placements/recruiter-message-email-inbound-service.ts`
- `src/modules/placements/recruiter-message-email-model.ts`
- `src/modules/placements/recruiter-message-email-provider.ts`
- `src/modules/placements/recruiter-message-tpo-notification-model.ts`
- `src/modules/placements/recruiter-message-tpo-notification-service.ts`
- `src/modules/placements/recruiter-own-company-policy.ts`
- `src/modules/placements/recruiter-page-copy.ts`
- `src/modules/placements/recruiter-portfolio-counts-service.ts`
- `src/modules/placements/recruiter-private-rating-service.ts`
- `src/modules/placements/recruiter-profile-details-model.ts`
- `src/modules/placements/recruiter-profile-details-service-client.ts`
- `src/modules/placements/recruiter-profile-details-service.ts`
- `src/modules/placements/recruiter-profile-service.ts`
- `src/modules/placements/recruiter-request-autoapproval-policy.ts`
- `src/modules/placements/recruiter-request-list-model.ts`
- `src/modules/placements/recruiter-round-results-read-model.ts`
- `src/modules/placements/recruiter-route-alias-model.ts`
- `src/modules/placements/recruiter-selection-list-model.ts`
- `src/modules/placements/recruiter-selection-staged-schema.ts`
- `src/modules/placements/recruiter-self-grants-model.ts`
- `src/modules/placements/recruiter-self-grants-service.ts`
- `src/modules/placements/recruiter-service.ts`
- `src/modules/placements/recruiter-shared-candidate-policy.ts`
- `src/modules/placements/recruiter-shell-navigation-model.ts`
- `src/modules/placements/recruiter-team-drive-count-service.ts`
- `src/modules/placements/recruiter-today-greeting-model.ts`
- `src/modules/placements/recruiter-today-model.ts`
- `src/modules/placements/recruiter-today-waiting-model.ts`
- `src/modules/placements/recruiter-today-week-events-model.ts`
- `src/modules/placements/recruiter-workspace-service.ts`

## Exported functions inventory batch 1 (12 files; 19 functions)

| Source | Exported function | Test closure |
|---|---|---|
| `src/modules/placements/hr-activity-csv-model.ts` | `buildHrActivityCsv` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-applicant-drawer-model.ts` | `buildHrApplicantDrawer` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-applicant-export-model.ts` | `buildHrApplicantCsv` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-calendar-category-model.ts` | `filterHrCalendarDays` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-calendar-day-model.ts` | `combineHrCalendarDays` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-calendar-day-model.ts` | `hrResultsDueHref` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-calendar-day-model.ts` | `selectHrMobileCalendarDays` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-calendar-export-model.ts` | `buildHrCalendarCsv` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-calendar-next-event-model.ts` | `hrNextCalendarEvent` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-company-report-export-model.ts` | `buildHrCompanyReportCsv` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-conversation-detail-links-model.ts` | `hrConversationDetailHref` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-conversation-detail-pagination-model.ts` | `hrConversationDetailPageWindow` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-conversation-inbox-model.ts` | `filterRecruiterConversations` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-conversation-inbox-model.ts` | `hrConversationPageBounds` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-conversation-inbox-model.ts` | `onlyUnreadRecruiterThreads` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-conversation-inbox-model.ts` | `orderRecruiterConversations` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-conversation-inbox-model.ts` | `scopeRecruiterConversations` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-conversation-inbox-model.ts` | `countScopedConversations` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-conversation-inbox-service.ts` | `listHrConversations` | **OPEN** — exact behavioural test and role matrix pending |

## Exported functions inventory offset 12 (16 files; 16 functions)

| Source | Exported function | Test closure |
|---|---|---|
| `src/modules/placements/hr-conversation-open-model.ts` | (no direct exported function detected) | Inspect schemas/types and re-exports |
| `src/modules/placements/hr-conversation-reply-model.ts` | (no direct exported function detected) | Inspect schemas/types and re-exports |
| `src/modules/placements/hr-conversation-return-url-model.ts` | `recruiterInboxReturnUrl` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-conversation-send-feedback-model.ts` | `hrReplySuccess` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-conversation-send-feedback-model.ts` | `hrReplyErrorMessage` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-conversation-snippet-model.ts` | `conversationSnippet` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-conversation-unread-model.ts` | `summarizeRecruiterUnread` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-conversation-urls-model.ts` | `hrConversationsHref` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-display-name-model.ts` | `normalizeHrDisplayName` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-display-name-model.ts` | `sameHrNameVersion` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-display-name-service.ts` | `updateOwnHrDisplayName` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-draft-compensation-review-model.ts` | `hrDraftCompensationWarnings` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-draft-preview-model.ts` | `hrDraftPreviewRounds` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-draft-reset-model.ts` | `hrDraftContainsWork` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-draft-round-duplicate-model.ts` | `duplicateHrDraftRound` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-draft-round-order-model.ts` | `reorderHrDraftRound` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-drive-attention-model.ts` | `hrDriveAttention` | **OPEN** — exact behavioural test and role matrix pending |
| `src/modules/placements/hr-drive-conversation-model.ts` | `recruiterDriveThreads` | **OPEN** — exact behavioural test and role matrix pending |
