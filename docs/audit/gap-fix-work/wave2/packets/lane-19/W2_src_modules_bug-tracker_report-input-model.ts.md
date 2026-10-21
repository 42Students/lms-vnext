# Work packet (wave 2): edit src/modules/bug-tracker/report-input-model.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u002-tracker-report.md, docs/audit/gap2/lane-4/bug-report-model.md

## G2-16-002-028  [P2] GAP  facet F06  effort S
- Legacy: `index.js:301-315`: required text 1–4000, autosize 5–10, character count.
- vNext now: `tracker-report-form.tsx:204-209`; `report-input-model.ts:17-18`: required, 4000 max, six-row textarea.
- Fix: Restore auto-resize and counter, keep same max.

## G2-16-002-063  [P2] GAP  facet F14  effort S
- Legacy: `index.js:321-328`: optional evidence URL always displayed, accepts HTTP/HTTPS, max1000.
- vNext now: `tracker-report-form.tsx:210-218`; `report-input-model.ts:19`: HTTP/HTTPS max1000 but disclosure collapsed.
- Fix: Show evidence directly with exact helper and max field error.

## G2-16-002-087  [P2] GAP  facet F22  effort M
- Legacy: `BugReport.java:25-69`; `BugReportCreateRequest.java:9-41`: reporter/account/environment/location/type/description/severity/evidence and optional source fields.
- vNext now: `db10-bug-tracker.ts:59-73`; `report-input-model.ts:6-19`: fields preserved in Drizzle, but sourceUrl/path/browser/viewport cannot be submitted by current form.
- Fix: Either support optional captured source metadata in API/quick report or document retained read-only fields.

## G2-4-021-007  [P2] MISSING  facet F03  effort M
- Legacy: Legacy sourceUrl/sourcePath/browser/viewport optional for automatic bug context. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:55-65`)
- vNext now: New report table has columns, but public intake validator lacks these properties and write omits them. (`src/db/schema/db10-bug-tracker.ts:69-72`; `src/modules/bug-tracker/report-input-model.ts:6-20`; `src/modules/bug-tracker/report-service.ts:31-46`)
- Fix: Capture safe browser,viewport and source context from authenticated application.

## G2-4-021-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy evidence_link1000, source_url2000, source_path500, browser500, viewport64. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:52-65`)
- vNext now: New columns same lengths, but intake exposes only evidenceLink. (`src/db/schema/db10-bug-tracker.ts:68-72`; `src/modules/bug-tracker/report-input-model.ts:19-20`)
- Fix: Wire remaining context fields with safe allowlist.

## G2-4-021-021  [P2] GAP  facet F06  effort M
- Legacy: Legacy intake creates report with required fields plus optional evidence/source environment context. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/bugtracker/BugReportCreateRequest.java:8-41`)
- vNext now: New strict report schema rejects sourceUrl/sourcePath/browser/viewport properties. (`src/modules/bug-tracker/report-input-model.ts:6-20`)
- Fix: Add validated optional diagnostic context without trusting secrets from URL.

## G2-4-021-024  [P2] GAP  facet F06  effort M
- Legacy: Legacy reporter name may be any nonblank string <=120. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/bugtracker/BugReportCreateRequest.java:9-10`)
- vNext now: New must belong to REPORTER_OPTIONS whitelist, not just nonblank. (`src/modules/bug-tracker/report-input-model.ts:6-9`)
- Fix: Confirm old reporter-name picker set; allow authorized additions safely.

## G2-4-021-053  [P2] GAP  facet F18  effort M
- Legacy: Legacy issue type/page/reporter copy drawn from old frontend options. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/bugtracker/BugReportCreateRequest.java:8-26`)
- vNext now: New report schema uses choices from REPORTER_OPTIONS,ISSUE_TYPE_OPTIONS,LOCATION_OPTIONS. (`src/modules/bug-tracker/report-input-model.ts:2-20`)
- Fix: Verify exact option labels and historical vocabulary before parity.

## G2-4-021-059  [P2] GAP  facet F20  effort S
- Legacy: Legacy reporter name max120 and blank must be rejected. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/bugtracker/BugReportCreateRequest.java:9-10`)
- vNext now: New whitelist can reject formerly valid names even if <=120. (`src/modules/bug-tracker/report-input-model.ts:6-9`)
- Fix: Provide controlled allowlist updates, not silent data loss.

## G2-16-002-029  [P3] GAP  facet F06  effort S
- Legacy: `index.js:321-328`: evidenceLink optional url 1000 max with required hidden no extra condition.
- vNext now: `tracker-report-form.tsx:210-218`; `report-input-model.ts:19`: same optional http(s) URL max1000, collapsed by default.
- Fix: Match always-visible optional field and helper.
