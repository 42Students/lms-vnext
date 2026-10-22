# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-student-placement-lookup-cap.test.ts (1 failing)
- SA-STUDENT-LOOKUP-CAP-01 truthful supervised placement lookup paging > probes an additional authorized database row and does not disclose it in output

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'const visiblePeople=capStudentLookupR…'
  - Expected
  + Received
  - const visiblePeople=capStudentLookupRows(people,STUDENT_LOOKUP_CAP).items
  + import "server-only";
  + import {and,asc,count,desc,eq,ilike,inArray,or,gte} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts (3 failing)
- chat-13 Super Admin settings, access and tracker reconciliation > SA-tenants-modules-45 verifies current code, without asserting runtime activation

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'limit: 50'
  - Expected
  + Received
  - limit: 50
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```
- chat-13 Super Admin settings, access and tracker reconciliation > SA-tenants-modules-48 verifies current code, without asserting runtime activation

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain '"OPEN","RELEASE","ALL"'
  - Expected
  + Received
  - "OPEN","RELEASE","ALL"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```
- chat-13 Super Admin settings, access and tracker reconciliation > SA-tenants-modules-60 verifies current code, without asserting runtime activation

  ```
  AssertionError: expected '"use client";\nimport {useRef,useStat…' to contain 'Pin for recipients'
  - Expected
  + Received
  - Pin for recipients
  + "use client";
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat15-company-shared-preview.test.ts (1 failing)
- chat-15 learner company disclosures > LEARNER-placements-28 matches active selected-applicant employer shares, not the company directory

  ```
  AssertionError: expected 'import "server-only";\n\nimport { and…' to contain 'limited.length===0||limited.includes(…'
  - Expected
  + Received
  - limited.length===0||limited.includes(application.applicationId)
  + import "server-only";
  +
  + import { and, asc, eq, gt, inArray, isNull } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  ```

## tests/unit/chat16-SA-placements-projects-120-refused-file-report.test.ts (2 failing)
- SA-placements-projects-120 authenticated import refusal reporting > SA-placements-projects-120 only reads persisted GitHub-import audit state for a globally scoped Super Admin

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'refusedCount:row.refusedFiles.length,…'
  - Expected
  + Received
  - refusedCount:row.refusedFiles.length,refusedFiles
  + import "server-only";
  + import {and,asc,count,desc,eq,ilike,inArray,or,sql,type SQL} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {db10AuditFindings,db10AuditFindingEvents,db10AuditFindingSyncs,db10AuditFindingFiles} from "@/db/schema/db10-audit-findings.draft";
  ```
- SA-placements-projects-120 authenticated import refusal reporting > SA-placements-projects-120 displays refused files and reasons without claiming an unperformed successful sync

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Refusal reason'
  - Expected
  + Received
  - Refusal reason
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat16-inbound-mail-status-json-cap-42.test.ts (1 failing)
- chat-16 global private inbound-mail status HTTP boundary > INBOUND-TRIAGE-SIZE-44 preserves optimistic version result and friendly stale/no-storage states

  ```
  AssertionError: expected 500 to be 409 // Object.is equality
  - Expected
  + Received
  - 409
  + 500
  ```

## tests/unit/chat16-public-auth-real-pages-16.test.tsx (3 failing)
- chat-16 real public sign-in page security and tenant rendering > UX-chat16-auth-unknown-03 fails closed for unrecognized domains with a recovery link

  ```
  AssertionError: expected '     Skip to sign in  Your session ex…' to contain 'This address isn'
  Expected: "This address isn"
  Received: "     Skip to sign in  Your session expired. Please log in again. Your session has expired. Please log in again. Start a fresh sign-in Back to home   Ask your administrator to add this college's address in 42LMS, or use the main sign-in page. Try again Use the main sign-in page (42lms.com)
  ```
- chat-16 real public sign-in page security and tenant rendering > UX-chat16-auth-unavailable-06 never shows a tenant OTP form after a domain lookup outage

  ```
  AssertionError: expected '     Skip to sign in     This address…' to contain 'We couldn'
  Expected: "We couldn"
  Received: "     Skip to sign in     This address may be correct, but its settings didn't load. Try again in a moment, or use the main sign-in page. Retry college lookup Use the main sign-in page (42lms.com) ©    42LMS · JRSPF Technologies Pvt. Ltd.    Privacy Terms"
  ```
- chat-16 real public sign-in page security and tenant rendering > UX-chat16-auth-metadata-05 reads verified tenant rather than forwarded-host headers

  ```
  AssertionError: promise rejected "TypeError: Cannot destructure property 's…" instead of resolving
  ❯ tests/unit/chat16-public-auth-real-pages-16.test.tsx:121:35
  119|  });
  120|  it("UX-chat16-auth-metadata-05 reads verified tenant rather than forw…
  121|   await expect(generateMetadata()).resolves.toMatchObject({title:"Sign…
  |                                   ^
  122|   expect(resolveRequestTenant).toHaveBeenCalledWith("42lms.com");
  123|  });
  ```
