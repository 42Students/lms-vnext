# HR, Recruiter and Tracker defects — chat-15

Scope: `chatgpt/chat-15-b`. Findings are source-reviewed; **test execution is pending** (this connected GitHub session has no executable checkout, disposable PostgreSQL or browser). No row below is a claim of release certification. Each ID is a dedicated audit gap.

| ID | Severity | Evidence and user impact | Fix commit(s) | Behavioural regression |
|---|---|---|---|---|
| HR-ROUND-STALENESS-01 | S2 | `editHrJobRound` compared `target.updatedAt.toISOString()` with the raw `expectedUpdatedAt`. The Zod schema expressly accepts timezone offsets, so `2026-10-18T15:30:00.123+05:30` and `2026-10-18T10:00:00.123Z` represented the same version but returned `PLACEMENT_ROUND_STALE`. | `37553d77`, `809be2b7`, `f6d9de6e` | `tests/unit/HR-BREAK-chat15-round-versions-02.test.ts`: same instant with three offsets passes, 1ms stale/missing/invalid tokens fail |
| HR-ROUND-CAS-02 | S1 | `editHrJobRound` compared `placement_job_rounds.updated_at` with JavaScript Date using exact SQL `eq`. PostgreSQL `clock_timestamp()` stores microseconds but JS `Date` only milliseconds; updates could report stale even with a current token. Maintain row lock and compare timestamps at milliseconds without discarding CAS. | `47298976` | Model-version unit matrix; real PostgreSQL edit/update/remove concurrent integration test **OPEN** |
| HR-REQUEST-CAS-01 | S1 | `updateOwnRecruiterDriveRequest` used `updatedAt:new Date()`. Two writes in the same millisecond could return the same optimistic version, allowing an older tab's token to be reused after a successful edit. Fix uses `greatest(clock_timestamp(), updated_at + interval '1 millisecond')` in transaction. | `9bcf8a67` | `tests/integration/recruiter-drive-requests-0101.test.ts` now requires strictly advanced timestamps on edit and resubmit (`45389989`); parallel-session test **OPEN** |
| HR-ROUND-ROLE-01 | S2 | Pure `canRecruiterEditRound` accepted `createdByUserId === recruiterUserId === ""`, making the eligibility predicate true without any actor identity when the round was pending/unused. Real DB columns are non-null UUIDs, but client/view-model logic must still fail closed. | `f6d9de6e` | `tests/unit/HR-BREAK-chat15-round-versions-02.test.ts`: empty/whitespace actor IDs, wrong creator, nonpending, results/slots |
| UX-tracker-mine-publicId-02 | S1 | `/tracker/mine/[publicId]` caught *all* `getMyTrackerReport` rejections and treated them as `notFound()`. A DB timeout therefore became a misleading 404 with no retry, despite the record possibly existing. Only `TrackerAdminError("ISSUE_NOT_FOUND")` now maps to 404; operational exceptions propagate to a retryable error boundary. | `4bfd1daa`, `a90202e7` | `tests/unit/HR-BREAK-tracker-detail-chat15-02.test.ts` (`9051a252`): disabled actor, invalid public ID, not found, timeout, disabled runtime and valid owned context |
| UX-tracker-admin-detail-01 | S3 | Tracker detail's temporarily-unavailable UI exposed `DB10_TRACKER_READY=DB10_VERIFIED` and migration 0076 rather than actionable nontechnical copy. Replaced with safe user copy. | `aacc6dd8` | Source review done; page rendering/a11y test **OPEN** |

## Unresolved release checks

1. **Do not merge or certify solely from this defect register.** The branch still needs strict typecheck, Vitest (including new tests), full PostgreSQL role/tenancy and concurrency integration, event/notification rollback verification, and phone/keyboard recovery checks.
2. Exhaustive HR/Recruiter exported-function + route ledger closure is still open in `docs/audit/coverage/hr-ledger.md`. Current ledger is a high-risk slice, not full module acceptance.
3. Validate TPO, HR and recruiter roles on project data for IIT Dharwad: unauthorized tenant data, revoked membership, stale tabs, duplicate actions, expired sessions.


## 2026-10-18 chat-15 follow-up (source fixes; not run)

| Defect ID | Severity | Defect and change | Branch commit | Acceptance evidence |
|---|---|---|---|---|
| HR-SLOT-ACTOR-01 | S2 | `canRecruiterMutateOwnSlot(" "," ")` previously returned true, even though neither actor identity was meaningful. The ownership predicate now rejects whitespace-only actors before comparing identity strings. | `bf7227245751de3009256069fec54349c17840b3` | `tests/unit/hr-interview-slot-model.test.ts` tests correct owner, empty, whitespace, and mismatched creator; authored not run. |
| HR-ROUND-INPUT-01 / HR-ROUND-CREATE-01 / HR-ROUND-REMOVE-01 | Regression expansion | Exercises invalid body rejection prior to SQL, duplicate/cap protection, correct create/remove receipts, single audit insertion and TPO notification and forbidden edit after slots/results. No production regression observed from source review. | `8362c16b26f262aa3d6fca4904697539bee115d4` | `tests/unit/HR-BREAK-chat15-round-service-03.test.ts` expanded mocked service matrix; PostgreSQL races and rollback remain open. |


