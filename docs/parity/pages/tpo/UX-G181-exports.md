# UX-G181 — TPO placement CSV export UX

- Scope: all 14 registered outbound surfaces: eligibility preview, import parser, lead CSV import model/service, drive-day CSV, operations export, recruiter export, grant export, registration history, requests, round decisions, round failures, student roster and unplaced learner CSV.
- Defect: seven duplicate CSV escape implementations accepted invisible Unicode/combining-mark prefixes before spreadsheet operators. They now use the existing application-wide spreadsheet formula guard, with headers, column order and row scopes unchanged.
- Recruiter spreadsheet date formatting now produces an empty cell for an invalid timestamp instead of throwing and blocking the export. Clipboard TSV now guards invisible Unicode formula prefixes and strips control characters.
- Existing safer student CSV, placement report CSV, grant projection, CSV import parser, transactional import and registration event serializer were reviewed and intentionally retained.
- Tests: focused Vitest assertions for all seven changed serializers; existing TPO safe download and students CSV regression tests; Chromium synthetic real-serializer downloads at 1280px and 390px, screenshots and keyboard-size action controls.
- Security: no permission or tenant scope changed. The new proof route is denied in production and outside the explicit development test flag. Synthetic browser downloads do not prove live API authorization.
- Closure gate: exact SHA CI (lint, TypeScript, Vitest, browser) and evidence must pass before marking DONE.
