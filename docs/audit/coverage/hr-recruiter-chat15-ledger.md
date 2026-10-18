# HR / Recruiter coverage ledger · chat-15

Partial inventory of high-risk pure functions completed in this round. NOT an assertion of exhaustive module coverage. Full module includes hundreds of exported functions, UI pages and HTTP route handlers requiring ledger rows and actual PostgreSQL integration.

| Function | Test | Cases covered | Missing evidence |
|---|---|---|---|
| hrRoundFormSchema | tests/unit/hr-recruiter-exhaustive-chat15-01.test.ts | allowed create/update/remove, name limits, mode, kind, optimistic token, forbidden fields, invalid size | real route/database |
| canRecruiterEditRound | same | author, wrong author, pending/nonpending, result/slot immutability | server enforcement |
| duplicateRecruiterRoundName | same | Unicode, whitespace, self-exclusion and cancelled records | database race |
| isHrDriveProposalResponse | same | valid response, UUID validation, replay shape, false positives | client save/retry |
| summarizeRecruiterUnread | same | empty, negative and multiple threads | receipts transaction |
| trustedRecruiterDomain | same | exact company/trusted domain and unsafe suffix/subdomains | verified grant integration |
| recruiterDriveApprovalPolicy | same | unverified grant, disabled approval, trusted relationship, mandatory review | request state machine |
| recruiterGrantValidUntil | same | leap-day month clamp and duration bounds | clock integration |
| recruiterGrantEffectiveAt | same | valid, revoked, pending, missing/expired, wrong capability | tenant/college permission matrix |

Additional model functions covered by tests/unit/hr-recruiter-exhaustive-chat15-02.test.ts:

| Function(s) | Cases |
|---|---|
| hrInterviewSlotCreateSchema, hrInterviewSlotActionSchema, slotTransitionAllowed | Valid input, malformed dates, invalid zones/modes/IDs, 8-hour limit, slot capacity, double-booking and forbidden transitions |
| slotsOverlap, parseIstLocalSlot, canRecruiterMutateOwnSlot | Half-open overlap, invalid persisted intervals, impossible IST date, ownership |
| hrScheduledRoundRows, hrRoundConflictLabels, hrRoundConflictLinks | Filter, ordering, conflicts, labels, authorized deep-link construction |
| hrNextCalendarEvent, hrResultDeadlineUrgency | Future-only category filters, boundary time |
| groupHrNotificationPage, buildHrOfferCsv | Group unread, limit 200, formula injection, masking |
| hrRecruiterReplySchema, recruiterReviewNoteSchema, hrTeamSearchSchema, searchHrTeam | Validation limits, strict keys, ratings, search matching |
| nextHrProposalAttempt, reorderHrDraftRound, duplicateHrDraftRound, hrDraftContainsWork | Idempotent proposal key, immutable ordering, duplicate limits, draft changes |

Route entrypoint supplement (source guard coverage, not full database integration):

| Route handlers | Test | Cases | Missing |
|---|---|---|---|
| /api/placements/recruiter/drives/requests GET/POST/PATCH; drives/proposal POST | hr-recruiter-route-security-chat15-01.test.ts; hr-recruiter-json-request-chat15-01.test.ts | same-origin mutations, scoped context, request body 128KiB cap, bad JSON 400, overlimit 413, idempotent replay status, GET read-only | live permissions/DB concurrency and side-effects |
| /api/placements/recruiter/drives/[jobId]/interview-slots POST and rounds POST | hr-recruiter-route-security-chat15-01.test.ts | same-origin/source guard | PostgreSQL role/state transitions |
| /api/placements/recruiter/conversations/[threadId]/reply POST, open POST, acknowledge POST | hr-recruiter-route-security-chat15-01.test.ts | same-origin/source guard | per-recipient grants, side-effect and replay |
| /api/placements/recruiter/notifications/[notificationId]/read POST | hr-recruiter-route-security-chat15-01.test.ts; hr-recruiter-json-request-chat15-01.test.ts | source guard, bounded JSON, friendly invalid input | receipt/tenant integration |
| /api/placements/recruiter/profile/details PATCH, profile PATCH | hr-recruiter-route-security-chat15-01.test.ts; hr-recruiter-json-request-chat15-01.test.ts | same-origin/source guard, bounded JSON | actual DB updates and role matrix |

