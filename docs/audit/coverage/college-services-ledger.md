# College service/model coverage ledger — chat-4 initial slice (2026-10-18)

**Status: PARTIAL; not exhaustive.** This first batch covers selected tenant-directory and safety models with executable Vitest cases; it is not a claim that all `src/modules/colleges`, `src/modules/academics`, `src/modules/groups` and `src/modules/people` services have permission-matrix/DB transition coverage. Those remain open in master queue chat-4.

| Exported function or schema | Source | Test and cases |
|---|---|---|
| `adminDirectoryQuerySchema` | `src/modules/colleges/admin-directory-query-model.ts` | `chat4-college-tenant-model-ledger.test.ts`: allowed/default, invalid length, page, size, foreign params |
| `parseAdminDirectorySearchParams` | same | duplicate/array/unknown/recovery |
| `tenantLifecyclePaging` | `admin-tenant-lifecycle-model.ts` | clamp, empty, negative error |
| `tenantLifecycleHref` | same | defaults, encoding, foreign params |
| `tenantSetupLinksAvailable` | same | all status combinations |
| `hasCollegeDependencies` | `archive-policy.ts` | every usage field |
| `assertCollegeCanArchive` | same | zero dependencies, positive dependency and typed reason |
| `signInCapabilities` | `signin-methods-model.ts` | all four methods |
| `updateCollegeSignInSchema` | same | bad ID, bad method, optimistic version |
| `collegeNameSchema` / `collegeCodeSchema` / `updateCollegeInputSchema` | `validation.ts` | required, trim/normalize, malformed code, non-empty update |
| `parseSuperAdminReadinessParams` | `admin-readiness-filter.ts` | defaults, duplicate, foreign and unsupported |
| `visibleReadinessChecks` | same | NEEDS_ATTENTION including UNKNOWN; exact area/status |
| `readinessRemediationLink` | `readiness-remediation-links.ts` | college-scoped URL encoding, stable target |
| `/admin/colleges` and `/admin/organizations` page reads | page routes | source-level scope, permissions, DataTable, malformed-query recovery |

**Outstanding:** enumerate and test the remaining exported functions in each of 40 `colleges`, 97 `academics`, 17 `groups`, and 117 `people` files (numbers include types/models and are not a function count); add PostgreSQL route/service permission, rollback, notification and concurrency tests. No claim of completion until these rows are added and executed.

## Academic lifecycle and groups model batch

| Exported function or schema | Source | Test and cases |
|---|---|---|
| `formatPromotionAcademicYear`, `collegePromotionQuerySchema`, `batchPromotionPlan` | `src/modules/academics/college-batch-promotion-model.ts` | `chat4-academics-groups-ledger.test.ts`: format, strict filters, promote/graduate/unavailable, blocked periods and unmapped terms |
| `promotionLearnerBlockers`, `collegePromotionExecuteSchema`, `promotionReady`, `promotionPreviewMatches` | same | role/activity checks; explicit confirmation and concurrency parameters; fail-closed preview |
| `timestampTokenIso` | `optimistic-timestamp-model.ts` | valid millisecond ISO and invalid timestamp |
| `collegeHallBookingSchema`, `hallBookingWindow`, `hallCanFitClass`, `hallFacultyIsEligible` | `college-hall-booking-model.ts` | IST date validity, bounded room capacity, faculty eligibility, confirmation |
| `collegeSectionLifecycleSchema`, `classLifecyclePrompt` | `college-section-lifecycle-model.ts` | guarded archive/restore and version |
| `collegePreviewErrorLabel` | `college-recurring-preview-ui-model.ts` | no untrusted API/stack detail leak |
| `collegeStudyGroupCreateSchema`, `collegeStudyGroupChangeSchema`, `studyGroupNextStatus`, `studyGroupConflictMessage` | `src/modules/groups/college-group-management-model.ts` | CRUD validation, state transitions, conflict copy |
| `collegeGroupDetailWriteSchema`, `collegeWaitlistPromotionBlocker`, `collegeGroupDetailActionLabel` | `college-group-detail-write-model.ts` | waitlist identity, version, queue order, capacity and confirmation |
| `collegeStudyMemberSchema`, `collegeStudyMemberLabel` | `college-member-management-model.ts` | guarded member role changes, lock/unlock and copy |
| `groupRuleCriteriaSchema`, `matchesGroupRuleCandidate`, `collegeRulePreviewInputSchema`, `projectCollegeGroupRulePreview` | `rule-evaluator.ts` / `college-rule-preview-model.ts` | strict criteria, missing evidence, scoped input, partial preview totals |

