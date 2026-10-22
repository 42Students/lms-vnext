# CI fix packet (round 1): src/modules/placements/legacy-job-read-adapter.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/placements/legacy-job-read-adapter.ts

- [tsc] line 32:39 error TS2551: Property 'candidatePreferences' does not exist on type '{ id: string; legacyJobId: number | null; legacySlug: string | null; legacySeasonId: number | null; legacyPostedAt: Date | null; legacyCreatorRole: string | null; legacyWasDeleted: boolean | null; ... 47 more ...; version: number; }'. Did you mean 'legacyCandidatePreferences'?
