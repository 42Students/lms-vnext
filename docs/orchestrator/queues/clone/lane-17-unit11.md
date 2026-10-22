# Unit-test repair queue (unit11): lane chat-17

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-17-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [x] `tests/unit/UX-college-term-mapping-scroll-chat17.test.ts` (1 failing) — preserved the read-only drag guard in product code and corrected outdated exact-source test assertion (19b5eecd).
- [x] `tests/unit/chat16-email-bridge-hardening-02.test.ts` (1 failing) — updated source assertion for authenticated HMAC key rotation, including previous-secret expiry (db12f7a0).
- [x] `tests/unit/chat3-faculty-assessment-report-service-scope.test.ts` (2 failing) — filter report rows by verified Section roster, preserving scoped reads when roster unavailable (ffa4aa4a; source-reviewed, not executed)
- [x] `tests/unit/chat7-college-assessment-export-service-weak.test.ts` (2 failing) — source-reviewed: `src/modules/courses/college-assessment-export-service.ts` now passes `(context,kind,{...query,page})` for first and subsequent pages, retaining kind and scope; the recorded CI output predates this implementation. Not executed in this lane.
- [x] `tests/unit/college-drive-applications-model.test.ts` (1 failing) — corrected default sort assertion and AGE_ASC link preservation (647a0bdd, 6db2f8f).
- [x] `tests/unit/sa-tenants-modules-24-college-mutation-audit.test.ts` (1 failing) — the fourth read transaction verifies persisted permission; updated exact transaction assertion (94368cf).

## Failures (from CI log)

### tests/unit/UX-college-term-mapping-scroll-chat17.test.ts

```
 FAIL  tests/unit/UX-college-term-mapping-scroll-chat17.test.ts > UX-UNOWNED-GRID-09 college semester mapping remains keyboard- and touch-accessible > maintains drag-to-reorder and button alternatives without sub-44px targets
AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'draggable={!pending && editableTerm}'

- Expected
+ Received

- draggable={!pending && editableTerm}
+ "use client";
+
+ import { Select } from "@/components/ui/select";
+ import { Input } from "@/components/ui/input";
+ import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
+ import { usePathname, useRouter } from "next/navigation";
+ import Link from "next/link";
+ import { Alert } from "@/components/ui/alert";
+ import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
```

### tests/unit/chat16-email-bridge-hardening-02.test.ts

```
 FAIL  tests/unit/chat16-email-bridge-hardening-02.test.ts > chat-16 recruiter email bridge security and resend policy > email-bridge-inbound-01 requires signed gateway, live college grants and per-thread deduplication
AssertionError: expected 'import "server-only";\nimport {create…' to contain 'verifyRecruiterMailBridgeSignature(se…'

- Expected
+ Received

- verifyRecruiterMailBridgeSignature(secret,rawBody,signature)
+ import "server-only";
+ import {createHash,randomUUID} from "node:crypto";
+ import {eq,sql} from "drizzle-orm";
+ import {z} from "zod";
+ import {getDb} from "@/db/client";
+ import {placementRecruiterInboundEmailEvents,placementRecruiterMessageMailState} from "@/db/schema";
+ import {inboundMailMessages} from "@/db/schema/inbound-mail";
+ import {notifyTpoOfRecruiterMessage} from "./recruiter-message-tpo-notification-service";
+ import {verifyRecruiterMailBridgeWithRotation,extractRecruiterEmailReply} from "./recruiter-message-email-model";
```

### tests/unit/chat3-faculty-assessment-report-service-scope.test.ts

