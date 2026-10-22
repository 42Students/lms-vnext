# CI fix packet (round 4): src/app/(authenticated)/college/projects/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/college/projects/page.tsx

- [tsc] line 64:9 error TS18048: 'query.page' is possibly 'undefined'.
- [tsc] line 103:52 error TS2345: Argument of type 'ProjectAdminCollectionQuery' is not assignable to parameter of type '{ q?: string | undefined; status?: "ACTIVE" | "ARCHIVED" | "PLANNED" | "COMPLETED" | "BLOCKED" | "READY" | "IN_PROGRESS" | undefined; view: "table" | "cards"; page: number; pageSize: number; }'.
