# CI fix packet (round 1): src/components/placements/placement-operations-overview.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/components/placements/placement-operations-overview.tsx

- [tsc] line 46:33 error TS2322: Type '{ code: "STALE_APPLICATIONS" | "INTERVIEW_UNSCHEDULED" | "OFFERED_NO_LETTER" | "CLOSING_SOON_LOW_CONVERSION"; jobId: unknown; jobTitle: unknown; companyName: unknown; count: number; priority: QueuePriority; }[]' is not assignable to type 'readonly Attention[]'.
- [tsc] line 47:52 error TS2322: Type '{ code: "STALE_APPLICATIONS" | "INTERVIEW_UNSCHEDULED" | "OFFERED_NO_LETTER" | "CLOSING_SOON_LOW_CONVERSION"; jobs: number; affected: number; samples: { code: "STALE_APPLICATIONS" | "INTERVIEW_UNSCHEDULED" | "OFFERED_NO_LETTER" | "CLOSING_SOON_LOW_CONVERSION"; ... 4 more ...; priority: QueuePriority; }[]; }[]' is not assignable to type 'readonly CategoryRead[]'.
