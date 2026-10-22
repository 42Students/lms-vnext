# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-calendar-page-85.test.tsx (2 failing)
- HR-CALENDAR-PAGE-85: recruiter role, malformed query and safe empty schedule > duplicate filter keys reject before reading private schedules

  ```
  AssertionError: expected '  Calendar    Invalid calendar filter…' to contain 'Invalid calendar filters.'
  Expected: "Invalid calendar filters."
  Received: "  Calendar    Invalid calendar filters Review the selected date, view and event filters.   "
  ```
- HR-CALENDAR-PAGE-85: recruiter role, malformed query and safe empty schedule > authorized empty week shows zero event counts without inventing an interview or result

  ```
  AssertionError: expected '  Calendar Rounds, interview slots, d…' to contain 'Results due'
  Expected: "Results due"
  Received: "  Calendar Rounds, interview slots, deadlines and results due, for your drives at this college.                  Today               Drives →         Calendar controls        28 Dec to 3 Jan 2099                     Jump to date                  Jump to date   *         Go to date      Ex
  ```

## tests/unit/HR-BREAK-chat15-team-attribution-50.test.ts (3 failing)
- HR-TEAM-ATTR-50: recruiter drive attribution is scoped and idempotent > checks the exact active relationship permission and refuses missing grant before SQL

  ```
  AssertionError: expected [Function] to throw error including 'FORBIDDEN' but got 'placements.recruiter.read'
  Expected: "FORBIDDEN"
  Received: "placements.recruiter.read"
  ```
- HR-TEAM-ATTR-50: recruiter drive attribution is scoped and idempotent > filters foreign jobs and deduplicates caller rows before request attribution

  ```
  Error: placements.recruiter.read
  ❯ Module.recruiterTeamAttributedDriveCounts src/modules/placements/recruiter-team-drive-count-service.ts:42:9
  40|  collegeId:string,relationshipId:string,authorizedJobs:readonly JobIte…
  41|  if(context.recruiter?.status!=="ACTIVE"||context.recruiter.userId!==c…
  42|   throw new AuthorizationError("placements.recruiter.read");
  |         ^
  43|  const grant=context.recruiter.grants.find(g=>
  44|    g.collegeId===collegeId&&g.companyRelationshipId===relationshipId);
  ```
- HR-TEAM-ATTR-50: recruiter drive attribution is scoped and idempotent > avoids touching persistence when no authorized jobs are in the requested scope

  ```
  AssertionError: promise rejected "Error: placements.recruiter.read" instead of resolving
  ❯ tests/unit/HR-BREAK-chat15-team-attribution-50.test.ts:85:6
  83|   await expect(recruiterTeamAttributedDriveCounts(context as never,col…
  84|    job("foreign-job","attacker",otherCollege),
  85|   ])).resolves.toEqual({});
  |      ^
  86|   expect(mocks.getDb).not.toHaveBeenCalled();
  87|  });
  ```

## tests/unit/HR-BREAK-chat19-legacy-job-aliases.test.ts (4 failing)
- HR-BREAK-chat19-legacy-navigation-job-page: authorize then redirect > an expired recruiter cannot load a URL-guessed hiring job

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  - }
  + <div
  +   className="min-w-0 space-y-4"
  ```
- HR-BREAK-chat19-legacy-navigation-job-page: authorize then redirect > legacy Messages redirect happens only after hiring job authorization

  ```
  AssertionError: expected [Function] to throw error including 'REDIRECT' but got 'Cannot read properties of undefined (…'
  Expected: "REDIRECT"
  Received: "Cannot read properties of undefined (reading 'rows')"
  ```
- HR-BREAK-chat19-legacy-navigation-job-page: authorize then redirect > retired recruiter college directory resolves to scoped Today, not an exposed index

  ```
  AssertionError: expected [Function] to throw an error
  - Expected:
  null
  + Received:
  undefined
  ```
- HR-BREAK-chat19-legacy-navigation-job-page: authorize then redirect > HR-BREAK-JOB-PRINCIPAL-27 rejects wrong-user recruiter before job reads

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  - }
  + <div
  +   className="min-w-0 space-y-4"
  ```

## tests/unit/HR-BREAK-tracker-pages-01.test.ts (3 failing)
- HR-BREAK-tracker-pages-01: reporter-owned routes and recovery > failed data fetch renders retry and does not masquerade as an empty list

  ```
  AssertionError: expected ' ' to contain 'We could not load your reports.'
  Expected: "We could not load your reports."
  Received: " "
  ```