| PROJ-BREAK-HR-ORG-02 | S1 | The Projects read guard verified the current college and active membership but did not independently verify the membership organization against the project college organization. Cross-organization context now fails before member queries, even if an identical college ID is supplied. HR/TPO hiring grants never substitute for project membership. | `0162447e8df68b14f51d4ff3a71ba018badadbdd` | `tests/unit/PROJ-BREAK-HR-01.test.ts`, `PROJ-BREAK-HR-ORG-02`; tests authored, real PostgreSQL/org invariants not run. |


## Chat-15 role/UX findings, continued 2026-10-18 (not executed)

| Defect ID | Severity | Evidence and correction | Source commit | Test and remaining validation |
|---|---|---|---|---|
| HR-TENANT-ID-04 | S2 defense in depth | Employer/candidate projection helpers accepted matching empty/whitespace company and college identifiers, so synthetic/corrupted scope rows could satisfy equality and suggest disclosure. Reject missing identifiers in shared candidate, exact-employer, grant-selection and visibility predicates before invoking central permission checks. | `aa4a3b4c`, `16914093`, `551f8d36`, `002cb2ba` | `tests/unit/HR-BREAK-chat15-tenant-identity-04.test.ts` exercises allowed ownership, wrong tenant, empty scope and no permission bypass. Live DB validation outstanding. |
| UX-TRACKER-ERROR-06 | S3 information disclosure | Ordinary tracker reporters on an unavailable database page were shown private migration number and environment flags. Replaced with a friendly retry-later message that does not claim submission. | `b03db127` | `tests/unit/UX-chat15-hr-tracker-pages-07.test.ts`; browser failure state still unverified. |


| HR-REQUEST-CANCEL-INTEGRITY-07 | S1 | A CANCEL command previously permitted an optional draft payload, and the generic request update path would persist that payload even while canceling the formal request, changing what the placement cell historically reviewed. The strict schema now forbids draft on CANCEL and requires it on EDIT/RESUBMIT, so it fails before opening SQL transaction. | `16fa29f3` | `tests/unit/HR-BREAK-chat15-request-cancel-integrity-07.test.ts` (`678d100c`): cancel, edit, resubmit, malicious identity/payload. CI & PostgreSQL replay pending. |

| HR-TENANT-ID-16 | S1 | A request context with a recruiter grant belonging to another user could pass the job visibility projection when college/relationship IDs matched. `isRecruiterJobVisible` now verifies `context.recruiter.userId === context.user.id` before invoking centralized permissions. | `cdb247a15f83cd2f6307a29a3847de03a055ae79` | `tests/unit/HR-BREAK-chat15-tenant-identity-04.test.ts`, `HR-TENANT-ID-16 refuses a valid grant carried in another session before permission lookup`; authored but not run. |

| HR-ACCOUNT-OWNER-17 | S1 | HR conversations and notification services previously accepted any active recruiter context without asserting the embedded recruiter user matched the authenticated session owner. Both now reject mismatched owners before private message/event reads. This is defense in depth against swapped/stale session context. | `d51e2104`, `5c7e0343` | `tests/unit/HR-BREAK-chat15-conversations-10.test.ts`, `tests/unit/HR-BREAK-chat15-notifications-09.test.ts`; new swapped-owner cases. Runtime not executed. |

| HR-WORKSPACE-CONTACT-18 | S1 privacy | Recruiter round workspace exposed every shortlisted participant's `users.email` as a participant field even when the current employer-college relationship had not enabled email sharing. The authoritative relationship query now also fetches `shareColumnDefaults`, and the per-participant projection masks email unless that list explicitly includes `email`. Prior candidate status/tenant checks remain unchanged. | `c59d302e`, `82221b19` | `tests/unit/HR-BREAK-chat15-workspace-contact-18.test.ts`, required missing/no-email/allowed cases and scoped projection contract; not run. |

| HR-WORKSPACE-ARCHIVE-19 | S1 | The recruiter job workspace accepted PUBLISHED/CLOSED status but did not reject a set `archivedAt`; an archived drive could still reach private shortlisted candidates and round-result queries by direct URL. Archived jobs now return the same not-found outcome as an unpublished or nonexistent job before any candidate rows are read. | `96a7eee9` | `tests/unit/HR-BREAK-chat15-workspace-archive-19.test.ts` covers archived published/closed, unpublished, absent, active status path; authored, not executed. |