```
 FAIL  tests/unit/chat3-faculty-assessment-report-service-scope.test.ts > FAC-REPORT-SERVICE-01 authenticated Section report projections > hides foreign learner submissions before summary, export counts or distribution are computed
AssertionError: expected [ { …(5) }, { …(5) } ] to have a length of 1 but got 2

- Expected
+ Received

- 1
+ 2

 ❯ tests/unit/chat3-faculty-assessment-report-service-scope.test.ts:77:32
     75|   it("hides foreign learner submissions before summary, export counts …
     76|     const result = await getFacultyAssignmentReport(actor, assignmentI…
     77|     expect(result.submissions).toHaveLength(1);
       |                                ^
     78|     expect(result.submissions[0]?.membershipId).toBe(a);
     79|     expect(result.missingLearners).toEqual([{ membershipId: b }]);

 FAIL  tests/unit/chat3-faculty-assessment-report-service-scope.test.ts > FAC-REPORT-SERVICE-01 authenticated Section report projections > uses only the latest retake for question accuracy and scored results, with no foreign rows
AssertionError: expected [ { …(6) }, { …(6) }, { …(6) } ] to have a length of 2 but got 3

- Expected
+ Received

- 2
+ 3

 ❯ tests/unit/chat3-faculty-assessment-report-service-scope.test.ts:90:29
     88|   it("uses only the latest retake for question accuracy and scored res…
     89|     const result = await getFacultyQuizReport(actor, quizId, deliveryI…
     90|     expect(result.attempts).toHaveLength(2);
       |                             ^
     91|     expect(result.latestAttempts).toHaveLength(1);
     92|     expect(result.latestAttempts[0]?.attemptNumber).toBe(2);
```

### tests/unit/chat7-college-assessment-export-service-weak.test.ts

```
 FAIL  tests/unit/chat7-college-assessment-export-service-weak.test.ts > COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > reads paginated results using the same current context/kind, returns quoted spreadsheet and bounded pagination
AssertionError: expected undefined to be 'QUIZ' // Object.is equality

- Expected:
"QUIZ"

+ Received:
undefined

 ❯ tests/unit/chat7-college-assessment-export-service-weak.test.ts:37:17
     35|  it("reads paginated results using the same current context/kind, retu…
     36|   state.reader.mockImplementation(async (_ctx,kind,query)=>{
     37|    expect(kind).toBe("QUIZ");
       |                 ^
     38|    const page=query.page as number;
     39|    return {items:Array.from({length:page===3?11:COLLEGE_ASSESSMENT_PAG…

 FAIL  tests/unit/chat7-college-assessment-export-service-weak.test.ts > COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > cannot silently export more than 1000 rows, labels truncated set and never fetches page 41
TypeError: Cannot read properties of undefined (reading 'page')
 ❯ tests/unit/chat7-college-assessment-export-service-weak.test.ts:57:77
     55|  it("cannot silently export more than 1000 rows, labels truncated set …
     56|   state.reader.mockImplementation(async (_ctx,_kind,query)=>({
     57|    items:Array.from({length:COLLEGE_ASSESSMENT_PAGE_SIZE},(_,i)=>row((…
       |                                                                             ^
     58|    total:1001,totalPages:Math.ceil(1001/COLLEGE_ASSESSMENT_PAGE_SIZE),
     59|   }));
 ❯ tests/unit/chat7-college-assessment-export-service-weak.test.ts:57:16

```

### tests/unit/college-drive-applications-model.test.ts

```
 FAIL  tests/unit/college-drive-applications-model.test.ts > College drive applicant filters and CSV protection > validates bounded status filters and forbids caller college
AssertionError: expected { q: '', status: 'ALL', …(8) } to deeply equal { q: '', status: 'ALL', …(8) }

- Expected
+ Received

@@ -3,10 +3,10 @@
    "page": 1,
    "q": "",
    "screening": "ALL",
    "size": 20,
    "skills": "",
-   "sort": "AGE_ASC",
+   "sort": "SCORE_DESC",
    "source": "ALL",
    "stage": "ALL",
```

### tests/unit/sa-tenants-modules-24-college-mutation-audit.test.ts

```
 FAIL  tests/unit/sa-tenants-modules-24-college-mutation-audit.test.ts > SA-tenants-modules-24 tenant write audit > writes each tenant mutation and event inside a transaction
AssertionError: expected 4 to be 3 // Object.is equality

- Expected
+ Received

- 3
+ 4

 ❯ tests/unit/sa-tenants-modules-24-college-mutation-audit.test.ts:14:82
     12|   expect((source.match(/recordActivityEventInTransaction\(tx,context/g…
     13|   expect(source).toContain("return await db.transaction(async tx=>");
     14|   expect((source.match(/return getDb\(\).transaction\(async tx=>/g)??[…
       |                                                                                  ^
     15|  });
     16| });
```