## College People and Contacts model batch

| Exported function or schema | Source | Test and cases |
|---|---|---|
| `maskedPhone`, `maskedEmail`, `visibleContactDetails` | `src/modules/people/college-contacts-privacy.ts` | `chat4-people-contacts-ledger.test.ts`: mask full learner data, missing and malformed identity |
| `collegeContactsQuerySchema`, `parseCollegeContactsSearchParams` | `college-contacts-model.ts` | allowed/foreign/duplicate/date/role exclusion filters |
| `contactRoleAudienceCompatible`, `contactAcademicFiltersCompatible`, `contactDateWindowValid` | same | contradictory role/teaching/enrollment/date matrix |
| `collegeContactsHref`, `clearedCollegeContactsHref`, `collegeContactsTabHref`, `collegeContactsWithoutMemberHref` | same | encoded URLs, canonical reset, preserve tab safely |
| `collegeContactLiteralPattern`, `collegeContactFilterMessage` | same | escaped SQL LIKE and no raw exception details |
| `collegeContactsPageRange`, `activeCollegeContactFilterCount` | same | empty/partial pages and ignore tabs/sort/pagination facets |
| `collegeRoleDirectoryQuerySchema`, `parseCollegeRoleDirectorySearchParams`, `assertCompatibleCollegeRoleDirectoryFilters` | `college-role-directory-model.ts` | strict parsing, allowed role/tenant combinations and conflicts |
| `describeCollegeDirectoryContext`, `collegeDirectorySearchHint` | same | truthful faculty and learner summaries |
| `collegeRoleDirectoryHref`, `canonicalCollegeRoleDirectoryHref`, `selectedDirectoryValueNotListed`, `collegeRoleContactHref` | same | role-restricted links, stale pages, scoped drilldown |
| `collegeRoleDirectoryFilterMessage`, `roleDirectoryDateWindowValid`, `roleDirectoryIstDayStart`, `roleDirectoryNextIstDayStart`, `collegeRoleDirectoryHasActiveFilters`, `collegeRoleDirectoryPageRange` | same | friendly error, IST day boundaries and count |
| `collegePeopleDirectoryFilterSchema`, `parseCollegePeopleDirectorySearchParams`, `collegePeopleDirectoryHref`, `collegePeopleHasFilters` | `college-people-directory-model.ts` | duplicates, foreign filters, canonical URLs |
| `collegePersonDetailQuerySchema`, `collegeStudentEnrollmentQuerySchema`, `recordedAttendanceSummary`, `CollegePersonNotFoundError` | `college-person-detail-model.ts` | strict filters, explicit denominator, zero unknown |
| `collegeFacultyLifecycleSchema`, `facultyLifecycleConfirmation` | `college-faculty-lifecycle-model.ts` | guardian and confirmation lifecycle |
| `studentCsvRequestSchema`, `tokenizeStudentCsv`, `parseStudentCsv`, `neutralStudentCsvCell`, `studentImportReportCsv` | `college-student-csv-model.ts` | rows, strict structure, duplicate phone, formula neutralization |


## College Admin Projects role journeys — IIT Dharwad hardening

**Scope:** targeted new break-it tests added in chat-4, not a claim that the overall Projects ledger is complete (chat-14 owns `projects-ledger.md`).