| HR-GRANT-OWNER-20 | S1 | The central `placements.recruiter.*` capability helper accepted a grant associated with a different recruiter user or blank company relationship/college scope as long as the active recruiter context and strings matched. Hardened `hasRecruiterGrant` to require exact authenticated user ID and nonempty scoped relationship and college IDs. All six recruiter capabilities share this guard. | `2f6b46cb` | `tests/unit/HR-BREAK-chat15-role-matrix-13.test.ts`, `HR-GRANT-OWNER-20`. Changes not run; cloud CI must verify. |

| HR-WORKSPACE-RELATION-21 | S1 | The recruiter workspace scoped the job to its relationship/college IDs but did not independently require ACTIVE employer, ACTIVE college, and ACTIVE relationship when the session's cached grant remained present. SQL now denies disabled or archived organizations before round/candidate data are read. | `c41e7bd15` | `tests/unit/HR-BREAK-chat15-workspace-contact-18.test.ts` checks all three SQL guards. PostgreSQL fixture for live relation-status mutations remains pending. |

| HR-PORTFOLIO-OWNER-24 | S1 | Shared `listOwnRecruiterPlacementJobs` previously checked active recruiter context but did not immediately reject a recruiter grant belonging to a different authenticated user before building its job query. It now verifies `recruiter.userId === user.id`; existing exact grant, employer, company status and college checks remain intact. | `f4c9f2fa` | `tests/unit/HR-BREAK-chat15-portfolio-owner-24.test.ts`: swapped owner, disabled user, null recruiter, foreign college, empty grants, empty job allowlist. Tests not executed here. |

| HR-ROUND-ARCHIVE-26 | S1 | The HR recruiter round list/write service allowed DRAFT or PUBLISHED jobs even if the job was archived, which could expose round metadata or permit edits to archived records. Both SQL scopes now additionally require `isNull(placementJobs.archivedAt)`, preserving normal author/optimistic version protections. | `c52e6374` | `tests/unit/HR-BREAK-chat15-round-archive-26.test.ts` verifies both predicate locations, personal round ownership and strict removal form schema. Not run. |

| HR-SLOT-ARCHIVE-27 | S1 | The recruiter interview-slot authorizer checked `PUBLISHED` status but did not exclude archived jobs or disabled company/college records. An archived published job could still reach slot reads and writes if the cached grant remained active. Added SQL `archivedAt IS NULL` and ACTIVE company/college constraints alongside the existing ACTIVE recruiter and relationship joins. | `f910e462` | `tests/unit/HR-BREAK-chat15-interview-slots-03.test.ts` now checks common guard is used by both slot listing and mutation, plus active tenant invariants. Real SQL/CI unverified. |

| HR-ACTIVITY-OWNER-28 | S1 privacy | `listRecruiterJobActivity` checked active recruiter role but not that the embedded recruiter identity belongs to `context.user.id`. A stale/swapped recruiter session with multiple grants could receive college choices before the underlying job owner check. The service now requires exact session owner before returning grant information or querying activity. | `637dbf68` | `tests/unit/HR-BREAK-chat15-activity-owner-28.test.ts`: wrong owner, disabled, no recruiter, multi-college chooser, foreign college, empty jobs and private-event exclusion; CI pending. |

| HR-PORTFOLIO-SCOPE-29 | `src/modules/placements/recruiter-portfolio-counts-service.ts` now independently scopes both shared applicant counts and offer counts to recruiter-owned job, authenticated user, exact active company relationship(s), active college/company, PUBLISHED/CLOSED and not archived, instead of trusting the supplied job IDs. `tests/unit/HR-BREAK-chat15-portfolio-scope-29.test.ts` exercises borrowed grants, wrong college, empty allowlist and both SQL authorization contracts. | Real PostgreSQL revoked-grant race and mixed-college/mixed-company counts still need fixture-based integration, CI not run. |

| HR-TEAM-OWNER-30 | S1 privacy | The HR company/grant selection helper checked active recruiter status but did not require the recruiter user ID to match the authenticated session. A swapped session could expose granted colleges and team access choices. Added exact owner check before returning any choices. | `a6177206` | `tests/unit/recruiter-company-team-scope.test.ts`: swapped user rejected, real owner unchanged; CI not executed. |
| HR-REPORT-ARCHIVE-31 | S2 correctness | Employer report summary and pagination included archived PUBLISHED/CLOSED jobs while its funnel explicitly excluded archived jobs, causing inconsistent totals and candidate funnel. Added `archivedAt IS NULL` to shared `visibleCondition` used by summary, filter and paginated rows. | `8821a8c4` | `tests/unit/HR-BREAK-chat15-company-report-archive-31.test.ts`: source scope parity, count projection and filter validation; CI pending. |
| HR-TEAM-REVOKE-32 | S1 privacy | HR company team route used session grant and active company/relationship but did not verify the current recruiter's persisted ACTIVE profile, ACTIVE college grant or ACTIVE platform user before returning team contacts. Joined all three authoritative records ahead of the team query, so revoked sessions cannot inspect colleagues. | `93344397` | `tests/unit/recruiter-company-team-scope.test.ts` confirms all SQL guards and ordering. PostgreSQL stale-session revocation fixture outstanding. |

