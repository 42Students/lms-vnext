# CI fix packet (round 1): src/modules/people/learner-profile-section-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/people/learner-profile-section-service.ts

- [tsc] line 59:35 error TS2345: Argument of type '{ id: string; educationType: string; program: string; specialization: string; institution: string; isCurrentlyPursuing: boolean; isRecentEducation: boolean; startYear: string; endYear: string; ... 5 more ...; examRank?: string | undefined; }[] | { ...; }[] | { ...; }[]' is not assignable to parameter of type 'readonly { id: string; educationType: string; program: st
