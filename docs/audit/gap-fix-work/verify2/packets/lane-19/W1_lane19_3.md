# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-17-23-020 [P1] GAP facet F04 Cascade identifier
- Files: (none, new feature)
- Legacy: TS:184–187 sets random UUID string on accept; JO:85–87 cascade_id String
- Expected fix: Verify cascade correlation is durable/readable from both new offer and status-history records and historical reports, not just request result

## G2-17-23-086 [P1] GAP facet F22 Status constraints
- Files: (none, new feature)
- Legacy: JO:69–75 string enum comment RELEASED/ACCEPTED/DECLINED plus other states, status column NOT NULL
- Expected fix: Map SELECTED/PENDING_VERIFICATION/RELEASED and REVOKED separately to vNext issuance/withdrawal; validate archival cases before importing

## G2-18-019-011 [P1] GAP facet F04 Verify flag
- Files: (none, new feature)
- Legacy: LV:25-26 `verify_status` Boolean default false from LS:119
- Expected fix: Define verifiedAt/usedAt audit relationship; old boolean must not authorize new session

## G2-18-026-044 [P1] GAP facet F22 Table/identity
- Files: (none, new feature)
- Legacy: NewProgram.java:10-21 `new_program`, integer id inherited BaseModel, dept_id int, name, duration_years int
- Expected fix: Maintain explicit table/ID/field migration crosswalk for reports and old client routes; no assumption that ints are compatible with UUIDs

## G2-19-029-037 [P1] GAP facet F10 Domain status read
- Files: (none, new feature)
- Legacy: LB:164-169 checks active hosts, number primary/verified; notices multiple primary
- Expected fix: Query active host count, primary count and verified count, distinguish multiple-primary and missing host states before deciding domain readiness

## G2-13-017-052 [P1] GAP facet F20
- Files: src/modules/projects/validation.ts, src/db/schema/projects.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:26` taskKey varchar120, template key may be user-defined
- Expected fix: Safely re-key invalid keys and preserve original as migration metadata/reference for copied tasks

## G2-13-002-056 [P1] GAP facet F15
- Files: src/app/(authenticated)/hr/home/page.tsx
- Legacy: Old unread task sums per-thread unread counts (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:173-176`)
- Expected fix: Verify double counting and scope for unread tasks.

## G2-14-007-001 [P1] MISSING facet F01
- Files: src/proxy.ts
- Legacy: Legacy nested /college-admin/student-groups/:id is retired and replaces location with /college-admin/people after router ready; vNext no matching route/redirect in next.config — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:6-12`
- Expected fix: Add explicit old URL wildcard redirect to current canonical People target

## G2-18-021-027 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Old event `type` selected before `dateType` fallback; does not replace meaningful type with label parsing (JobServiceImpl:1562-1567)
- Expected fix: Preserve and prioritize raw type over label heuristics at all consumers

## G2-14-002-011 [P1] MISSING facet F03
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy Profile icon with resume, skills, education, preferences and identity; vNext omitted here — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:982-989,1765-1775`
- Expected fix: Link to 20-section profile viewer with same entry point