| HR-TEAM-COLLEGE-33 | S1 access | The persisted company-team read checked employer/relationship status but omitted current college status. An inactive college with a cached recruiter grant could expose coworkers' email/name. Added an ACTIVE college join before querying contacts. | `2442704c` | Extended `tests/unit/recruiter-company-team-scope.test.ts`; not executed. |
| HR-TODAY-ARCHIVE-34 | S2 workflow | The recruiter Today open interview slots and offer follow-ups included formerly PUBLISHED jobs with `archivedAt` set. Enforced nonarchived jobs in each SQL path, maintaining college scope. | `e9ceb0f4`, `cb00a3ed` | `HR-BREAK-chat15-today-archive-34.test.ts`; not executed. |

| HR-PORTFOLIO-GRANT-35 | S1 privacy | Count queries could still return shortlisted applicant and offer aggregates after a recruiter-college grant was revoked in the database if their session context remained cached. Both queries now join ACTIVE recruiter profile and ACTIVE persisted grant scoped by actor and relationship. | `29c07907` | `HR-BREAK-chat15-portfolio-scope-29.test.ts` verifies both joins, CI and concurrent PostgreSQL revocation outstanding. |

| HR-PORTFOLIO-ARCHIVE-36 | S1 employer disclosure | Shared `listOwnRecruiterPlacementJobs` accepted archived PUBLISHED/CLOSED drives, and its output seeded notifications, activity and calendars. The authoritative job query now requires `placementJobs.archivedAt IS NULL` so archived records cannot re-enter these surfaces through a stale grant. | `c9773847` | `tests/unit/HR-BREAK-chat15-portfolio-owner-24.test.ts` includes the common allowlist predicate and caller coverage; cloud CI not executed. |
| HR-PORTFOLIO-REVOKE-37 | S1 employer revocation | Even after college/relationship status checks, the shared portfolio query did not recheck the acting recruiter's persisted ACTIVE grant and recruiter profile. A revoked grant cached in an existing session could continue to reveal employer job metadata. Both persisted records are now joined as ACTIVE with exact recruiter ID, company and relationship before returning rows. | `b990f201` | `tests/unit/HR-BREAK-chat15-portfolio-owner-24.test.ts` checks grant/profile scoping; PostgreSQL concurrent revocation acceptance pending. |

| HR-PORTFOLIO-EXPIRY-38 | S1 security | An ACTIVE database grant may still be unverified, expired, have `validUntil = NULL`, or lack the `DRIVES` capability. The canonical recruiter job query now applies `verificationStatus = VERIFIED`, `validUntil > now()` (null fails closed), and SQL `DRIVES = ANY(capabilities)` alongside persisted active recruiter/grant checks. This keeps a stale session from bypassing T-S1-01. | `2e02db0c` | `tests/unit/HR-BREAK-chat15-portfolio-owner-24.test.ts` checks source predicates and policy boundary cases; cloud CI/real SQL not run. |


| HR-GRANT-EXPIRE-39 | S1 grant/tenant | Candidate workspace, hiring round writes/lists, interview slots, company team directory and both employer portfolio aggregate queries trusted ACTIVE persisted grants without verifying future `valid_until` and VERIFIED status. Hardened them to fail closed against expired/unverified persisted grants; drive-specific reads and writes also require `DRIVES` capability. | Commits on chat-15 branch | Unit `HR-BREAK-chat15-expired-grants-39.test.ts` and rollback-only PostgreSQL `hr-grant-expiry-39-postgresql.test.ts` authored, not executed. |
| HR-REPORT-MEMBER-42 | S2 reporting/privacy | Recruiter company report rows and funnel could include inactive college memberships/users although normal applicant sharing requires ACTIVE. Scoped both report pipelines to ACTIVE member and ACTIVE platform user; kept shortlisted release guard. | Chat-15 branch | Named `HR-REPORT-MEMBER-42` regression in `HR-BREAK-chat15-company-report-archive-31.test.ts`; CI pending. |

| HR-GRANT-EXPIRY-CLOCK-44 | S1 expiry boundary | PostgreSQL transaction-start `now()` can remain before a grant expiry during a long transaction, potentially authorizing a late operation. Recruiter reads and writes now use fresh `clock_timestamp()` against `valid_until`; repaired the company team SQL predicate closure while changing. | Chat-15 commits | `HR-BREAK-chat15-expired-grants-39.test.ts` and `hr-grant-expiry-39-postgresql.test.ts`; not run. |
| HR-TEAM-RECIPIENT-45 | S1 colleague privacy | A recruiter directory could display employee contact emails whose persisted college grants were unverified or expired because only status ACTIVE was checked for **other** recruiters. Require VERIFIED and future expiry in the team roster query. | Chat-15 commits | `recruiter-company-team-scope.test.ts` named HR-TEAM-RECIPIENT-45; tests authored, not executed. |
| HR-ROUND-TENANT-46 | S1 tenant status | Recruiter round list/write previously allowed a disabled college or employer if grant/relationship and drive state looked active. Both database scopes now require ACTIVE college and company. | Chat-15 commits | `HR-BREAK-chat15-round-archive-26.test.ts` named HR-ROUND-TENANT-46; CI pending. |

