# Chat-12 TPO students/companies export-level coverage ledger

2026-10-18. Scope: **key TPO student and company exported functions**; all other placement functions are separately inventoried in the main coverage tracker. This is NOT a release sign-off. Classification: BEHAVIOURAL means a direct unit assertion; MOCKED means only a dependent writer was simulated; SOURCE means string/route checks; PARTIAL is limited direct coverage; OPEN means an explicit gap, **not** a passing test. Never count an OPEN row as covered.

| Production path | Export | Test file | Evidence and missing cases | Status |
|---|---|---|---|---|
| `src/modules/placements/tpo-students-model.ts` | `TPO_STUDENT_JOURNEY_STATES` | `tests/unit/chat12-tpo-roster-facets-behavioral.test.ts` | enumerated journey states; enum consumers | **PARTIAL** |
| `src/modules/placements/tpo-students-model.ts` | `deriveTpoStudent` | `tests/unit/chat12-round34-profile-readiness.test.ts` | source-level readiness provenance | **SOURCE** |
| `src/modules/placements/tpo-students-model.ts` | `summarizeTpoStudents` | `tests/unit/chat12-tpo-roster-summaries-behavior.test.ts` | Active roster, registered placement pool vs unregistered, placed outside pool, null rate for no denominator, deterministic branch sorting | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-model.ts` | `summarizeTpoStudentBranches` | `tests/unit/chat12-tpo-roster-summaries-behavior.test.ts` | Active roster, registered placement pool vs unregistered, placed outside pool, null rate for no denominator, deterministic branch sorting | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-model.ts` | `filterTpoStudentRoster` | `tests/unit/chat12-tpo-roster-facets-behavioral.test.ts` | facet intersection, nulls, search and pagination | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-model.ts` | `selectTpoStudentWorkingSet` | `tests/unit/chat12-tpo-roster-facets-behavioral.test.ts` | default vs explicit finished-batch access | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-model.ts` | `tpoStudentRegisteredForPlacements` | `tests/unit/chat12-tpo-roster-facets-behavioral.test.ts` | explicit selection vs application fallback | **BEHAVIOURAL** |
| `src/modules/placements/tpo-students-model.ts` | `tpoStudentMatchesLegacyStage` | `tests/unit/chat12-tpo-roster-facets-behavioral.test.ts` | verified vs waiting / legacy status | **PARTIAL** |
| `src/modules/placements/tpo-students-model.ts` | `tpoStudentNeedsAttention` | `tests/unit/chat12-tpo-roster-facets-behavioral.test.ts` | offer pending and verification attention | **PARTIAL** |
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
| `src/modules/placements/tpo-bulk-action-preview-service.ts` | `loadTpoBulkCurrent` | `tests/unit/PROJ-BREAK-TPO-bulk-partial-audit-01.test.ts` | mocked; database authorization still pending | **MOCKED** |
| `src/modules/placements/tpo-bulk-action-preview-service.ts` | `previewTpoBulkAction` | `tests/unit/chat12-tpo-bulk-concurrency-and-authorization.test.ts` | signed preview model only; service integration pending | **SOURCE** |
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
| `src/modules/placements/tpo-company-team-service.ts` | `readTpoCompanyTeam` | **NO TARGETED TEST** | persisted team role, missing/archived records, page truncation | **OPEN** |
| `src/modules/placements/tpo-company-team-service.ts` | `mutateTpoCompanyTeam` | `tests/unit/chat12-tpo-team-scope-and-notifications.test.ts` | source-side idempotency, active recipient, audit; DB race pending | **SOURCE** |
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

## Critical outstanding integration tests

- Actual `getTpoStudentsIntelligence`, `listTpoStudentRequests`, and `getTpoCompaniesView` against a disposable migrated PostgreSQL database, with a wrong-college actor and a disabled TPO membership. Model-level tests are **not** these service tests.
- True simultaneous updates to `decideTpoLearnerParticipation` across two database connections; select/preview/confirm stale versions and aggregate event failure; persisted replay/idempotency design remains D12-03.
- Company Team transactionally atomic follow + send + notifications with duplicate idempotency keys, archived relationship, wrong tenant, role removal and a disabled recipient.
- Company-share public expiry/revocation and redacted recruiter output with two actual colleges and exact privacy policy switches.
- All 42 first-third TPO page viewports at 320/360/390 px, focus order and keyboard/back/forward, plus slow DB, outage and session expiry.

## Projects priority

`PROJ-BREAK-TPO-01.test.ts` exercises TPO role, IDOR, stale session, bogus mentor claim and read vs write denial on the actual project access service with mocked DB reads. `PROJ-BREAK-TPO-02` verifies unreviewed portfolio counts cannot be presented as approved Projects outcomes. No direct `project_instances`/enrollment reconciliation has been established. `PROJ-BREAK-TPO-bulk-partial-audit-01.test.ts` exercises the actual TPO bulk confirmation service and audit outage without a real PostgreSQL transaction. `tests/integration/PROJ-BREAK-TPO-DB-01.test.ts` adds a rollback-only PostgreSQL witness for unassigned TPO, foreign tenant and revoked project role joins; the harness cannot exercise the service's own connection with uncommitted fixtures, so HTTP authorization is still unproven. All are authored, not locally executed.