- HR-BREAK-tracker-pages-01: reporter-owned routes and recovery > empty list has an actionable report route; persisted rows use encoded detail link

  ```
  AssertionError: expected ' ' to contain 'You have not reported any issues yet.'
  Expected: "You have not reported any issues yet."
  Received: " "
  ```
- HR-BREAK-tracker-pages-01: reporter-owned routes and recovery > detail view shows own report, non-secret severity and return path

  ```
  Error: [vitest] No "listMyTrackerReportHistory" export is defined on the "@/modules/bug-tracker/reporter-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/bug-tracker/reporter-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-meeting-version-cas.test.ts (7 failing)
- Legacy meeting transition optimistic concurrency, side effects and actors > PROJ-BREAK-MENTOR-389 stale client version is refused before project lock or notification

  ```
  AssertionError: expected Error: [vitest] No "isNull" export is def… { codeFrame: '…' } to match object { Object (code) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "PROJECT_MEETING_STALE_VERSION",
  + Error {
  +   "message": "[vitest] No \"isNull\" export is defined on the \"drizzle-orm\" mock. Did you forget to return it from \"vi.mock\"?
  ```
- Legacy meeting transition optimistic concurrency, side effects and actors > PROJ-BREAK-MENTOR-390 completion CAS pins the exact loaded status and millisecond revision

  ```
  Error: [vitest] No "isNull" export is defined on the "drizzle-orm" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("drizzle-orm"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- Legacy meeting transition optimistic concurrency, side effects and actors > PROJ-BREAK-MENTOR-391 concurrent version change rejects COMPLETE and rolls back event and notifications

  ```
  
  ```
- Legacy meeting transition optimistic concurrency, side effects and actors > PROJ-BREAK-MENTOR-391 concurrent version change rejects CANCEL and rolls back event and notifications

  ```
  AssertionError: expected Error: [vitest] No "isNull" export is def… { codeFrame: '…' } to match object { Object (code) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "PROJECT_MEETING_STALE_VERSION",
  + Error {
  +   "message": "[vitest] No \"isNull\" export is defined on the \"drizzle-orm\" mock. Did you forget to return it from \"vi.mock\"?
  ```
- Legacy meeting transition optimistic concurrency, side effects and actors > PROJ-BREAK-MENTOR-392 cancelling a draft never broadcasts to other project members

  ```
  Error: [vitest] No "isNull" export is defined on the "drizzle-orm" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("drizzle-orm"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- Legacy meeting transition optimistic concurrency, side effects and actors > PROJ-BREAK-MENTOR-393 learner cancellation pins requester, live grant and REQUESTED status

  ```
  Error: [vitest] No "isNull" export is defined on the "drizzle-orm" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("drizzle-orm"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- Legacy meeting transition optimistic concurrency, side effects and actors > PROJ-BREAK-MENTOR-394 equivalent IST offsets pass and forged version fields fail strict parsing

  ```
  Error: [vitest] No "isNull" export is defined on the "drizzle-orm" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("drizzle-orm"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/PROJ-BREAK-chat19-project-workspace-export-ui.test.tsx (2 failing)
- PROJ-BREAK-EXPORT-02: project export UI only permits authorized visible rows > never offers a clickable CSV download for an empty authorized page

  ```
  AssertionError: expected undefined to be defined
  ❯ tests/unit/PROJ-BREAK-chat19-project-workspace-export-ui.test.tsx:9:18
  7|   const html=renderToStaticMarkup(<ProjectAdminWorkspacePageExport ite…
  8|   const button=html.match(/<button\b[^>]*>Export this page<\/button>/)…
  9|   expect(button).toBeDefined();
  |                  ^
  10|   expect(button).toMatch(/\sdisabled(?=[\s=>])/);
  11|   expect(button).toContain("min-h-11");
  ```
- PROJ-BREAK-EXPORT-02: project export UI only permits authorized visible rows > enables an exported page without any all-tenants lookup or hidden row download link

  ```
  AssertionError: expected undefined to be defined
  ❯ tests/unit/PROJ-BREAK-chat19-project-workspace-export-ui.test.tsx:20:18
  18|   }]}/>);
  19|   const button=html.match(/<button\b[^>]*>Export this page<\/button>/)…
  20|   expect(button).toBeDefined();
  |                  ^
  21|   // Button retains CSS disabled:* classes in BOTH states; only the ac…
  22|   // disabled attribute determines whether the action can be invoked.
  ```