| Export or route | Tests and behavioural cases |
|---|---|
| `collegeProjectSummaryPatch` | `PROJ-BREAK-chat4-college-summary.test.ts`: valid state, malformed versions and dates, unknown keys, invalid numeric progress, invalid tenant identifiers |
| `collegeProjectSummaryMatchesCurrent` | same: identical no-op retries plus each of fourteen independently modified fields cannot bypass CAS |
| `collegeProjectStatusChangeAllowed` | same: planned→active mentor guard; active→completed approval guard; forbidden archive/reopen/historical states |
| `updateCollegeProjectSummary` | same: transaction/row-lock/CAS ordering, tenant/section restriction, per-write audit and notifications (source guard; PostgreSQL integration outstanding) |
| `getProjectAdminCollegeId` | `PROJ-BREAK-chat4-college-create-scope.test.ts`: wrong tenant, missing membership, suspended/ended membership, wrong role, disabled user and unscoped/organization-only Super Admin |
| `requireTeamCreationAuthority` | same: selected-college gate before mutable service access, persisted user/membership and college checks (source guard; PostgreSQL integration outstanding) |
| `createClassTeamWorkspacesSchema` | same: valid request; unknown organization field, hostile slug, invalid team member list, malformed preview token, limits |
| `createClassTeamWorkspaces` | same: serializable transaction, optimistic roster/preview guards, duplicate-slug mapping, atomic activity (source guard; PostgreSQL integration outstanding) |
| `POST /api/projects/class-team-workspaces` | same: CSRF/same-origin check before reading the JSON body and friendly API failure routing (source guard; full HTTP integration outstanding) |

**Pending:** real PostgreSQL integration for persisted membership revocation, concurrent writes, interrupted audit/notification transactions, 1000+ roster rows and query plans; comprehensive per-export coverage across colleges, academics, groups, people; all College pages and Super Admin tenancy pages. Do not mark master-queue chat-4 complete until these are exercised.


## Added College + Super Admin tenants coverage (chat-4, 2026-10-18)

| Export/page | Behavioural / adversarial test | Known limitation |
|---|---|---|
| `listOrganizations(context)` | `PROJ-BREAK-chat4-superadmin-tenants.test.ts` SA-colleges-tenants-BREAK-02: selected college must join active persisted organization, restrict result to one, reject stale selected organization | SQL/source guard; database integration pending |
| `listColleges(context, organizationId?)` | same, BREAK-03: selected college always intersects persisted organization, active parent and requested organization | SQL/source guard; DB integration pending |
| `parseAdminDirectorySearchParams` | same, BREAK-01: duplicated, unauthorized, invalid page-size/query filters fail before DB call | Pure behavioural assertions |
| `canManageCollegeDirectoryRow` | same, BREAK-04: disabled user, foreign college, foreign organization, wrong selected scope deny actions | Pure behavioural assertions |
| `preferredNewTenantOrganization`, `createdOrganizationStepHref` | same, BREAK-05: only allowlisted UUIDs preselect; malformed response rejected | Pure behavioural assertions |
| `tenantSetupLinksAvailable`, `tenantLifecycleHref` | same, BREAK-06: archived organization/college blocks setup and malformed states rejected | Pure behavioural assertions |
| `saveAdminCollegeSignInPolicy`, `updateCollegeSignInSchema` | `chat4-college-export-signin-ledger.test.ts`: schema rejects tampering; unchanged retry under locks skips second audit; changed request still uses CAS | SQL/source guard; DB integration pending |
| `effectiveCollegeSignInMethod`, `effectiveCollegeSignInCapabilities` | same: verified-host ID and corrupt-policy rejection source guards | Real provider flow pending |
| `collegeAdminHistoryCsv`, `escapeRoleDirectoryCsvCell` | same: formula prefixes, embedded quotes, IST date, CSV line breaks | Pure behavioural assertions |
| `exportParams`, `buildCollegeDirectoryCsv`, `collectCollegeExportRows` | same: duplicate filter rejection, cap/truncation, zero/NaN/infinite inputs rejected before any read | Pure behavioural assertions |
| `/admin/colleges`, `/admin/organizations`, `/admin/colleges/[collegeId]` | `PROJ-BREAK-chat4-superadmin-tenants.test.ts`: bad-input fast-fail, safe row controls and active-parent restore | Server-render integration pending |
| Five legacy `/college` redirect routes and `components/college` responsive lists | `chat4-college-ux-redirect-coverage.test.ts`: canonical destinations, encoded URL parameters, downstream authorization, labelled scroll cue | Actual browser keyboard/focus/screen-reader tests pending |

