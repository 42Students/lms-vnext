# Typecheck errors (CI 39270260, refreshed by orchestrator)

Production typecheck errors on that commit were fixed afterwards. Test-file typecheck (non-blocking) errors below; fix in your own files:

- src/modules/academics/college-directory-export-model.ts(7,36): error TS1517: Range out of order in character class.
- src/modules/colleges/admin-history-export-model.ts(7,46): error TS1517: Range out of order in character class.
- src/modules/placements/tpo-prep-readiness-derived-service.ts(47,14): error TS2345: Argument of type 'string[]' is not assignable to parameter of type 'SQL<unknown> | PgTable<TableConfig> | Subquery<string, Record<string, unknown>> | PgViewBase<string, boolean, ColumnsSelection>'.
- src/modules/placements/tpo-prep-readiness-derived-service.ts(47,14): error TS2448: Block-scoped variable 'cohorts' used before its declaration.
- src/modules/placements/tpo-prep-readiness-derived-service.ts(47,14): error TS2454: Variable 'cohorts' is used before being assigned.
- src/modules/placements/tpo-prep-readiness-derived-service.ts(47,25): error TS2448: Block-scoped variable 'cohorts' used before its declaration.
- src/modules/placements/tpo-prep-readiness-derived-service.ts(47,25): error TS2454: Variable 'cohorts' is used before being assigned.
- src/modules/placements/tpo-prep-readiness-derived-service.ts(47,33): error TS2339: Property 'id' does not exist on type 'string[]'.
- src/modules/placements/tpo-prep-readiness-derived-service.ts(49,7): error TS2448: Block-scoped variable 'cohorts' used before its declaration.
- src/modules/placements/tpo-prep-readiness-derived-service.ts(49,7): error TS2454: Variable 'cohorts' is used before being assigned.
- src/modules/placements/tpo-prep-readiness-derived-service.ts(49,15): error TS2339: Property 'programId' does not exist on type 'string[]'.
- src/modules/projects/evaluation-service.ts(137,53): error TS2345: Argument of type '{ member: null; access: "ADMIN"; project: { id: string; collegeId: string; templateId: string; templateVersionId: string; teamGroupId: string | null; slug: string; title: string; summary: string | null; ... 17 more ...; updatedAt: Date; }; organizationId: string; collegeId: string; } | { ...; }' is not assignable to parameter of type '{ project: { id: string; }; collegeId: string; organizationId: string; access: "MENTOR" | "ADMIN"; }'.
- tests/integration/projects-adversarial.test.ts(1158,13): error TS2554: Expected 4 arguments, but got 3.
- tests/integration/projects-p6b-final-evaluation.test.ts(402,7): error TS2554: Expected 4 arguments, but got 3.
- tests/integration/projects-p6b-final-evaluation.test.ts(414,7): error TS2554: Expected 4 arguments, but got 3.
- tests/integration/projects-p6b-final-evaluation.test.ts(440,11): error TS2554: Expected 4 arguments, but got 3.
- tests/integration/projects-p6b-final-evaluation.test.ts(473,11): error TS2554: Expected 4 arguments, but got 3.
- tests/integration/projects-p6b-final-evaluation.test.ts(544,27): error TS2554: Expected 4 arguments, but got 3.
- tests/integration/projects-p6b-final-evaluation.test.ts(620,11): error TS2554: Expected 4 arguments, but got 3.
- tests/unit/PROJ-BREAK-chat6-submission-http-race.test.ts(30,54): error TS2322: Type 'NextResponse<{ error: string; }>' is not assignable to type 'NextResponse<{ message: string; requestId: string; }>'.
- tests/unit/PROJ-BREAK-chat9-sa-student-lookup-tenant.test.ts(42,19): error TS2741: Property 'organizationId' is missing in type '{ collegeId: string; }' but required in type 'AdminScope'.
- tests/unit/chat12-tpo-roster-legacy-stage-matrix.test.ts(7,26): error TS2352: Conversion of type '{ membershipId: string; branchId: string; branchName: string; registrationOpen: false; registeredForPlacements: false; participationStatus: "ELIGIBLE"; debarred: false; verification: { status: "VERIFIED"; waitingSections: never[]; verifiedSections: never[]; }; offersAwaitingAnswer: number; ambiguousSection: false; r...' to type 'TpoStudentRow' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
- tests/unit/chat13-platform-placement-policy-read-service.test.ts(63,29): error TS2367: This comparison appears to be unintentional because the types '"interview.overlapWindowMinutes" | "interview.overlapBufferMinutes" | "interview.durationMinMinutes" | "interview.durationMaxMinutes" | "placement.applyRateLimitPerMinute" | "placement.staleAppliedDays" | "placement.closingSoonDays" | "placement.lowConversionThreshold" | "placement.needsAttentionSampleCap"' and '"unrelated.tenant.setting"' have no overlap.
- tests/unit/chat16-messaging-receipt-history-service-16.test.ts(22,65): error TS2345: Argument of type 'undefined' is not assignable to parameter of type 'RequestContext'.
- tests/unit/chat16-tpo-campaign-draft-live-role-16.test.ts(31,65): error TS2345: Argument of type 'undefined' is not assignable to parameter of type 'RequestContext'.
- tests/unit/chat4-super-admin-colleges-bulk-service-behaviour.test.ts(25,18): error TS2741: Property 'collegeId' is missing in type '{ organizationId: string; }' but required in type 'AdminScope'.
- tests/unit/chat4-superadmin-tenant-lifecycle-actor.test.ts(51,31): error TS2502: 'tx' is referenced directly or indirectly in its own type annotation.
