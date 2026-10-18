# Compile errors on main (cloud typecheck, tests included). Fix the ones in YOUR files first.

Production code passes. Test files are checked separately (tsconfig.tests.json) and must still be fixed. Typical causes: plain string where a union literal is required (use `as const`), reading a property the function does not return, wrong argument shape, env object typing (cast `as NodeJS.ProcessEnv`), request/context casts (`as unknown as RequestContext`), no line break before `as`.

- tests/unit/COURSES-BREAK-FACULTY-02.test.ts
  - line 7 TS2322: Type 'string | Uint8Array<ArrayBufferLike>' is not assignable to type 'BodyInit | null | undefined'.
- tests/unit/PROJ-BREAK-FACULTY-02.test.ts
  - line 92 TS2322: Type '"SUSPENDED"' is not assignable to type '"ACTIVE" | "DISABLED"'.
- tests/unit/chat3-faculty-gradebook-service-journey.test.ts
  - line 72 TS2322: Type '"SUSPENDED"' is not assignable to type '"ACTIVE" | "DISABLED"'.
- tests/unit/chat7-course-resource-materials-weak.test.ts
  - line 37 TS2345: Argument of type '{} | { DB05_RESOURCE_MATERIALS_READY: string; }' is not assignable to parameter of type 'ProcessEnv | undefined'
  - line 39 TS2345: Argument of type '{ DB05_RESOURCE_MATERIALS_READY: string; }' is not assignable to parameter of type 'ProcessEnv'.
- tests/unit/chat7-learner-assignment-methods-weak.test.ts
  - line 17 TS2352: Conversion of type '{ membership: { roles: string[]; }; }' to type 'RequestContext' may be a mistake because neither type sufficie
