# CI fix packet (round 1): src/app/api/placements/tpo/jobs/[jobId]/recruiter-review-invite/route.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/api/placements/tpo/jobs/[jobId]/recruiter-review-invite/route.ts

- [tsc] line 126:4 error TS2322: Type '(collegeId: string, leadId: string, token: string) => Promise<ProviderAcceptance>' is not assignable to type '(collegeId: string, leadId: string, token: string) => Promise<boolean>'.