Not yet covered: all unlisted exported functions and handlers, unauthenticated/wrong-role/other-college integration cases, same-origin and body limit guards, rollback, audit/activity/notification effects, idempotency and duplicate concurrent requests. The user-requested full exhaustive ledger remains open.

## Break-it journey matrix — 2026-10-18 continuation

All entries below execute imported implementation functions, not read source code. Mocks are used only at the persistence/authorization boundary. Unit test presence is **not** proof of production PostgreSQL isolation or successful CI; no runner is available in this GitHub-only session.

| Journey and exported functions | Behavioral test | Successful and hostile states | Remaining |
|---|---|---|---|
| Shared applicants: hrApplicantFilterSchema, hrApplicantPageBounds, hrOfferPageBounds, projectSharedApplicants | `tests/unit/HR-BREAK-applicants-01.test.ts` | Valid filters, tab aliases, malformed ID/invalid paging/hidden keys, withdrawn-vs-submitted projection, out-of-range stale page (code fixed) | Server query's own-role, wrong-role, cross-college data and 1k-row pagination |
| Offers/selection: buildHrOfferOverview, hrSelectionReadyApplicationIds, recruiterSelectionListInputSchema, recruiterSelectionRangeWarning, RECRUITER_SELECTION_STAGES | `HR-BREAK-offers-01.test.ts` | Historical/current offers, expiry equality, accepted/joined counting, all evaluative PASS vs pending/fail, duplicate applicants, excessive payload, CTC range edges | Real TPO approval and notifications, concurrent offer issue |
| Drive Today and request lifecycle: recruiterTodayWaitingRequests, recruiterDriveProgressSteps, recruiterDriveNextAction, initialRecruiterRequestStatus, canRecruiterResubmit, recruiterRequestStage, recruiterRequestLegacyLabel, recruiterRequestUpdateSchema, nextHrProposalAttempt | `HR-BREAK-drives-01.test.ts` | Limit-eight queue, request vs draft/closed, joining not inferred, grant not verified, stale token/malformed input, replay vs edited payload | Race on request service and DB delivery |
| Profile/company: hrRecruiterNameFieldsSchema, joinHrRecruiterName, splitHrRecruiterName, sameHrNameVersion, recruiterProfileDetailsPatchSchema, isExactRecruiterEmployerRow, buildRecruiterCompanyOverview, recruiterCompanyOverviewQuerySchema | `HR-BREAK-profile-01.test.ts` | Invalid phone/name, stale timestamp, foreign company/relationship/college, archived/draft suppression and full valid context | Tenant-backed read/write permission service |
| Messaging: getRecruiterDriveConversations, recruiterDriveThreads | `HR-BREAK-messaging-01.test.ts` | Authorized workspace before message list, wrong tenant/expired session lookup refusal (mock), malformed IDs, other recruiter's and unscoped threads suppressed | Postgres membership revocation, message/receipt dedupe |
| Calendar: buildHrCalendarCsv, filterHrCalendarDays, hrNextCalendarEvent, parseIstLocalSlot | `HR-BREAK-calendar-01.test.ts` | IST 00:00/23:59, invalid leap days, categories, future-only events, CSV size cap, malicious spreadsheet fields | Real slot writes, race against overlapping booking |
| Reports: buildHrApplicantCsv, buildHrActivityCsv, buildHrDrivesCsv, buildHrInboxCsv, buildHrCompanyReportCsv, buildRecruiterReportFunnel | `HR-BREAK-reports-01.test.ts` | Every export capped, formula injection neutered, applicant contacts masked, empty funnel, IST headings | Database counting equality vs UI and leak tests across authorization |
| Today service orchestration: listRecruiterTodayOfferActions, listRecruiterTodayRoundsNeedingSlots, listRecruiterTodayChangeRequests | `HR-BREAK-today-service-01.test.ts` | Empty authorized job set short-circuits, persisted offer action counts, offered slots suppressed, proposed slots flagged, recorded change requests (persistence mocked) | SQL generated, tenant predicate and DB integration |
| Recruiter authorization: isRecruiterJobVisible, isRecruiterSharedCandidateAllowed, recruiterGrantEffectiveAt, hrRecruiterGrantLinks | `HR-BREAK-authorization-01.test.ts` | Central permission required even for matching grant, mismatched company/college/relationship, inactive/private candidate, revoked/expired grants, unsafe chooser URLs | Route-level IDOR actual logged-in sessions |
| Tracker weak area: indiaDayStart, indiaDayEndExclusive, TrackerAdminError, parseIndependentFindingFilters, independentFindingHref | `tests/unit/HR-BREAK-tracker-01.test.ts` | IST exact day, impossible dates rejected (code fixed), stable error codes, invalid filters and extraneous college scope | Tracker database queries, stale audited versions and activity |
 
