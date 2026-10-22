# CI fix packet (round 4): src/app/(authenticated)/learn/calendar/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/learn/calendar/page.tsx

- [tsc] line 39:5 error TS2322: Type '{ sections: never[]; courses: never[]; events: never[]; courseLookupWarning: null; }' is not assignable to type '{ sections: never[]; courses: never[]; events: never[]; courseLookupWarning: string | null; lookupStatus: "UNASSIGNED" | "LOOKUP_FAILED"; } | { sections: { sectionId: string; sectionName: string; ... 6 more ...; periodStatus: "ACTIVE" | ... 1 more ... | "CLOSED"; }[]
