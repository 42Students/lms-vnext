# CI fix packet (round 4): src/app/(authenticated)/college/placements/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/college/placements/page.tsx

- [tsc] line 146:20 error TS2741: Property 'empty' is missing in type '{ caption: string; rows: { id: string; title: string; status: string; applicationDeadline: Date | null; openings: number | null; type: string; locations: string[]; publishedAt: Date | null; ... 7 more ...; companyName: string; }[]; getRowKey: (row: { ...; }) => string; columns: ({ ...; } | ... 1 more ... | { ...; })...' but required in type 'DataT
