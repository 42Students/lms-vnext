# Work packet (wave 2): edit src/modules/placements/college-placement-student-lookup-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u002-student-placement-lookup.md

## G2-15-002-013  [P2] GAP  facet F04  effort M
- Legacy: Autocompletion label firstName + lastName, else contactMail, else `Student #id` (`StudentPlacementLookup.js:53-59`).
- vNext now: Search result uses `users.displayName`, rollNumber, email; title falls back roll/`Student` (`college-placement-student-lookup-service.ts:14-20`; `admin/placements/student-lookup/page.tsx:58-59`).
- Fix: Normalize first+last with contactMail and stable learner identifier fallback.

## G2-15-002-016  [P2] MISSING  facet F04  effort S
- Legacy: Shows localized Applied date for every row, fallback `-` for malformed/empty (`StudentPlacementLookup.js:197-201`; `dateUtils.js:9-14`).
- vNext now: `submittedAt` fetched but not rendered (`college-placement-student-lookup-service.ts:47-53`; `admin/placements/student-lookup/page.tsx:62-73`).
- Fix: Display submitted date in `DD MMM YYYY` in viewer local zone with '-' fallback.

## G2-15-002-022  [P2] GAP  facet F05  effort M
- Legacy: Search runs on name/email and cache searchable text (fuzzy/synonym documented), with college filter (`LearnerSearchService.js:3-24`; `LearnerSearchController.java:129-137`).
- vNext now: Name substring or exact roll/email, escaped SQL wildcards (`college-placement-student-lookup-service.ts:21-25`).
- Fix: Match case-insensitive partial email and searchable-text semantics; preserve tenant filter and query escaping.

## G2-15-002-045  [P2] GAP  facet F10  effort M
- Legacy: Typeahead `GET /api/v2/learners/search` with query, limit10, collegeId (`LearnerSearchService.js:3-24`; `StudentPlacementLookup.js:45-60`).
- vNext now: Server Drizzle membership search per GET page, up to15 full results (`college-placement-student-lookup-service.ts:11-27`).
- Fix: Split lightweight suggestion query from chosen student's heavy detail query.

## G2-15-002-054  [P2] GAP  facet F12  effort M
- Legacy: Candidate trigger min2 chars, 300ms debounce, max10 results; selection numeric learnerId (`StudentPlacementLookup.js:45-60,70-92`).
- vNext now: Trigger min3 max150, GET submit, 15 matches; IDs are UUID membership (`super-admin-placement-student-search-model.ts:5-15`; `college-placement-student-lookup-model.ts:1-10`; `college-placement-student-lookup-service.ts:14-25`).
- Fix: Match threshold/timing/count; translate identity mapping explicitly.

## G2-15-002-075  [P2] GAP  facet F20  effort S
- Legacy: Legacy date formatter interprets UTC timestamp in viewer locale and invalid→`-` (`dateUtils.js:9-14`).
- vNext now: No date rendering although submittedAt present (`college-placement-student-lookup-service.ts:47-53`; `admin/placements/student-lookup/page.tsx:62-73`).
- Fix: Normalize UTC dates, format IST/local per product decision, and handle malformed values.
