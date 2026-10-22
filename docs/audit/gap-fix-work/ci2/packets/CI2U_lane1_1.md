# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/COURSES-BREAK-FACULTY-05.test.ts (1 failing)
- COURSES-BREAK-FACULTY-05 /teacher route authorization and session scope > FAC-courses-01 Learner, Mentor, TPO, College Admin and Recruiter cannot enter faculty routes by guessed URL

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/HR-BREAK-chat15-proposals-page-80.test.tsx (1 failing)
- HR-RECRUITER-PAGE-80: persisted sent proposals are not approved drive requests > multi-college context requires a choice without combining two companies

  ```
  AssertionError: expected [ '/hr/drives', '/hr/drives/new' ] to include '/hr/drives/proposals?collegeId=111111…'
  ❯ tests/unit/HR-BREAK-chat15-proposals-page-80.test.tsx:73:27
  71|   const rendered=await view();
  72|   expect(labels(rendered)).toContain("Choose a college");
  73|   expect(links(rendered)).toContain("/hr/drives/proposals?collegeId="+…
  |                           ^
  74|   expect(links(rendered)).toContain("/hr/drives/proposals?collegeId="+…
  75|  });
  ```

## tests/unit/HR-BREAK-chat19-conversation-inbox-page.test.ts (9 failing)
- HR-BREAK-CONVO-04: inbox account, stale message and ancillary failure containment > HR-XA-09 notification action opens the bell inbox instead of looping through Messages alias

  ```
  AssertionError: expected [ Array(1) ] to include '/hr/notifications'
  ❯ tests/unit/HR-BREAK-chat19-conversation-inbox-page.test.ts:59:25
  57|  it("HR-XA-09 notification action opens the bell inbox instead of loop…
  58|   const result=await page();
  59|   expect(hrefs(result)).toContain("/hr/notifications");
  |                         ^
  60|   expect(hrefs(result)).not.toContain("/hr/messages");
  61|  });
  ```
- HR-BREAK-CONVO-04: inbox account, stale message and ancillary failure containment > invalid {"collegeId":"wrong"} rejects without reading private message bodies

  ```
  
  ```
- HR-BREAK-CONVO-04: inbox account, stale message and ancillary failure containment > invalid {"page":"0"} rejects without reading private message bodies

  ```
  
  ```
