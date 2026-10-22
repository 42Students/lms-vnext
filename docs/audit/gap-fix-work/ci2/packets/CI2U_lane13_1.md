# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-expired-grants-39.test.ts (2 failing)
- HR-GRANT-EXPIRE-39 cached recruiter grants cannot outlive persisted access > workspace, both round operations, slot authorization and both count queries check live expiry

  ```
  AssertionError: expected 3 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 3
  ```
- HR-GRANT-EXPIRE-39 cached recruiter grants cannot outlive persisted access > company team denies expired and unverified grants before the coworkers query

  ```
  AssertionError: expected 5958 to be less than -1
  ❯ tests/unit/HR-BREAK-chat15-expired-grants-39.test.ts:58:5
  56|   ])expect(query).toContain(clause);
  57|   expect(source.indexOf("if (!company) throw new AuthorizationError"))
  58|    .toBeLessThan(source.indexOf("const team = await db"));
  |     ^
  59|  });
  60| });
  ```

## tests/unit/HR-BREAK-chat15-tracker-report-page-81.test.tsx (1 failing)
- HR-TRACKER-PAGE-81: authenticated reporter intake and HR privacy > denies expired identity before reading runtime or rendering a form

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + <section
  +   className="space-y-4"
  + >
  ```

## tests/unit/HR-BREAK-chat19-notifications-page.test.ts (12 failing)
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"collegeId":"../admin"} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"collegeId":"invalid"} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"page":"0"} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"page":"100000000"} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"page":"1.5"} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"q":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"unreadOnly":"neither"} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"collegeId":["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"]} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"page":["1","2"]} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"q":["A","B"]} renders recoverable error without reading a tenant inbox

  ```
  AssertionError: expected '  Notifications   Invalid inbox filte…' to contain 'Invalid inbox filter.'
  Expected: "Invalid inbox filter."
  Received: "  Notifications   Invalid inbox filter Review the college, search and unread options. "
  ```
- … 2 more in this file

## tests/unit/PROJ-BREAK-SA-34-admin-lock-role-revocation.test.ts (1 failing)
- PROJ-BREAK-SA-34 persisted actor guard precedes project and submission row locks > retries an exact same-actor lock idempotently without duplicating the delivery event

  ```
  ProjectsServiceError: PROJECT_SUBMISSION_CONFLICT
  ❯ src/modules/projects/admin-submission-review-service.ts:51:10
  49|    .orderBy(desc(projectSubmissions.version)).limit(1);
  50|   if(latest?.id!==submissionId)
  51|    throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  |          ^
  52|   // Two tabs may retry a lock after the first response was lost. Both…
  53|   // parent and the submission are locked, so returning the already-lo…
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-reassignment-scope.test.ts (2 failing)
- PROJ-BREAK-MENTOR-196..199 scoped college mentor reassignment > PROJ-BREAK-MENTOR-196 refuses unauthorized admin before any workloads DB query

  ```
  AssertionError: expected [Function] to throw error including 'PROJECTS_MANAGE_DENIED' but got '[vitest] No "can" export is defined o…'
  - Expected
  + Received
  - PROJECTS_MANAGE_DENIED
  + [vitest] No "can" export is defined on the "@/modules/permissions/policy" mock. Did you forget to return it from "vi.mock"?
  + If you need to partially mock a module, you can use "importOriginal" helper inside:
  +
  ```
- PROJ-BREAK-MENTOR-196..199 scoped college mentor reassignment > PROJ-BREAK-MENTOR-197 permitted college admin reaches scoped database services

  ```
  AssertionError: expected [Function] to throw error including 'DB_QUERY_STARTED' but got '[vitest] No "can" export is defined o…'
  - Expected
  + Received
  - DB_QUERY_STARTED
  + [vitest] No "can" export is defined on the "@/modules/permissions/policy" mock. Did you forget to return it from "vi.mock"?
  + If you need to partially mock a module, you can use "importOriginal" helper inside:
  +
  ```

## tests/unit/PROJ-BREAK-chat4-superadmin-tenants.test.ts (1 failing)
- Super Admin colleges/organizations/tenants adversarial audit > SA-colleges-tenants-BREAK-02 selected-college scope cannot enumerate every organization

  ```
  AssertionError: expected -1 to be greater than -1
  ❯ tests/unit/PROJ-BREAK-chat4-superadmin-tenants.test.ts:50:22
  48|     const selected = branch.indexOf("if (selected?.collegeId)");
  49|     const unrestricted = branch.indexOf(".where(eq(organizations.statu…
  50|     expect(selected).toBeGreaterThan(-1);
  |                      ^
  51|     expect(selected).toBeLessThan(unrestricted);
  52|     const scoped = branch.slice(selected, unrestricted);
  ```
