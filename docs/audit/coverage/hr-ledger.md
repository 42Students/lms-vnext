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
| PROJ-BREAK-HR-01 | `requireProjectReadAccess`, `requireProjectLifecycleAccess` in `src/modules/projects/access.ts` | New `tests/unit/PROJ-BREAK-HR-01.test.ts`: recruiter hiring grant denied, TPO without member denied, wrong-college membership denied, inactive session/membership denied | Mocked service suite **not executed**; PostgreSQL membership/IDOR and HR view still **OPEN** |

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

## Exported functions inventory offset 28 (16 files; 21 functions)

| Source | Exported function | Test closure |
|---|---|---|
| `src/modules/placements/hr-drive-conversation-service.ts` | `getRecruiterDriveConversations` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-draft-links.ts` | `recruiterDriveDraftHref` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-draft-model.ts` | `emptyHrDriveDraft` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-draft-model.ts` | `hrDraftFromAuthorizedJob` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-draft-model.ts` | `hrDriveDraftQuerySchema` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-draft-model.ts` | `hrDriveDraftSchema` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-messages-link-model.ts` | `hrDriveMessagesHref` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-overview-model.ts` | `buildHrDriveOverview` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-proposal-attempt-model.ts` | `nextHrProposalAttempt` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-proposal-export-model.ts` | `hrDriveProposalHistoryCsv` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-proposal-history-links.ts` | `hrSentProposalHistoryHref` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-proposal-history-links.ts` | `hrSentProposalExportHref` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-proposal-history-model.ts` | `previewHrDriveProposalMessage` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-proposal-history-model.ts` | `hrProposalHistoryWindow` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-proposal-history-service.ts` | `listHrDriveProposals` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-proposal-links-model.ts` | `hrSentProposalsHref` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-proposal-model.ts` | `formatHrDriveProposal` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-proposal-response-model.ts` | `isHrDriveProposalResponse` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drive-round-presets.ts` | `applyHrRoundPreset` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-drives-csv-model.ts` | `buildHrDrivesCsv` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-focused-review-model.ts` | `focusedReviewNavigation` | **OPEN** — test and role matrix not verified |

## Exported functions inventory offset 44 (16 files; 31 functions)

| Source | Exported function | Test closure |
|---|---|---|
| `src/modules/placements/hr-inbox-csv-model.ts` | `buildHrInboxCsv` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-inline-round-results-model.ts` | `hrInlineRoundResultFilters` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-inline-round-results-model.ts` | `hrInlineRoundResultsHref` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-interview-slot-model.ts` | `slotTransitionAllowed` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-interview-slot-model.ts` | `slotsOverlap` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-interview-slot-model.ts` | `parseIstLocalSlot` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-interview-slot-model.ts` | `canRecruiterMutateOwnSlot` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-interview-slot-model.ts` | `hrInterviewSlotCreateSchema` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-interview-slot-service.ts` | `listHrInterviewSlots` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-interview-slot-service.ts` | `writeHrInterviewSlot` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-job-activity-model.ts` | `projectHrJobActivity` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-job-activity-model.ts` | `hrActivityEventFilter` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-job-activity-model.ts` | `hrActivityHasNext` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-job-activity-model.ts` | `searchHrActivityJobs` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-job-activity-service.ts` | `listRecruiterJobActivity` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-job-applicants-model.ts` | `projectSharedApplicants` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-job-applicants-model.ts` | `hrApplicantPageBounds` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-job-applicants-model.ts` | `hrOfferPageBounds` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-job-applicants-model.ts` | `hrApplicantFilterSchema` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-job-read-service.ts` | `getHrJobRead` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-notification-groups-model.ts` | `groupHrNotificationPage` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-notification-read-model.ts` | `hrNotificationVersionMatches` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-notification-read-service.ts` | `markHrNotificationRead` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-notifications-model.ts` | `projectHrNotifications` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-notifications-model.ts` | `hrInboxPageBounds` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-notifications-model.ts` | `filterHrNotificationJobs` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-notifications-service.ts` | `listHrNotifications` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-offer-export-model.ts` | `buildHrOfferCsv` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-offer-selection-read-model.ts` | `buildHrOfferOverview` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-offer-selection-read-model.ts` | `hrSelectionReadyApplicationIds` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-proposal-message-marker-model.ts` | `recruiterProposalMessageMarker` | **OPEN** — test and role matrix not verified |

## Exported functions inventory offset 60 (16 files; 26 functions)

