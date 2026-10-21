# Work packet: NEW / MISSING items from docs/audit/gap2/lane-13/l18-u026-new-program-controller.md

14 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l18-u026-new-program-controller.md

## G2-18-026-001  [P1] GAP  facet F01 Routes  effort M
- Legacy: NPC:26,60,86,118,126,134,146,186,213,227 exposes 9 distinct REST operations under `/api/v1/new-program`
- vNext now: AR:13-45 and PR:24-49 expose list/create/update/archive; no parity aliases
- Fix: Inventory legacy consumers and map fetchAll/fetchByDept/fetchByCollege/fetch/{id}/details/paged explicitly; update callers or add scoped compatibility routes; never preserve insecure unscoped access

## G2-18-026-007  [P1] GAP  facet F04 Duration representation  effort S
- Legacy: NewProgramDTO:11-15 and NPS:57-60 persist duration_years integer
- vNext now: DB:40 duration_terms integer; PS:38-63 derives years = terms/2
- Fix: Define complete conversion contract (terms=years*2) for reads/writes; prevent fractional legacy years in compatibility projections

## G2-18-026-012  [P1] GAP  facet F06 Create payload  effort M
- Legacy: NPC:60-83 accepts `{name,dept_id,duration_years}` via SnakeCase DTO
- vNext now: AR:28-36, VM:8-13 requires `{departmentId,name,code,durationTerms}`
- Fix: Explicitly adapt snake_case and derive code/terms at legacy-client boundary; do not silently accept missing required code

## G2-18-026-013  [P1] GAP  facet F06 Update payload  effort M
- Legacy: NPC:145-183 PUT `/update/{id}` full validated DTO
- vNext now: PR:24-36 PATCH `/[programId]`; VM:15-20 requires name, code, durationTerms; department optional
- Fix: Document PUT→PATCH payload migration and make old edit callers write required vNext fields atomically

## G2-18-026-018  [P1] GAP  facet F07 Duration conflict  effort M
- Legacy: NPS:113-139 emits named batch/semester and maximum allowed number when shrinking
- vNext now: CM:190-202 raises generic PROGRAM_DURATION_HAS_DEPENDENCIES
- Fix: Return structured blocking batch/semester(s), then render readable legacy-style actionable details before save

## G2-18-026-023  [P1] GAP  facet F10 Audit creation  effort M
- Legacy: NPC:80-83 calls admin audit PROGRAM_CREATE on success; audit helper:52-57 may be null
- vNext now: CM:156-163 records ACADEMICS_PROGRAM_CREATED event in transaction
- Fix: Crosswalk action/event taxonomy, entity and actor fields; confirm same admin audit screen can discover new records

## G2-18-026-024  [P1] GAP  facet F10 Update/delete audit  effort M
- Legacy: NPC:175-176 PROGRAM_UPDATE and 205-206 PROGRAM_DELETE; optional audit dependency
- vNext now: CM:209-221 PROGRAM_UPDATED and 254-260 PROGRAM_ARCHIVED events
- Fix: Ensure old audit consumer maps archived vs deleted and retains college/actor/payload and outcome semantics

## G2-18-026-026  [P1] GAP  facet F11 Superadmin scoping  effort M
- Legacy: NPC:67-77,152-162,192-202 reject wrong scoped college or organization with explicit 403 copy
- vNext now: CM:50-69,73-98 resolves acting college and locks associated active tenant
- Fix: Verify role and organization checks for every mutation and preserve explicit unauthorized feedback for selected wrong college

## G2-18-026-027  [P1] GAP  facet F11 Read scoping  effort M
- Legacy: NPC:89-115 fetchAll superadmin scoped by college/org; ordinary roles restricted to college, learner fallback to full scope
- vNext now: PS:138-165 requires college UUID and `academics.read`; no fetchAll implicit context
- Fix: Audit every role caller; provide tenant-safe scoped list for learner and unscoped Super Admin without opening cross-tenant read

## G2-18-026-029  [P1] GAP  facet F12 Unique name  effort M
- Legacy: NPS:63-71, NPR:47-50 trim/case-insensitive within dept (including potentially soft-deleted rows)
- vNext now: CM:101-125 case-insensitive ACTIVE-only, DB:56-67 partial unique indexes for name AND code
- Fix: Decide archived-name reuse and restoration collisions explicitly; document stronger code constraint

## G2-18-026-030  [P1] GAP  facet F12 Dependency delete  effort M
- Legacy: NPS:149-178 rejects structures, batches, semesters, learners then physical delete
- vNext now: CM:235-252 rejects any cohort/enrollment/term then status ARCHIVED; no hard-delete
- Fix: Verify all legacy relationships (including classes and references) map to vNext dependency checks and show blocker-specific messages

## G2-18-026-031  [P1] GAP  facet F12 Duration shrink  effort M
- Legacy: NPS:113-139 uses newMaxSemesters=years*2 and rejects referenced batch/semester beyond cap
- vNext now: CM:190-202 checks highest term/cohort progression in terms
- Fix: Include historical semester/course and active enrollments in shrink decision; document behavior for partially built future terms

## G2-18-026-044  [P1] GAP  facet F22 Table/identity  effort M
- Legacy: NewProgram.java:10-21 `new_program`, integer id inherited BaseModel, dept_id int, name, duration_years int
- vNext now: DB:29-54 `programs`, UUID id/department, code, duration_terms, ACTIVE/ARCHIVED, timestamps
- Fix: Maintain explicit table/ID/field migration crosswalk for reports and old client routes; no assumption that ints are compatible with UUIDs

## G2-18-026-045  [P1] GAP  facet F22 Constraints/index  effort M
- Legacy: NewProgramDTO:10-15 validation min1/max255; NPR:47-50 soft logical name uniqueness
- vNext now: DB:55-76 active partial case-insensitive name/code indexes, duration_terms check1..24 and restrict dept FK
- Fix: Record deliberate stronger constraints, test conflict codes and archived-record uniqueness/restoration; keep duration terms <=20 for legacy 10-year UI
