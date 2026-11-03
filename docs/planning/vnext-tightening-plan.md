# vNext tightening plan

Written 2026-11-03. Start after the pixel parity work.

**Goal:** when something is wrong, the build or deploy fails before anyone sees it. No set of checks guarantees zero bugs, but these cover every type of error found on 2026-11-03.

**Related:** `docs/planning/part-f-exhaustive-testing-plan.md` is the wider testing program. Check its catalog before starting a step, and reuse anything that already exists.

## Why this exists

On 2026-11-03, opening real pages as real roles on dev found these, while typecheck and unit tests passed:

| Error | Why the checks missed it |
|---|---|
| `SELECT FOR SHARE` in a read-only transaction (TPO Drives, applicant pipeline and others) | Only Postgres rejects it, at runtime |
| Ambiguous `status` and `id` columns (retention report, hiring funnel) | Hand-written SQL is not validated by the compiler |
| `Checkbox` without `"use client"` (likely) | Pages that load per request are not rendered during the build |
| SMS log failing on every open | Page and API were never tested together |
| Hiring dashboard error | The page hid the error, so it was never logged |
| Invalid IDs crashing a page | Bad input was not tested |
| `Missing permission` crashes | No page and role test; the logs did not name the page |

The main causes: many tests only search source code for text, CI is usually red so new failures do not stand out, deploys do not require CI to pass, and nobody reads the logs after a deploy.

## The order

Each step depends on the ones before it. Do not start a new check while CI is red, because it will be ignored too.

### Phase 1: make CI trustworthy

1. **Fix the CI build.** Give the `build` job enough memory to finish, including its type check. It currently dies on GitHub runners.
2. **Zero lint errors.** Fix the existing errors, and allow no permanent skips.
3. **All CI green and required on `main`.** One red check blocks the merge.
4. **Deploy script checks CI.** Refuse a commit whose checks did not all pass. This is needed because the image build skips its type check (`SKIP_BUILD_TYPECHECK` in the `Dockerfile`), so CI is the only type check.
5. **Refuse pending migrations.** The deploy script stops if a migration is pending and not approved.

### Phase 2: make errors visible

6. **Log the page name with every server error.** 55 errors on 2026-11-03 could not be traced because this was missing.
7. **Clean the logs.** Remove false errors so one real error stands out.
8. **No hidden errors.** Any `catch` that shows a friendly message must also log the real error. Sweep the code, then enforce it in step 11.

### Phase 3: catch broken pages

9. **Page smoke test for every route and role.** Start the real app with seeded data, open all pages as each role, and fail on any 500, crash screen or server error in the logs. Start from the capture script used for the parity work. This gives the most value of any single step.
10. **Automatic check after deploy.** Run the smoke test on dev, count new errors in the logs, and roll back automatically if they increase. Alert on any new error type.

### Phase 4: catch whole types of bug

11. **Custom lint rules:**
    - No `catch` that hides an error without logging it
    - No `FOR SHARE` or `FOR UPDATE` helpers called in a read-only transaction
    - No `ref=` or event handlers in a file without `"use client"`
    - No plain `throw new Error()` for user input errors
    - No unqualified columns in hand-written SQL
12. **Real database tests for all SQL.** Run every query in the services against real Postgres, including with empty data and every filter.
13. **Migration tests.** Apply all migrations to a fresh database and a copy of the dev schema, and confirm the code matches the schema.
14. **API contract tests.** Call each API with valid, empty, wrong-type and malformed input. Bad input must return a 400, never a 500.
15. **Permission matrix tests.** Every role against every page and API, each expecting allowed, denied or redirected, never a crash.

### Phase 5: test real use

16. **Test the save flows.** On a throwaway database, as each role, actually create, edit and submit things. This is the biggest unknown, because the 2026-11-03 capture only tested viewing. Consider starting this early if a production date gets close.
17. **Click-through browser tests.** The main journeys for each role, opening real buttons, tabs and popups with real data, and failing on any browser console error or failed request.
18. **Visual comparison.** Compare key pages with approved old LMS screenshots, and fail above an agreed difference. Add this after pixel parity is reached, otherwise it fails on everything.

### Phase 6: keep it tight

19. **Every bug gets a real test.** A test that runs the behaviour, not one that searches the source code for text.
20. **Coverage counted by behaviour.** Every page, API and role must appear in the smoke and permission tests. A new page with no test fails the build.

## Cost

The repo is private, so all of this uses GitHub Actions minutes. Run fast checks on every push, and run the full page and browser tests nightly or before each deploy. No paid GCP resources are needed.
