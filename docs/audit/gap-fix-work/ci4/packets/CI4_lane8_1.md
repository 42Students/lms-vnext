# CI fix packet (round 4): src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx

- [tsc] line 106:9 error TS2322: Type 'string' is not assignable to type 'EmploymentType'.
- [tsc] line 107:9 error TS2322: Type 'string' is not assignable to type 'WorkMode'.
- [tsc] line 109:53 error TS2322: Type 'string' is not assignable to type 'ApplicationMode'.
- [tsc] line 126:9 error TS2322: Type 'string' is not assignable to type '"ALLOW_WITH_FLAG" | "REQUIRE_COMPLETE"'.
- [tsc] line 150:41 error TS2322: Type 'string' is not assignable to type '"FULL_TIME" | "INTERNSHIP" | "CONTRACT"'.
- [tsc] line 151:7 error TS2322: Type 'string' is not assignable to type '"ONSITE" | "HYBRID" | "REMOTE"'.
