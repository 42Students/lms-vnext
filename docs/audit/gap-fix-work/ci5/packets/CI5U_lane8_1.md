# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/PROJ-BREAK-chat9-admin-verification-entry.test.tsx (2 failing)
- Super Admin last-third: verification entry security and scope > UX-admin-verification-19 expired and college-only roles see a safe denial with no selected-scope redirect

  ```
  2026-10-22T07:22:51.3976064Z AssertionError: expected 'Profile verification Verification acc…' to contain 'Back to dashboard'
  Expected: "Back to dashboard"
  Received: "Profile verification Verification access denied Your account cannot access Super Admin verification. /dashboard"
  ```
- Super Admin last-third: verification entry security and scope > UX-admin-verification-20 a global operator must select a college rather than inheriting a guessed default

  ```
  TypeError: Cannot destructure property 'searchParams' of 'undefined' as it is undefined.
  ❯ Module.AdminVerificationEntry src/app/(authenticated)/admin/verification/page.tsx:15:55
  13|  * Do not implicitly select the first college in a global organization.
  14|  */
  15| export default async function AdminVerificationEntry({searchParams}:{s…
  |                                                       ^
  16|   const context = await getCurrentRequestContext();
  17|   if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))
  ```

## tests/unit/UX-campaign-unsubscribe-token-01.test.ts (1 failing)
- UX-campaign-unsubscribe-token-01 preference confirmation > uses mobile-safe shared Card and a guarded confirmed POST with accessible error

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'if(pendingRef.current)return'
  - Expected
  + Received
  - if(pendingRef.current)return
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```

## tests/unit/UX-college-verification-01.test.ts (1 failing)
- /college/verification UX > UX-college-verification-03 preserves responsive or failure recovery contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Could not load verification re…'
  - Expected
  + Received
  - title="Could not load verification requests"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {hasMembershipRole} from "@/modules/identity/context";
  ```

## tests/unit/UX-teacher-pages-round3.test.ts (1 failing)
- UX teacher rollout third ten route contracts > UX-teacher-courses-deliveryId-session-coverage-01 keeps persisted session history, no inferred absence

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'timeZone:"Asia/Kolkata"'
  - Expected
  + Received
  - timeZone:"Asia/Kolkata"
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/chat11-academic-register-regressions-round11.test.ts (2 failing)
- College Academic Setup open-register functional checks > COL-academic-setup-29 rejects batch archival with linked classes or learners

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Remove this planned batch?'
  - Expected
  + Received
  - Remove this planned batch?
  + "use client";
  + import { Button } from "@/components/ui/button";
  +
  + import { useEffect, useState, useTransition, type FormEvent } from "react";
  ```
- College Academic Setup open-register functional checks > COL-academic-setup-39 emits a real CSV rather than arbitrary HTML

  ```
  AssertionError: expected '\ufeff"id","batchName","programId","c…' to contain 'Active learner enrollments'
  - Expected
  + Received
  - Active learner enrollments
  + ﻿"id","batchName","programId","currentSemester","academicYear","students","status","startDate","endDate"
  + "11111111-1111-4111-8111-111111111111","2024 CSE","22222222-2222-4222-8222-222222222222","1","2024-25","120","ACTIVE","",""
  ```

## tests/unit/chat12-graceful-tpo.test.ts (2 failing)
- chat-12 touched TPO pages degrade gracefully > GR-90 / GR-91 offer plain announced retryable student-panel errors

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {Tabs} from "@/components/ui/tabs";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- chat-12 touched TPO pages degrade gracefully > GR-32 preserves the academic import draft on conflict and never renders the raw backend code

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'cause instanceof FriendlyFetchError &…'
  - Expected
  + Received
  - cause instanceof FriendlyFetchError && cause.status===409
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {DataTable} from "@/components/ui/data-table";
  ```

## tests/unit/chat13-admin-placement-directory-and-identity-adversarial.test.ts (3 failing)
- chat-13 Super Admin placements: adversarial directory, company identity and HR filters > SA-ADMIN-DRIVE-01 rejects malicious pagination/status and never lets URL params escape query encoding

  ```
  AssertionError: expected { q: '', status: 'ALL', page: 1, …(1) } to match object { status: 'ALL', q: '', page: 1, …(1) }
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 10,
  +   "pageSize": 20,
  "q": "",
  ```
- chat-13 Super Admin placements: adversarial directory, company identity and HR filters > SA-ADMIN-DRIVE-02 filters by actual published status, company and lowercases without changing input

  ```
  AssertionError: expected 'Expired' to be 'Open · Expired' // Object.is equality
  Expected: "Open · Expired"
  Received: "Expired"
  ```
- chat-13 Super Admin placements: adversarial directory, company identity and HR filters > SA-COMPANY-IDENTITIES-01 rejects claiming email hosts, college domains and malformed DNS input

  ```
  AssertionError: http://acme.example: expected [Function] to throw an error
  ❯ tests/unit/chat13-admin-placement-directory-and-identity-adversarial.test.ts:42:52
  40|   expect(normalizeCompanyDomain(" Employee@WWW.Acme.Example ")).toBe("…
  41|   for(const input of ["gmail.com","finance@outlook.com","yahoo.com","c…
  42|    expect(()=>normalizeCompanyDomain(input),input).toThrow();
  |                                                    ^
  43|   }
  44|   expect(companyDomainCommandSchema.safeParse({companyId:uuid,action:"…
  ```
