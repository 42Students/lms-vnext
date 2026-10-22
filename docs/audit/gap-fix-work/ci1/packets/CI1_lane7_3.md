# CI fix packet (round 1): src/modules/courses/faculty-course-list-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/courses/faculty-course-list-service.ts

- [tsc] line 24:43 error TS2448: Block-scoped variable 'sections' used before its declaration.
- [tsc] line 24:43 error TS2454: Variable 'sections' is used before being assigned.
- [tsc] line 24:52 error TS2339: Property 'id' does not exist on type 'Map<string, string>'.
- [tsc] line 24:67 error TS2448: Block-scoped variable 'sections' used before its declaration.
- [tsc] line 24:67 error TS2454: Variable 'sections' is used before being assigned.
- [tsc] line 24:76 error TS2339: Property 'name' does not exist on type 'Map<string, string>'.
- [tsc] line 35:15 error TS2345: Argument of type 'Map<string, string>' is not assignable to parameter of type 'SQL<unknown> | PgTable<TableConfig> | Subquery<string, Record<string, unknown>> | PgViewBase<string, boolean, ColumnsSelection>'.
- [tsc] line 35:15 error TS2448: Block-scoped variable 'sections' used before its declaration.
- [tsc] line 35:15 error TS2454: Variable 'sections' is used before being assigned.
- [tsc] line 35:31 error TS2448: Block-scoped variable 'sections' used before its declaration.
- [tsc] line 35:31 error TS2454: Variable 'sections' is used before being assigned.
- [tsc] line 35:40 error TS2339: Property 'id' does not exist on type 'Map<string, string>'.
- [tsc] line 36:9 error TS2448: Block-scoped variable 'sections' used before its declaration.
- [tsc] line 36:9 error TS2454: Variable 'sections' is used before being assigned.
- [tsc] line 36:18 error TS2339: Property 'cohortId' does not exist on type 'Map<string, string>'.
- [tsc] line 37:9 error TS2448: Block-scoped variable 'sections' used before its declaration.
- [tsc] line 37:9 error TS2454: Variable 'sections' is used before being assigned.
- [tsc] line 37:18 error TS2339: Property 'academicPeriodId' does not exist on type 'Map<string, string>'.