| Source | Exported function | Test closure |
|---|---|---|
| `src/modules/placements/hr-recruiter-bell-model.ts` | `relativeHrBellTime` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-recruiter-bell-model.ts` | `createHrBellMutationGate` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-recruiter-bell-service.ts` | `readHrRecruiterBell` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-recruiter-bell-service.ts` | `markHrRecruiterBellRead` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-recruiter-grant-navigation-model.ts` | `hrRecruiterGrantLinks` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-recruiter-name-fields-model.ts` | `splitHrRecruiterName` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-recruiter-name-fields-model.ts` | `joinHrRecruiterName` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-recruiter-name-fields-model.ts` | `sameHrNameVersion` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-recruiter-name-fields-model.ts` | `hrRecruiterNameFieldsSchema` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-recruiter-open-change-counts-service.ts` | `countRecruiterAnswerableDriveRequests` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-report-page-signals-model.ts` | `hrCompanyReportPageSignals` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-result-deadline-urgency-model.ts` | `hrResultDeadlineUrgency` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-review-note-model.ts` | (no direct function export) | Review schemas/re-exports |
| `src/modules/placements/hr-round-editor-model.ts` | `canRecruiterEditRound` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-round-editor-model.ts` | `duplicateRecruiterRoundName` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-round-editor-model.ts` | `matchesRecruiterRoundVersion` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-round-editor-model.ts` | `hrRoundFormSchema` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-round-editor-service.ts` | `editHrJobRound` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-round-editor-service.ts` | `listHrRoundEditorRows` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-round-schedule-model.ts` | `hrScheduledRoundRows` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-round-schedule-model.ts` | `hrRoundConflictLabels` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-round-schedule-model.ts` | `hrRoundConflictLinks` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-team-csv-model.ts` | `buildHrTeamCsv` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-team-pagination-model.ts` | `hrTeamPage` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-team-roster-message-model.ts` | `hrTeamRosterMessage` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-team-search-model.ts` | `searchHrTeam` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-today-action-queue-model.ts` | `buildRecruiterActionQueue` | **OPEN** — test and role matrix not verified |

## Exported functions inventory offset 76 (16 files; 21 functions)

| Source | Exported function | Test closure |
|---|---|---|
| `src/modules/placements/hr-today-change-request-service.ts` | `listRecruiterTodayChangeRequests` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-today-conversation-model.ts` | `hrTodayConversationSignals` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-today-deeplink-model.ts` | `recruiterTodayHref` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-today-live-drive-model.ts` | `hrTodayLiveDriveRows` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-today-offer-actions-service.ts` | `listRecruiterTodayOfferActions` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-today-open-slots-service.ts` | `listRecruiterTodayRoundsNeedingSlots` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-today-results-due-model.ts` | `projectHrTodayResultsDue` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-today-unread-model.ts` | `hrTodayUnreadAction` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-tpo-notification-service.ts` | `notifyTpoOfRecruiterAction` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-unsent-draft-storage-model.ts` | `hrDriveSessionStorageKey` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-unsent-draft-storage-model.ts` | `saveHrUnsentDraft` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/hr-unsent-draft-storage-model.ts` | `restoreHrUnsentDraft` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-access-defaults.ts` | `recruiterAccessMonthsOrDefault` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-applicant-resume-service.ts` | `grantRecruiterSharedResume` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-applicant-shared-links-model.ts` | `safeRecruiterExternalLink` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-applicant-shared-links-model.ts` | `projectRecruiterProfileLinks` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-approved-draft-job-service.ts` | `createRecruiterApprovedDraftJob` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-bell-model.ts` | `recruiterBellAriaLabel` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-bell-model.ts` | `recruiterBellPreview` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-board-view-model.ts` | `recruiterBoardColumn` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-board-view-model.ts` | `shouldRenderCompaniesView` | **OPEN** — test and role matrix not verified |

## Exported functions inventory offset 92 (16 files; 30 functions)

| Source | Exported function | Test closure |
|---|---|---|
| `src/modules/placements/recruiter-calendar-model.ts` | `buildRecruiterCalendarEvents` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-calendar-model.ts` | `buildRecruiterResultsDueItems` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-calendar-service.ts` | `listRecruiterCalendarEvents` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-calendar-service.ts` | `recruiterCalendarQuerySchema` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-college-branch-service.ts` | `listRecruiterCollegeBranches` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-company-funnel-model.ts` | `buildRecruiterReportFunnel` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-company-overview-model.ts` | `buildRecruiterCompanyOverview` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-company-reports-model.ts` | `buildRecruiterCompanyReportRows` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-company-reports-model.ts` | `summarizeRecruiterReportPortfolio` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-company-reports-model.ts` | `recruiterCompanyReportsHref` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-company-reports-service.ts` | `getRecruiterCompanyReports` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-company-team-service.ts` | `resolveRecruiterCompanyScope` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-company-team-service.ts` | `getRecruiterCompanyTeam` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-decision-notice-model.ts` | `recruiterDecisionNoticeRows` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-decision-notice-service.ts` | `listOwnRecruiterDecisionNotices` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-designation-model.ts` | `normalizeRecruiterDesignation` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-designation-model.ts` | `sameRecruiterProfileVersion` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-designation-service.ts` | `updateOwnRecruiterDesignation` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-autoapproval-policy.ts` | `trustedRecruiterDomain` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-autoapproval-policy.ts` | `recruiterDriveApprovalPolicy` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-funnel-model.ts` | `recruiterVisibleDriveFunnel` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-list-model.ts` | `summarizeRecruiterDrives` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-list-model.ts` | `isHrDriveDeadlineToday` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-list-model.ts` | `filterRecruiterDrives` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-list-model.ts` | `recruiterDrivesHref` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-list-model.ts` | `paginateRecruiterDrives` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-list-model.ts` | `sortRecruiterDrives` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-list-model.ts` | `recruiterDriveListQuerySchema` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-progress-model.ts` | `recruiterDriveProgressSteps` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-progress-model.ts` | `recruiterDriveNextAction` | **OPEN** — test and role matrix not verified |