- HR-BREAK-CONVO-04: inbox account, stale message and ancillary failure containment > invalid {"q":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"} rejects without reading private message bodies

  ```
  
  ```
- HR-BREAK-CONVO-04: inbox account, stale message and ancillary failure containment > invalid {"scope":"PRIVATE"} rejects without reading private message bodies

  ```
  
  ```
- HR-BREAK-CONVO-04: inbox account, stale message and ancillary failure containment > invalid {"collegeId":["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"]} rejects without reading private message bodies

  ```
  
  ```
- HR-BREAK-CONVO-04: inbox account, stale message and ancillary failure containment > invalid {"page":["1","100"]} rejects without reading private message bodies

  ```
  
  ```
- HR-BREAK-CONVO-04: inbox account, stale message and ancillary failure containment > invalid {"q":["first","second"]} rejects without reading private message bodies

  ```
  AssertionError: expected '  Messages   Invalid conversation fil…' to contain 'Invalid conversation filters.'
  Expected: "Invalid conversation filters."
  Received: "  Messages   Invalid conversation filters Review the college and conversation filters. "
  ```
- HR-BREAK-CONVO-04: inbox account, stale message and ancillary failure containment > when a second live grant check fails, never display an older cached preview or inline reply

  ```
  AssertionError: expected '     Messages 1 conversation · undefi…' to contain 'General message history is unavailabl…'
  Expected: "General message history is unavailable right now."
  Received: "     Messages 1 conversation · undefined unread messages      Drive request decisions are temporarily unavailable. Conversations are still accessible; refresh to try again.         Search and sort conversations              Order     Most recently updated   Oldest updated first   Search b
  ```

## tests/unit/HR-BREAK-company-reports-page-01.test.ts (3 failing)
- HR-BREAK-company-reports-page-01: unauthorized, invalid, multiple college and retry > invalid college, stage or page params produce friendly reset without hitting service

  ```
  Error: REDIRECT
  ❯ tests/unit/HR-BREAK-company-reports-page-01.test.ts:38:48
  36|   mocks.active.mockReturnValue(true);
  37|   mocks.read.mockResolvedValue({status:"NO_ACCESS",choices:[]});
  38|   mocks.redirect.mockImplementation(()=>{throw new Error("REDIRECT");}…
  |                                                ^
  39|  });
  40|  it("inactive/wrong-role HR identity cannot run any company report que…
  ```
- HR-BREAK-company-reports-page-01: unauthorized, invalid, multiple college and retry > no active grant shows denial rather than a cross-college aggregate

  ```
  Error: REDIRECT
  ❯ tests/unit/HR-BREAK-company-reports-page-01.test.ts:38:48
  36|   mocks.active.mockReturnValue(true);
  37|   mocks.read.mockResolvedValue({status:"NO_ACCESS",choices:[]});
  38|   mocks.redirect.mockImplementation(()=>{throw new Error("REDIRECT");}…
  |                                                ^
  39|  });
  40|  it("inactive/wrong-role HR identity cannot run any company report que…
  ```
- HR-BREAK-company-reports-page-01: unauthorized, invalid, multiple college and retry > multiple grants prompt explicit college selection; links contain only scoped IDs

  ```
  Error: REDIRECT
  ❯ tests/unit/HR-BREAK-company-reports-page-01.test.ts:38:48
  36|   mocks.active.mockReturnValue(true);
  37|   mocks.read.mockResolvedValue({status:"NO_ACCESS",choices:[]});
  38|   mocks.redirect.mockImplementation(()=>{throw new Error("REDIRECT");}…
  |                                                ^
  39|  });
  40|  it("inactive/wrong-role HR identity cannot run any company report que…
  ```

## tests/unit/PROJ-BREAK-chat14-meetings-resources-route-matrix.test.ts (4 failing)
- Mentor meeting and resource endpoint permission matrix > PROJ-BREAK-MENTOR-334 meeting create uses exact route IDs and JSON body

  ```
  
  ```
- Mentor meeting and resource endpoint permission matrix > PROJ-BREAK-MENTOR-334 meeting edit uses exact route IDs and JSON body

  ```
  
  ```
- Mentor meeting and resource endpoint permission matrix > PROJ-BREAK-MENTOR-334 meeting transition uses exact route IDs and JSON body

  ```
  AssertionError: expected Promise{…} to deeply equal { title: 'New value', …(1) }
  - Expected
  + Received
  - {
  -   "expectedUpdatedAt": "2099-01-01T00:00:00.000Z",
  -   "title": "New value",
  - }
  + Promise {}
  ```
- Mentor meeting and resource endpoint permission matrix > PROJ-BREAK-MENTOR-337 malformed JSON never reaches project write service

  ```
  AssertionError: expected 201 to be 400 // Object.is equality
  - Expected
  + Received
  - 400
  + 201
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-state-evidence.test.ts (1 failing)
- PROJ-BREAK-MENTOR-76..84 finite state and final-delivery consistency > PROJ-BREAK-MENTOR-82 numeric titles, ties and unknown progress have stable ordering

  ```
  AssertionError: expected 1 to be less than 0
  ❯ tests/unit/PROJ-BREAK-chat14-mentor-state-evidence.test.ts:112:55
  110|  it("PROJ-BREAK-MENTOR-82 numeric titles, ties and unknown progress ha…
  111|   expect(compareMentorProjects(active,older,"RECENT")).toBeLessThan(0);
  112|   expect(compareMentorProjects(active,older,"TITLE")).toBeLessThan(0);
  |                                                       ^
  113|   expect(compareMentorProjectsByProgress(active,older,NaN,50)).toBeGre…
  114|   expect(compareMentorProjectsByProgress(active,older,0,50)).toBeLessT…
  ```
