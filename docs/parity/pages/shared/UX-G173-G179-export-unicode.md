# UX-G173 and UX-G179 — College content and recruiter export safety

**Canonical tracker:** `docs/tracker.json#uxReview.groups`  
**Owner:** `chat-ux-easy-10-20261108`  
**Current state:** DOING — not closed; focused tests and real desktop/mobile download proof remain outstanding.

## Scoped implementation (8 November 2026)

- **UX-G173:** `src/modules/courses/college-content-csv-model.ts` now calls the existing `spreadsheetCsvCell` for both contemporary content CSV and the legacy lesson-content CSV. Column sequence, quoted output and row selection are unchanged.
- **UX-G179:** Nine recruiter exports now delegate spreadsheet cell quoting to the same existing helper, preserving their limits, notices, field selection, existing IST formatting, masked applicant contacts and authorized row population:
  - `hr-applicant-export-model.ts`
  - `hr-activity-csv-model.ts`
  - `hr-calendar-export-model.ts`
  - `hr-company-report-export-model.ts`
  - `hr-drive-proposal-export-model.ts`
  - `hr-drives-csv-model.ts`
  - `hr-inbox-csv-model.ts`
  - `hr-offer-export-model.ts`
  - `hr-team-csv-model.ts`

The older ad-hoc guards tested only ASCII whitespace before =, +, -, @. Unicode format characters and combining marks could hide a formula prefix. The pre-existing shared helper checks these invisible prefixes, avoids a second independently maintained escaping path, and preserves RFC 4180 quote doubling.

## Regression evidence and pending gates

- **Authored:** `tests/unit/ux-g173-g179-csv-unicode-regression.test.ts` calls both college content exports and all nine recruiter exports with Unicode-invisible formula prefixes. It also checks benign text, quote escaping, headings and that private applicant email is not emitted.
- **Execution:** Not yet verified by a successful exact-SHA Vitest run. GitHub's combined commit status endpoint returned no statuses for the submitted commits; that is **not** a passing CI result.
- **Required focused checks:** `npx vitest run tests/unit/ux-g173-g179-csv-unicode-regression.test.ts tests/unit/hr-applicant-export-model.test.ts tests/unit/hr-team-csv-model.test.ts tests/unit/HR-BREAK-reports-01.test.ts`; `npm run typecheck`; changed-source lint, UX group board validation.
- **Required browser checks:** With authorized College Admin/Recruiter test sessions, download and inspect full/empty/capped CSVs on desktop (1280px) and mobile (390px). Verify correct filenames and headers, safe quoting on a seeded Unicode formula value, role/tenant-negative access, that exports do not reveal contacts outside policy, and that existing filter controls and return navigation still work.
- **Regression/security review:** This change touches pure export formatting only; no permissions, request parsing, business state transitions, row selection, tenant scopes, API response headers or database queries were edited. Consumer route and authorization checks still need run-time confirmation before closure.
- **Group coverage:** These repairs now change **3 of 15** `UX-G173` source files and **10 of 15** `UX-G179` source files. All remaining registered source files are reviewed below, but an executed whole-group gate is still required before either group may be marked DONE.

No release security certification is claimed by this export polish.

## Further implementation and scope review — 8 November 2026

The second pass added further noncosmetic changes and tests:

- `college-assessment-export-service.ts`: rejects invalid page metadata, changed totals/page counts/college scope, incomplete responses, oversized pages and duplicate IDs as `COLLEGE_ASSESSMENT_EXPORT_STALE`. No partial download is returned after detecting observable drift; an actual database snapshot transaction is not claimed.
- `faculty-quiz-csv-cap.ts`: nonfinite internal row limits recover to the documented 500-row cap rather than emitting an unexplained empty report. Finite caller-selected limits still respect the same bounds.
- `hr-company-report-export-model.ts`: invalid total metadata cannot yield a `NaN` omitted-row count; valid report totals and the 200-row limit are preserved.
- `company-share/audit-csv-model.ts`: uses `spreadsheetCsvCell` to protect Unicode spacing-mark prefixes. The real HTTP route already adds a UTF-8 BOM, so **the model deliberately does not add one**; the development fixture emulates the route-level prefix exactly once.
- `hr-drive-proposal-export-model.ts`: now adds one UTF-8 BOM at the serializer because its actual API route does not add one. Private proposal descriptions and message bodies remain excluded.

**Every G173 registered source file reviewed:** assessment model/service (page-vs-all, role-aware kind filters, 1,000-row cap), content CSV/model/service (content filtering, stable 1,000-row pager), course catalogue model (bounded filtered catalogue), lessons model/service (pagination and filters), progress model/service (college-admin authorization and scoped service reads), faculty quiz row cap/service (persisted scoped results and 500-row cap), question CSV model/service (aggregate question accuracy only), faculty request/service (strict URL query and persisted faculty Section scope). No role grants, tenant scopes, API routes, database writes or external dependencies were altered in these unmodified files.

