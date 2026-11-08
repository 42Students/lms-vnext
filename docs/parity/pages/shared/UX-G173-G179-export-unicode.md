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
- **Group coverage:** These repairs cover 1 of 15 `UX-G173` source files and 9 of 15 `UX-G179` source files. The remaining registered surfaces must also pass scoped review before either **whole group** can be marked DONE.

No release security certification is claimed by this export polish.