## Exported functions inventory offset 108 (16 files; 29 functions)

| Source | Exported function | Test closure |
|---|---|---|
| `src/modules/placements/recruiter-drive-request-model.ts` | `initialRecruiterRequestStatus` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-request-model.ts` | `canRecruiterResubmit` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-request-model.ts` | `recruiterRequestStage` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-request-model.ts` | `recruiterRequestLegacyLabel` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-request-service.ts` | `createOwnRecruiterDriveRequest` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-request-service.ts` | `listOwnRecruiterDriveRequests` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-request-service.ts` | `updateOwnRecruiterDriveRequest` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-drive-search-service.ts` | `searchOwnRecruiterDrives` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-grant-expiry-policy.ts` | `recruiterGrantValidUntil` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-grant-expiry-policy.ts` | `recruiterGrantEffectiveAt` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-grant-selection-model.ts` | `findRecruiterScopedGrant` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-invite-alias-model.ts` | `recruiterInviteHref` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-invite-otp-accept-model.ts` | `recruiterInviteAcceptReady` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-invite-otp-accept-model.ts` | `recruiterInviteAcceptanceBodySchema` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-invite-otp-accept-service.ts` | `acceptTpoRecruiterInviteOtp` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-invite-otp-policy.ts` | `recruiterOtpSendAllowed` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-invite-otp-policy.ts` | `createRecruiterInviteOtp` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-invite-otp-policy.ts` | `recruiterOtpDigest` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-invite-otp-policy.ts` | `recruiterOtpMatches` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-invite-otp-policy.ts` | `recruiterOtpUsable` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-invite-otp-policy.ts` | `recruiterOtpAttemptDecision` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-invite-otp-send-model.ts` | `recruiterOtpRequestResult` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-invite-otp-service.ts` | `requestRecruiterInviteOtp` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-invite-preview-disposition-model.ts` | `recruiterInvitePreviewDisposition` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-job-ownership.ts` | `recruiterOwnJobPredicate` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-job-ownership.ts` | `recruiterOwnJobExists` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-job-visibility-model.ts` | `isRecruiterJobVisible` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-json-request.ts` | `readRecruiterJsonBody` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-email-dispatch-service.ts` | `dispatchRecruiterUnreadMessageDigests` | **OPEN** — test and role matrix not verified |

## Exported functions inventory offset 124 (16 files; 31 functions)