### Weak-areas reconciliation

The generated `docs/audit/coverage/WEAK-AREAS.md` listed several unreferenced HR models and services. New **behavioral** references now cover: `hr-recruiter-name-fields-model.ts`, `hr-drive-conversation-service.ts`, `recruiter-drive-progress-model.ts`, `recruiter-today-waiting-model.ts`, `hr-today-offer-actions-service.ts`, `hr-today-open-slots-service.ts`, `hr-today-change-request-service.ts`, `bug-tracker/audit-findings-day-model.ts`, and `bug-tracker/admin-errors.ts`. These are independent of existing source-string tests.

Remaining weak-area placements sources outside this subset and every unlisted HR handler/export remain OPEN. The section cannot truthfully be declared exhaustively tested without a live test runner, coverage collection, and PostgreSQL fixtures. Do not mark owner sign-off complete.

### Weak HR services — second pass

The following tests import live exported services and substitute only DB reads / upstream authorization with controlled test doubles. **Mocks cannot prove SQL's tenant predicates**; actual tenant isolation still requires PostgreSQL integration tests.

| Exported service | Behavioral test | Tests | Open |
|---|---|---|---|
| countRecruiterAnswerableDriveRequests | `HR-BREAK-weak-services-01.test.ts` | Empty authorized list causes zero DB calls; persisted count coercion and per-drive mapping | SQL query actual tenant |
| listRecruiterCollegeBranches | same | No matching grant -> no query; central permission false -> no query; authorized list returned | Active/archived departments with real DB |
| listOwnRecruiterDecisionNotices | same | No own requests -> no notification query; authorized notices mapped with unread/href | Other-tenant/nonowner SQL protection |
| recruiterTeamAttributedDriveCounts | same | No matching employer grant denies; own request attribution overrides TPO creator; mismatched college job absent | Real DB ownership race |
| recruiterVisiblePortfolioCounts | same | Inactive/wrong college rejects; empty allowed job list never touches DB | Counts scoped against real shortlist |
| MyTrackerReportsPage / MyTrackerReportDetail | `HR-BREAK-tracker-pages-01.test.ts` | Suspended reporter, runtime disabled, data loading failed, empty state, persisted list, invalid and missing detail IDs; direct server component invocation | Browser and signed-in DB IDOR |
| RecruiterCompanyReportsPage | `HR-BREAK-company-reports-page-01.test.ts` | Wrong role redirect; invalid query reset; no college access; multiple-college chooser excludes global sum | Full READY branch and DB pagination |

The Weak Areas generated report also names `recruiter-selection-staged-schema.ts`. It is explicitly staged, not live; no tenant query or write should be introduced before its orchestrator-registered migration. Treat it as **N/A to live persistence tests**, not tested and not approved for writes.

### Additional interactive HR routes and draft resilience

| Export / route | Behavioral test | Break-it cases | Still unverified |
|---|---|---|---|
| `RecruiterRequestDrivePage` (`/hr/drives/new`) | `HR-BREAK-request-drive-page-01.test.ts` | Wrong role, invalid UUID, unauthorized college, mutually exclusive URL actions, no grants, multiple grants, cancelled/stale edit, authorized new request | Real database/tenant session, draft POST |
| `HrRoundResultsPage` (`/hr/round-results`) | `HR-BREAK-round-results-page-01.test.ts` | Wrong role, forged job ID, invalid outcome, no drive, archived drive hidden, other employer, other round in owned job, no rounds | Real round results query, TPO review state |
| `saveHrUnsentDraft`, `restoreHrUnsentDraft`, `hrDriveSessionStorageKey` | `HR-BREAK-unsent-draft-01.test.ts` | Cross-user / cross-college key separation, incomplete edit restore, expiration at 24h boundary, future timestamp, malformed/oversized/extra keys, legacy schema validation | Browser storage quota and real tab contention |
| Third-party assessment and offer links, responsive quiz and attendance tables | Updated existing `chat15-assessment-submission-deadline.test.ts`, `chat15-offer-letter-and-placement.test.ts`, `chat15-quiz-table-legacy.test.ts`, `learner-attendance-parity.test.ts`, `learner-learning-misc-gap-closure.test.ts` | Preserved actual safe HTTPS and copy behavior, DataTable field disclosure, IST and legacy labels following shared UX replacement | CI must confirm these legacy assertions |