| HR-ACTOR-STATUS-48 | S1 identity revocation | A recruiter account disabled in persistence could retain a previously issued in-memory ACTIVE context and access job/round/slot read queries that did not independently join the acting user's database status. Added matching persisted ACTIVE actor joins to four sensitive recruiters services. | chat-15 branch | Named `HR-BREAK-chat15-persisted-user-48.test.ts` plus existing service test extensions; CI not run. |

| HR-RECORDED-QUERY-51 | S2 tenant ambiguity | The recruiter outside-drive recording page accepted multiple `collegeId` or `saved` query-string entries and silently chose the first. It now rejects duplicate keys before any private action, with authorized single-college fallback preserved. | `20af456` | `tests/unit/chat15-hr-recorded-outside-page-51.test.tsx`: SSR user/tenant/404 and saved-receipt cases; CI pending. |
| HR-REPORT-MEMBER-42 | S2 accuracy / privacy | Company report shortlisting counts and funnel could include student memberships/users no longer ACTIVE even though candidate listing hides them. Membership and user ACTIVE predicates have been added to both queries; the matching regression test checks both. | `e1b6df4` | Unit and PostgreSQL tests not executed. |

| HR-SELF-GRANTS-53 | S1 stale-account presentation | Self-grant overview queried `status = ACTIVE` without persisted verification or expiry, so a stale recruiter session could display expired/unverified relationships as presently accessible in the profile. The SQL now requires `VERIFIED` and future `valid_until` against real wall-clock time, while retaining other actor and tenant checks. | `93b844a` | `tests/unit/chat15-hr-self-grants-53.test.ts`; not run. |

| HR-TODAY-CHANGE-56 | S2 privacy and workflow accuracy | Today recruiter change-request list and open-count helpers scoped job IDs and college but could show requests for an archived or no-longer-published job when the caller held an earlier allowlist. Both now add persisted allowed-status and `archivedAt IS NULL` checks. | `7ee4d33`, `82aa849` | `tests/unit/chat15-hr-today-change-56.test.ts` named regression; cloud CI/DB pending. |


## HR-first depth findings — 2026-10-18, authored only

| ID | Severity | Defect and safe corrective behavior | Evidence | Verification |
|---|---|---|---|---|
| HR-OFFER-DEPTH-60 | S2 outcome safety | A duplicated result projection could make a learner look selected on one PASS despite another FAIL/unapplied or duplicated row. Selection now requires exactly one APPLIED PASS for each evaluative round, never infers from TALK. | `hr-offer-selection-read-model.ts`, `HR-BREAK-chat15-selection-ambiguity-60.test.ts` | Not run; DB staging and selection release remain to test |
| HR-JOBS-DEPTH-61 | S3 resilience | Malformed persisted drive deadline caused IST date formatting to throw or undefined sort placement. Invalid deadlines are treated as unknown/non-actionable and sorting remains deterministic. | `recruiter-drive-list-model.ts`, `HR-BREAK-chat15-job-date-61.test.ts` | Not run |
| HR-APPLICANTS-DEPTH-62 | S2 privacy | A duplicate applicant row with conflicting withdrawn or shortlist status could expose the first row's contact/project details. The HR applicant drawer now requires a unique submitted, shortlisted row. | `hr-applicant-drawer-model.ts`, `HR-BREAK-chat15-applicant-detail-62.test.ts` | Not run |
| HR-MESSAGING-DEPTH-63 | S2 privacy / scale | Unread lookup queried all recruiter-college threads, including otherwise inaccessible drive IDs. Query now has explicit authorized thread ID restriction and skips SQL for an empty allowlist. | `hr-conversation-inbox-service.ts`, `HR-BREAK-chat15-messaging-63.test.ts` | Not run; review SQL on PostgreSQL |
| HR-NOTIFY-DEPTH-66 | S2 retry resilience | A successfully read notification returned stale/conflict to a duplicate POST after a lost response. A repeated owner/version-scoped mutation now returns the same persisted timestamp without a second update. | `hr-notification-read-service.ts`, `HR-BREAK-chat15-notification-retry-66.test.ts`, strengthened PG test | Not run; concurrent receipts remain open |
| SA-TRACKER-AUDIT-67 | S1 cross-scope security | Global Tracker Issues and Logs allowed a Super Admin in acting-college/organization mode; global services must only be reached outside impersonated tenant scopes. Both pages now redirect before private reads. | `tracker/issues/page.tsx`, `tracker/logs/page.tsx`, `HR-BREAK-chat15-superadmin-tracker-scope-67.test.ts` | Not run; browser role impersonation check pending |