## G2-14-001-024 [P1] GAP facet F06
- Files: src/components/tpo/tpo-academic-import-workspace.tsx, src/modules/placements/tpo-academic-preview-import-model.ts
- Legacy: Legacy academic import by roll, sparse academic columns; vNext mandatory UUID studentCode,cgpa,activeBacklogs — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentsReadService.java:530-561,593-605`
- Expected fix: Support roll lookup and all sparse marks/year/gap/gender/batch fields

## G2-14-015-021 [P1] GAP facet F10
- Files: src/modules/placements/tpo-drive-lifecycle-model.ts
- Legacy: Legacy REQUEST to DRAFT SENT_BACK REJECTED CANCELLED allowed `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:18-24`
- Expected fix: Reconcile missing request review actions in appropriate request service

## G2-14-015-025 [P1] GAP facet F10
- Files: src/modules/placements/tpo-drive-lifecycle-model.ts, src/modules/placements/tpo-drive-lifecycle-service.ts
- Legacy: Legacy CLOSED and CANCELLED terminal, no outgoing transitions `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:33-35`
- Expected fix: Document intentional reopening extension and its safety gates

## G2-14-017-029 [P1] GAP facet F10
- Files: src/modules/projects/lifecycle-service.ts, src/modules/projects/mentor-sprint-write-service.ts
- Legacy: Legacy workspace startSprint,completeSprint,reopenSprint operations `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ProjectWorkspaceService.java:94-111`
- Expected fix: Crosswalk all three transitions and no duplicate action paths

## G2-14-020-036 [P1] GAP facet F12
- Files: src/modules/placements/tpo-company-trust-service.ts
- Legacy: Legacy trusted company recruiter drives bypass placement-cell review `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:60-62` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:30-34`
- Expected fix: Verify trusted-drive publish fastpath and consent safeguards end-to-end

## G2-15-002-032 [P1] MISSING facet F06
- Files: src/app/(authenticated)/admin/placements/student-lookup/page.tsx
- Legacy: Profile edit form values default from loaded record; booleans checked and blanks `''`, string lists joined (`ProfileSectionsPanel.js:101-126,129-145,232-240`).
- Expected fix: Replicate data-to-form conversion, schema defaults, boolean bindings and cancel behaviour.

## G2-15-005-032 [P1] GAP facet F08
- Files: (none, new feature)
- Legacy: Legacy apply success inline `You're in — application sent`, receipt and no auto-dismiss (JobDetailContent.jsx:911-963,573-593)
- Expected fix: Restore durable post-apply receipt and same modal close/state transition

## G2-15-007-040 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: Legacy path only skeleton/redirect, no create/search/row actions (student-groups.js:14-19)
- Expected fix: Implement exact legacy alias redirect, keep new functionality separate and permission-gated

## G2-16-001-042 [P1] GAP facet F12
- Files: src/modules/bug-tracker/independent-finding-transition-model.ts
- Legacy: `auditFindingsModel.js:33-42`; `AuditFindingService.java:133-150`: fixed/released prerequisites; note required on terminal/reopening; duplicate ID validated.
- Expected fix: Define and implement migration of legal legacy transitions or explicitly document stricter redesign; handle existing states.

## G2-16-002-050 [P1] GAP facet F11
- Files: src/app/(authenticated)/tracker/page.tsx
- Legacy: `index.js:240-244`; `PublicBugTrackerController.java:15-35`: no-login public report permitted.
- Expected fix: Implement policy-approved public report access with throttling/safe session, or explicitly document owner exception.

## G2-16-006-041 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: `index.js:13-20`: query-preserving, browser-replace /home redirect.
- Expected fix: Fix query and verify old slug vs deliveryId routing before declaring parity.

## G2-16-010-001 [P1] GAP facet F01
- Files: src/app/api/skills/route.ts
- Legacy: SkillsSearchController.java:22-27 serves /api/v2/skills, CORS approved domains.
- Expected fix: Provide compatibility redirect/adapter for six old endpoint paths and documented clients.

## G2-16-010-004 [P1] GAP facet F02
- Files: src/app/api/skills/route.ts
- Legacy: SkillsSearchController.java:35-121 seven public methods, no screen UI.
- Expected fix: Expose documented public skills API families through compatibility handlers.

## G2-16-010-009 [P1] MISSING facet F03
- Files: src/app/api/skills/route.ts
- Legacy: SkillsSearchController.java:92-100 select POST increments usage.
- Expected fix: Implement authenticated POST skill selection with same-origin CSRF and usage counter.

## G2-16-010-014 [P1] GAP facet F05
- Files: src/modules/skills/catalog-service.ts
- Legacy: SkillsCache.java:313-378 lookup exact then prefix then bounded fuzzy Levenshtein distance2 if fewer than5.
- Expected fix: Port distance≤2 fallback when matches below five; cap candidates and score.
