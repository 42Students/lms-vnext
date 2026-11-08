# UX-G181 — TPO placement CSV export UX

- Scope: all 14 registered outbound surfaces: eligibility preview, import parser, lead CSV import model/service, drive-day CSV, operations export, recruiter export, grant export, registration history, requests, round decisions, round failures, student roster and unplaced learner CSV.
- Defect: seven duplicate CSV escape implementations accepted invisible Unicode/combining-mark prefixes before spreadsheet operators. They now use the existing application-wide spreadsheet formula guard, with headers, column order and row scopes unchanged.
- Recruiter spreadsheet date formatting now produces an empty cell for an invalid timestamp instead of throwing and blocking the export. Clipboard TSV now guards invisible Unicode formula prefixes and strips control characters.
- Existing safer student CSV, placement report CSV, grant projection, CSV import parser, transactional import and registration event serializer were reviewed and intentionally retained.
- Tests: focused Vitest assertions for all seven changed serializers; existing TPO safe download and students CSV regression tests; Chromium synthetic real-serializer downloads at 1280px and 390px, screenshots and keyboard-size action controls.
- Security: no permission or tenant scope changed. The new proof route is denied in production and outside the explicit development test flag. Synthetic browser downloads do not prove live API authorization.
- Closure gate: exact SHA CI (lint, TypeScript, Vitest, browser) and evidence must pass before marking DONE.

## Executed closure evidence (2026-11-08)

- Source SHA: c22794c6c315c17aa7a60a61afb1375f9c6facbd (main)
- Run: https://github.com/42Students/lms-vnext/actions/runs/42451404640 — success, checkout verified exact triggering SHA
- Passed: npm ci, scoped ESLint, full project TypeScript, new G181 Vitest plus prior TPO safe download / student CSV / round regression, Playwright Chromium 1280px and 390px download tests
- Artifact: 13605892613 (ux-g181-tpo-csv-browser), responsive screenshots and Playwright report
- Security assessment: existing production endpoints and authorization unchanged; browser fixture explicitly synthetic, not a cross-tenant permission substitute. Other release/security gates remain independent.