**Every G179 registered source file reviewed:** admin company directory exporter (explicit non-sensitive columns), applicant projection/service (persisted per-job and college scope; no third-party contacts), college directory CSV (same shared guard and blank unavailable contacts), share audit model/response headers (cap notice, no-referrer/no-store), and nine recruiter modules (activity, applicants, calendar, report, proposals, drives, inbox, offers, team). The nine recruiter exports preserve documented 200-row caps or caller-scoped page behavior, selected field sets, IST timestamps, masked contact, and existing footer/omitted signals. The actual company-share API adds the UTF-8 BOM at its response boundary.

**Added authored tests:**

- `tests/unit/ux-g173-assessment-export-snapshot.test.ts` — valid stable two-page export; total drift; college drift; duplicate row; incomplete page; oversized first page.
- `tests/unit/ux-g179-audit-proposals-regression.test.ts` — Unicode spacing-mark neutralization, first-row cap notice, BOM in proposal history, empty header-only file, and public link privacy headers.
- `tests/unit/ux-g173-g179-export-count-guards.test.ts` — NaN/infinite quiz limit and malformed recruiter total coverage.
- `tests/e2e/ux-g173-g179-csv.spec.ts` — real serializers behind a strictly development-only synthetic fixture; fourteen downloads at 1280×800 and 390×844, 44px actions, zero horizontal overflow/JS errors, UTF-8 bytes, formula guards, empty/capped output.

**Exact-SHA workflow:** `.github/workflows/ux-g173-g179-export-acceptance.yml` checks scoped ESLint, full TypeScript, focused and existing Vitest regressions, Chromium downloads and publishes a GitHub commit status with run URL. The workflow uses minimal `contents: read` and `statuses: write` permissions; it does not touch live data. Source commit alone is not a passing test result.

**Acceptance still required:** verify the successful exact-SHA check and browser run/artifacts, review the changed route download filenames and headers after both desktop/mobile runs, and record the real GitHub run URL/commit SHA. Synthetic fixture evidence does not independently prove authorized persisted college/recruiter HTTP access; security release and cross-tenant sign-off remain separate.

## Additional guarded page-export and immediate source-smoke evidence

- The assessment export's **PAGE** mode now also rejects malformed/oversized source pages and a mismatched server page number, without silently labelling a different page as the requested one. Two more negative cases were added to the current-page regression suite.
- On 8 November 2026, nine isolated JavaScript behavioral checks **passed** against the then-current GitHub source blobs, after stripping TypeScript syntax for in-memory execution: `spreadsheetCsvCell` Unicode spacing prefix; company-share audit quoting/BOM placement/notice row; recruiter proposal BOM and Unicode safety; faculty quiz NaN/infinite cap handling; recruiter report NaN and valid-total handling. This is limited, useful **source-smoke evidence**—not an executed Vitest/TypeScript/Playwright acceptance run, nor a substitute for the exact-SHA closure gate.
- The dedicated workflow now posts a commit status and run URL when it starts and ends. Concurrency cancels superseded main-branch runs so parallel updates do not spend unnecessary runner minutes. Do not mark these groups DONE from an absent, pending or failed status.

## Additional isolated multi-page behavior checks

Seven further source-function tests passed under in-memory JavaScript execution of fetched `college-assessment-export-service.ts` (blob `4d14e7c551f2e89c8b223b796034bf3ea831cc40`): stable two-page export, changed totals, duplicate row IDs, changed college scope, missing final page data, oversized current-page data and mismatched current-page identity. The executable used mocked schema/reader dependencies, so **the total is now 16/16 isolated source-smoke checks**, not a claim of repository Vitest, authorized database access or responsive browser execution. The dedicated GitHub Actions acceptance job remains the required whole-group closure gate.

## Browser fixture failure and remedy — 8 November 2026

- [First exact-SHA run 42462222692](https://github.com/42Students/lms-vnext/actions/runs/42462222692) **FAILED browser acceptance**. Its checkout verification, dependency installation, scoped lint, complete TypeScript and all focused Vitest regressions **passed**. Both desktop/mobile Chromium cases timed out waiting for the `download` event when clicking the fixture's `data:text/csv` anchors. The failed run is preserved as evidence of the unverified UI, **not** a closure.
- The fixture now reuses the same `Blob`, `URL.createObjectURL`, temporary `<a download>` click, and deferred cleanup pattern as the actual `CollegeContentCsvExport` UI. It is a development-only test component; no authenticated route, tenant query, production feature or security policy was relaxed.
- The Playwright spec now interacts with an accessible **button** and checks its `data-filename` before expecting an actual downloaded file. The workflow's scope and ESLint include this new client component.
- [Replacement exact-SHA acceptance run 42463744495](https://github.com/42Students/lms-vnext/actions/runs/42463744495) was queued on commit `a6ac0187e64ccea4536455ac8a28f01eb1d649dd`. A successful result, screenshot/download artifacts and final checked SHA are required for DONE.