| Source | Exported function | Test closure |
|---|---|---|
| `src/modules/placements/recruiter-message-email-inbound-service.ts` | `acceptAuthenticatedRecruiterEmailReply` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-email-model.ts` | `isRecruiterUnreadReminderDue` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-email-model.ts` | `safeRecruiterEmailMergeText` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-email-model.ts` | `safeRecruiterDigestMessages` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-email-model.ts` | `recruiterReplyTokenForThread` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-email-model.ts` | `makeRecruiterReplyAddress` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-email-model.ts` | `isRecruiterReplyAddress` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-email-model.ts` | `recruiterMailBridgeSignature` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-email-model.ts` | `verifyRecruiterMailBridgeSignature` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-email-model.ts` | `extractRecruiterEmailReply` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-email-provider.ts` | `sendRecruiterMessageDigest` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-tpo-notification-model.ts` | `recruiterMessageTpoRecipients` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-tpo-notification-model.ts` | `recruiterMessageTpoHref` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-tpo-notification-model.ts` | `recruiterMessageTpoPreview` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-message-tpo-notification-service.ts` | `notifyTpoOfRecruiterMessage` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-own-company-policy.ts` | `isExactRecruiterEmployerRow` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-page-copy.ts` | (no direct function export) | Review schemas/re-exports |
| `src/modules/placements/recruiter-portfolio-counts-service.ts` | `recruiterVisiblePortfolioCounts` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-private-rating-service.ts` | `readRecruiterPrivateReview` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-private-rating-service.ts` | `writeRecruiterPrivateReview` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-profile-details-model.ts` | `hrProfileSaveErrorFeedback` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-profile-details-model.ts` | `recruiterProfileDetailsPatchSchema` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-profile-details-service-client.ts` | `recruiterMobileNumberValid` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-profile-details-service.ts` | `updateOwnRecruiterProfileDetails` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-profile-service.ts` | `ownRecruiterGrant` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-profile-service.ts` | `getRecruiterSelfProfile` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-profile-service.ts` | `leaveOwnRecruiterCollegeAccess` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-request-autoapproval-policy.ts` | `recruiterAutoApprovalReason` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-request-list-model.ts` | `requestStageLabel` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-request-list-model.ts` | `filterOwnRecruiterRequests` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-round-results-read-model.ts` | `projectRecruiterRoundResults` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-round-results-read-model.ts` | `recruiterResultTableHref` | **OPEN** — test and role matrix not verified |

## Exported functions inventory offset 140 (14 files; 21 functions)

