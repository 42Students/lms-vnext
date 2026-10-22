# CI fix packet (round 1): src/modules/courses/learner-assessment-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/courses/learner-assessment-service.ts

- [tsc] line 80:49 error TS2448: Block-scoped variable 'courses' used before its declaration.
- [tsc] line 80:49 error TS2454: Variable 'courses' is used before being assigned.
- [tsc] line 80:57 error TS2339: Property 'id' does not exist on type '{ id: string; name: string; code: string; }[]'.
- [tsc] line 80:65 error TS2448: Block-scoped variable 'courses' used before its declaration.
- [tsc] line 80:65 error TS2454: Variable 'courses' is used before being assigned.
- [tsc] line 80:73 error TS2339: Property 'slug' does not exist on type '{ id: string; name: string; code: string; }[]'.
- [tsc] line 80:83 error TS2448: Block-scoped variable 'courses' used before its declaration.
- [tsc] line 80:83 error TS2454: Variable 'courses' is used before being assigned.
- [tsc] line 80:91 error TS2339: Property 'code' does not exist on type '{ id: string; name: string; code: string; }[]'.
- [tsc] line 81:13 error TS2345: Argument of type '{ id: string; name: string; code: string; }[]' is not assignable to parameter of type 'SQL<unknown> | PgTable<TableConfig> | Subquery<string, Record<string, unknown>> | PgViewBase<string, boolean, ColumnsSelection>'.
- [tsc] line 81:13 error TS2448: Block-scoped variable 'courses' used before its declaration.
- [tsc] line 81:13 error TS2454: Variable 'courses' is used before being assigned.
- [tsc] line 81:36 error TS2448: Block-scoped variable 'courses' used before its declaration.
- [tsc] line 81:36 error TS2454: Variable 'courses' is used before being assigned.
- [tsc] line 81:44 error TS2339: Property 'id' does not exist on type '{ id: string; name: string; code: string; }[]'.
