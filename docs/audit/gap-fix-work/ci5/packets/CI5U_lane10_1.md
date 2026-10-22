# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat19-profile-page.test.ts (1 failing)
- HR-BREAK-chat19-profile-page: active recruiter reads and session denial > HR-BREAK-PROFILE-IDENTITY-10 rejects mismatched recruiter identity before profile and grant reads

  ```
  AssertionError: expected [Function] to throw error including 'REDIRECT' but got 'Cannot destructure property \'searchP…'
  Expected: "REDIRECT"
  Received: "Cannot destructure property 'searchParams' of 'undefined' as it is undefined."
  ```

## tests/unit/PROJ-BREAK-chat9-college-project-outage.test.tsx (1 failing)
- IIT Dharwad College Admin Projects: independent outage and view contracts > PROJ-BREAK-college-ux-26 strict backend query excludes cards/table view but keeps valid filters

  ```
  AssertionError: expected { q: 'alpha', status: 'ACTIVE', …(3) } to deeply equal { q: 'alpha', status: 'ACTIVE', …(2) }
  - Expected
  + Received
  {
  "page": 2,
  -   "pageSize": 25,
  +   "pageSize": 20,
  "q": "alpha",
  ```

## tests/unit/UX-chat15-hr-tracker-pages-15.test.ts (3 failing)
- UX-HR-TRACKER-15 recruiter reports and tracker security boundaries > issue detail validates public ID then maps only genuine missing issues to 404

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'trackerPublicIdSchema.safeParse(canon…'
  - Expected
  + Received
  - trackerPublicIdSchema.safeParse(canonical)
  + import Link from "next/link";
  + import {TrackerIssueCopyActions} from "@/components/tracker/tracker-issue-copy-actions";
  + import {TrackerReporterIssueDetail} from "@/components/tracker/tracker-reporter-issue-detail";
  + import {TrackerScreenshotGallery} from "@/components/tracker/tracker-screenshot-gallery";
  ```
- UX-HR-TRACKER-15 recruiter reports and tracker security boundaries > tracker global logs and audit findings never use a college-admin or scoped Super Admin bypass

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Clear the Super Admin organization/co…'
  - Expected
  + Received
  - Clear the Super Admin organization/college safety scope
  + import Link from "next/link";
  + import type { Metadata } from "next";
  + import { Tabs } from "@/components/ui/tabs";
  +
  ```
- UX-HR-TRACKER-15 recruiter reports and tracker security boundaries > tracker reporter detail guards the owner context, validates URL ID and retains retryable failures

  ```
  AssertionError: expected 'import {notFound,redirect} from "next…' to contain 'trackerPublicIdSchema.safeParse(publi…'
  - Expected
  + Received
  - trackerPublicIdSchema.safeParse(publicId)
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  ```

## tests/unit/UX-courses-external-links-01.test.ts (1 failing)
- UX-courses-external-links-01 safe learner and offering external content > learner-youtube-player opens external media in the same tab and never grants opener access

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useEffec…' to match /href=\{(?:item\.)?externalUrl\}/
  - Expected:
  /href=\{(?:item\.)?externalUrl\}/
  + Received:
  "\"use client\";
  import {
  useEffect,
  useRef,
  ```

## tests/unit/UX-teacher-results-coverage-01.test.ts (1 failing)
- UX-teacher-results-01 /teacher/results keeps report scope and state contracts

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/chat11-college-projects-pages-adversarial.test.ts (2 failing)
- PROJ-BREAK-COL-PAGES-01 scope and resilience for all seven College Admin entries > missing optional template labels must not hide actual project workspaces

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'emptyTitle="No Projects match these f…'
  - Expected
  + Received
  - emptyTitle="No Projects match these filters"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- PROJ-BREAK-COL-PAGES-01 scope and resilience for all seven College Admin entries > does not produce a class team when authority or published templates are unavailable

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'href="/college/projects/templates"'
  - Expected
  + Received
  - href="/college/projects/templates"
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {CreateProjectControl} from "@/components/projects/project-create-control";
  + import {ClassTeamWorkspaceCreator} from "@/components/projects/class-team-workspace-creator";
  ```

## tests/unit/chat12-profile-facets-round6.test.ts (1 failing)
- TPO saved profile count facets > TPO-students-31 uses saved profile and separate placement readiness

  ```
  AssertionError: expected 'import {\n  getLearnerPlacementAccess…' to contain 'profileFacts:tpoStudentProfileFacts'
  - Expected
  + Received
  - profileFacts:tpoStudentProfileFacts
  + import {
  +   getLearnerPlacementAccess,
  +   type ResolvedPlacementParticipation,
  + } from "./batch-eligibility-policy";
  ```

## tests/unit/chat13-application-rescreen.test.ts (1 failing)
- Application re-screen on real academic evidence > SA-placements-projects-21 protects mutation origin and shows scored policy checks without a fake match score

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'No fabricated public resume URL or ma…'
  - Expected
  + Received
  - No fabricated public resume URL or match score is shown.
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```
