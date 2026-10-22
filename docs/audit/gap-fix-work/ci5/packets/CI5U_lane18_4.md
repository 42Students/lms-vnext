# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-owner-decision-scope-parity.test.ts (1 failing)
- Owner-approved improvements over obsolete legacy workflows > COL-projects-05 preserves recoverable archive and restore instead of a competing delete implementation

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'Archived workspaces can be reopened w…'
  - Expected
  + Received
  - Archived workspaces can be reopened with all of their content.
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat9-super-admin-module-access.test.ts (1 failing)
- Super Admin Module Access entry > uses persisted scoped module-access service, not a dummy redirect

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'listSuperAdminFeatureControls(context…'
  - Expected
  + Received
  - listSuperAdminFeatureControls(context,parsed)
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Banner } from "@/components/ui/banner";
  ```

## tests/unit/college-activity-model.test.ts (2 failing)
- College activity model > strictly accepts actor, entity and date filters

  ```
  AssertionError: expected { Object (from, to) } to deeply equal {}
  - Expected
  + Received
  - {}
  + {
  +   "from": "2026-09-23",
  +   "to": "2026-10-22",
  + }
  ```
- College activity model > persists bounded per-page size in cursor URLs without accepting oversized reads

  ```
  AssertionError: expected null to be '50' // Object.is equality
  - Expected:
  "50"
  + Received:
  null
  ```

## tests/unit/college-people-gap-closure.test.ts (4 failing)
- College People legacy audited page contracts > COL-people-17 Contacts separate from member management with role tabs and page-size

  ```
  AssertionError: expected 'import CollegeContactsPage from "../c…' to contain 'redirect("/college/contacts")'
  - Expected
  + Received
  - redirect("/college/contacts")
  + import CollegeContactsPage from "../contacts/page";
  +
  + /** Keep the historical /college-admin/people destination on the canonical
  +  * college workspace URL. The old shared directory maps to role-specific
  ```
- College People legacy audited page contracts > COL-people-27 Faculty and Learner use responsive cards and bounded desktop table

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain '<ScrollCue axis="x" label={title + " …'
  - Expected
  + Received
  - <ScrollCue axis="x" label={title + " scrollable results columns"}>
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```
- College People legacy audited page contracts > COL-people-20 Super Admin permission guards COLLEGE_ADMIN grant and revoke before writes

  ```
  AssertionError: expected 'export async function addMembershipRo…' to contain 'if (input.role === "COLLEGE_ADMIN") {…'
  - Expected
  + Received
  - if (input.role === "COLLEGE_ADMIN") {
  + export async function addMembershipRole(
  +   context: RequestContext,
  +   membershipIdInput: string,
  +   rawInput: unknown,
  ```
- College People legacy audited page contracts > COL-people-21 shows persisted mentor workload risk and an Unassigned filter

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'row.activeWorkspaces'
  - Expected
  + Received
  - row.activeWorkspaces
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/faculty-profile-round10-4.test.ts (1 failing)
- names the invalid field so Faculty can correct it

  ```
  TypeError: .toMatch() expects to receive a string, but got object
  ❯ tests/unit/faculty-profile-round10-4.test.ts:6:79
  4|  expect(facultyProfileTextDraftIssue("personalDetails",{dateOfBirth:"2…
  5|  expect(facultyProfileTextDraftIssue("address",{currentAddress:"Hi"}))…
  6|  expect(facultyProfileTextDraftIssue("about",{description:"x".repeat(5…
  |                                                                               ^
  7| });
  8|
  ```

## tests/unit/hr-recruiter-exhaustive-chat15-02.test.ts (1 failing)
- HR interview slots, rounds, offers, messaging and drafts chat-15 > HR-round-schedule returns only valid scheduled rows, detects overlap and deep links to current job

  ```
  AssertionError: expected [ { …(8) }, { …(8) }, …(1) ] to have a length of 2 but got 3
  - Expected
  + Received
  - 2
  + 3
  ```

## tests/unit/learner-dashboard-model.test.ts (4 failing)
- Learner placement dashboard summary and priority > renders a real first-run browse action with zero counts

  ```
  AssertionError: expected '/learn/my-placements' to be '/learn/my-placements/jobs' // Object.is equality
  Expected: "/learn/my-placements/jobs"
  Received: "/learn/my-placements"
  ```
- Learner placement dashboard summary and priority > prioritizes a soon assessment over an earlier interview

  ```
  AssertionError: expected 'interview' to be 'test' // Object.is equality
  Expected: "test"
  Received: "interview"
  ```
- Learner placement dashboard summary and priority > retains the actual chronologically next scheduled event even when hero prefers a later test

  ```
  AssertionError: expected 'earlier' to be 'later' // Object.is equality
  Expected: "later"
  Received: "earlier"
  ```
- L11-014 needs-attention ordering > shows the earliest effective schedule, not all assessments before interviews

  ```
  AssertionError: expected 'early-interview' to be 'middle-test' // Object.is equality
  Expected: "middle-test"
  Received: "early-interview"
  ```

## tests/unit/learner-placements-chat7-legacy-headings-r7.test.ts (1 failing)
- chat-7 learner Placements legacy tabs and hero > LEARNER-placements-03 has no duplicate heading below shared tab strip

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' not to contain '<PageHeader'
  - Expected
  + Received
  - <PageHeader
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import { PageLoading } from "@/components/ui/page-loading";
  + import {StatusBadge,applicationStatusTone} from "@/components/ui/status-badge";
  ```
