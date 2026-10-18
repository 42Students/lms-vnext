# Chat-12 TPO students/companies export-level coverage ledger

2026-10-18. Scope: **key TPO student and company exported functions**; all other placement functions are separately inventoried in the main coverage tracker. This is NOT a release sign-off. Classification: BEHAVIOURAL means a direct unit assertion; MOCKED means only a dependent writer was simulated; SOURCE means string/route checks; PARTIAL is limited direct coverage; OPEN means an explicit gap, **not** a passing test. Never count an OPEN row as covered.

| Production path | Export | Test file | Evidence and missing cases | Status |
|---|---|---|---|---|
| `src/modules/placements/tpo-students-model.ts` | `TPO_STUDENT_JOURNEY_STATES` | `tests/unit/chat12-tpo-roster-legacy-stage-matrix.test.ts` | all five exact published journey states and enum consumers | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-model.ts` | `deriveTpoStudent` | `tests/unit/chat12-round34-profile-readiness.test.ts` | source-level readiness provenance | **SOURCE** |
| `src/modules/placements/tpo-students-model.ts` | `summarizeTpoStudents` | `tests/unit/chat12-tpo-roster-summaries-behavior.test.ts` | Active roster, registered placement pool vs unregistered, placed outside pool, null rate for no denominator, deterministic branch sorting | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-model.ts` | `summarizeTpoStudentBranches` | `tests/unit/chat12-tpo-roster-summaries-behavior.test.ts` | Active roster, registered placement pool vs unregistered, placed outside pool, null rate for no denominator, deterministic branch sorting | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-model.ts` | `filterTpoStudentRoster` | `tests/unit/chat12-tpo-roster-facets-behavioral.test.ts` | facet intersection, nulls, search and pagination | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-model.ts` | `selectTpoStudentWorkingSet` | `tests/unit/chat12-tpo-roster-facets-behavioral.test.ts` | default vs explicit finished-batch access | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-model.ts` | `tpoStudentRegisteredForPlacements` | `tests/unit/chat12-tpo-roster-facets-behavioral.test.ts` | explicit selection vs application fallback | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-model.ts` | `tpoStudentMatchesLegacyStage` | `tests/unit/chat12-tpo-roster-legacy-stage-matrix.test.ts` | all five legacy stages with inverse states | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-model.ts` | `tpoStudentNeedsAttention` | `tests/unit/chat12-tpo-roster-legacy-stage-matrix.test.ts` | all seven independently reported attention reasons and clean placed state | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-service.ts` | `tpoStudentsQuerySchema` | `tests/unit/chat12-tpo-query-schema-security.test.ts` | default bounds, tri-state booleans, inverted numeric ranges and strict unknown-key refusal; DB read permission still pending | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-service.ts` | `tpoStudentRequestsQuerySchema` | `tests/unit/chat12-tpo-query-schema-security.test.ts` | all request filters, wrong tenant, non-GET guards | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-service.ts` | `getTpoStudentsIntelligence` | `tests/unit/chat12-tpo-students-contract.test.ts` | source assertions only; PostgreSQL authorisation and query count pending | **SOURCE** |
| `src/modules/placements/tpo-students-service.ts` | `listTpoStudentRequests` | `tests/unit/chat12-tpo-student-requests-service-tenant.test.ts` | Actual service with mocked database: strict payload refusal before reads, wrong-college permission denial, zero state, pending filter with total counts, empty enrollment lookup; real joins and CAS workflow pending | **BEHAVIOURAL/MOCKED DB** |
| `src/modules/placements/tpo-students-csv.ts` | `tpoStudentCsvCell` | `tests/unit/chat12-tpo-export-and-clipboard-security.test.ts` | malicious company cell formula, quoting and control chars | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-csv.ts` | `exportTpoStudentsCsv` | `tests/unit/chat12-tpo-safe-export.test.ts` | authorized list CSV shape and injection proof | **PARTIAL** |
| `src/modules/placements/tpo-student-clipboard-model.ts` | `tpoStudentClipboardCell` | `tests/unit/chat12-tpo-export-and-clipboard-security.test.ts` | BOM/ZWSP formulas, controls, CRLF | **BEHAVIOURAL** |
| `src/modules/placements/tpo-student-clipboard-model.ts` | `tpoStudentClipboardTsv` | `tests/unit/chat12-tpo-export-and-clipboard-security.test.ts` | formula prefixes and fixed header | **BEHAVIOURAL** |
| `src/modules/placements/tpo-student-clipboard-model.ts` | `matchTpoStudentRolls` | `tests/unit/chat12-tpo-export-and-clipboard-security.test.ts` | case fold, ambiguous duplicates, invalid IDs | **BEHAVIOURAL** |
| `src/modules/placements/tpo-student-history-model.ts` | `tpoStudentHistoryQuerySchema` | `tests/unit/chat12-tpo-history-team-and-sharing-behavior.test.ts` | invalid id/page/additional scope field | **BEHAVIOURAL** |
| `src/modules/placements/tpo-student-history-model.ts` | `projectTpoStudentPlacementHistory` | `tests/unit/chat12-tpo-history-team-and-sharing-behavior.test.ts` | persisted-only chronology and staged/applied separation | **BEHAVIOURAL** |
| `src/modules/placements/tpo-participation-model.ts` | `tpoParticipationStatusSchema` | `tests/unit/chat12-tpo-participation-state-cas.test.ts` | all 3 states and rejects | **BEHAVIOURAL** |
| `src/modules/placements/tpo-participation-model.ts` | `tpoMembershipDecisionSchema` | `tests/unit/chat12-tpo-participation-state-cas.test.ts` | unexpected/expired version values | **BEHAVIOURAL** |
| `src/modules/placements/tpo-participation-model.ts` | `tpoParticipationChangeSchema` | `tests/unit/chat12-tpo-participation-state-cas.test.ts` | reason and trim requirements | **BEHAVIOURAL** |
| `src/modules/placements/tpo-participation-model.ts` | `canonicalTpoParticipationChange` | `tests/unit/chat12-tpo-participation-state-cas.test.ts` | status normalization, source reasons | **BEHAVIOURAL** |
| `src/modules/placements/tpo-participation-model.ts` | `snapshotTpoMembershipDecision` | `tests/unit/chat12-tpo-participation-state-cas.test.ts` | stale date resolution and null default | **BEHAVIOURAL** |
| `src/modules/placements/tpo-participation-model.ts` | `isTpoDecisionSnapshotCurrent` | `tests/unit/chat12-tpo-participation-state-cas.test.ts` | CAS equality and null safety | **BEHAVIOURAL** |
| `src/modules/placements/tpo-participation-model.ts` | `hasTpoDecisionChanged` | `tests/unit/chat12-tpo-participation-state-cas.test.ts` | idempotency and diff with null status | **BEHAVIOURAL** |
| `src/modules/placements/tpo-participation-service.ts` | `TpoParticipationConflictError` | `tests/unit/chat12-tpo-bulk-concurrency-and-authorization.test.ts` | caught on failed preview, not direct DB | **SOURCE** |
| `src/modules/placements/tpo-participation-service.ts` | `getTpoLearnerParticipation` | `tests/unit/chat12-tpo-participation-persisted-role.test.ts` | Actual service with mocked DB: invalid/stale/disabled/wrong-role actor denied before learner read, missing student denied; real tenant DB proof pending | **BEHAVIOURAL/MOCKED DB** |
| `src/modules/placements/tpo-participation-service.ts` | `decideTpoLearnerParticipation` | `tests/unit/chat12-tpo-participation-persisted-role.test.ts` | Actual service stale actor denied before write; source assertions verify persisted SHARE-lock check inside college-lock transaction; real DB CAS/audit pending | **BEHAVIOURAL/MOCKED DB** |
| `src/modules/placements/tpo-bulk-action-confirm-service.ts` | `TpoBulkPreviewError` | `tests/unit/PROJ-BREAK-TPO-bulk-partial-audit-01.test.ts` | rejects stale token and reordered IDs | **BEHAVIOURAL** |
| `src/modules/placements/tpo-bulk-action-confirm-service.ts` | `confirmTpoBulkAction` | `tests/unit/PROJ-BREAK-TPO-bulk-partial-audit-01.test.ts` | partial rows, audit outage, undo only with receipt, replay invalidation | **BEHAVIOURAL** |
| `src/modules/placements/tpo-bulk-action-preview-service.ts` | `loadTpoBulkCurrent` | `tests/unit/chat12-tpo-bulk-preview-service-behavior.test.ts` | Actual service with mocked actor/DB: persisted role revoked before person reads, foreign learner skipped, source scoped actor; PostgreSQL + high-volume query count still pending | **BEHAVIOURAL/MOCKED DB** |
| `src/modules/placements/tpo-bulk-action-preview-service.ts` | `previewTpoBulkAction` | `tests/unit/chat12-tpo-bulk-preview-service-behavior.test.ts` | Actual preview service signs exact authorized rows/order/versions, no-op rows skipped, forged action/IDs fail before I/O, stale role denied; 21-row ordered result with max eight active reads; PostgreSQL under concurrent actors pending | **BEHAVIOURAL/MOCKED DB** |
| `src/modules/placements/tpo-companies-view-model.ts` | `buildTpoCompanyRows` | `tests/unit/chat12-tpo-company-directory-hardening.test.ts` | canonical IDs, duplicate offers, wrong relationship | **BEHAVIOURAL** |
| `src/modules/placements/tpo-companies-view-model.ts` | `filterTpoCompanyRows` | `tests/unit/chat12-tpo-company-directory-hardening.test.ts` | search and deterministic paging | **BEHAVIOURAL** |
| `src/modules/placements/tpo-companies-view-model.ts` | `buildTpoCompanyTimeline` | `tests/unit/chat12-tpo-company-directory-hardening.test.ts` | persisted events only, tie ordering | **BEHAVIOURAL** |
| `src/modules/placements/tpo-companies-view-service.ts` | `tpoCompaniesQuerySchema` | `tests/unit/chat12-tpo-company-directory-hardening.test.ts` | bad page, bogus scope and unknown key | **BEHAVIOURAL** |
| `src/modules/placements/tpo-companies-view-service.ts` | `tpoCompanyDetailQuerySchema` | `tests/unit/chat12-tpo-company-directory-hardening.test.ts` | invalid company ID | **BEHAVIOURAL** |
| `src/modules/placements/tpo-companies-view-service.ts` | `getTpoCompaniesView` | `tests/unit/chat12-tpo-company-view-service-permissions.test.ts` | Real service with mocked persistence: foreign tenant denied before source or CRM discovery, strict invalid IDs/filters, empty canonical/lead state, unknown company null; live relationships and pagination under DB pending | **BEHAVIOURAL/MOCKED DB** |
| `src/modules/placements/tpo-companies-view-service.ts` | `exportTpoCompanyDirectory` | `tests/unit/chat12-tpo-company-view-service-permissions.test.ts` | Real service with mocked persistence: foreign tenant denied before source or CRM discovery, strict invalid IDs/filters, empty canonical/lead state, unknown company null; live relationships and pagination under DB pending | **BEHAVIOURAL/MOCKED DB** |
| `src/modules/placements/tpo-companies-view-service.ts` | `getTpoCompanyDetailView` | `tests/unit/chat12-tpo-company-view-service-permissions.test.ts` | Real service with mocked persistence: foreign tenant denied before source or CRM discovery, strict invalid IDs/filters, empty canonical/lead state, unknown company null; live relationships and pagination under DB pending | **BEHAVIOURAL/MOCKED DB** |
| `src/modules/placements/tpo-company-team-service.ts` | `companyTeamCompanyIdSchema` | `tests/unit/chat12-tpo-history-team-and-sharing-behavior.test.ts` | schema of related model; service-specific id check pending | **SOURCE** |
| `src/modules/placements/tpo-company-team-service.ts` | `TpoCompanyTeamError` | `tests/unit/chat12-tpo-team-scope-and-notifications.test.ts` | route mapping, source contract | **SOURCE** |
| `src/modules/placements/tpo-company-team-service.ts` | `readTpoCompanyTeam` | `tests/unit/PROJ-BREAK-TPO-company-team-role-revocation-07.test.ts` | Real service with mocked persistence: role revoked before any private read, disallowed actor, foreign/unlinked company not found; live messages/pagination still pending | **BEHAVIOURAL/MOCKED DB** |
| `src/modules/placements/tpo-company-team-service.ts` | `mutateTpoCompanyTeam` | `tests/unit/PROJ-BREAK-TPO-company-team-role-revocation-07.test.ts`, `tests/unit/chat12-tpo-company-team-send-idempotency.test.ts`, `tests/unit/chat12-tpo-company-team-follow-transitions.test.ts` | Actual service with mocked transaction: revoked-role denial, first SEND one message and audit, same-key replay no second audit/notification, changed-payload replay conflict, self-ask denied, FOLLOW/UNFOLLOW transitions emit events only for actual changes; live PostgreSQL race and delivery acceptance pending | **BEHAVIOURAL/MOCKED DB** |
| `src/modules/placements/tpo-company-directory-export-model.ts` | `tpoCompanyDirectoryCsv` | `tests/unit/chat12-tpo-export-and-clipboard-security.test.ts` | unsafe Unicode formulas and CSV escaping | **BEHAVIOURAL** |
| `src/modules/placements/tpo-company-visibility-model.ts` | `describeTpoCompanyVisibility` | `tests/unit/chat12-tpo-history-team-and-sharing-behavior.test.ts` | deny-by-default sharing copy and 5 flags | **BEHAVIOURAL** |
| `src/modules/placements/tpo-student-profile-facts.ts` | `tpoStudentProfileFacts` | `tests/unit/PROJ-BREAK-TPO-01.test.ts` | masked contact, no raw project metadata, HTTPS-only links | **BEHAVIOURAL** |
| `src/modules/placements/tpo-team-people-sort-model.ts` | `sortTpoPeople` | `tests/unit/chat12-tpo-history-team-and-sharing-behavior.test.ts` | non-mutating deterministic workload sort | **BEHAVIOURAL** |

## Additional TPO quick-panel and note functions

| Production path | Export | Test file | Evidence and missing cases | Status |
|---|---|---|---|---|
| `src/modules/placements/tpo-student-panel-detail-service.ts` | `getTpoStudentPanelDetail` | `tests/unit/PROJ-BREAK-TPO-PANEL-auth-session-05.test.ts` | Real service with mocked persistence: revoked persisted role fails before data access, expired/disabled/wrong role denied, invalid UUID and missing learner handled; live DB joins still pending | **BEHAVIOURAL/MOCKED DB** |
| `src/modules/placements/tpo-student-notes-service.ts` | `tpoStudentNotesInput` | `tests/unit/PROJ-BREAK-TPO-PANEL-01.test.ts` | Strict UUIDs, no duplicate rows, max 100 IDs, note nonempty/2K limit, tenant override rejected | **BEHAVIOURAL** |
| `src/modules/placements/tpo-student-notes-service.ts` | `addTpoStudentNotes` | `tests/unit/chat12-tpo-notes-authorization-behavior.test.ts` | Mocked transaction: persisted permission before reads, foreign ID skip, active saved row, audit write failure; actual DB atomicity/race pending | **BEHAVIOURAL/MOCKED DB** |
| `src/modules/placements/tpo-student-notes-service.ts` | `listTpoStudentNotes` | `tests/unit/chat12-tpo-notes-authorization-behavior.test.ts` | Mocked disappeared learner returns null without leaking old notes; production SQL checks active learner/college and caps at 100; DB role/session race still pending | **BEHAVIOURAL/MOCKED DB** |

### Projects ID-oracle denial for TPO-only sessions

`tests/unit/PROJ-BREAK-TPO-01.test.ts` now asserts that pure TPO cannot call either `requireProjectReadAccess` or `requireProjectManageAccess` even for an existing, unknown or malformed project ID **without an underlying DB read**. The previous existing-vs-nonexistent return-code difference was a cross-tenant object-existence oracle. Genuine persisted Mentor/Learner project member reads and normal PROJECT_NOT_FOUND for a properly authorized viewer retain explicit positive tests. Fix `6f44aea6`, test `0f182fdd`; full role/browser coverage remains open.

### Real permission policy matrix

`tests/unit/PROJ-BREAK-TPO-real-permission-matrix.test.ts` asserts the **actual** `can` function for own-college TPO versus College Admin, learner/faculty/mentor/recruiter, wrong college, forged org, disabled account, suspended membership and Super Admin acting-college scope. This is distinct from the mocked persisted project-member SQL read in `PROJ-BREAK-TPO-01.test.ts`. `projects.read` by itself does not permit a nonmember to open a project workspace; the access service still checks a persisted project-member row.

### Private TPO page and CSV authorization boundaries

`tests/unit/chat12-tpo-persisted-private-read-boundaries.test.ts` source-inspects the actual Students, Companies, Students CSV and Companies CSV entrypoints. All four must invoke `requireTpoBatchActor` before decoding filters, visiting a company memory deep-link or reading any roster rows. The helper itself validates the persisted ACTIVE user + membership and TPO/College Admin role. Service-level reads from other callers and authenticated browser revoke tests are separate remaining acceptance gates.

### TPO company nested page entrypoints

`tests/unit/chat12-tpo-company-persisted-detail-pages.test.ts` covers six additional page source contracts for detail, contacts, feedback, lifecycle management, people, and archived relationships. Each requires persisted ACTIVE TPO/CA actor validation before private data access. This is role-boundary source proof only: real browser revoked-cookie navigation and PostgreSQL backend permission tests remain open.

### Company export route

| Production path | Handler | Evidence | Scope and remaining cases | Status |
|---|---|---|---|---|
| `src/app/api/placements/tpo/companies/export/route.ts` | `GET` | `tests/unit/chat12-tpo-export-and-clipboard-security.test.ts` | Source contract ensures route uses Unicode-safe shared cell helper and bounded company export; full HTTP role, no-store and CSV import acceptance pending | **SOURCE/ENCODER BEHAVIOURAL** |

### Company Team input and relationship state

| Production path | Export | Test | Evidence and remaining cases | Status |
|---|---|---|---|---|
| `src/modules/placements/tpo-company-team-model.ts` | `tpoCompanyTeamPostSchema` | `tests/unit/chat12-tpo-company-team-validation-and-archive.test.ts` | Accept/trim bounded private message, reject invalid idempotency key, extra scope or action, whitespace-only and 4001-byte body | **BEHAVIOURAL** |
| `src/modules/placements/tpo-company-team-model.ts` | `tpoCompanyTeamCompanyIdSchema` | same file | Canonical UUID accepts, malformed company path denies | **BEHAVIOURAL** |
| `src/modules/placements/tpo-company-team-model.ts` | `canPostToTpoCompanyTeam` | same file | ACTIVE only; ARCHIVED/SUSPENDED/DELETED/unknown denied, including casing confusion | **BEHAVIOURAL** |

### Bulk application stage actor revocation (TPO-students-14)

| Production export | Test file | Real versus mocked proof | Status |
|---|---|---|---|
| `loadTpoBulkApplicationStages` | `tests/unit/PROJ-BREAK-TPO-applicant-stage-revocation-10.test.ts` | Real reader rejects removed persisted role before stage rows or migration probes; DB access mocked, no PostgreSQL concurrency witness yet | **BEHAVIOURAL/MOCKED DB** |
| `moveTpoBulkApplicationStage` | same test | Revoked actor fails inside serialized transaction before application query; wrong/unknown application denied, unavailable registered schema refuses; real two-session race pending | **BEHAVIOURAL/MOCKED DB** |

### Company applicant-share history

| Production export | Test file | Evidence / remaining acceptance | Status |
|---|---|---|---|
| `src/modules/placements/company-share/company-history-service.ts` — `listCompanyShareHistory` | `tests/unit/chat12-tpo-company-share-history-behavior.test.ts` | Actual reader mocked DB: zero jobs return without queries, missing migration reports `ready:false`, persisted revocation/expiry/selection counts returned, static tenant join and 100-row limit; authentic tenant authorization is delegated to callers and needs end-to-end PostgreSQL proof | **BEHAVIOURAL/MOCKED DB** |

- PostgreSQL actor validation executes `requireTpoJobActor` using a row `FOR SHARE` lock. Both bulk current and direct stage preview now use ordinary short transactions, **not** `READ ONLY` transactions (which forbid `FOR SHARE`). Named source regression in `chat12-tpo-bulk-preview-service-behavior.test.ts`; real PostgreSQL execution pending.
- Actual Students bulk preview now uses an eight-wide bounded read window for up to 200 authorized learners; `chat12-tpo-bulk-preview-service-behavior.test.ts` verifies peak concurrency and signed output order without claiming database race proof. The confirm writer remains deliberately sequential for CAS/audit semantics.

## Critical outstanding integration tests

- Actual `getTpoStudentsIntelligence`, `listTpoStudentRequests`, and `getTpoCompaniesView` against a disposable migrated PostgreSQL database, with a wrong-college actor and a disabled TPO membership. Model-level tests are **not** these service tests.
- True simultaneous updates to `decideTpoLearnerParticipation` across two database connections; select/preview/confirm stale versions and aggregate event failure; persisted replay/idempotency design remains D12-03.
- Company Team now has `tests/integration/chat12-tpo-company-team-db-constraints.test.ts`: rollback-only PostgreSQL proof of same-college author/assignee FK, unique key replay, follow uniqueness and invalid ask/body checks. Still open: two-session simultaneous SEND race through the service, transactionally atomic notifications, archived relationship mutation, role removal after preview and disabled recipient under real DB.
- Company-share public expiry/revocation and redacted recruiter output with two actual colleges and exact privacy policy switches.
- All 42 first-third TPO page viewports at 320/360/390 px, focus order and keyboard/back/forward, plus slow DB, outage and session expiry.

## Projects priority

`PROJ-BREAK-TPO-01.test.ts` exercises TPO role, IDOR, stale session, bogus mentor claim and read vs write denial on the actual project access service with mocked DB reads. `PROJ-BREAK-TPO-02` verifies unreviewed portfolio counts cannot be presented as approved Projects outcomes. No direct `project_instances`/enrollment reconciliation has been established. `PROJ-BREAK-TPO-bulk-partial-audit-01.test.ts` exercises the actual TPO bulk confirmation service and audit outage without a real PostgreSQL transaction. `tests/integration/PROJ-BREAK-TPO-DB-01.test.ts` adds a rollback-only PostgreSQL witness for unassigned TPO, foreign tenant and revoked project role joins; the harness cannot exercise the service's own connection with uncommitted fixtures, so HTTP authorization is still unproven. All are authored, not locally executed.

## 2026-10-18 service-level persisted-role revocation closure

| Export | New regression evidence | Limits |
|---|---|---|
| `getTpoStudentsIntelligence` | `chat12-tpo-live-role-private-reads.test.ts`: revoked role, stale/foreign persisted college denied before touching any sensitive roster query | Mocked scopes, not migrated PostgreSQL; page and CSV callers independently recheck actor |
| `listTpoStudentRequests` | `chat12-tpo-student-requests-service-tenant.test.ts`: revoked actor before requests; malformed and cross-college query refusals; empty/count/filter fixtures | Mocked DB rows; real role revocation/locking and pagination need database proof |
| `getTpoStudentPlacementHistory` | `chat12-tpo-live-role-private-reads.test.ts`: actor revocation and wrong-college identity before archived offer/application history | Mocked DB; archived participation/event join authority needs PostgreSQL proof |
| `getTpoCompaniesView`, `getTpoCompanyDetailView`, `exportTpoCompanyDirectory` | `chat12-tpo-company-view-service-permissions.test.ts`: persisted-role revocation and college drift deny contact and CRM reads, preserves no-result/filter cases | Mocked DB and company service; genuine multi-college relationships, CSV and revoke races remain |

Requests grid refreshed-failure trio: `chat12-requests-grid-round6.test.ts`, `chat12-round10-requests-state-contracts.test.ts`, `chat12-round27-request-grid.test.ts`; page-local selection preserves 500-row paging and defends copy against off-page IDs, formula cells and unselected columns. Current table caption, sticky student column and privacy-respecting selected TSV are retained rather than restoring a stale literal DOM contract.

All evidence above is authored but unexecuted, and no green CI/typecheck result is claimed.
- `getTpoRecruiterLeadStages`, `listTpoCompanies` and `getTpoCompanyMemory`: `tests/unit/chat12-tpo-company-memory-live-actor.test.ts` verifies persisted actor role revocation and wrong-college denial before the shared CRM/lead query. This is a mocked service test, not a real-PostgreSQL concurrency proof (TPO-BREAK-company-memory-actor-04).
- `tpoCompanyKey`, `resolveRecruiterLeadRelationship`, `deriveOwnRecruiterLeadStage` and `deriveTpoRecruiterLeadStage`: `tests/unit/chat12-tpo-company-lead-stage-facts.test.ts` asserts relationship-bound offer facts, archived/draft exclusion, unique normalized-name resolution and exact legacy stage precedence (TPO-companies-lead-facts-01). Named behavioral pure-policy coverage; PostgreSQL relationship join still pending.
- TPO-companies-lead-facts-02: `deriveOwnRecruiterLeadStage` now resolves company relationship only for unique normalized employer matches; `tests/unit/chat12-tpo-company-lead-stage-facts.test.ts` directly verifies ambiguous same-name matches yield no borrowed Recruited/Drive planned stage, while uniquely linked and creator-owned jobs still count. Live duplicate-name DB constraints are not proven.
- TPO-students-export-UNICODE-01: `tpoStudentCsvCell` and `tpoStudentClipboardCell` now directly test visible and hidden Unicode formula prefixes (U+200C/U+200D/U+2060/U+00AD/U+202E and combining marks) and preserve benign cells. Named direct behavioral test in `chat12-tpo-export-and-clipboard-security.test.ts`. No spreadsheet desktop-import run.
- `listTpoApplicantNotes`: `tests/unit/chat12-tpo-applicant-notes-persisted-read.test.ts` covers wrong-college rejection before transaction, revoked current TPO membership before private scope reads, and an authorized snapshot under one transaction holding the actor SHARE lock (TPO-BREAK-applicant-notes-revoke-01). DB mocked; real PostgreSQL revoke/read race pending.
- `groupTpoDriveFactsByJob` / `listTpoCompanies`: `tests/unit/chat12-tpo-company-drive-facts-scaling.test.ts` directly exercises 1,200 per-offer facts across 120 job keys, membership segregation, 1-query source wiring, and no dropped duplicates (TPO-companies-scale-01). Needs real PostgreSQL batch-load latency and query plan verification.
- `exportTpoStudentsCsv` TPO-students-export-TRUTH-02: `tests/unit/chat12-tpo-student-marks-export-truth.test.ts` covers unknown, absent, true and false verified evidence without changing the legacy Marks verified column. No real spreadsheet import run.
- TPO-companies-scale-02: exported `tpoDriveFactIdChunks` and private `loadDriveFacts` bound SQL IN predicates at 500 unique job IDs, maintaining original sequence and all facts per job. `chat12-tpo-company-drive-facts-scaling.test.ts` validates 1,205 IDs + duplicates/empty. Needs real 2,000+ job/PostgreSQL query performance verification.
- Page-level TPO first-third behavioral SSR: `chat12-tpo-archived-everyone-ssr-journey.test.tsx` (8 tests) for `/tpo/companies/archived` and `/tpo/team/everyone`, including role/expired authority, partial/empty/missing, outage/retry, IST labels, pagination and links. Execution pending.
- `getTpoCompanyLifecycle`, `listArchivedTpoCompanyRelationships`, shared `companyScope`: `chat12-tpo-company-lifecycle-persisted-reads.test.ts` covers revoked persisted actor, foreign college drift, denied roles and malformed company IDs before database reads, archived cap=100 and empty truthfulness (TPO-BREAK-company-lifecycle-read-05). Uses mocked DB; live revocation race unverified.
- `sendTpoBulkApplicationMessage` / `tpoApplicantBulkMessageSchema`: `tests/unit/chat12-tpo-bulk-message-replay.test.ts` directly invokes the writer against transaction mocks to prove successful recipient/event coupling, stale-version/foreign-record refusal, invalid body and role-denial before writes, locked row/CAS evidence (TPO-BREAK-bulk-message-replay-01). Genuine 2-session DB concurrency/rollback acceptance remains open.
- `getTpoAuditLog` / `/tpo/audit`: direct service authorization tests in `chat12-tpo-audit-revocation-service.test.ts` check persisted TPO actor and college identity before any audit query, fail-closed invalid range/pagination, no fabricated share history (TPO-BREAK-audit-revoked-06). Mocked data only.
- `getTpoActorAudit`: `chat12-tpo-actor-audit-revocation.test.ts` direct service mock checks revoked actor, foreign college, invalid page, zero-result correctness and early page-level actor gate (TPO-BREAK-actor-audit-revoked-07). Actual PostgreSQL auth/concurrency unverified.
- First-third `/tpo/calendar` direct SSR: `chat12-tpo-calendar-ssr-scope.test.tsx` checks cached and persisted role guards before calendar access, malformed filter alert/no events, valid explicit Week date and accessible navigation (UX-tpo-first-third-calendar-02). Browser not exercised.
- `chat12-tpo-audit-pages-ssr-revoked.test.tsx` adds real-server-rendered wrong-role, revoked actor and invalid-filter error branches for both first-third TPO audit pages (UX-tpo-audit-revoked-08); runtime E2E and live DB remain to be verified.
- `tpoStudentMarksVerificationLabel` + `TpoStudentsSpreadsheet`: `tests/unit/chat12-tpo-student-marks-label.test.ts` verifies unknown academic record is `Not recorded` rather than false `Not verified`, with existing exact legacy Marks verified column (TPO-students-29). Tests authored, not executed.
- TPO-requests-verification-37 policy correction: direct `recruiterDriveApprovalPolicy` test ensures trusted company relationship is an independent verified-grant autoapprove cause, unverified grants never bypass, domain-only requires exact matching email, and approval-disabled remains explicit. Company request transactional integration not executed.
- TPO-students-31 source-profile provenance: `tests/unit/tpo-students-model.test.ts` checks missing/null profile JSON is unknown, stored empty profile is explicit resume absence, populated saved profile yields own self-reported counts. `tests/unit/chat12-tpo-readiness-note-provenance.test.ts` checks readiness `No resume` only when profile facts explicitly false. Does not claim Projects workspace verification.
- TPO-requests-verification-R02: `tpoRecruiterRequestAccessEnded` direct tests for no/revoked/expired/null-validity/no DRIVES grant and disabled recruiter; existing change-comparison and recruiter link asserted in `chat12-tpo-drive-recruiter-access-ended.test.ts`. Company request UI browser/session verification pending.
