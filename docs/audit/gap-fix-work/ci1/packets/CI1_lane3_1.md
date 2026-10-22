# CI fix packet (round 1): scripts/db-e2e-prepare.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: scripts/db-e2e-prepare.ts

- [tsc] line 398:15 error TS2741: Property 'taskType' is missing in type '{ key: string; sprintKey: string; title: string; priority: "MEDIUM"; sequence: number; }' but required in type '{ key: string; title: string; taskType: "STORY" | "BUG" | "CHORE" | "SPIKE"; priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; sequence: number; sprintKey?: string | null | undefined; ... 5 more ...; estimatePoints?: number | undefine
