# CI fix packet (round 4): src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx

- [tsc] line 66:32 error TS2345: Argument of type '{ q: string; status: "SUBMITTED"; stage: "ASSESSMENT"; screening: "ALL"; source: "ALL"; page: number; }' is not assignable to parameter of type 'DriveApplicationsQuery'.
