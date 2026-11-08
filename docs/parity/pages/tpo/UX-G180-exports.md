# UX-G180 — Learner and TPO batch/company export UX

- Audited all 15 registered outbound files: learner applications, safe cells and offers; TPO audit and batch history, registration, filtered roster and student exports; calendar, company directory, drives, engagement, company reporting, drive applications and drive list.
- Five serializers lacked full Unicode formula guards; now use the established shared spreadsheet formula neutralizer. The learner-specific cleanup of invisible format/control codepoints is preserved to avoid breaking the established export behavior.
- Bad imported company-drive timestamps no longer crash CSV generation; display Not recorded in year/date fields. No authorization, tenant scope, selected rows, fields or query filters changed.
- Pre-existing safer serializers and authorized export services were retained without changes.
- Test proof: focused Vitest, prior learner/batch export tests, Playwright desktop 1280px/mobile 390px real-serializer downloads and screenshots on synthetic development-only fixture. Synthetic files alone do not prove live tenant boundaries.
- Do not mark DONE until exact source SHA lint, full TypeScript, unit and Chromium checks all pass.

## Verified closure (2026-11-08)
- Source commit: e53ef924c632acf93f836e0f464509e28290d35e
- Exact-SHA CI: https://github.com/42Students/lms-vnext/actions/runs/42451651599 — success including lint, full TS, unit and existing regressions, Chromium desktop 1280px and mobile 390px
- Browser artifact: 13605184187. Synthetic download validation does not independently attest live role/tenant security; those production guards remain unchanged.