No tests, migrations or CI were executed. `HR-ROUND-DEPTH-64`, `HR-CALENDAR-DEPTH-65`, `HR-RECRUITER-PAGE-68` and `HR-RECRUITER-PAGES-69` add behavioral coverage without claiming a new production defect.


| HR-APPLICANT-EXPORT-70 | S3 resilience | A malformed persisted submission timestamp could abort the entire recruiter export; invalid totals could print NaN. The CSV now renders a clear unavailable date and bounded totals without changing contact masking or caps. | `hr-applicant-export-model.ts`, `HR-BREAK-chat15-applicant-export-70.test.ts` | Unit and PostgreSQL exports not run |
| HR-DRIVE-API-71 | S2 graceful failure | Unexpected recruiter drive request service failures were rethrown from GET/POST/PATCH, leaving an unstructured HTTP exception instead of a safe response. The route now delegates those cases to the common sanitized API error handler. | `api/placements/recruiter/drives/requests/route.ts`, `HR-BREAK-chat15-request-api-71.test.ts` | HTTP and cloud CI not run |


## HR-first continuation findings — October 19, 2026

| Gap | Severity | Concrete defect and change | Named behavioral test | Verification |
|---|---|---|---|---|
| HR-OFFER-EXPORT-74 | S2 | Corrupted `issuedAt` or `expiresAt` throws `RangeError: Invalid time value` during the entire employer CSV export; an invalid aggregate `total` can insert NaN/Infinity in the cap row. Export now treats invalid dates as empty and uses only safe integer counts. | `HR-BREAK-chat15-offer-export-74.test.ts` | Tests authored, not run |
| HR-CALENDAR-75 | S2 | The HR Today results-due projection accepted any round status when its date/job looked valid; stale canceled and pending dates could appear as actionable employer deadlines. Now only SCHEDULED/COMPLETED results are projected. | `HR-BREAK-chat15-calendar-state-75.test.ts` | Tests authored, not run |
| HR-PROFILE-76 | S3 | Recruiter first/last name validation accepted embedded control characters in identity data. Input now rejects CR/LF/tab/NUL without prohibiting normal Unicode names. | `HR-BREAK-chat15-profile-name-76.test.ts` | Tests authored, not run |
| PROJ-BREAK-HR-77 | S1 | `requireProjectLifecycleMutationAccess` loaded feature settings before checking whether a recruiter, TPO or learner may ever mutate Projects. Such roles now fail early, before private module config or project ID lookups. | `PROJ-BREAK-HR-77.test.ts` | Tests authored, not run; external Projects reviewer and real tenant DB pending |


## HR-role page and data integrity follow-up — 19 October 2026

| ID | Severity | Impact and corrective behavior | Regression evidence | Remaining verification |
|---|---|---|---|---|
| HR-APPLICANTS-78 | S2 accuracy/privacy | Verified academic mark records for a given learner and level could contain conflicting historical values. `getHrJobRead` previously overwrote earlier values depending on unordered SQL delivery, disclosing an arbitrary grade. `uniqueHrVerifiedAcademicMarks` now omits ambiguous or corrupt marks, preserving independent valid levels and learners. | `HR-BREAK-chat15-verified-marks-78.test.ts` | Real PostgreSQL mixed verification history, CI and authorized employer rendering |
| HR-DRIVES-82 | S2 workflow correctness | Recruiter draft hiring round labels accepted internal CR/LF/control characters and visually identical full-width Unicode names as distinct. New validation rejects control chars and compares Unicode-NFKC canonical names before sending to the placement cell. | `HR-BREAK-chat15-drive-round-82.test.ts` | TPO import and browser draft form acceptance |

Additional **coverage without an independently established defect**: `HR-BREAK-chat15-drive-new-page-79.test.tsx`, `HR-BREAK-chat15-proposals-page-80.test.tsx`, `HR-BREAK-chat15-tracker-report-page-81.test.tsx`. None was run; no release readiness is asserted.


## HR messaging retry and identity follow-up — 19 October 2026

| Gap | Severity | Issue and fix | Test | Verification |
|---|---|---|---|---|
| HR-MESSAGING-83 | S2 reliability | Optional general-conversation directory lookup was awaited without failure recovery, so a transient enrichment failure crashed the entire valid recruiter inbox. Now the main inbox remains available with explicit retry copy and the create-new form stays hidden while general-thread state is unknown. | `HR-BREAK-chat15-messaging-page-83.test.tsx` | Authenticated page/browser test not executed |
| HR-MESSAGING-84 | S2 defense in depth | Recruiter open/reply HTTP handlers checked active role but did not preflight equality between cached recruiter principal and signed-in user before calling a sensitive service. Both now reject mismatched principal with 403 before persistence and retain same-origin guards. | `HR-BREAK-chat15-messaging-api-84.test.ts` | Actual HTTP, persistence and notification tests not executed |