The College, academics, groups and people exported-function inventory remains **incomplete**. This section records newly covered symbols without claiming that the master-queue's exhaustive coverage requirement is satisfied. A dedicated PostgreSQL fixture run is required before release.


## Pass B / IIT Dharwad additional verified source invariants — 2026-10-18

| Function or route | Adversarial/behavioural test | Open integration work |
|---|---|---|
| `updateCollegeProjectSummary` | `PROJ-BREAK-chat4-college-persisted-actor.test.ts`: role/tenant policy and SQL order; locked persisted-actor check before stale/no-op retry, write, audit and notifications | Transactional PostgreSQL revoked-role race not yet executed |
| `replaceCollegeProjectLearners` | same: stale role check before no-op and member writes, college-bound learner set, revoked account | PostgreSQL concurrent roster replace and rollback |
| `createClassTeamWorkspaces` | same: assert persisted permission inside SERIALIZABLE transaction before any group insert; channel attribution rebuilt from locked actor | Actual serializable retry and 2000-learner fixture |
| `exportVisibleCollegePeople` | `chat4-college-academics-people-weak-area.test.ts`: locked reauthorization between directory read and private phone/profile enrichment; college-ID and selected-membership intersections | Connection-level revocation and snapshot consistency |
| `requireActiveAcademicMembership`, `requireAcademicRole` | same: ACTIVE/ENDED/SUSPENDED, exact FACULTY/LEARNER authorization and typed denial codes | End-to-end membership switches |
| `renderBatchCsv`, `renderSemesterCsv`, `academicExportHref`, `ACADEMIC_EXPORT_CAP` | same: recorded counts, CSV formula neutralization, blank credits/year, 1000-row limit, encoded search | 1000+ row paginated DB export |
| `exportCollegeAcademicDirectory` | same: strict semester/batch filter parser before page reads and matching renderer | Full PostgreSQL export result equal to screen |
| `parseCollegeRoleDirectorySearchParams`, `assertCompatibleCollegeRoleDirectoryFilters`, `collegeRoleDirectoryFilterMessage` | same: duplicated/unknown/bad date filters, wrong role, error copy cannot expose raw SQL detail | Browser filters and permission error route |
| `roleDirectoryDateWindowValid`, `roleDirectoryIstDayStart`, `roleDirectoryNextIstDayStart` | same: inclusive IST start and exclusive next-day midnight | DST-independent date edge integration |
| `describeCollegeDirectoryContext`, `selectedDirectoryValueNotListed` | same: deduped sorted section names, no fabricated course teaching counts, bookmarked missing option | Rendered directory UI |

These rows establish tests for listed exports only. **Not exhaustive**: 319 academics + 323 people + 94 colleges + 48 groups exports need individually accounted for, with PostgreSQL and page journeys before closing the lane.


## College groups / persisted-actor test (chat-4)

| Export | Test and outcomes |
|---|---|
| `assertPersistedGroupActor` (`src/modules/groups/actor-access.ts`) | `tests/unit/chat4-college-group-persisted-authority.test.ts`: real function executed against deterministic transactional query adapter; active College Admin lock sequence, revoked/disabled actor, wrong college, forged user, missing member, missing role, SELF learner role and membership matching, Super Admin persisted role removal. **Not yet** tested against PostgreSQL lock races. |


## College Admin sensitive mutations + profile privacy, additional Pass B slice

