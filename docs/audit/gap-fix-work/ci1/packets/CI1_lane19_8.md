# CI fix packet (round 1): src/components/tpo/tpo-team-messages-directory.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/components/tpo/tpo-team-messages-directory.tsx

- [tsc] line 209:8 error TS2741: Property 'kind' is missing in type '{ threadId: string; actorUserId: string; }' but required in type '{ threadId: string; actorUserId: string; kind: string; mentionMembers?: readonly Member[] | undefined; }'.