| Source | Exported function | Test closure |
|---|---|---|
| `src/modules/placements/recruiter-route-alias-model.ts` | `recruiterDriveDetailHref` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-selection-list-model.ts` | `recruiterSelectionRangeWarning` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-selection-list-model.ts` | `recruiterSelectionListInputSchema` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-selection-staged-schema.ts` | `stagedRecruiterSelectionItems` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-self-grants-model.ts` | `buildRecruiterSelfGrantRows` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-self-grants-service.ts` | `getRecruiterSelfGrantOverview` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-service.ts` | `listPlacementRecruiterGrants` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-service.ts` | `grantPlacementRecruiter` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-service.ts` | `revokePlacementRecruiterGrant` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-service.ts` | `listOwnRecruiterPlacementJobs` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-shared-candidate-policy.ts` | `isRecruiterSharedCandidateAllowed` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-shell-navigation-model.ts` | `recruiterLegacyMobileNavigation` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-shell-navigation-model.ts` | `recruiterLegacyHeaderCollege` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-team-drive-count-service.ts` | `recruiterTeamAttributedDriveCounts` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-today-greeting-model.ts` | `recruiterTodayGreeting` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-today-model.ts` | `recruiterTodayWeek` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-today-model.ts` | `recruiterTodayEightDayWindow` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-today-model.ts` | `buildRecruiterToday` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-today-waiting-model.ts` | `recruiterTodayWaitingRequests` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-today-week-events-model.ts` | `recruiterTodayWeekEvents` | **OPEN** — test and role matrix not verified |
| `src/modules/placements/recruiter-workspace-service.ts` | `getRecruiterPlacementWorkspace` | **OPEN** — test and role matrix not verified |


## 2026-10-18 chat-15 additional executable-contract evidence (not CI-certified)

| Gap / function or route | Test file / named assertions | Cases authored | Remaining required acceptance |
|---|---|---|---|
| HR-SLOT-ACTOR-01 / `canRecruiterMutateOwnSlot` | `tests/unit/hr-interview-slot-model.test.ts` / `HR-SLOT-ACTOR-01` | Exact same owner allowed; empty/whitespace/mismatched owners denied | Database-side role, membership revocation and real HTTP denial |
| HR-SLOT-STATE-02 / `slotTransitionAllowed` | `tests/unit/hr-interview-slot-model.test.ts` / `HR-SLOT-STATE-02` | All disallowed terminal transitions; capacity exhausted; invalid booked counts; allowed OFFER/BOOK/CANCEL stages | Concurrent capacity limit enforced in PostgreSQL transaction |
| HR-ROUND-INPUT-01 / `editHrJobRound` validation | `tests/unit/HR-BREAK-chat15-round-service-03.test.ts` / `HR-ROUND-INPUT-01` | Malformed UUID, forbidden mutation keys, invalid action/version rejected before DB | API size and same-origin request tests; HTTP error recovery |
| HR-ROUND-CREATE-01, HR-ROUND-CREATE-02 / `editHrJobRound` | same test / `HR-ROUND-CREATE-01`, `HR-ROUND-CREATE-02` | Transactional create emits one event and notification; canonical duplicate and 12-stage cap reject writes | Real SQL uniqueness/parallel insertion, event rollback on notification failure |
| HR-ROUND-REMOVE-01, HR-ROUND-REMOVE-02 / `editHrJobRound` | same test / `HR-ROUND-REMOVE-01`, `HR-ROUND-REMOVE-02` | Own PENDING round can cancel; existing result/slot blocks cancellation | Concurrent results arrival, SQL CAS and audit persistence in PostgreSQL |
| HR-BREAK-profile-01 / `isExactRecruiterEmployerRow` | `tests/unit/HR-BREAK-profile-01.test.ts` / identical college ID relationship mismatch case | Fixture now statically typed to the complete `RecruiterContext.grants` shape; preserves multi-college denial checks | CI test-typecheck and revoked grant / relationship database query |

The previously recorded 154-file inventory is not exhaustive behavioural certification; **OPEN** rows stay open until full role-state/tenancy/transactional assertions and CI execution are reviewed. Branch updates are not evidence of a production deploy.

## IIT Dharwad Projects HR-view role boundary (2026-10-18)

| Risk | Evidence | State |
|---|---|---|
| PROJ-BREAK-HR-ORG-02: identical college ID with foreign organization | `requireProjectReadAccess` checks membership college **and** membership organization against authoritative project-college scope before project-member lookup. `tests/unit/PROJ-BREAK-HR-01.test.ts` rejects a forged organization context and checks no project membership SELECT or module access. | SOURCE FIX + TEST AUTHORED, not executed |
| HR/recruiter hiring grant without project membership | `PROJ-BREAK-HR-01` tests no college member, wrong tenant, suspended membership, revoked/inactive recruiter context, and lifecycle denial. | TEST AUTHORED; real database ownership and expired-session checks OPEN |

No HR/Recruiter account obtains Projects access merely through employer/drive grants. Actual PostgreSQL member rows, role revocation and parallel session tests are still required for the IIT Dharwad acceptance gate.


## HR interview-slot service adverse matrix (2026-10-18)

| Gap or service behavior | Authored test | Verified in CI? | Remaining work |
|---|---|---|---|
| HR-SLOT-SCOPE-01/02 revoked recruiter, missing job, denied write role | `tests/unit/HR-BREAK-chat15-interview-slots-03.test.ts` mocked transaction rejects before slot access/side effects | No | Live cross-company and wrong college SQL fixtures |
| HR-SLOT-VERSION-01/ACTOR-02 stale tab and wrong creator | Same test requires no update/no TPO notification | No | Parallel locked row races in PostgreSQL |
| HR-SLOT-STATE-03/04 valid OFFER and capacity/terminal/past enforcement | Same test verifies exactly one TPO action, no writes on invalid stage | No | Real capacity with two simultaneous bookers, rollback behavior |
| HR-SLOT-INPUT-01 strict tenant/action/version input | Same test requires rejection before transaction | No | HTTP 400/403/409 state and same-origin behavior on real requests |

| HR-SLOT-READ-01/02 / `listHrInterviewSlots` | `tests/unit/HR-BREAK-chat15-interview-slots-03.test.ts`: returns own editable slot, marks another creator's slot read-only; revocation denies before private row read, no side effects | No | Real revocation mid-session, database wrong-college row and alternate account browser flow |


## Continuation, HR roles, read journeys and page states (2026-10-18)

| ID | Executable evidence added | Still open |
|---|---|---|
| HR-TENANT-ID-04 | `HR-BREAK-chat15-tenant-identity-04.test.ts`: empty/whitespace employer IDs, college IDs, relationship IDs denied for candidate projection, employer-job match, grant selection, and live permission gating | Real database invalid-grant defense, revoked session, runtime response privacy |
| HR-ROUND-LIST-05 | `HR-BREAK-chat15-round-list-05.test.ts`: invalid job id, disabled recruiter, empty authorized job, denied manage permission, canceled rounds filtered, another author's round read-only, attached result/slot locks edits | Concurrent live PostgreSQL grants/round mutation, rollback |
| UX-HR-PAGES-07 | `UX-chat15-hr-tracker-pages-07.test.ts`: 8 recruiter page role guards, invalid-filter recovery, HR/recruiter alias parity, tracker outage/error/empty/active-role behavior | Browser 320px, inaccessible focus flow, SSR runtime and expired cookie |
| UX-TRACKER-ERROR-06 | Source update of `src/app/(authenticated)/tracker/page.tsx` removes operator-only migration and environment names; same UX test checks friendly unavailable copy and suppressed admin-only known-error ID | Manual outage browser run |

The stale CI snapshot in `docs/orchestrator/unit-failures-latest.md` lists `chat15-missed-quiz-release.test.ts` and `learner-assessment-state-filter-model.test.ts`. Their current content has already been corrected to exercise deadline-gated release semantics, and `HR-BREAK-chat15-round-service-03.test.ts` no longer uses a self-referential tx argument. Do not mark those green without a new CI run; keep current assertions intact.


## HR request mutation and calendar authorization (2026-10-18, authored/not executed)

| Coverage ID | Authored behavior evidence | Remaining acceptance |
|---|---|---|
| HR-REQUEST-CANCEL-INTEGRITY-07 | `recruiterRequestUpdateSchema` rejects CANCEL with any draft (prevents historical terms overwrite) and requires validated draft on EDIT and RESUBMIT. `HR-BREAK-chat15-request-cancel-integrity-07.test.ts` checks all three paths, stale/foreign IDs and parse-before-transaction order | End-to-end HTTP 409/400, concurrent cancellation and request audit history in PostgreSQL |
| HR-CALENDAR-SCOPE-08 | `HR-BREAK-chat15-calendar-08.test.ts` validates one-day 00:00 through 23:59 IST, foreign job and slot exclusion, calendar query 366-day bound, no SQL when no authorized jobs | Real PostgreSQL slot/round calendar role matrix, event/CSV equality, 320px and keyboard UX |


## HR account service coverage continued — 2026-10-18 (CI pending)

| Requirement | Authored test and real assertions | Remaining |
|---|---|---|
| HR-NOTIFY-SCOPE-09 | `HR-BREAK-chat15-notifications-09.test.ts`: inactive/revoked recruiter denied before DB; no grants yields NO_ACCESS; multi-college requires explicit choice; unauthorized subject and non-job notifications removed; invalid/foreign query blocked | PostgreSQL event/audience, notifications from concurrent employer changes and browser fetch |
| HR-CONVERSATIONS-SCOPE-10 | `HR-BREAK-chat15-conversations-10.test.ts`: inactive account, foreign tenant, malformed query denied before messaging; multi-grant choice; foreign recruiter/college/unowned drive thread invisible; unread, general/drive, search and stable order | Real database unread update, concurrent replies and last-message race |
| HR-APPLICANTS-EXPORT-11 | `HR-BREAK-chat15-applicant-export-11.test.ts`: formula injection and CRLF controls escaped; IST midnight; contacts, resume/skills/roll/branch excluded; 200 row cap with notice, withdrew vs submitted separation, bounded query and pagination | Direct HTTP download vs screen equality, revoked grant export denial, real CSV spreadsheet validation |


## HR jobs and offer boundary — source-level test expansion (CI pending)

| Requirement | New evidence | Remaining acceptance |
|---|---|---|
| HR-DRIVES-FILTER-12 | `tests/unit/HR-BREAK-chat15-drives-12.test.ts` validates authorized-scope portfolio filters, published vs closed vs waiting, excludes archived and unpublished jobs, IST deadline at 23:59:59.999 and following midnight, bounded 20-row pagination and deterministic title sort | Real DB authorized relationship changes and cursor/page consistency, page UX |
| HR-ROLE-MATRIX-13 | `tests/unit/HR-BREAK-chat15-role-matrix-13.test.ts` directly exercises `can()` for recruiter own company relationship, wrong college/relationship, TPO placement management vs recruiter-only writes, college-admin, HR membership, deactivated actor, revoked membership, scoped Super Admin and forbidden recruiter impersonation | Live PostgreSQL grants and role changes mid-request, API 401/403/404 uniformity |

All new checks are **authored but not executed** by this lane. Previously reported failures from `unit-failures-latest.md` and test-only TypeScript error snapshot are older than their source/test corrections; they still require fresh CI evidence before marking green. Continue outstanding HR jobs, offers, applicant export and messaging DB scenarios, plus 47-page interactive browser matrix.

| HR-OFFERS-STATE-14 | `tests/unit/HR-BREAK-chat15-offer-states-14.test.ts` checks persisted ISSUED/ACCEPTED/WITHDRAWN states and precise expiration, completed/APPLIED/PASS intersection across evaluative rounds, forged selection payloads, encoded round-result views | PostgreSQL offer issuance/revocation races, TPO verification release, mobile/keyboard and audit recipient counts remain unverified |


## Additional account page and selection coverage (tests not executed)

| Requirement | New ID-named evidence | Remaining acceptance |
|---|---|---|
| UX-HR-TRACKER-15 | `tests/unit/UX-chat15-hr-tracker-pages-15.test.ts`: additional HR activity/round-results/company-reports page role gates, invalid-filter and selector recovery, tracker Super Admin issue detail, logs/global-scope, findings, reporter details and distinct operational retry failures | Browser render/navigation, small-screen focus and live authorization on each route |
| HR-ROUND-RESULTS-15 | `tests/unit/HR-BREAK-chat15-round-results-15.test.ts`: selected-round-only participant projection, anonymized unnamed learners, one-per-outcome counts, invalid job/round/query denied, encoded deep links | PostgreSQL staging vs APPLIED release authorizations, cross-college/expired grant HTTP |

**State:** Coverage inventory is broader, but many exported functions and routes still need independent service-level behaviour, real PostgreSQL tenancy/concurrency, and interactive page checks. This ledger remains OPEN, not release-certified.

| HR-TENANT-ID-16 | `tests/unit/HR-BREAK-chat15-tenant-identity-04.test.ts`: mismatched recruiter grant/session user and null employer denied even when mocked permission returns true; matching active user remains allowed. | Real multi-user revoked session and persistent employer mismatches require DB integration and CI. |

| HR-ACCOUNT-OWNER-17 | `src/modules/placements/hr-conversation-inbox-service.ts` and `hr-notifications-service.ts` fail closed when `context.recruiter.userId` differs from `context.user.id`, before listing any thread or notification. `HR-BREAK-chat15-conversations-10.test.ts` and `HR-BREAK-chat15-notifications-09.test.ts` include swapped user context and no SQL side effects. | PostgreSQL actor swap, renewed-session and account revocation tests; CI pending. |

| HR-WORKSPACE-CONTACT-18 | `src/modules/placements/recruiter-workspace-service.ts` uses authoritative `placementCompanyRelationships.shareColumnDefaults` and `recruiterSharedRoundParticipantEmail` to mask participant email unless explicitly shared. `tests/unit/HR-BREAK-chat15-workspace-contact-18.test.ts` covers denied missing/other column and authorized `email`, while preserving recruiter/job/college and shortlist checks. | Real tenancy PostgreSQL fixture with share-column toggles; legacy wording and browser results verify; CI not executed. |

| HR-WORKSPACE-ARCHIVE-19 | `getRecruiterPlacementWorkspace` rejects archived published/closed jobs before granting candidate/round read. `tests/unit/HR-BREAK-chat15-workspace-archive-19.test.ts`: deny archived, draft and nonexistent jobs; preserve not-archived visibility checks. | PostgreSQL archived rows, read-only role workflow and URL-level acceptance pending. |

| HR-GRANT-OWNER-20 | `src/modules/permissions/policy.ts`: all six `placements.recruiter.*` grants must be owned by current session user and have nonblank college and relationship scope. `tests/unit/HR-BREAK-chat15-role-matrix-13.test.ts` verifies matching grant succeeds; swapped recruiter user ID and blank college/relationship fail across all capabilities. | CI typecheck, revoked live grant, member/session race and PostgreSQL permission checks remain pending. |

| HR-WORKSPACE-RELATION-21 | `recruiter-workspace-service.ts` enforces active company, college, relationship in the scoped SQL in addition to authorized recruiter grant. `HR-BREAK-chat15-workspace-contact-18.test.ts` asserts the guards and existing participant masking. | Real PostgreSQL archived-company, college and relationship cases pending; CI not run. |
| HR-CALENDAR-EXPORT-22 | `tests/unit/HR-BREAK-chat15-calendar-export-22.test.ts` asserts round, interview slot, application deadline and results-due category isolation, IST cross-midnight formatting, CSV formula neutralization, quote escaping and capped 200-row export with omitted-row notice. | Actual HTTP export role/tenant checks, spreadsheet open and browser download not executed. |

| HR-REQUEST-ROUTE-23 | `tests/unit/HR-BREAK-chat15-drive-request-route-23.test.ts` exercises live Next.js GET/POST/PATCH handlers with mock services: cross-origin POST/PATCH reject before auth/body, GET validates scoped UUID, POST returns 201 vs replay 200, PATCH uses update only, malformed body 400, oversized body 413, forbidden/not found/stale status mapping. | CI not run; database transaction replay and 128 KiB streamed payload with real HTTP required. |
| HR-PORTFOLIO-OWNER-24 | `recruiter-service.ts:listOwnRecruiterPlacementJobs` now rejects mismatched embedded recruiter user before SQL. `HR-BREAK-chat15-portfolio-owner-24.test.ts` covers cross-user grant, disabled user, missing recruiter, ungranted college, zero grants and empty scoped job list without DB access. | Database active grant expiry races and actual role-change HTTP behavior pending. |

| HR-ROUND-SLOT-ROUTE-25 | `tests/unit/HR-BREAK-chat15-round-slot-route-25.test.ts` exercises actual recruiter round/slot POST handlers: cross-origin 403 before session/body, malformed round 400, successful round/slot 303 first-party redirects, used/stale round 409, overfull interview slot 409 and invalid IST datetime 400 before mutation. | Cloud CI not executed; full expired-cookie, actual PostgreSQL CAS and concurrent room/slot collisions remain to verify. |

| HR-ROUND-ARCHIVE-26 | `src/modules/placements/hr-round-editor-service.ts` rejects archived jobs for both round list and write paths at SQL lookup; `HR-BREAK-chat15-round-archive-26.test.ts` verifies the non-archived predicate in both operations, creator-only mutation, existing-result and slot locks, and required version token. | PostgreSQL archived-PUBLISHED fixture and direct URL route 404/409 confirmation remain pending. |

| HR-SLOT-ARCHIVE-27 | Shared `verifyRecruiterSlotJob` now requires published/non-archived job, active company/college and relationship, active recruiter profile and grant. `tests/unit/HR-BREAK-chat15-interview-slots-03.test.ts` checks these SQL conditions are present and list/mutate paths both use common guard. | PostgreSQL archived published drive read/write, disabled company and college, simultaneous booking + revocation pending. |

| HR-ACTIVITY-OWNER-28 | `src/modules/placements/hr-job-activity-service.ts` checks exact authenticated recruiter identity before using college grant choices or querying any job activity. `tests/unit/HR-BREAK-chat15-activity-owner-28.test.ts` covers swapped users, no recruiter, disabled user, explicit college selection, no SQL for unowned jobs, and exclusion of foreign/private job events. | Real PostgreSQL grant revocation, activity export download privacy and UI recovery states remain outstanding; tests authored, not executed. |

| HR-PORTFOLIO-SCOPE-29 | S1 data isolation | `recruiterVisiblePortfolioCounts` used caller-provided job IDs plus ownership predicate but omitted persisted `placementJobs.collegeId` / `companyRelationshipId` constraints in its applicant and offer count queries. A stale/cross-tenant job ID could request aggregate data for an unintended relationship. Both SQL branches now require the authorized college and one of the recruiter's exact relationships, active job and non-archived state, plus active employer/college/relationship joins and an exact session owner. | `1756eaa3`, `85b7f0c2` | `tests/unit/HR-BREAK-chat15-portfolio-scope-29.test.ts` checks no SQL for swapped users or wrong college and confirms both persisted ownership clauses; CI and PostgreSQL adversarial fixtures pending. |

| HR-TEAM-OWNER-30 | `resolveRecruiterCompanyScope` requires exact session owner before listing any employer-college choices; regression assertions in `tests/unit/recruiter-company-team-scope.test.ts` cover borrowed recruiter IDs and valid owner access. | Real multi-college cross-account test pending. |
| HR-REPORT-ARCHIVE-31 | `recruiter-company-reports-service.ts` uses `archivedAt IS NULL` for total, status summary, selected jobs and per-job counts; its SQL funnel already excluded archives. `tests/unit/HR-BREAK-chat15-company-report-archive-31.test.ts` verifies consistent scoping and no orphaned counts. | Database counts with archived jobs and real UI pagination pending. |
| HR-TEAM-REVOKE-32 | `getRecruiterCompanyTeam` now rechecks persisted ACTIVE acting recruiter profile, ACTIVE recruiter-college grant, ACTIVE user status and employer relationship before querying contacts. Existing `tests/unit/recruiter-company-team-scope.test.ts` extended with revoked-role scope and source-level SQL evidence. | Multi-session PostgreSQL grant revocation and 401/403 browser response verification pending. |
