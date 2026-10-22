# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-company-report-archive-31.test.ts (1 failing)
- HR-REPORT-ARCHIVE-31 published/closed company report portfolio parity > HR-REPORT-MEMBER-42 counts only shortlisted ACTIVE college members with ACTIVE student accounts

  ```
  AssertionError: expected 'const reportCounts = jobIds.length ==…' to contain 'eq(collegeMemberships.collegeId,'
  - Expected
  + Received
  - eq(collegeMemberships.collegeId,
  + const reportCounts = jobIds.length === 0
  +     ? []
  +     : await db
  +         .select({
  ```

## tests/unit/HR-BREAK-chat15-tracker-audit-page-58.test.ts (9 failing)
- HR-TRACKER-PAGE-58: admin-only findings route resilient states > invalid filters {"page":["1","2"]} give a reset link without making an audit query

  ```
  
  ```
- HR-TRACKER-PAGE-58: admin-only findings route resilient states > invalid filters {"page":"0"} give a reset link without making an audit query

  ```
  
  ```
- HR-TRACKER-PAGE-58: admin-only findings route resilient states > invalid filters {"view":"PRIVATE"} give a reset link without making an audit query

  ```
  
  ```
- HR-TRACKER-PAGE-58: admin-only findings route resilient states > invalid filters {"q":["one","two"]} give a reset link without making an audit query

  ```
  
  ```
- HR-TRACKER-PAGE-58: admin-only findings route resilient states > invalid filters {"area":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"} give a reset link without making an audit query

  ```
  
  ```
- HR-TRACKER-PAGE-58: admin-only findings route resilient states > invalid filters {"status":"UNKNOWN"} give a reset link without making an audit query

  ```
  
  ```
- HR-TRACKER-PAGE-58: admin-only findings route resilient states > invalid filters {"collegeId":"forged"} give a reset link without making an audit query

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- HR-TRACKER-PAGE-58: admin-only findings route resilient states > reads only after admin authorization and exposes an explicit empty result

  ```
  TypeError: Cannot read properties of undefined (reading 'CRITICAL')
  ❯ src/app/(authenticated)/tracker/audit-findings/page.tsx:123:16
  121|    items={FINDING_SEVERITIES.map(severity=>({
  122|     key:severity,label:severity[0]+severity.slice(1).toLowerCase()+" o…
  123|     count:data.severityOpenCounts[severity]??0,
  |                ^
  124|     href:independentFindingHref({...parsed,view:"OPEN",severities:[sev…
  125|    }))}/>
  ```
- HR-TRACKER-PAGE-58: admin-only findings route resilient states > preserves the persisted finding's id and authorized detail link

  ```
  TypeError: Cannot read properties of undefined (reading 'CRITICAL')
  ❯ src/app/(authenticated)/tracker/audit-findings/page.tsx:123:16
  121|    items={FINDING_SEVERITIES.map(severity=>({
  122|     key:severity,label:severity[0]+severity.slice(1).toLowerCase()+" o…
  123|     count:data.severityOpenCounts[severity]??0,
  |                ^
  124|     href:independentFindingHref({...parsed,view:"OPEN",severities:[sev…
  125|    }))}/>
  ```

## tests/unit/HR-BREAK-chat19-mail-redirect-boundary.test.ts (1 failing)
- HR-BREAK-MAIL-REDIRECT-13: recruiter digest must reject provider redirects > sends one bounded nonredirecting POST, with sanitized digest text and scoped Reply-To

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/PROJ-BREAK-FACULTY-06.test.ts (1 failing)
- PROJ-BREAK-FACULTY-06 meeting revisions, duplicate submits and notification integrity > PROJ-BREAK-FACULTY-06-07 cancelling an unsent draft cannot notify learners or create false meeting announcements

  ```
  AssertionError: expected { projectStatus: 'ACTIVE', …(9) } to match object { writes: 1, events: +0, …(1) }
  (7 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "events": 0,
  +   "events": 1,
  "notifications": 0,
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-project-pages-hardening.test.tsx (1 failing)
- Mentor project page-level failure and permission boundaries > PROJ-BREAK-MENTOR-243 duplicated review filters never reach data service

  ```
  AssertionError: expected '<div class="min-w-0 max-w-full space-…' to contain 'Invalid project review filters'
  Expected: "Invalid project review filters"
  Received: "<div class="min-w-0 max-w-full space-y-4 md:space-y-6"><header><h1>Delivery review overview</h1><p>Atlas · ACTIVE</p><a href="/mentor/projects/11111111-1111-4111-8111-111111111111?tab=delivery">Delivery workspace</a></header><section data-slot="filter-bar" data-open="false" data-active-co
  ```

## tests/unit/PROJ-BREAK-chat3-faculty-role-journey.test.ts (1 failing)
- PROJ-BREAK-chat3-FACULTY-01 project role boundary and access journeys > Faculty-only accounts cannot discover project IDs or trigger project SQL reads

  ```
  AssertionError: expected ProjectsServiceError: PROJECT_LIFECYCLE_A… { code: '…' } to match object { code: 'PROJECT_ACCESS_DENIED' }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "PROJECT_ACCESS_DENIED",
  + ProjectsServiceError {
  +   "code": "PROJECT_LIFECYCLE_ACCESS_DENIED",
  ```
