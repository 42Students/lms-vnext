# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat15-recruiter-tracker-route-matrix-41.test.ts (1 failing)
- UX-CHAT15-ROUTES-41 HR, recruiter and tracker access and state matrix > HR-FILTER-RECOVERY-41 activity, messages, drives, rounds and company reports expose recoverable invalid filters

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'Invalid inbox filter.'
  - Expected
  + Received
  - Invalid inbox filter.
  + import { Tabs } from "@/components/ui/tabs";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  + import Link from "next/link";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/chat16-public-login-page-render-08.test.ts (2 failing)
- chat-16 direct public sign-in page render and tenant/OTP journeys > AUTH-PAGE-OTP-01 renders the actual login route with both permitted OTP channels

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'Sign in with the phone number or email'
  Expected: "Sign in with the phone number or email"
  Received: "<link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><main class="_viewport_3c482d"><div aria-hidden="true" class="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden lg:block"><svg viewBox="0 0 48 48" width="84" height="84" fill="none" class="absolute l
  ```
- chat-16 direct public sign-in page render and tenant/OTP journeys > AUTH-PAGE-BRANDING-07 gives college-bound OTP login its own title

  ```
  AssertionError: expected { …(3) } to match object { title: 'Sign in · IIT Dharwad' }
  (5 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "title": "Sign in · IIT Dharwad",
  +   "title": {
  +     "absolute": "Sign in · IIT Dharwad",
  ```

## tests/unit/chat19-college-cross-audit.test.ts (11 failing)
- chat-19 college UX cross-audit > COL-XA-08 accepts defaults and bounded, user-visible URL filters

  ```
  AssertionError: expected { Object (view, page, ...) } to deeply equal { Object (view, page, ...) }
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 25,
  -   "view": "cards",
  +   "pageSize": 20,
  ```
- chat-19 college UX cross-audit > COL-XA-08 rejects malformed or hostile project list filters: {"pageSize":"20000"}

  ```
  
  ```
- chat-19 college UX cross-audit > COL-XA-08 rejects malformed or hostile project list filters: {"pageSize":"-1"}

  ```
  
  ```
- chat-19 college UX cross-audit > COL-XA-08 rejects malformed or hostile project list filters: {"status":"OTHER_COLLEGE"}

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- chat-19 college UX cross-audit > COL-XA-09 keeps workspaces visible when optional template labels fail

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'listProjectAdminSnapshots(context, co…'
  - Expected
  + Received
  - listProjectAdminSnapshots(context, collegeId, query)
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- chat-19 college UX cross-audit > COL-XA-07 exposes roster fields and class-move controls in mobile cards

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'empty={<p className="text-sm text-mut…'
  - Expected
  + Received
  - empty={<p className="text-sm text-muted-foreground">No matching students.</p>}
  + import Link from "next/link";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { notFound, redirect } from "next/navigation";
  + import { and, eq, ilike, or } from "drizzle-orm";
  ```
- chat-19 college UX cross-audit > COL-XA-11 uses mobile cards with labelled elective allocation checkboxes

  ```
  AssertionError: expected '"use server";\nimport Link from "next…' to contain 'empty={<p'
  - Expected
  + Received
  - empty={<p
  + "use server";
  + import Link from "next/link";
  + import { redirect, notFound } from "next/navigation";
  + import { and, asc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
  ```
- chat-19 college UX cross-audit > COL-XA-13 keeps each faculty assignment field and both guarded actions in mobile cards

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'key: "period"'
  - Expected
  + Received
  - key: "period"
  + import Link from "next/link";
  + import { FACULTY_ASSIGNMENT_COPY, FACULTY_ASSIGNMENT_ROLE_LABELS, facultyAssignmentRoleLabel } from "@/modules/courses/college-courses-copy";
  + import { Alert } from "@/components/ui/alert";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-19 college UX cross-audit > COL-XA-15 keeps elective roster actions, state and join time visible on phones

  ```
  AssertionError: expected '"use server";\nimport Link from "next…' to contain 'required /> Confirm removal'
  - Expected
  + Received
  - required /> Confirm removal
  + "use server";
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { and, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
  ```
- chat-19 college UX cross-audit > COL-XA-16 stale or malformed elective and membership identifiers fail safely

  ```
  AssertionError: expected '"use server";\nimport Link from "next…' to contain 'eq(electiveSlots.collegeId, context.m…'
  - Expected
  + Received
  - eq(electiveSlots.collegeId, context.membership.collegeId)
  + "use server";
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { and, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
  ```
- … 1 more in this file

## tests/unit/chat2-final-sprint-recruiter-messages.test.ts (2 failing)
- Final sprint recruiter conversations verification > REC-calendar-messages-profile-13 refreshes visible recruiter discussions at four seconds and on focus without GET writes

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'window.addEventListener("focus",updat…'
  - Expected
  + Received
  - window.addEventListener("focus",update)
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import { Button } from "@/components/ui/button";
  ```
- Final sprint recruiter conversations verification > REC-calendar-messages-profile-15 independent final-sprint acceptance regression

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'setNotice("Could not send. "+feedback)'
  - Expected
  + Received
  - setNotice("Could not send. "+feedback)
  + "use client";
  + import {useEffect,useRef,useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/chat2-tpo-lead-modal-source.test.ts (1 failing)
- TPO recruiter contact modal and source parity > TPO-recruiters-36 traps Tab and supports Escape inside editable recruiter dialogs

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat3-faculty-gradebook-http-route.test.ts (1 failing)
- FAC-GRADE-HTTP-01 Faculty published gradebook CSV endpoint > returns a BOM, safe formula values and published Section grades, never learner email/PII

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat4-college-academics-people-weak-area.test.ts (2 failing)
- College academics/people weak-area behavioural ledger > COL-academics-CSV-01 uses neutralized formula cells, fixed field order, declared row cap and recorded data only

  ```
  TypeError: Cannot read properties of undefined (reading 'replace')
  ❯ safeCollegeCsvCell src/modules/academics/college-directory-export-model.ts:6:22
  4|  * invisible prefixes that some spreadsheet engines silently strip. */
  5| function safeCollegeCsvCell(value:string):string {
  6|  const visible=value.replace(/^[\s\p{Cf}\p{Mn}]*/u,"");
  |                      ^
  7|  return escapeActivityCsvCell(/^[-=+@]/u.test(visible)?"'"+value:value…
  8| }
  ```
- College academics/people weak-area behavioural ledger > COL-people-DIRECTORY-01 rejects duplicated, foreign, cross-role and out-of-range filters

  ```
  AssertionError: expected [Function] to throw an error
  ❯ tests/unit/chat4-college-academics-people-weak-area.test.ts:83:59
  81|    {sectionId:"javascript:alert(1)"},{q:"x".repeat(101)},
  82|   ]){
  83|    expect(()=>parseCollegeRoleDirectorySearchParams(raw)).toThrow();
  |                                                           ^
  84|   }
  85|   const faculty=collegeRoleDirectoryQuerySchema.parse({sectionId:colle…
  ```

## tests/unit/chat4-college-ux-round5.test.ts (6 failing)
- Chat-4 college UX round five > UX-college-departments-01 makes the layout or actions more readable on narrow screens

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import Link from "next/link";
  + import { Alert } from "@/components/ui/alert";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Chat-4 college UX round five > UX-college-domains-01 makes the layout or actions more readable on narrow screens

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import {
  ```
- Chat-4 college UX round five > UX-college-electives-01 makes the layout or actions more readable on narrow screens

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Chat-4 college UX round five > UX-college-electives-slotId-allocate-01 makes the layout or actions more readable on narrow screens

  ```
  AssertionError: expected '"use server";\nimport Link from "next…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + "use server";
  + import Link from "next/link";
  + import { redirect, notFound } from "next/navigation";
  + import { and, asc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
  ```
- Chat-4 college UX round five > UX-college-electives-slotId-offerings-offeringId-roster-01 makes the layout or actions more readable on narrow screens

  ```
  AssertionError: expected '"use server";\nimport Link from "next…' to contain 'rows={detail.members}'
  - Expected
  + Received
  - rows={detail.members}
  + "use server";
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { and, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
  ```
- Chat-4 college UX round five > UX-college-faculty-assignment-01 makes the layout or actions more readable on narrow screens

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import Link from "next/link";
  + import { FACULTY_ASSIGNMENT_COPY, FACULTY_ASSIGNMENT_ROLE_LABELS, facultyAssignmentRoleLabel } from "@/modules/courses/college-courses-copy";
  + import { Alert } from "@/components/ui/alert";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
