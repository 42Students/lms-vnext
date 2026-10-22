# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-course-material-link-safety.test.ts (1 failing)
- LEARNER-ASSIGNMENT-MATERIALS-04 safe instructor references and file selection > only permits uncredentialed, fragment-free HTTPS external materials

  ```
  AssertionError: expected 'https://[::1]/' to be null
  - Expected:
  null
  + Received:
  "https://[::1]/"
  ```

## tests/unit/chat7-project-workspace-legacy-heading.test.ts (1 failing)
- Project workspace legacy title-only headings across roles > renders the real project title and optional persisted summary without invented eyebrow

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'title={workspace.project.title}'
  - Expected
  + Received
  - title={workspace.project.title}
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat7-superadmin-course-catalogue-actionable-copy.test.ts (1 failing)
- Super Admin course catalogue action and copy parity > SA-academics-people-56 does not describe an actionable Lessons directory as read-only

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Open offering to add lessons'
  - Expected
  + Received
  - Open offering to add lessons
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat9-college-project-bookmark-redirects.test.ts (1 failing)
- legacy College Admin workspace deep-link continuity > redirects stale Workspaces list bookmarks to the canonical list

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/college/projects")'
  - Expected
  + Received
  - redirect("/college/projects")
  + import { redirect } from "next/navigation";
  +
  + /** Preserve old Workspaces bookmarks and the selected project filter/tab context. */
  + export default async function LegacyCollegeWorkspacesRedirect({searchParams}:{
  ```

## tests/unit/chat9-phase2-college-shortlisted.test.ts (1 failing)
- college shortlisted route > forces submitted+shortlisted through the authorized college applicant read

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'hasMembershipRole(context,"COLLEGE_AD…'
  - Expected
  + Received
  - hasMembershipRole(context,"COLLEGE_ADMIN")
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat9-super-admin-placement-remaining-gap-verification.test.ts (2 failing)
- Super Admin Placement operations remaining source parity > SA-placements-projects-12 previews drive deletion impact and requires confirmation before archiving

  ```
  AssertionError: expected '"use client";\nimport {useState,type …' to contain 'Confirm delete (archive)'
  - Expected
  + Received
  - Confirm delete (archive)
  + "use client";
  + import {useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```
- Super Admin Placement operations remaining source parity > SA-placements-projects-13 allows guarded changes to a published drive with recorded reason

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'Edit published drive'
  - Expected
  + Received
  - Edit published drive
  + "use client";
  + import {useEffect,useRef,useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {Input} from "@/components/ui/input";
  ```
