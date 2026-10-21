# Work packet: NEW / MISSING items from docs/audit/gap2/lane-13/l18-u030-superadmin-departments.md

8 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l18-u030-superadmin-departments.md

## G2-18-030-002  [P1] GAP  facet F01 No scope  effort M
- Legacy: L:26-29/68-93 when no collegeId, fetches `getDepartments()` globally and loads `getColleges()` dropdown
- vNext now: N:15-30 renders `Select a college to continue` and no global department list
- Fix: Document product decision: Super Admin all-college view intentionally removed for safety; offer explicit selected-college scope UX, not silent empty list

## G2-18-030-036  [P1] GAP  facet F10 List API  effort L
- Legacy: L:60-80 getDepartmentsByCollege(collegeId) OR getDepartments() if unscoped
- vNext now: N:32-47 listDepartments(context,collegeId), S:221-250 scoped and archived-only filter
- Fix: Document intentionally removed unscoped listing; if global directory required, add new server-authorized paged cross-college view

## G2-18-030-037  [P1] GAP  facet F10 Mutations API  effort M
- Legacy: L:105-110 create with snake `college_id`, L:145-151 update and L:167-176 delete
- vNext now: API:8-15 POST name-only; APIID:12-34 PATCH rename and DELETE archive + explicit confirm
- Fix: Document snakeCase→server tenant mapping and DELETE→ARCHIVE migration; old API clients must use new safe endpoints

## G2-18-030-039  [P1] GAP  facet F11 SA privilege  effort M
- Legacy: L:26-29 supports unscoped global Super Admin directory; mutation payload carries college_id
- vNext now: NL:13-15 requires isSuperAdmin, M:29-38 resolveActingCollege('department.manage')
- Fix: Test selected-college SA acting scope authorization, no privilege via forged college ID, explicit missing-scope error

## G2-18-030-041  [P1] GAP  facet F12 Dependency guard  effort M
- Legacy: L:219-223 counts program/course/faculty; L:282-320 disables delete when known positive
- vNext now: M:126-138 checks all historical children before archive, A:35-36 disables when counts unavailable or positive
- Fix: Explain archived children still block even when active count chips show zero; provide count/blocker reason from server

## G2-18-030-046  [P1] GAP  facet F13 Initial failure  effort M
- Legacy: L:399-415 `Could not load departments` error + Retry, table hidden on failure
- vNext now: N:34 awaits listDepartments uncaught; route-local fail-safe UI not shown
- Fix: Catch list failure at page boundary, render error and retry rather than server exception or bogus no-results

## G2-18-030-058  [P1] GAP  facet F22 Schema mapping  effort M
- Legacy: L:105-109 `college_id` integer and record numeric id, name
- vNext now: DB:12-30 UUID id/collegeId, name, archivedAt, timestamps, unique per active college
- Fix: Document legacy int→UUID ID translation, tenant scope and archivedAt vs delete for integrations/export

## G2-18-030-059  [P1] GAP  facet F22 Archive/storage  effort M
- Legacy: L:167-176 calls deleteDepartment, whereas M:140-143 sets archivedAt
- vNext now: DB:20,25-27 soft archive with active-only unique index
- Fix: Confirm archived data retention and dependency uniqueness; old reports must not assume deleted rows disappear physically
