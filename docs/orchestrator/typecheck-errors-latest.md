# Typecheck errors (CI b813876c, refreshed by orchestrator)

Production typecheck: PASS. Lint: PASS (0 errors). Test-file typecheck (non-blocking) has these errors; fix in your own files:

- tests/unit/HR-BREAK-chat15-round-service-03.test.ts(48,49): error TS2502: 'tx' is referenced directly or indirectly in its own type annotation.
- tests/unit/chat7-course-resource-materials-weak.test.ts(37,10): error TS2322: Type '{} | { DB05_RESOURCE_MATERIALS_READY: string; }' is not assignable to type 'ProcessEnv'.
- tests/unit/chat7-course-resource-materials-weak.test.ts(40,38): error TS2345: Argument of type '{ DB05_RESOURCE_MATERIALS_READY: string; }' is not assignable to parameter of type 'ProcessEnv'.
