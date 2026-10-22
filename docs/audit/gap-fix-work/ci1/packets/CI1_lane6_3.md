# CI fix packet (round 1): src/app/enterprises/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/enterprises/page.tsx

- [tsc] line 11:33 error TS2561: Object literal may only specify known properties, but 'maxImagePreview' does not exist in type 'Robots'. Did you mean to write 'max-image-preview'?