### Confirmed source defects fixed

| Defect | Symptom | Fix commit | Regression test |
|---|---|---|---|
| `HR-APP-PAGE-STALE` | On a deleted/changed final page, pagination told user `first=0` but `last=total` | `81ad4bd` | `HR-BREAK-applicants-01` |
| `TRACKER-IST-INVALID-DATE` | Impossible dates could silently normalize into a neighboring IST audit day | `72916f2` | `HR-BREAK-tracker-01` |
| `HR-BELL-WRONG-DESTINATION` | Recruiter notification bell footer opened conversations instead of its notifications inbox | `12f0cb6` | `UX-chat15-overlays-second-pass` |

**Gate remains open:** Unit tests added but not executed in this environment; real HR PostgreSQL fixtures and browser journey testing are required before claiming the complete HR module or its 2,300+ placements exports exhaustively covered.

### Additional draft payload coverage

| Exported symbols | Behavioral test | Cases | Still unverified |
|---|---|---|---|
| `hrDriveDraftSchema`, `hrDriveDraftQuerySchema`, `hrDraftFromAuthorizedJob` | `HR-BREAK-drive-payload-01.test.ts` | TPO-review-safe hire-again, off-campus HTTPS only, deny credentials/scripts, salary parts and internship stipend, invalid duplicate rounds/CGPA/bond/branches, URL mode clashes, prevent conflicting edit/copy/fix | Database-side compensation policy and concurrent proposal reconciliation |

**Working rule:** A test source reference alone is not counted as closed here. The new `HR-BREAK-*.test.ts` test cases invoke the actual function or page directly. Assertions which mock the database do not substitute for transaction, uniqueness, tenant or audit guarantees on real PostgreSQL.


## Chat-15 October 18 current-branch hardening (HR-COV-15 continuation)

This section records source/test evidence only, **not executed or PostgreSQL-verified**. Source changes and tests were pushed exclusively to `chatgpt/chat-15-b`.

| Export / route | Behavioural test | Newly checked invariants | Remaining certification |
|---|---|---|---|
| `recruiterTeamAttributedDriveCounts`, new `attributeRecruiterTeamJobs` (`src/modules/placements/recruiter-team-drive-count-service.ts`) | `tests/unit/HR-BREAK-chat15-team-attribution-50.test.ts` (`HR-TEAM-ATTR-50`) | Duplicate authorized job rows credited once; conflicting approved request owners fall back to job creator regardless of query order; orphan/nonmatching job request rows excluded; denied college and missing permission do not query DB; exact relationship-scoped allowlist | PostgreSQL conflicting historical approved request fixtures; query plan and actual revoked-grant request must be exercised by CI |
| `hrDriveAttention` (`src/modules/placements/hr-drive-attention-model.ts`) | `tests/unit/HR-BREAK-chat15-drive-attention-51.test.ts` (`HR-DRIVE-ATTENTION-51`) | Fix `slice(-0)` exposing every overdue row for zero limit; negative/nonfinite limit returns empty; upper bound 50; invalid persisted deadline skipped; future/overdue sorted, exact 7-day boundary, archived/draft/foreign college excluded | Browser Today attention-card rendering and CI run |
| `requireProjectReadAccess` / `requireProjectLifecycleAccess` (`src/modules/projects/access.ts`, source unchanged) | `tests/unit/PROJ-BREAK-HR-01.test.ts` (`PROJ-BREAK-HR-01`, `PROJ-BREAK-HR-ORG-03`) | TPO-only role denied *before* project ID query; stale assertions updated to expect no SQL instead of allowing object-existence probe; separately test active MENTOR with foreign organization or college has only scope read, no member query | Unit suite and real two-college PostgreSQL role journey |
| `/tracker/audit-findings` server page | `tests/unit/HR-BREAK-chat15-tracker-audit-page-58.test.ts` (`HR-TRACKER-PAGE-58`) | Actually invokes page with mocked auth and persistence: role/disabled/acting-college denial before SQL; central-permission denial; invalid/multi-valued filters; unavailable datastore; admin empty results; persisted row projection | Live 320px/keyboard flow, genuine admin auth, database outage and CI |
 
