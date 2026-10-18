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
