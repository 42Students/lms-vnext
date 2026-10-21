# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-13/l18-u026-new-program-controller.md

20 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l18-u026-new-program-controller.md

## G2-18-026-002  [P2] GAP  facet F01 Admin entry  effort S
- Legacy: LP:267-273 creates Programs screen within scoped admin; NPC itself only JSON
- vNext now: AP:54-76 has Programs plus academic steps and back link; legacy /superadmin/programs redirects via page:5-7
- Fix: Keep redirects deliberate; ensure sidebar, breadcrumb, and displayed academic path match legacy Programs entry and document destination

## G2-18-026-003  [P2] GAP  facet F02 Section order  effort M
- Legacy: LP:269-292 Programs heading then Create New Program left / Existing Programs right
- vNext now: AP:55-76 adds PageBackLink, PageHeader and AcademicSetupSteps; AD renders collapsible create then directory
- Fix: Match measured legacy two-column and section order in admin portal when target is visual parity, retaining safe vNext semantics

## G2-18-026-004  [P2] GAP  facet F03 Controls  effort M
- Legacy: LP:233-244 Edit/Delete row buttons with explicit icons, tooltip, Popconfirm; LP:286-298 Create, search, refresh, CSV
- vNext now: AD: columns/ProgramActions and Export CSV/Refresh, but separate component composition
- Fix: Compare icon, tooltip, disabled, action placement and button text for each control side by side; align to legacy chrome without restoring dangerous hard-delete

## G2-18-026-005  [P2] GAP  facet F04 Fields  effort M
- Legacy: NPC:136-142, NPS:189-206 response id,name,deptId,deptName,durationYears
- vNext now: PS:182-205 fields id,departmentId,departmentName,name,code,durationTerms,status,timestamps + derived durationYears
- Fix: Supply stable legacy compatibility projection if old callers still expect snake_case; document ID translation (integer vs UUID)

## G2-18-026-009  [P2] GAP  facet F05 Filters  effort S
- Legacy: NPC:118-131 dedicated deptId and collegeId endpoints, no search
- vNext now: AR:16-21 `collegeId` required, optional `departmentId`; AD client text filter
- Fix: Map query names/scope and retain department/college filtering; avoid treating absence of collegeId as 'all programs'

## G2-18-026-010  [P2] MISSING  facet F05 Page sizes  effort M
- Legacy: NPC:227-245 offers zero-based page=0, size=20, clipped 1..100, PageResponseDTO metadata
- vNext now: AR:13-22 returns full array without pagination; AD paginates locally
- Fix: Provide server-side pagination with totalElements/totalPages/first/last for large tenant lists, or document replacement and cap payload

## G2-18-026-011  [P2] GAP  facet F05 Export/search  effort M
- Legacy: LP:44-46,170-173,292-319 searches program/department and exports CSV with dependency columns, user-configurable 25 row default
- vNext now: AD list search and CSV plus persisted page size; backend has no export
- Fix: Verify exported headers, row counts, search placeholder, saved page-size key and empty copy against LP:292-319

## G2-18-026-014  [P2] GAP  facet F06 Form constraints  effort S
- Legacy: NewProgramDTO:10-15 name nonblank max255, deptId>=1, years>=1; LP:278-285 years range1..10 default4
- vNext now: VM:3-13 name max255, code regex, UUID dept, terms1..24; AD validates legacy years1..10
- Fix: Preserve year default 4 and 1..10 UI; expose new code as optional only in UI with deterministic code derivation

## G2-18-026-015  [P2] GAP  facet F07 Conflict text  effort S
- Legacy: NPS:63-71 409 `Program name already exists in this department`; NPC:177-181 exposes server reason
- vNext now: CM:101-123, AR:38-41 returns `PROGRAM_NAME_CONFLICT` machine code
- Fix: Map conflict code to exact legacy field-level message and HTTP 409; field highlight on name

## G2-18-026-016  [P2] GAP  facet F07 Missing ID  effort S
- Legacy: NPC:139-140 and 218-219 `Program not found`; NPS:145 update says `Program not found with id: N`
- vNext now: PR:15-19 returns `PROGRAM_NOT_FOUND` 404
- Fix: Normalize human-friendly missing-ID copy and ensure 404 shown inline or toast with retry/back link

