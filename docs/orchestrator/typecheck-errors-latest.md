# Compile errors on main (cloud typecheck, tests included). Fix the ones in YOUR files first.

Production code is now checked separately from tests (tsconfig.tests.json), so test errors no longer block builds, but they still must be fixed. Typical causes: plain string where a union literal is required (use `as const`), reading a property the function does not return, wrong argument shape, env object typing (cast `as NodeJS.ProcessEnv`), request/context casts (use `as unknown as RequestContext`).

- src/modules/projects/mentor-release-write-service.ts
  - line 46 TS2339: Property 'title' does not exist on type '{ expectedUpdatedAt: string; } | { title: string; description?: string | null | undefined
  - line 46 TS2339: Property 'description' does not exist on type '{ expectedUpdatedAt: string; } | { title: string; description?: string | null | und
  - line 54 TS2339: Property 'title' does not exist on type '{ expectedUpdatedAt: string; } | { title: string; description?: string | null | undefined
  - line 54 TS2339: Property 'description' does not exist on type '{ expectedUpdatedAt: string; } | { title: string; description?: string | null | und
- tests/integration/placements-p8-offers.test.ts
  - line 470 TS2339: Property 'id' does not exist on type '{ offerId: string; status: string; joiningDate: string | null; reason: string | null; record
  - line 470 TS2339: Property 'id' does not exist on type '{ offerId: string; status: string; joiningDate: string | null; reason: string | null; record
- tests/unit/COURSES-BREAK-FACULTY-02.test.ts
  - line 7 TS2322: Type 'string | Uint8Array<ArrayBufferLike>' is not assignable to type 'BodyInit | null | undefined'.
- tests/unit/HR-BREAK-profile-01.test.ts
  - line 37 TS2345: Argument of type '{ companyId: string; grants: { collegeId: string; companyRelationshipId: string; }[]; }' is not assignable to pa
  - line 38 TS2345: Argument of type '{ companyId: string; grants: { collegeId: string; companyRelationshipId: string; }[]; }' is not assignable to pa
  - line 39 TS2345: Argument of type '{ companyId: string; grants: { collegeId: string; companyRelationshipId: string; }[]; }' is not assignable to pa
  - line 40 TS2345: Argument of type '{ companyId: string; grants: { collegeId: string; companyRelationshipId: string; }[]; }' is not assignable to pa
- tests/unit/PROJ-BREAK-FACULTY-02.test.ts
  - line 93 TS2322: Type '"SUSPENDED"' is not assignable to type '"ACTIVE" | "DISABLED"'.
- tests/unit/chat11-college-projects-role-journeys.test.ts
  - line 98 TS2322: Type '"DISABLED"' is not assignable to type '"ACTIVE" | "SUSPENDED" | "ENDED"'.
- tests/unit/chat7-course-resource-materials-weak.test.ts
  - line 37 TS2345: Argument of type '{} | { DB05_RESOURCE_MATERIALS_READY: string; }' is not assignable to parameter of type 'ProcessEnv | undefined'
  - line 39 TS2345: Argument of type '{ DB05_RESOURCE_MATERIALS_READY: string; }' is not assignable to parameter of type 'ProcessEnv'.
- tests/unit/chat7-learner-assignment-methods-weak.test.ts
  - line 17 TS2352: Conversion of type '{ membership: { roles: string[]; }; }' to type 'RequestContext' may be a mistake because neither type sufficie
