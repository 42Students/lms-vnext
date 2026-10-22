# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/COURSES-BREAK-SECTION-TRANSFER-12.test.ts (3 failing)
- COURSES7-SECTION-TRANSFER-12: one learner attempt quota and submission after a section switch > scopes assignment lookup to the learner and authorized shared item, never the old submission section

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin(...).where(...).orderBy is not a function
  ❯ Module.listOwnLearnerAssessmentRows src/modules/courses/learner-assessment-flat-query.ts:47:5
  45|     eq(assignmentSubmissions.membershipId,membershipId)))
  46|    .where(and(...baseConditions,eq(courseAssignments.status,"PUBLISHED…
  47|    .orderBy(sql`coalesce(${courseAssignments.dueAt},'infinity'::timest…
  |     ^
  48|      courseAssignments.title,courseAssignments.id)
  49|    .limit(pageSize).offset(offset),
  ```
- COURSES7-SECTION-TRANSFER-12: one learner attempt quota and submission after a section switch > counts a quiz attempt against the same learner's global quiz quota after transfer

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin(...).where(...).orderBy is not a function
  ❯ Module.listOwnLearnerAssessmentRows src/modules/courses/learner-assessment-flat-query.ts:47:5
  45|     eq(assignmentSubmissions.membershipId,membershipId)))
  46|    .where(and(...baseConditions,eq(courseAssignments.status,"PUBLISHED…
  47|    .orderBy(sql`coalesce(${courseAssignments.dueAt},'infinity'::timest…
  |     ^
  48|      courseAssignments.title,courseAssignments.id)
  49|    .limit(pageSize).offset(offset),
  ```
- COURSES7-SECTION-TRANSFER-12: one learner attempt quota and submission after a section switch > performs no database work without a server-authorized delivery

  ```
  AssertionError: expected { assignments: [], quizzes: [], …(1) } to deeply equal { assignments: [], quizzes: [] }
  - Expected
  + Received
  {
  "assignments": [],
  "quizzes": [],
  +   "totals": {
  +     "assignments": 0,
  ```

## tests/unit/HR-BREAK-chat15-recruiter-tracker-fallback-108.test.tsx (3 failing)
- HR-TRACKER-FALLBACK-108 bounded recruiter and tracker page recovery > loading routes delegate to the shared bounded loading state instead of a blank page

  ```
  AssertionError: expected 'div' to be [Function GracefulPageLoading] // Object.is equality
  - Expected:
  [Function GracefulPageLoading]
  + Received:
  "div"
  ```
- HR-TRACKER-FALLBACK-108 bounded recruiter and tracker page recovery > not-found route has actionable legacy fallback with no private object disclosure

  ```
  AssertionError: expected 'div' to be [Function GracefulScreen] // Object.is equality
  - Expected:
  [Function GracefulScreen]
  + Received:
  "div"
  ```
- HR-TRACKER-FALLBACK-108 bounded recruiter and tracker page recovery > visible retry button invokes its provided reset exactly once

  ```
  AssertionError: expected undefined to be defined
  ❯ tests/unit/HR-BREAK-chat15-recruiter-tracker-fallback-108.test.tsx:52:17
  50|   const retry=elements(output).find(el=>(el.type==="button"&&
  51|    words((el.props as {children?:ReactNode}).children).includes("Try a…
  52|   expect(retry).toBeDefined();
  |                 ^
  53|   (retry!.props as {onClick:()=>void}).onClick();
  54|   expect(reset).toHaveBeenCalledTimes(1);
  ```

## tests/unit/HR-BREAK-chat19-drive-draft-duplicate-query.test.ts (7 failing)
- HR-BREAK-DRIVE-DRAFT-QUERY-23: secure recruiter draft source URL > does not pick one of contradictory grant/request/source links {"collegeId":["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"]}

  ```
  
  ```
- HR-BREAK-DRIVE-DRAFT-QUERY-23: secure recruiter draft source URL > does not pick one of contradictory grant/request/source links {"collegeId":["11111111-1111-4111-8111-111111111111","11111111-1111-4111-8111-111111111111"]}

  ```
  
  ```
- HR-BREAK-DRIVE-DRAFT-QUERY-23: secure recruiter draft source URL > does not pick one of contradictory grant/request/source links {"from":["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"]}

  ```
  
  ```
- HR-BREAK-DRIVE-DRAFT-QUERY-23: secure recruiter draft source URL > does not pick one of contradictory grant/request/source links {"edit":["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"]}

  ```
  
  ```
- HR-BREAK-DRIVE-DRAFT-QUERY-23: secure recruiter draft source URL > does not pick one of contradictory grant/request/source links {"fix":["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"]}

  ```
  
  ```
- HR-BREAK-DRIVE-DRAFT-QUERY-23: secure recruiter draft source URL > does not pick one of contradictory grant/request/source links {"copy":["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"]}

  ```
  
  ```
- HR-BREAK-DRIVE-DRAFT-QUERY-23: secure recruiter draft source URL > does not pick one of contradictory grant/request/source links {"from":"11111111-1111-4111-8111-111111111111","fix":"22222222-2222-4222-8222-222222222222"}

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  - }
  + <DriveSourceUnavailable />
  ```

## tests/unit/HR-BREAK-round-results-page-01.test.ts (6 failing)
- HR-BREAK-round-results-page-01 recruiter job and shared candidate privacy > invalid job/round/outcome filter renders reset instead of issuing a query

  ```
  Error: REDIRECT
  ❯ tests/unit/HR-BREAK-round-results-page-01.test.ts:43:44
  41|    college:{name:"College"},rounds:[],
  42|   });
  43|   f.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  |                                            ^
  44|   f.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
  45|  });
  ```
- HR-BREAK-round-results-page-01 recruiter job and shared candidate privacy > empty own job list shows a truthful no-drives state, not another employer's jobs

  ```
  Error: REDIRECT
  ❯ tests/unit/HR-BREAK-round-results-page-01.test.ts:43:44
  41|    college:{name:"College"},rounds:[],
  42|   });
  43|   f.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  |                                            ^
  44|   f.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
  45|  });
  ```
- HR-BREAK-round-results-page-01 recruiter job and shared candidate privacy > archived jobs are absent from picker while own active jobs have scoped URLs

  ```
  Error: REDIRECT
  ❯ tests/unit/HR-BREAK-round-results-page-01.test.ts:43:44
  41|    college:{name:"College"},rounds:[],
  42|   });
  43|   f.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  |                                            ^
  44|   f.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
  45|  });
  ```
- HR-BREAK-round-results-page-01 recruiter job and shared candidate privacy > wrong employer relationship is indistinguishable from missing job

  ```
  AssertionError: expected [Function] to throw error including 'NOT_FOUND' but got 'REDIRECT'
  Expected: "NOT_FOUND"
  Received: "REDIRECT"
  ```
- HR-BREAK-round-results-page-01 recruiter job and shared candidate privacy > foreign round ID inside owned job is never treated as a valid selection

  ```
  AssertionError: expected [Function] to throw error including 'NOT_FOUND' but got 'REDIRECT'
  Expected: "NOT_FOUND"
  Received: "REDIRECT"
  ```
- HR-BREAK-round-results-page-01 recruiter job and shared candidate privacy > authorized job with zero configured rounds shows an explicit empty message

  ```
  Error: REDIRECT
  ❯ tests/unit/HR-BREAK-round-results-page-01.test.ts:43:44
  41|    college:{name:"College"},rounds:[],
  42|   });
  43|   f.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  |                                            ^
  44|   f.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
  45|  });
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-core-state-matrix.test.ts (1 failing)
- IIT Dharwad Mentor sprint/task transition and input hardening > PROJ-BREAK-MENTOR-227 task builder never makes unsprinted work active or accepts stale sprint linkage

  ```
  ReferenceError: expectedSprintUpdatedAt is not defined
  ❯ tests/unit/PROJ-BREAK-chat14-mentor-core-state-matrix.test.ts:91:55
  89|   expect(mentorTaskCreateSchema.safeParse({...backlog,status:"IN_PROGR…
  90|   expect(mentorTaskCreateSchema.safeParse({...backlog,sprintId}).succe…
  91|   expect(mentorTaskCreateSchema.safeParse({...backlog,expectedSprintUp…
  |                                                       ^
  92|   expect(mentorTaskCreateSchema.safeParse({...backlog,collegeId:"forei…
  93|   expect(mentorTaskCreateSchema.safeParse({...backlog,title:""}).succe…
  ```

## tests/unit/PROJ-BREAK-chat14-project-lifecycle-mutation-gate.test.ts (2 failing)
- Shared mutation gate protects hidden Projects tenant > PROJ-BREAK-MENTOR-250 rejects disabled tenant before role/project lookup for real and guessed IDs

  ```
  AssertionError: expected 4 to be +0 // Object.is equality
  - Expected
  + Received
  - 0
  + 4
  ```
- Shared mutation gate protects hidden Projects tenant > PROJ-BREAK-MENTOR-251 enabled tenant still denies unprivileged role before project fetch

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