| Export | Test and verified cases | PostgreSQL gap |
|---|---|---|
| `placeImportedLearnerInSection` — `src/modules/people/college-student-import-placement.ts` | `chat4-college-import-placement-authorization.test.ts`: serialized same-college class, learner's persisted ACTIVE membership and role, active user, origin context revoked within write tx, capacity and already-placed checks | Foreign enrollment and concurrent user-disable integration required |
| `scheduleReassignInput` — `college-faculty-schedule-reassignment-service.ts` | `chat4-college-faculty-schedule-hardening.test.ts`: confirmation literal true, UUID, strict unknown-key rejection | None for pure schema |
| `getFacultyScheduleReassignOptions` | same: rejects foreign source membership and counts only same-college section events; excludes disabled replacement users | PostgreSQL wrong tenant injected schedule row |
| `reassignFacultyUpcomingSchedules` | same: actor persisted while row locks held, source and replacement FACULTY, future sessions belonging to current college only, collision skipped, max 200, duplicate/no-write retries produce no duplicate audit, disabled replacement denied | Parallel reassignment, session collision and revocation race |
| `getCollegePersonProfileOverview` | `chat4-college-profile-projection-revocation.test.ts`: exact FACULTY/LEARNER kind, tenant-filtered private profile document read, persisted actor SHARE locks held, projection lists only sanctioned fields, no raw identity or file tokens | Revocation between preflight and read in PostgreSQL |

**Suite additions:** `tests/integration/chat4-college-project-actor-revocation.test.ts` uses disposable DB03 fixtures to disable an authorized College Admin before a Project summary PATCH and remove their persisted role before learner roster mutations. Both assert no committed write. Green CI result is pending; the source contracts in the unit tests do not substitute for this DB acceptance.


| `reassignFacultyUpcomingSchedules` concurrency | `COL-faculty-reassign-RACE-01` PostgreSQL integration adds two different source lecturers with the same future interval and simultaneously reassigns both to a single replacement. Exactly one wins, the other is skipped; retry does not change the outcome. Source guard verifies `pg_advisory_xact_lock(hashtext(replacementMembershipId))` before slot acquisition. | Requires disposable PostgreSQL CI |
| `placeImportedLearnerInSection` database | `tests/integration/chat4-college-student-placement-tenant.test.ts`: foreign college enrollment with forged same cohort cannot be placed, authorized learner inserts once, duplicate is denied, removed College Admin role denies stale session. | Requires disposable PostgreSQL CI |



## October 18 — Super Admin tenant/page security and import follow-through

| Service export | Executable cases | Still open |
|---|---|---|
| `parseCollegeImportCsv`, `MAX_COLLEGE_IMPORT_ROWS`, `collegeImportInputSchema` — `src/modules/colleges/bulk-import-model.ts` | `tests/unit/chat4-super-admin-colleges-bulk-csv-hardening.test.ts`: BOM, CRLF, headerless CSV, quoted commas/double-quotes, malformed quote tails, duplicate case-insensitive codes, line number, malformed length, 200 limit, forged request fields | File upload/UI confirmation |
| `bulkImportColleges` — `src/modules/colleges/bulk-import-service.ts` | `tests/unit/chat4-super-admin-colleges-bulk-service-behaviour.test.ts`: actual service with isolated DB and createCollege mocks, existing code/late unique conflict, partial error, scoped system admin, wrong role, disabled user, forged fields | PostgreSQL duplicate key, audit and retry |
| `listCollegeAdminSessionTargets`, `listCollegeAdminSessions`, `listCollegeAdminHistory` — `src/modules/colleges/admin-session-service.ts` | `tests/unit/chat4-super-admin-session-hardening.test.ts`: tenant ID scoping, persisted current actor authorization within transaction before reading admin identities/device sessions and audit, 500/100/100-page caps; disabled *target* admins remain revocable | PostgreSQL revoked-Super Admin concurrent read |
| `revokeCollegeAdminSessions` — same source | same: committed device revocation and audit in same transaction; zero-live-session retries no duplicate audit; scope/user/membership checked | Disposable PG session mutation race and audit FK |

**Important:** The four chat-4 tests in the orchestrator's older `unit-failures-latest.md` were compared against the current `main` source and test assertions. The merged tests now assert real `DataTable` markup and the query parser's behaviour, rather than stale string formatting. The CI failures file may reflect an earlier run; no fresh green CI result was claimed.
