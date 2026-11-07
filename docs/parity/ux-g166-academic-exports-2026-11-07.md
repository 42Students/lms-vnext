# UX-G166 — Academics outbound copy and exports

Claimed by `chat-ux-academics-exports-2026-11-07` on `main`.

## Surfaces and scope

The canonical tracker assigns these 13 files to this one group:

- `college-academic-export-model.ts` and `college-academic-export-service.ts` — semesters and batches
- `college-classes-export-model.ts` and `college-classes-export-service.ts` — classes
- `college-directory-export-model.ts` — common safe CSV and pagination
- `college-elective-export-model.ts` and `college-elective-export-service.ts` — elective slots
- `college-faculty-assignment-export-model.ts` and `college-faculty-assignment-export-service.ts` — faculty course coverage
- `college-lecture-halls-export-model.ts` and `college-lecture-halls-export-service.ts` — hall directory
- `college-mapping-export-model.ts` and `college-mapping-export-service.ts` — offerings

All files are under `src/modules/academics/`. Group evidence is for the full 13-file inventory, not just the four changed implementation files.

## Improvements

1. CSV cells use the shared `spreadsheetCsvCell` guard. Unlike one-off regexes, it treats whitespace, controls, bidi formatting and all Unicode combining-mark categories as potentially hidden formula prefixes. Existing byte-level quotes and UTF-8 BOM are preserved.
2. Common CSV reports pad the explicit `EXPORT TRUNCATED` row to the same column count as the header. Users see what was omitted and how to narrow filters.
3. The classes export is bounded to 1,000 rows instead of reading arbitrarily many full database pages. It preserves the established eight columns, the existing authorized college filter, and now reports `X-Export-Truncated` and `X-Export-Row-Cap: 1000` accurately. This is a deliberate change from the previous unbounded behavior; existing class export tests were updated accordingly. Additional rows require narrower filters.
4. Common page collection rejects observable page-count/total drift, incomplete page coverage, impossible metadata and duplicate stable-ID rows. A consistent database snapshot would be necessary to detect all same-count substitutions; this is not claimed.
5. Lecture-hall export rejects observed count changes, incomplete results and duplicate room IDs while preserving original max 1,000 and both college/superadmin column sets.
6. Academic/batch, elective, assignment and offering service files reuse the updated common helper without changing their authorized source services, query validation or column identities.
7. No academic data or end-user role was invented. Existing admin permissions and authorization logic were not modified.

## Tests and browser proof required

- Focused unit: `npx vitest run tests/unit/ux-g166-academic-csv-acceptance.test.ts tests/unit/college-classes-export-model.test.ts tests/unit/chat4-college-admin-export-boundaries.test.ts tests/unit/chat4-college-export-signin-ledger.test.ts`.
- Scoped ESLint plus full `npm run typecheck`.
- Browser: `npx playwright test tests/e2e/ux-g166-academic-csv.spec.ts --project=chromium`, at 1280×800 and 390×844. Inspect screenshots, real CSV download files, control size, no horizontal overflow and lack of JS errors.
- Synthetic CSV fixture `/e2e/ux-g166-academic-csv` is available **only in development** with `UX_G166_FIXTURE=1`; it uses the production serializers but no live tenant data. It cannot stand in for a live authorization test.
- [Dedicated acceptance workflow](https://github.com/42Students/lms-vnext/actions/workflows/ux-g166-academic-csv-acceptance.yml) must pass on the exact committed SHA before DONE.
- Relevant DB integration tests must be executed against the authorized disposable database if they are used to claim tenant isolation; they are **not** marked passed merely because the source tests exist.

## Security and regression review

- The seven actual CSV download routes still require `auth: "user"` and `stepUp: true`. No permission checks or acting-college selections were removed.
- Real responses retain `text/csv`, attachment disposition, `private, no-store`, `nosniff` and truncation/cap response headers.
- Additional optional query keys (including caller-supplied `page` and `pageSize`) are rejected for class exports; server chooses its own pages.
- The common pagination helper has other consumers in the courses module; their focused tests and regression checks must remain green.
- No group should transition to DONE until completed exact-SHA unit, CI, desktop and mobile evidence is recorded in `docs/tracker.json#uxReview`.

## Verified scoped closure (2026-11-08)

- **DONE (export UX scope)**. [Dedicated exact-SHA acceptance run](https://github.com/42Students/lms-vnext/actions/runs/42415932747) succeeded for commit `551efef21f9fd943515ff8fc6204a1f7b84d22fe`.
- Scoped ESLint, full TypeScript, 4 Vitest suites / 30 cases, and 2/2 Chromium desktop/mobile synthetic download journeys passed, including actual UTF-8 CSV bytes, formula neutralization, row-cap display, 44px actions and overflow checks.
- Screenshots/download evidence: artifact `ux-g166-academic-csv-evidence`, ID `13591662042`.
- Code review covers all 13 registered models/services. The tested development-only fixture is **not** a live user/tenant login; independent database authorization and production release remain separate gates and are not claimed here.
