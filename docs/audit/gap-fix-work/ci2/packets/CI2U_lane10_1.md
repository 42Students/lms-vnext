# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-calendar-service-107.test.ts (1 failing)
- HR-CALENDAR-SERVICE-107 authorized event database preflight > an employer with zero authorized jobs gets zero events and no global round query

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ { user: { …(2) }, …(1) } ]
  Received:
  1st vi.fn() call:
  @@ -9,6 +9,7 @@
  "user": {
  "id": "recruiter",
  "platformStatus": "ACTIVE",
  },
  ```

## tests/unit/HR-BREAK-chat15-today-archive-34.test.ts (1 failing)
- HR-TODAY-ARCHIVE-34 no stale archived-drive follow-ups > enforces non-archived PUBLISHED job and original college in both Today queries

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'eq(placementJobs.status,"PUBLISHED")'
  - Expected
  + Received
  - eq(placementJobs.status,"PUBLISHED")
  + import "server-only";
  + import {and,eq,inArray,isNull,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships,placementApplications,placementApplicationScreenings,
  ```

## tests/unit/HR-BREAK-chat19-mail-digest-provider.test.ts (2 failing)
- HR-BREAK-MAIL-DIGEST-15: provider boundary, recipient privacy and non-OTP template > rejects mismatched/OTP template or Reply-To domain {"RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY":""}

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- HR-BREAK-MAIL-DIGEST-15: provider boundary, recipient privacy and non-OTP template > sends only last three bounded, HTML-escaped messages with one nonredirecting POST

  ```
  AssertionError: expected [ { …(2) } ] to deeply equal [ Array(1) ]
  - Expected
  + Received
  [
  {
  "address": "r-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@reply.42lms.com",
  +     "name": "o ege  A   am us Re ruitment",
  },
  ```

## tests/unit/HR-BREAK-weak-services-01.test.ts (1 failing)
- HR-BREAK-weak-services-01: actual service branches with mocked persistence > branches service denies all lookup for wrong college or revoked central policy

  ```
  Error: placements.recruiter.read
  ❯ getRecruiterCollegeDemographics src/modules/placements/recruiter-college-demographics-service.ts:28:18
  26|   throw new AuthorizationError("placements.recruiter.read");
  27|  const grant=recruiter.grants.find(row=>row.collegeId===collegeId);
  28|  if(!grant)throw new AuthorizationError("placements.recruiter.read");
  |                  ^
  29|  requirePermission(context,"placements.recruiter.read",{
  30|   collegeId,placementCompanyRelationshipId:grant.companyRelationshipId,
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-page-filter-privacy.test.tsx (1 failing)
- PROJ-BREAK-MENTOR-192..194 server-rendered project filters and disabled headings > PROJ-BREAK-MENTOR-194 disabled headings never display stale project names or statuses

  ```
  TypeError: Cannot read properties of undefined (reading 'search')
  ❯ Module.MentorBoardReviewPage src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx:35:37
  33|   const data=await getMentorBoardReview(await getCurrentRequestContext…
  34|   const base="/mentor/projects/"+encodeURIComponent(projectId);
  35|   const filtered=Boolean(data.query.search)||data.query.status!=="ALL"…
  |                                     ^
  36|   return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  37|     <PageHeader eyebrow="Mentor · Project" title="Task board status"
  ```

## tests/unit/PROJ-BREAK-chat19-workspace-brief-and-comment-kinds.test.ts (1 failing)
- PROJ-BREAK-BRIEF-01: workspace brief and persisted task-kind integrity > untrusted invalid persisted JSON is replaced by fresh independent empty lists

  ```
  AssertionError: expected { goal: 'Injected', …(4) } to deeply equal { goal: '', description: '', …(3) }
  - Expected
  + Received
  {
  "completionConditions": [],
  "deliverables": [],
  "description": "",
  -   "goal": "",
  ```
