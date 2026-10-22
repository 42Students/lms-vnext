# CI fix packet (round 4): src/app/(authenticated)/learn/my-placements/support/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/learn/my-placements/support/page.tsx

- [tsc] line 83:13 error TS2339: Property 'hasMore' does not exist on type '{ generalAvailable: boolean; items: LearnerUnifiedRequestHistoryItem[]; page: number; pageSize: number; total: number; totalPages: number; olderPage: number | null; hasPrevious: boolean; }'.
