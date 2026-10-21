# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/admin-attendance-policy-controller.md

14 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-attendance-policy-controller.md

## G2-2-010-004  [P1] GAP  facet F03  effort S
- Legacy: LF:133-151 College Admin fields tagged Read-only and Reload icon
- vNext now: NW:113-169 editable numeric inputs, Save attendance policy and Reset default
- Fix: Restrict College Admin to read-only as legacy or obtain explicit new write-permission decision.

## G2-2-010-012  [P1] GAP  facet F06  effort S
- Legacy: LF:133-151 College Admin no user-editable policy input
- vNext now: NW:115-156 editable min1 max100 and min1 max168
- Fix: Remove College Admin save actions until explicit owner approval for expanded rights.

## G2-2-010-024  [P1] GAP  facet F10  effort S
- Legacy: LF:115 `deleteCollegeSetting` resets one override to inherited defaults
- vNext now: NW:81-85 writes BOTH defaults explicitly rather than removing per-field override
- Fix: Support per-setting inherited/global reset and source-of-value provenance.

## G2-2-010-025  [P1] GAP  facet F11  effort S
- Legacy: LC:16-20 College Admin may read only two safe keys; prohibits general tenant config
- vNext now: NA:62-121 College Admin `academics.manage` and NS:72-156 allows write
- Fix: Separate attendance.policy.read vs update permissions or owner-authorize new mutation.

## G2-2-010-027  [P1] GAP  facet F11  effort S
- Legacy: LF:42-44 College Admin identified as FACULTY/admin, `isCollegeAdmin` guard in LF:86-87 disables mutation
- vNext now: NW:49-70 persists for any authorized College Admin
- Fix: Reinstate role-based read-only state for strict legacy behavior.

## G2-2-010-030  [P1] GAP  facet F12  effort S
- Legacy: LF:106-118 reset deletes override row
- vNext now: NS:101-121 explicit default upsert remains
- Fix: Restore inheritance semantics, avoid immutable default override.

## G2-2-010-041  [P1] GAP  facet F20  effort S
- Legacy: LF:92-94 independent save may have concurrent setting changes
- vNext now: NS:88-130 both-field upsert with no expectedUpdatedAt CAS
- Fix: Add row version/CAS and independent update capability; prevent lost policy edits.

## G2-2-010-046  [P1] GAP  facet F22  effort S
- Legacy: LF:165-168 distinguishes default vs custom
- vNext now: NB:17-60 row is present or absent as a unit; no per-field override provenance
- Fix: Persist null/inherited flags per individual setting or separate override rows.

## G2-2-010-048  [P1] GAP  facet F23  effort S
- Legacy: LF:115-118 delete single override
- vNext now: NW:81-85 reset writes both fixed defaults
- Fix: Implement effective precedence and granular reset.

## G2-2-010-016  [P2] GAP  facet F07  effort S
- Legacy: LF:75-77 read error uses `Couldn't load ${label}` then reload
- vNext now: NP:54 getAdminAttendanceOptions may throw full-page; NW no independent read retry
- Fix: Provide per-policy-field unavailable state with retry while keeping attendance grid usable.

## G2-2-010-015  [P3] GAP  facet F07  effort S
- Legacy: LC:40-42 exact error 'collegeId must be a positive integer' 400
- vNext now: NR:27-39 Zod strict UUID and apiErrorResponse
- Fix: Map invalid requested college to clear user-visible field error.

## G2-2-010-017  [P3] GAP  facet F07  effort S
- Legacy: LF:96-100 Save field error `Failed to save ${label}`
- vNext now: NW:66-67 whole-policy generic save failure
- Fix: Restore field-specific failure copy for permitted editors.

## G2-2-010-019  [P3] GAP  facet F08  effort S
- Legacy: LF:95 'Late marking allowed for updated' success when Super Admin saves
- vNext now: NW:78 'Attendance policy saved. New attendance reads...'
- Fix: Match exact field-specific success and avoid claiming both fields changed when only one.

## G2-2-010-020  [P3] GAP  facet F08  effort S
- Legacy: LF:118 `label reset to default` toast
- vNext now: NW:85 'Attendance policy reset to the defaults...' both fields
- Fix: Provide independent reset notice and semantics.