The full HR/recruiter/tracker module remains **OPEN for exhaustive certification**: every unlisted service export and API route still requires its own row and role/validation/concurrency/notification tests. Neither existing test names nor the new mocked-boundary suites constitute production confirmation.


## HR depth priority change — source and test traceability (2026-10-18)

CI was explicitly deferred by the owner. Every line below is **authored but unexecuted**; do not interpret it as PostgreSQL or browser certification.

| Export, handler, or page | New behavioral test (named contract) | Cases covered by authored test | Remaining verification |
|---|---|---|---|
| `hrSelectionReadyApplicationIds`, `buildHrOfferOverview` | `tests/unit/HR-BREAK-chat15-selection-ambiguity-60.test.ts` (HR-OFFER-DEPTH-60) | Exactly one APPLIED PASS per round; duplicate/concurrent conflicting results fail closed; TALK-only/incomplete outcomes excluded; offer expiry boundary | Real HR round-result table uniqueness, TPO release and offer notification |
| `filterRecruiterDrives`, `isHrDriveDeadlineToday`, `sortRecruiterDrives` | `tests/unit/HR-BREAK-chat15-job-date-61.test.ts` (HR-JOBS-DEPTH-61) | Persisted invalid dates cannot crash filtering/sorting; IST today; private/draft/archived entries remain excluded | Job list 1k rows, live responsive page and PostgreSQL |
| `buildHrApplicantDrawer` | `tests/unit/HR-BREAK-chat15-applicant-detail-62.test.ts` (HR-APPLICANTS-DEPTH-62) | Conflicting duplicate joined application IDs disclose nothing; withdrawn/unshared denial; valid singleton and null masking | SQL duplicate join and stale/open drawer browser replay |
| `listHrConversations` | `tests/unit/HR-BREAK-chat15-messaging-63.test.ts` (HR-MESSAGING-DEPTH-63) | Unread lookup only reaches thread IDs from employer + college + recruiter allowlist; zero authorized threads never touch body table; revoked/wrong account | Actual SQL tenant predicate, receipts and multi-tab replay |
| `hrRoundFormSchema`, `canRecruiterEditRound`, `matchesRecruiterRoundVersion`, `duplicateRecruiterRoundName` | `tests/unit/HR-BREAK-chat15-round-depth-64.test.ts` (HR-ROUND-DEPTH-64) | Live author-only editing; immutable results/slots; stale ms token; normalized name collisions; strict bounded command | PostgreSQL concurrent CREATE/UPDATE/REMOVE, rollback and exactly-once TPO notice |
| `buildRecruiterCalendarEvents`, `buildRecruiterResultsDueItems`, `hrNextCalendarEvent` | `tests/unit/HR-BREAK-chat15-calendar-depth-65.test.ts` (HR-CALENDAR-DEPTH-65) | Exclusive IST next-midnight boundary, sanctioned statuses/jobs, aggregate slot privacy, no forged results due or future events | Calendar pagination, external-drive data and browser date-format acceptance |
| `markHrNotificationRead` | `tests/unit/HR-BREAK-chat15-notification-retry-66.test.ts`, `tests/integration/hr-notification-read.test.ts` (HR-NOTIFY-DEPTH-66) | Same token/owner retry is read-only success, stale version and foreign principal denied; PostgreSQL verifies unchanged readAt | Concurrent POSTs on disposable DB, middleware rate limit, browser status |
| `/tracker/issues`, `/tracker/logs` | `tests/unit/HR-BREAK-chat15-superadmin-tracker-scope-67.test.ts` (SA-TRACKER-AUDIT-67) | Global Tracker refuses acting-college/org, inactive Super Admin, and recruiter-only principals before DB | Admin E2E and tenant-scoped browser navigation |
| `/recruiter/drives/[jobId]/change-requests` | `tests/unit/HR-BREAK-chat15-recruiter-change-requests-page-68.test.tsx` (HR-RECRUITER-PAGE-68) | TPO party denied, foreign job non-enumeration, registered/unready states, authenticated employer detail and back link | Browser form race, persistence on authorized role and timeout |
| 14 legacy `/recruiter/**` server aliases; two legacy redirects | `tests/unit/HR-BREAK-chat15-recruiter-alias-pages-69.test.ts` (HR-RECRUITER-PAGES-69) | Actual server page export identity with secure canonical HR routes; legacy entrypoints redirect to Today | End-to-end navigation, loading/error states and responsive screens |

