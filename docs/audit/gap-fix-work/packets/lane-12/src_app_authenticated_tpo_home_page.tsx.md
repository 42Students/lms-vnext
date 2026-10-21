# Work packet: edit src/app/(authenticated)/tpo/home/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/l19-u022-tpo-hub-controller.md, docs/audit/gap2/lane-2/l19-u022-tpo-hub-controller.md, docs/audit/gap2/lane-6/l11-u014-tpo-home.md

## G2-19-022-003  [P1] GAP  facet F02  effort M
- Legacy: Home aggregates summary, needsYou, team asks, calendar, report filters (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:45-95; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:278-418).
- vNext now: Home renders separate reads for batch, operations, requests, students, unread, calendar in `src/app/(authenticated)/tpo/home/page.tsx:48-77`.
- Fix: Make legacy section ordering a side-by-side acceptance list; preserve `needsYou` priority, team asks and filtered season scope in page composition.

## G2-19-022-007  [P1] GAP  facet F04  effort M
- Legacy: Home payload includes `needsYou`, `team`, season-specific totals and report records (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:47-66,82-94; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:278-418).
- vNext now: `src/app/(authenticated)/tpo/home/page.tsx:50-73` merges distinct shapes; optional errors become null.
- Fix: Build field-to-field response parity sheet for `needsYou`, `numbers`, `thisWeek`, `companyFunnel`, `team` and distinct `seasonId`.

## G2-19-022-108  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/home.js:69-84 first-load error Retry, last successful snapshot on refresh failure
- vNext now: src/app/(authenticated)/tpo/home/page.tsx:50-73 each partial read catches and uses defaults; src/app/(authenticated)/tpo/home/page.tsx:179 inline info
- Fix: Keep partial failure explicit; never show fallback 0 as verified, use null/unknown on unavailable inputs

## G2-11-014-038  [P1] GAP  facet F12  effort S
- Legacy: Legacy needLine counts max(number needsYou cards, number rows with attention dots), so never says fewer than urgent tasks (homeRows.js:126-137).
- vNext now: vNext tpoHomeNeedsLine counts ONLY rows with needsAttention, can undercount multiple tasks in Drives and miss Next up priority (tpo-home-legacy-rows.ts:19-25; tpo/home/page.tsx:198-198).
- Fix: Use max(verified urgent task count, attention rows) as legacy, preserve exact grammar.

## G2-11-014-054  [P1] GAP  facet F20  effort M
- Legacy: Legacy loadInFlightRef serializes reads and retains old snapshot on failed refresh (home.js:28-47).
- vNext now: vNext refresh abort+inflight guards, per-source catch/null but can replace some metrics with defaults after completed SSR success (tpo-home-return-refresh.tsx:18-58; tpo/home/page.tsx:64-73).
- Fix: Do not replace verified snapshot counts with 0 on source failure, use per-field last-good/unavailable.
