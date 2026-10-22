# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-college-verification-misc-gap-closure.test.ts (1 failing)
- chat-4 College Verification and Misc verification > COL-verification-misc-02 retains source-backed legacy behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Retry'
  - Expected
  + Received
  - Retry
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeProfileRetained } from "@/components/college/college-profile-retained";
  ```

## tests/unit/chat4-superadmin-organizations-page-journey.test.tsx (4 failing)
- SA-organizations-page-01 real directory permission, filters and restore states > denies duplicate and unknown URL keys before any private tenant directory read

  ```
  
  ```
- SA-organizations-page-01 real directory permission, filters and restore states > renders real scoped organizations, search and pagination without invented records

  ```
  
  ```
- SA-organizations-page-01 real directory permission, filters and restore states > renders an honest empty organization directory

  ```
  Error: invariant expected app router to be mounted
  ❯ useRouter node_modules/next/src/client/components/navigation.ts:169:11
  ❯ OrganizationDirectoryRefresh src/components/admin/organization-directory-refresh.tsx:7:15
  5|
  6| export function OrganizationDirectoryRefresh(){
  7|  const router=useRouter();
  |               ^
  8|  const [pending,startTransition]=useTransition();
  ```
- SA-organizations-page-01 real directory permission, filters and restore states > shows actual archived restoration choices only for an authorized platform administrator

  ```
  TypeError: Cannot read properties of undefined (reading 'getTime')
  ❯ organizationCreatedIstDate src/modules/organizations/organization-created-date-model.ts:3:28
  1| /** Platform tenant creation dates follow the LMS-wide IST display rul…
  2| export function organizationCreatedIstDate(value:Date):string {
  3|  if(!Number.isFinite(value.getTime()))return "—";
  |                            ^
  4|  return new Intl.DateTimeFormat("en-IN",{
  5|   timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",
  ```

## tests/unit/chat6-admin-second-third-people-inbound.test.ts (1 failing)
- /admin second third: inbound mail and People directory behavioral boundaries > CHAT6-ADMIN-INBOUND-01 validates inbox filters, refuses duplicate/privileged input and caps search

  ```
  AssertionError: {"status":"DELETED"}: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat6-faculty-schedule-and-tracker-evidence-round17.test.ts (1 failing)
- chat-6 source-evidence gaps > SA-placements-projects-102 mounts authenticated Alt+B report drawer with captured page/browser/viewport context

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat6-superadmin-mentor-role-round3.test.ts (1 failing)
- Mentor faculty role parity > SA-academics-people-115 recognizes real mentor memberships and filters faculty by mentor role

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'query.employmentType.toLowerCase()===…'
  - Expected
  + Received
  - query.employmentType.toLowerCase()==="mentor"
  + import "server-only";
  + import {and,asc,count,desc,eq,exists,ilike,or,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {aliasedColumn} from "@/db/aliased-column";
  ```

## tests/unit/chat7-college-assessment-export-service-weak.test.ts (3 failing)
- COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > reads paginated results using the same current context/kind, returns quoted spreadsheet and bounded pagination

  ```
  AssertionError: expected undefined to be 'QUIZ' // Object.is equality
  - Expected:
  "QUIZ"
  + Received:
  undefined
  ```
- COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > cannot silently export more than 1000 rows, labels truncated set and never fetches page 41

  ```
  AssertionError: expected "vi.fn()" to be called 40 times, but got 41 times
  ❯ tests/unit/chat7-college-assessment-export-service-weak.test.ts:63:24
  61|   expect(out.truncated).toBe(true);
  62|   expect(out.cap).toBe(1000);
  63|   expect(state.reader).toHaveBeenCalledTimes(40);
  |                        ^
  64|   expect(out.csv).toContain("EXPORT TRUNCATED");
  65|   expect(out.csv).toContain("Only the first 1000 matching records");
  ```
- COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > cannot silently export more than 1000 rows, labels truncated set and never fetches page 41

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ tests/unit/chat7-college-assessment-export-service-weak.test.ts:56:51
  54|  it("cannot silently export more than 1000 rows, labels truncated set …
  55|   state.reader.mockImplementation(async (_ctx,_kind,query)=>({
  56|    items:Array.from({length:25},(_,i)=>row((query.page-1)*25+i)),
  |                                                   ^
  57|    total:1001,totalPages:41,
  58|   }));
  ```

## tests/unit/chat7-legacy-faculty-assessments-copy.test.ts (1 failing)
- Faculty My Assignments and My Quizzes legacy headers > allAssignments uses exact Faculty legacy H1 rather than Learner All

  ```
  AssertionError: expected 'import { assignmentFilesRuntimeEnable…' to contain 'title="My Assignments"'
  - Expected
  + Received
  - title="My Assignments"
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {RetainedFacultyAssignments} from "@/components/courses/faculty-assignments-retention";
  + import { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";
  ```

## tests/unit/chat7-superadmin-assessment-friendly-errors.test.ts (2 failing)
- Super Admin assignment and quiz authoring recoverable errors > SA-academics-people-64 does not expose unexpected API error identifiers while editing and reviewing assignments

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'Another author edited the assignment.'
  - Expected
  + Received
  - Another author edited the assignment.
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Button } from "@/components/ui/button";
  ```
- Super Admin assignment and quiz authoring recoverable errors > SA-academics-people-65 renders friendly failure text for quiz updates and submissions without leaking internal errors

  ```
  AssertionError: expected '"use client";\n\nimport {useEffect,us…' to contain 'Could not load quiz attempts. Check y…'
  - Expected
  + Received
  - Could not load quiz attempts. Check your selected Section and try again.
  + "use client";
  +
  + import {useEffect,useRef,useState} from "react";
  + import {Input} from "@/components/ui/input";
  ```