## G2-18-026-017  [P2] GAP  facet F07 Invalid fields  effort M
- Legacy: NPC:62,148 `@Valid`; DTO:10-15 validation; LP:278-284 client form messages
- vNext now: VM:3-20 Zod; AR:23-25 delegates apiErrorResponse
- Fix: Map Zod errors to exact field errors, differentiate 422 validation from dependency 409 and unauthorized 403

## G2-18-026-020  [P2] GAP  facet F08 Delete success  effort S
- Legacy: NPC:207 `Program deleted successfully`; LP:183 shows `Deleted program “X”.`
- vNext now: PR:47-48 returns archived program; archive UI labels differ
- Fix: Keep explicit 'archived' text instead of misleading 'deleted'; document deliberate changed deletion model in UI

## G2-18-026-022  [P2] GAP  facet F09 Delete confirm  effort S
- Legacy: LP:236-243 Popconfirm text and button disables during in-flight delete
- vNext now: VM:22-24 archive requires explicit `confirm:true`; ProgramActions used by AD
- Fix: Verify exact confirm copy and disable timing; show 'Archive' / linked-dependency reasons consistently, not silent deletion

## G2-18-026-033  [P2] GAP  facet F13 Load/empty  effort M
- Legacy: LP:303-320 shows retry alert, skeleton, stale refreshed list and 'No programs found. Create a department first.'
- vNext now: AP:35-51 fail-closed unavailable page; AD renders separate no-results / initial empty message
- Fix: Align error, loading and empty state copy and retry placement; avoid falsely reporting an empty list after failed read

## G2-18-026-034  [P2] GAP  facet F14 Export  effort M
- Legacy: NPC has no export endpoint; LP:292-299 client CSV including id/name/years/dept and dependency counts
- vNext now: AD CSV (search result) from `adminProgramsCsv`
- Fix: Compare exact header/csv escaping, BOM, row filtering and linkage counts; preserve safe download on narrow screens

## G2-18-026-037  [P2] GAP  facet F16 Responsive  effort M
- Legacy: LP:270-292 Ant Design Row/Col xs24 lg10/14, wide create/list columns
- vNext now: AD: responsive controls, AP:55-77 single container; mobile behavior differs
- Fix: Side-by-side compare <768 and desktop breakpoints, toolbar wrap and 2-column create/list proportions

## G2-18-026-039  [P2] GAP  facet F18 Wording  effort S
- Legacy: LP:213-218 columns `Program Name`, `Duration`, `Department`, `Contents`, `Actions`
- vNext now: AD table calls first column `Program` and adds code/modern phrasing
- Fix: Match table heading `Program Name` and exact tooltips/placeholders from LP; use legacy-copy-A/B as per-page inventory

## G2-18-026-040  [P2] GAP  facet F19 Data volume  effort M
- Legacy: NPC:227-245 paged query caps 100; NPS:75-96 unpaged read; NPR:27-31 explicit countQuery
- vNext now: PS:182-205 fully materializes all active rows; AD local pagination
- Fix: Add server page/size for large colleges; benchmark tenant with many programs after audit and prevent N+1 department dependency lookups

## G2-18-026-042  [P2] GAP  facet F20 Time/date  effort S
- Legacy: NPS:252-259 details course.createdAt as array [year,month,day], no timezone explicit
- vNext now: PS:191-192 returns createdAt/updatedAt ISO timestamp; details endpoint absent
- Fix: If porting nested details, preserve date-only course representation or provide explicit IST/date adapter; avoid UTC day shifts

## G2-18-026-043  [P2] GAP  facet F21 Integrations  effort S
- Legacy: NPC:52-57 AdminAuditLogService optional and page fetches program dependency APIs; no external third party in controller
- vNext now: CM:156-163 transactional activity event bus; no direct third-party call
- Fix: Trace event consumers and admin-audit screens; no unsubstantiated email/queue claims