| HR-OFFERS-86 | S2 funnel correctness | HR Hired applicant-stage query trusted a JOINED outcome alone, even when its offer had subsequently been DECLINED, REVOKED, or WITHDRAWN. It now requires both the persisted ACCEPTED offer and JOINED outcome, consistent with offer overview counts. | `HR-BREAK-chat15-hired-offer-86.test.ts` | PostgreSQL history and CI not executed |


## Late HR applicant funnel and export follow-up

| Gap | Severity | Impact and safeguard | Regression | Verification |
|---|---|---|---|---|
| HR-APPLICANTS-87 | S2 reporting/privacy | A withdrawn applicant with historical PASS, OFFERED, HIRED or FAIL markers could still appear in corresponding active recruiter funnel counts and filtered applicant pages. SQL filters, aggregate counts and the pure projection now require SUBMITTED for active milestones; ALL/WITHDRAWN history remains available. | `HR-BREAK-chat15-withdrawn-stages-87.test.ts` | Actual PostgreSQL withdrawn/offer history, cloud tests and authenticated page pending |
| HR-OFFER-EXPORT-88 | S2 employer accuracy | Issued-offer CSV route accepted pre-issue selection ledger statuses and could return a misleading empty export with unrelated offer totals. It now refuses such state with 400 before any applicant read, and the offer page no longer advertises the incompatible export action for selection-only filters. | `HR-BREAK-chat15-offer-export-route-88.test.ts` | Cloud tests, browser visibility and selection/offer E2E pending |


## HR-first wave 90–98 findings (19 October 2026, code reviewed only)

| Gap | Severity | Defect / corrective contract | Behavioral evidence | Release gate |
|---|---|---|---|---|
| HR-PAGINATION-90 | S3 | Applicant and offer pagination helpers passed NaN/Infinity and negative/fractional persisted totals straight through to page labels. They now sanitize unsupported counts and page values while preserving real 25/15-row ranges. | `HR-BREAK-chat15-bounds-90.test.ts` | Cloud unit and live count parity not executed |
| HR-DRIVES-91 | S2 | Recruiter role/location draft fields allowed embedded CR/LF/control characters that could forge proposal header metadata in TPO conversation messages. Now rejects control characters in structured fields, but intentionally preserves multi-line description. | `HR-BREAK-chat15-proposal-header-91.test.ts` | Employer submission and TPO preview E2E not executed |
| HR-ACTIVITY-92 / HR-NOTIFICATIONS-93 | S3 | Invalid persisted date objects could surface in recruiter activity or notification pages and crash IST formatting. Now rejects rows with invalid timestamps before view-model projection. | `HR-BREAK-chat15-activity-dates-92.test.ts`; `HR-BREAK-chat15-notification-dates-93.test.ts` | Real PostgreSQL/browser not executed |
| HR-PROPOSALS-94 | S3 | An unsafe page argument to the proposal history window could produce NaN SQL offsets. Invalid pages now recover to the first page without weakening total-count integrity checks. | `HR-BREAK-chat15-proposal-pagination-94.test.ts` | Real TPO thread history paging not executed |
| HR-OFFER-FOLLOWUPS-95 | S2 | Recruiter Today follow-ups could display unknown offer statuses or corrupt/fractional aggregate counts from stale cached projections. Only supported statuses and positive safe integer counts now survive. | `HR-BREAK-chat15-offer-followups-95.test.ts` | Real offer state transitions and notifications not executed |

Page-level **coverage-only** additions: `HR-BREAK-chat15-activity-page-96.test.tsx`, `HR-BREAK-chat15-notifications-page-97.test.tsx`, `HR-BREAK-chat15-tracker-mine-page-98.test.tsx`. These do not assert a production defect or verified UI execution.


## HR private export regression follow-up — 19 October 2026

| Gap | Severity | Risk and source correction | Authored regression | Verification |
|---|---|---|---|---|
| HR-PROPOSAL-CSV-99 | S2 spreadsheet safety | Proposal summary CSV did not neutralize formulas prefixed by spaces; invalid historic Date could crash export. It now guards cells with leading whitespace and omits malformed UTC timestamps. | `HR-BREAK-chat15-proposal-csv-99.test.ts` | CI, Excel/LibreOffice viewer and PostgreSQL pending |
| HR-CALENDAR-CSV-100 | S2 export recovery | Corrupt persisted calendar event or results-due timestamp could abort the entire recruiter CSV. Invalid rows are filtered before sorting/IST formatting. | `HR-BREAK-chat15-calendar-csv-100.test.ts` | CI, calendar index and live download pending |
| HR-PROPOSAL-API-101 | S2 private data/failure mapping | Proposal CSV export lacked a catch/mapping for private DB errors and did not explicitly verify recruiter principal equality at route entry. It now rejects swapped identities and routes failures through the shared sanitized response. | `HR-BREAK-chat15-proposal-export-api-101.test.ts` | Authenticated browser and session-revocation pending |
| HR-ACTIVITY-CSV-102 | S3 correctness | Activity CSV could throw on invalid date; if rows exceeded the hard cap with no explicit downstream-more flag, it silently truncated without the warning row. Now safe-dates and independently determines the cap marker. | `HR-BREAK-chat15-activity-csv-102.test.ts` | CI, real 200+ event history pending |
| HR-NOTIFICATIONS-CSV-103 | S3 resilience | Notification export could crash formatting an invalid Date and print NaN omitted counts from a corrupt aggregate total. It now uses safe dates/aggregate totals. | `HR-BREAK-chat15-notification-csv-103.test.ts` | CI, real read/unread export pending |
| HR-EXPORT-104 | S2 query authorization clarity | Five recruiter GET CSV endpoints silently accepted duplicate sensitive filters and unknown query keys; now return INVALID_QUERY before private service reads. | `HR-BREAK-chat15-export-query-104.test.ts` | Authenticated HTTP, paging and cache checks pending |