The overall `HR-COV-15` work remains **OPEN**: remaining exported functions and HTTP route handlers still need individually documented success/validation/security/concurrency cases and real PostgreSQL run. None of these edits touches production or replaces central authorization.


## Subsequent HR export and API failure-mode coverage

| Export / route | Named behavioral evidence | Invariants | Still missing |
|---|---|---|---|
| `buildHrApplicantCsv` (`src/modules/placements/hr-applicant-export-model.ts`) | `tests/unit/HR-BREAK-chat15-applicant-export-70.test.ts` (HR-APPLICANT-EXPORT-70) | CSV formula injection guarded, private contact masked, 200-row cap, malformed persisted date does not crash export, invalid aggregate totals do not print NaN/Infinity | Real SQL export counts agree with visible recruiter shortlist, Excel and 1k-row database fixtures |
| `/api/placements/recruiter/drives/requests` GET/POST/PATCH; shared unexpected-error handler | `tests/unit/HR-BREAK-chat15-request-api-71.test.ts` (HR-DRIVE-API-71) | Cross-origin POST/PATCH rejected before service, valid vs replay status, exact GET college validation and no writes, unexpected service outage produces sanitized request-id response | Genuine logged-in HTTP cookie/CSRF, database write rollback, parallel nonce conflict and rate limits |

Tests were authored only, not executed. No CI run was requested; HR release certification remains open.


| `summarizeRecruiterUnread`, `hrConversationPageBounds`, `scopeRecruiterConversations`, `onlyUnreadRecruiterThreads`, `orderRecruiterConversations`, `recruiterMessageSearchLimit` | `tests/unit/HR-BREAK-chat15-messaging-counts-72.test.ts` (HR-MESSAGING-DEPTH-72) | NaN, Infinity, negative and fractional read counts ignored; large totals saturate safely; paging boundary; general/drive and unread filters; deterministic order; result limit from distinct authorized thread IDs | Cloud unit run, large persisted message-table query and live bell page |


| `/api/placements/recruiter/drives/[jobId]/rounds` POST | `tests/unit/HR-BREAK-chat15-round-api-73.test.ts` (HR-ROUND-API-73) | Actual form handler denies cross-origin before actor/DB; strict round create/edit/remove payload and optimistic token parsing; own create 303 target; stale/used round 409; foreign ID non-enumerating 404 | Live HR form POST and PostgreSQL sequential/concurrent author checks |


## HR-first continuation — October 19, 2026 (coverage authored, CI deferred)

| Exact exported function | Behavioral tests | Account/state matrix proven by authored assertions | Outstanding validation |
|---|---|---|---|
| `buildHrOfferCsv` | `tests/unit/HR-BREAK-chat15-offer-export-74.test.ts` | Corrupt persisted issued/expiry Date cannot throw; NaN/Infinity/fractional export totals cannot print invalid omitted counts; formula escaping, masked contact and cap retained | Disposable PostgreSQL export-200/201 consistency and CSV import in common viewers |
| `projectHrTodayResultsDue` | `tests/unit/HR-BREAK-chat15-calendar-state-75.test.ts` | Keeps SCHEDULED and COMPLETED result reminders for authorized jobs; no canceled, pending, draft, foreign college/job or malformed date; stable sort | Live calendar staleness on round reschedule and multi-college selection |
| `hrRecruiterNameFieldsSchema`, `joinHrRecruiterName`, `splitHrRecruiterName`, `sameHrNameVersion` | `tests/unit/HR-BREAK-chat15-profile-name-76.test.ts` | Embedded CR/LF/control rejected, Unicode allowed, unknown fields fail, normalized names and offset-aware optimistic stale version | Browser edit/cancel/retry and PostgreSQL name CAS |
| `requireProjectLifecycleMutationAccess` (HR-restricted Projects entry) | `tests/unit/PROJ-BREAK-HR-77.test.ts` | HR-only, TPO, learner, faculty, disabled/suspended/revoked mentor never query private project or module settings; authorized mentor still honors feature-disabled gate | IIT Dharwad real-tenant role journey, 2-session concurrency and separate lane reviewer |

