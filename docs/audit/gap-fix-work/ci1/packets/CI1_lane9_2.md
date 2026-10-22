# CI fix packet (round 1): src/app/api/courses/faculty/results/csv/route.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/api/courses/faculty/results/csv/route.ts

- [tsc] line 19:45 error TS2345: Argument of type '({ eligible: number | null; responded: number; pending: number | null; averagePercent: number | null; published: number; reportHref: string; id: string; kind: "ASSIGNMENT" | "QUIZ"; ... 7 more ...; dueAt: Date | null; } | { ...; })[]' is not assignable to parameter of type 'readonly FacultyExportRow[]'.