## Recruiter message and proposal entry defects — October 19

| ID | Severity | Source-level defect and fix | Regression | Release gate |
|---|---|---|---|---|
| HR-MESSAGING-109 | S2 request validation | Recruiter reply form schema accepted NUL and other unprintable bytes that PostgreSQL TEXT refuses; unstructured persistence failures could result. Form input now rejects controls except intentional whitespace for multiline replies. | `HR-BREAK-chat15-reply-bytes-109.test.ts` | Actual HTTP/DB test and final CI |
| HR-PROPOSAL-API-110 | S2 access and resilience | Employer drive proposal POST checked active recruiter but not cached recruiter principal equality before entering service; context/backend failures and unexpected DB errors could reject the HTTP route without safe response. Added principal check and common sanitized error mapping while retaining replay semantics and 403 origin guard. | `HR-BREAK-chat15-proposal-post-api-110.test.ts` | Concurrent PostgreSQL submission and TPO notice audit |

Coverage-only without a new defect claim: HR-CALENDAR-SERVICE-107 and HR-TRACKER-FALLBACK-108 behavior tests; pending live verification.


## HR applicant resume and review endpoint scope — 19 October 2026

| ID | Severity | Issue and guard | Regression evidence | Acceptance |
|---|---|---|---|---|
| HR-APPLICANT-PRIVATE-115 | S1 private PII | Signed resume grant and private rating endpoints checked an active recruiter role but did not consistently verify the cached recruiter profile belonged to the authenticated user before processing a private object. Resume auth-context failures occurred outside the nonenumerating catch and could surface a raw backend failure instead of a generic resume-unavailable 404. All three handler entries now deny actor swap before any storage or rating schema read, and the resume context load uses the same safe 404 boundary. | `HR-BREAK-chat15-applicant-private-routes-115.test.ts` | Real employer grant/membership revocation, signed URL lifetime, rating CAS, browser and CI pending |


## HR applicant write-body boundedness — October 19

| Gap | Severity | Issue and correction | Regression | Pending |
|---|---|---|---|---|
| HR-APPLICANT-REVIEW-116 | S2 abuse/resilience | Private rating PATCH used unbounded `request.json()`; chunked or oversized JSON reached parser without size guard, risking memory/DoS and uncontrolled response semantics. Now uses shared bounded reader at 16KiB with 400 malformed and 413 oversized, retaining CSRF and optimistic conflict behavior. | `HR-BREAK-chat15-private-rating-body-116.test.ts` | Actual chunked HTTP and PostgreSQL CAS |
| HR-APPLICANT-NOTES-117 | S2 abuse/resilience | Employer-private applicant note POST also used unbounded `request.json()`. It now bounds at 16KiB and maps invalid/malformed request consistently without touching note storage. | `HR-BREAK-chat15-applicant-notes-api-117.test.ts` | Actual chunked HTTP, own/foreign job and withdrawn candidate E2E |

Tests authored only, not executed, per owner directive.


| HR-DRIVES-EXPORT-118 | S2 employer privacy | Recruiter drives CSV silently chose the first query value when duplicated college/filter fields were supplied, and its route only checked an active recruiter profile without asserting the cached recruiter principal matches the authenticated user. It now rejects ambiguous/unknown query keys before data reads and identity mismatch before job search, retaining no-store CSV and exact company grant scoping. | `HR-BREAK-chat15-drive-export-api-118.test.ts` | Real cross-college/organization grants, browser and PostgreSQL pending |


| HR-JOBS-API-119 | S2 employer-private caching | `GET /api/placements/recruiter/jobs` returned recruiter-owned job rows without an explicit `Cache-Control: private, no-store` header. The response now prohibits intermediary/browser caching of an authenticated recruiter portfolio, while preserving the central exact-grant job lookup and sanitized error mapping. | `HR-BREAK-chat15-jobs-api-119.test.ts` | Actual response headers and cross-session cache behavior in browser/production proxy pending |