No suites were executed or disabled. The HR-first continuation remains open for full per-export, per-route, PostgreSQL and page-level certification.


## HR-depth continuation — applicant validation and actual page-level journeys

| Export or authenticated page | Behavioral test | Covered account and failure transitions | Remaining gates |
|---|---|---|---|
| `uniqueHrVerifiedAcademicMarks` used by `getHrJobRead` | `tests/unit/HR-BREAK-chat15-verified-marks-78.test.ts` | Conflicting academic records for the same member/level no longer arbitrarily disclose whichever historical row wins query order; identical duplicates are safe; invalid percentages fail closed; cross-member/level boundaries are preserved | PostgreSQL mixed `VERIFIED`/`UPDATE_PENDING` fixtures, view policy, real released grade display |
| `/hr/drives/new` and `/recruiter/drives/new` page | `tests/unit/HR-BREAK-chat15-drive-new-page-79.test.tsx` | Direct page invocation for revoked actor, conflicting `edit/fix/from` parameters, wrong-college 404, multi-college chooser, missing grants, stale editing request and authorized form | Browser form draft/restoration and disabled React client states |
| `/hr/drives/proposals` and recruiter alias | `tests/unit/HR-BREAK-chat15-proposals-page-80.test.tsx` | Actual page: revoked role, duplicate filters, college chooser, no-access/empty, persisted list, export link; discussion proposals cannot claim a hiring approval | Real TPO thread history from DB and pagination comparison |
| `/tracker` report intake | `tests/unit/HR-BREAK-chat15-tracker-report-page-81.test.tsx` | Recruiter versus Super Admin known-error disclosure, disabled user redirect, backend unavailable state, repeated/oversized query inputs | Browser/keyboard, live auth, actual persisted own report |
| `hrDriveDraftSchema` / `hrDriveDraftQuerySchema` | `tests/unit/HR-BREAK-chat15-drive-round-82.test.ts` | Control characters in round labels refused; Unicode NFKC+whitespace lookalike duplicate rounds rejected; supported names and single-action query retained | PostgreSQL proposal submission and TPO round import checks |

All evidence above is **authored but not executed** under the owner's no-CI direction. Every item retains the full end-to-end and database acceptance gate.


## Chat-15 messaging resilience and HTTP principal preflight

| Export / authenticated route | Behavioral file | Invariants exercised | Still open |
|---|---|---|---|
| `/hr/conversations` server page | `tests/unit/HR-BREAK-chat15-messaging-page-83.test.tsx` | An optional general-thread lookup failure does not crash the primary authorized message directory or offer a misleading duplicate new-thread action; revoked recruiter, duplicate filters, authentic empty state and primary failure are distinct | Live multi-college thread, keyboard/phone and read receipt integration |
| `/api/placements/recruiter/conversations/open` POST | `tests/unit/HR-BREAK-chat15-messaging-api-84.test.ts` | Same-origin first, strict college UUID, inactive and swapped recruiter user, canonical 303 redirect, sanitized downstream error response | Real HTTP body caps, concurrent open idempotence and transaction lock |
| `/api/placements/recruiter/conversations/[threadId]/reply` POST | `tests/unit/HR-BREAK-chat15-messaging-api-84.test.ts` | Same-origin, trimmed nonblank body, canonical recruiter identity, disabled session, single authorized message service call, redirect and failure no false success | Live message audit and TPO notification exactly-once/rollback |


| `/hr/calendar` and `/recruiter/calendar` authorized server page | `tests/unit/HR-BREAK-chat15-calendar-page-85.test.tsx` | Direct render validates expired/swap recruiter denial before calendar query, repeated date filter denial, no-grant recovery state, and authorized empty-event week without fabricated slots/results | Browser timezone and 320px/390px grid, real college grant expiry/revocation and PostgreSQL data |
