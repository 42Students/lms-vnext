# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/COURSES-BREAK-FACULTY-14.test.ts (2 failing)
- COURSES-BREAK-FACULTY-14 persisted Faculty schedule privilege at write time > FAC-attendance-grades-03 revoked teaching grant after UI load prevents insert and activity

  ```
  AssertionError: expected { persistedDenied: true, …(7) } to match object { locks: 2, authChecks: 1, …(4) }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  {
  "authChecks": 1,
  "events": 0,
  "inserts": 0,
  ```
- COURSES-BREAK-FACULTY-14 persisted Faculty schedule privilege at write time > FAC-attendance-grades-03 valid author reaches the guarded conflict read before any insert

  ```
  AssertionError: expected { persistedDenied: false, …(7) } to match object { locks: 2, authChecks: 1, …(2) }
  (4 matching properties omitted from actual)
  - Expected
  + Received
  {
  "authChecks": 1,
  "events": 1,
  -   "locks": 2,
  ```

## tests/unit/HR-BREAK-chat15-recruiter-alias-pages-69.test.ts (2 failing)
- HR-RECRUITER-PAGES-69: legacy aliases use the exact authorized HR server pages > home alias cannot bypass the canonical page's auth and tenant boundary

  ```
  AssertionError: expected [Function RecruiterHome] to be [AsyncFunction HrHomePage] // Object.is equality
  - Expected
  + Received
  - [Function HrHomePage]
  + [Function RecruiterHome]
  ```
- HR-RECRUITER-PAGES-69: legacy aliases use the exact authorized HR server pages > both legacy landing pages return to Today, not to an unscoped college directory

  ```
  AssertionError: expected 1st "vi.fn()" call to have been called with [ '/hr/home' ]
  - Expected
  + Received
  [
  -   "/hr/home",
  +   "/recruiter/home",
  ]
  ```

## tests/unit/HR-BREAK-chat19-conversation-receipt.test.ts (1 failing)
- HR-BREAK-CONVO-RECEIPT-49: persisted recruiter message receipt > returns exact persisted reply ID and thread ID

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ Anything, …(2) ]
  Received:
  1st vi.fn() call:
  [
  -   Anything,
  +   {
  +     "recruiter": {
  +       "status": "ACTIVE",
  ```

## tests/unit/HR-BREAK-double-submit-01.test.ts (1 failing)
- HR-BREAK-double-submit-01: recruiter formal drive submission > has a synchronous in-flight ref guard, not only delayed React state, and preserves retries

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'if(submitting||submittingRef.current|…'
  - Expected
  + Received
  - if(submitting||submittingRef.current||submittedRef.current)return
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { useToast } from "@/components/ui/toast";
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-attention-aggregation.test.ts (2 failing)
- Mentor activity aggregation and tenancy at scale > PROJ-BREAK-MENTOR-354 aggregates the latest event per project in SQL, not an unbounded history

  ```
  Error: [vitest] No "projectSubmissionReviews" export is defined on the "@/db/schema" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/db/schema"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- Mentor activity aggregation and tenancy at scale > PROJ-BREAK-MENTOR-355 keeps a 1,200-project activity feed bounded to 1,200 grouped rows

  ```
  Error: [vitest] No "projectSubmissionReviews" export is defined on the "@/db/schema" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/db/schema"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-task-transition-service.test.ts (3 failing)
- Mentor task transition persisted workflow > PROJ-BREAK-MENTOR-313 blocks an active task with one audit and recorded reason

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
- Mentor task transition persisted workflow > PROJ-BREAK-MENTOR-314 unblocking clears stale blocker text

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
- Mentor task transition persisted workflow > PROJ-BREAK-MENTOR-317 inactive sprint or shipped release cannot advance task

  ```
  AssertionError: expected Error: [vitest] No "isNull" export is def… { codeFrame: '…' } to match object { code: 'PROJECT_TASK_INVALID_STATE' }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "PROJECT_TASK_INVALID_STATE",
  + Error {
  +   "message": "[vitest] No \"isNull\" export is defined on the \"drizzle-orm\" mock. Did you forget to return it from \"vi.mock\"?
  ```
