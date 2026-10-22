# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat12-final-mentor-projects.test.ts (1 failing)
- chat-12 final sprint mentor projects > MEN-projects-meetings-20 preserves authored deliverables behind the mentor mutation guard

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'authoredBrief:input.brief'
  - Expected
  + Received
  - authoredBrief:input.brief
  + import "server-only";
  + import {and,eq} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {projectInstances} from "@/db/schema";
  ```

## tests/unit/chat12-round3-guarded-actions.test.ts (1 failing)
- chat-12 round3 guarded mutation controls > TPO-students-14 confirms a single Add-to-Drive mutation after the dialog

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'runGuarded(submit)'
  - Expected
  + Received
  - runGuarded(submit)
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat12-tpo-company-team-send-idempotency.test.ts (1 failing)
- TPO-companies-05 private company Team idempotent SEND service > persists message once with a single audit entry and does not email guessed @names

  ```
  TypeError: tx.select(...).from(...).where(...).orderBy is not a function
  ❯ src/modules/placements/tpo-company-team-service.ts:188:7
  186|    const subscribers=await tx.select({membershipId:follows.membershipI…
  187|      .from(follows).where(and(eq(follows.collegeId,college.id),eq(foll…
  188|      .orderBy(asc(follows.membershipId)).limit(250);
  |       ^
  189|    const explicitMentions:string[]=[];
  190|    // Explicit @member:<UUID> is an unambiguous, scoped person mention.
  ```

## tests/unit/chat13-academic-existing-routes.test.ts (1 failing)
- Chat13 Academic existing route and mutation contracts > SA-academics-people-27 lecture hall search export and paging

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Export CSV'
  - Expected
  + Received
  - Export CSV
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  + import { LectureHallManager } from "@/components/admin/lecture-hall-manager";
  ```

## tests/unit/chat13-faculty-bulk-response-ux.test.ts (1 failing)
- SA-FACULTY-CSV-22 bounded and verified Super Admin import recovery > accepts exact partial success totals without claiming the failed rows were created

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat13-placements-admin-coverage-registry.test.ts (1 failing)
- SA-ADMIN-LEDGER-01 every dedicated placement-admin/report module has an explicit coverage record > enumerates every admin, Super Admin, report and platform-policy file without silently omitting new entrypoints

  ```
  AssertionError: expected [ …(4) ] to deeply equal []
  - Expected
  + Received
  - []
  + [
  +   "admin-drive-settings-date-model.ts",
  +   "super-admin-calendar-appointment-directory.ts",
  +   "super-admin-drive-attention-service.ts",
  ```
