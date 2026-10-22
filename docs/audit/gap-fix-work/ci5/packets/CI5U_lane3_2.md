# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-super-admin-placements-command-matrix.test.ts (1 failing)
- Super Admin Placements destructive command and concurrency matrix > SA-PUBLISHED-DRIVE-EDIT-02 rejects forged requests, duplicate locations, negative openings and inverted CTC

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat16-campaign-unsubscribe-auth-28.test.ts (1 failing)
- chat-16 purpose-bound unsubscribe gate before storage access > T-S2-04-UNSUB-05 forged cross-college recipient ID fails without updating or revealing identity

  ```
  AssertionError: promise resolved "{ unsubscribed: true }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "unsubscribed": true,
  }
  ```

## tests/unit/chat16-public-placements-route-16.test.tsx (1 failing)
- chat-16 public placements page role and safe-unavailability journeys > UX-chat16-public-placement-17 does not render an explicitly unpublished college page

  ```
  AssertionError: expected [Function] to throw error including 'NOT_FOUND' but got 'PUBLIC_PLACEMENTS_TEMPORARILY_UNAVAIL…'
  Expected: "NOT_FOUND"
  Received: "PUBLIC_PLACEMENTS_TEMPORARILY_UNAVAILABLE"
  ```

## tests/unit/chat19-north-star-legacy-sidebar.test.ts (5 failing)
- NORTH-STAR-SIDEBAR-01: old LMS 96px rail, hover push and icons > follows exactly the old measured rail transition and active/hover colors

  ```
  AssertionError: expected '/*\n * Legacy sidebar shell (docs/des…' to contain 'background:#eff8fa'
  - Expected
  + Received
  - background:#eff8fa
  + /*
  +  * Legacy sidebar shell (docs/design/old-lms-shell.css).
  +  * Desktop: 96px rail -> 256px on hover/focus, content PUSHES right.
  +  * Mobile uses the existing focus-trapped drawer and always shows labels.
  ```
- NORTH-STAR-SIDEBAR-01: old LMS 96px rail, hover push and icons > matches all measured sidebar link, heading, badge and logo values from the old CSS

  ```
  AssertionError: expected '/*\n * Legacy sidebar shell (docs/des…' to contain 'border-right:1px solid #f1f4f9'
  - Expected
  + Received
  - border-right:1px solid #f1f4f9
  + /*
  +  * Legacy sidebar shell (docs/design/old-lms-shell.css).
  +  * Desktop: 96px rail -> 256px on hover/focus, content PUSHES right.
  +  * Mobile uses the existing focus-trapped drawer and always shows labels.
  ```
- NORTH-STAR-SIDEBAR-01: old LMS 96px rail, hover push and icons > uses the legacy thin TPO scrollbar only on expanded rails

  ```
  AssertionError: expected '/*\n * Legacy sidebar shell (docs/des…' to contain '.lms-sidebar-item-icon svg {display:b…'
  - Expected
  + Received
  - .lms-sidebar-item-icon svg {display:block;width:20px;height:20px;}
  + /*
  +  * Legacy sidebar shell (docs/design/old-lms-shell.css).
  +  * Desktop: 96px rail -> 256px on hover/focus, content PUSHES right.
  +  * Mobile uses the existing focus-trapped drawer and always shows labels.
  ```
- NORTH-STAR-SIDEBAR-01: old LMS 96px rail, hover push and icons > hides expanded headings and labels in collapsed desktop mode, keeps mobile labels

  ```
  AssertionError: expected '"use client";\n\nimport {Fragment,use…' to contain 'scopedShellNavigation(items,pathname)'
  - Expected
  + Received
  - scopedShellNavigation(items,pathname)
  + "use client";
  +
  + import {Fragment,useEffect,useState} from "react";
  + import {apiFetch} from "@/lib/api-fetch";
  ```
- NORTH-STAR-SIDEBAR-01: old LMS 96px rail, hover push and icons > uses the exact historic 42LMS logomark and preserves the mobile focus-trapped drawer

  ```
  AssertionError: expected 'import { Suspense, type ReactNode } f…' to contain 'className="lms-shell-page min-h-dvh"'
  - Expected
  + Received
  - className="lms-shell-page min-h-dvh"
  + import { Suspense, type ReactNode } from "react";
  + import {
  +   hasMembershipRole,
  +   isSuperAdmin,
  ```

## tests/unit/chat2-public-join-states.test.ts (2 failing)
- Public recruiter invitation parity > TPO-campaigns-public-R03 labels already joined versus first join from server outcome

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'setSignInEmail(result.signInEmail)'
  - Expected
  + Received
  - setSignInEmail(result.signInEmail)
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  ```
- Public recruiter invitation parity > TPO-campaigns-public-R07 permits approved company subdomains but rejects lookalikes

  ```
  AssertionError: expected 'import {publicWorkEmailIssue,publicWo…' to contain 'matchesCompanyDomain'
  - Expected
  + Received
  - matchesCompanyDomain
  + import {publicWorkEmailIssue,publicWorkEmailIssueCopy} from "@/modules/placements/public-work-email-policy";
  + import {publicRecruiterWorkEmailSchema} from "@/modules/placements/public-college-join-model";
  + /** REC-calendar-messages-profile-R04/39/45: identify recoverable public join errors
  +  * without leaking email existence, verifying the user client-side, or claiming success. */
  ```

## tests/unit/chat2-tpo-recruiter-edit-conflict.test.ts (1 failing)
- TPO recruiter editor duplicate conflict recovery > TPO-recruiters-30 preserves edit values and links the college-scoped duplicate lead on 409

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'className="font-semibold text-primary…'
  - Expected
  + Received
  - className="font-semibold text-primary-text underline">Open {duplicateLead.name}
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { Banner } from "@/components/ui/banner";
  ```

## tests/unit/chat3-final-sprint-company-engage.test.ts (1 failing)
- chat-3 final sprint Engage company navigation and communication > TPO-companies-14 verifies scoped legacy company workflows

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'New recruiter lead for '
  - Expected
  + Received
  - New recruiter lead for
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```

## tests/unit/chat4-college-course-tabs-gap-closure.test.ts (2 failing)
- chat-4 College Course Tabs gap closure > COL-course-tabs-06 verifies scoped College Admin authoring and listing

  ```
  AssertionError: expected '"use client";\n\nimport {useEffect,us…' to contain 'Submissions'
  - Expected
  + Received
  - Submissions
  + "use client";
  +
  + import {useEffect,useRef,useState} from "react";
  + import {Input} from "@/components/ui/input";
  ```
- chat-4 College Course Tabs gap closure > COL-course-tabs-22 keeps all College Course pages usable when no college is assigned

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'Ask a Super Admin to assign a college'
  - Expected
  + Received
  - Ask a Super Admin to assign a college
  + import { Alert } from "@/components/ui/alert";
  + import {PageHeader} from "@/components/ui/page-header";
  + export function CollegeCourseMissingScope({area}:{area:string}){
  +  return <div className="min-w-0 space-y-3">
  ```
