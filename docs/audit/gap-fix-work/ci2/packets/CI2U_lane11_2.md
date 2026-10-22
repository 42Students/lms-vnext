# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-project-sections.test.tsx (2 failing)
- Super Admin last-third Project detail role and route guard > PROJ-BREAK-idor-55 unauthorized Super Admin scope fails before workspace view read

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + <section
  +   aria-live="polite"
  +   className="min-w-0 space-y-4"
  ```
- Super Admin last-third Project detail role and route guard > PROJ-BREAK-ux-39 whitelisted at-risk and submission referrals preserve navigation safely

  ```
  AssertionError: expected { …(10) } to match object { mode: 'ADMIN', …(5) }
  (5 matching properties omitted from actual)
  - Expected
  + Received
  {
  "activeSection": "delivery",
  "backHref": "/admin/projects/at-risk",
  "backLabel": "Back to at-risk projects",
  ```

## tests/unit/PROJ-BREAK-chat9-readiness-page-guard.test.tsx (4 failing)
- IIT Dharwad Projects: readiness deep-link, denied and partial-data states > PROJ-BREAK-readiness-67 invalid UUID cannot trigger authorization or a project read

  ```
  AssertionError: expected 'Submission readiness Projects Workspa…' to contain 'Workspace readiness unavailable'
  Expected: "Workspace readiness unavailable"
  Received: "Submission readiness Projects Workspace not found Check the workspace link or return to your workspaces. /admin/projects"
  ```
- IIT Dharwad Projects: readiness deep-link, denied and partial-data states > PROJ-BREAK-readiness-68 revoked/foreign actor never sees readiness content

  ```
  AssertionError: expected 'Submission readiness Projects Workspa…' to contain 'Workspace readiness unavailable'
  Expected: "Workspace readiness unavailable"
  Received: "Submission readiness Projects Workspace could not be loaded The workspace may be unavailable or your access may have changed. Retry /admin/projects/22222222-2222-4222-8222-222222222222/readiness /admin/projects"
  ```
- IIT Dharwad Projects: readiness deep-link, denied and partial-data states > PROJ-BREAK-readiness-69 a service outage shows an actionable safe state without data leakage

  ```
  AssertionError: expected 'Submission readiness Projects Workspa…' to contain 'Back to workspaces'
  Expected: "Back to workspaces"
  Received: "Submission readiness Projects Workspace could not be loaded The workspace may be unavailable or your access may have changed. Retry /admin/projects/22222222-2222-4222-8222-222222222222/readiness /admin/projects"
  ```
- IIT Dharwad Projects: readiness deep-link, denied and partial-data states > PROJ-BREAK-readiness-70 valid role renders legacy readiness and safely handles a bad stored date

  ```
  TypeError: Cannot read properties of undefined (reading 'advisoryWarnings')
  ❯ Module.ProjectWorkspaceReadiness src/components/projects/project-workspace-readiness.tsx:137:34
  135|         </div>
  136|       </dl>
  137|       {readiness.legacyReadiness.advisoryWarnings.length>0?
  |                                  ^
  138|         <aside role="note" aria-label="Nonblocking readiness advisorie…
  139|           className="border-l-[3px] border-warning bg-[var(--lms-warni…
  ```

## tests/unit/PROJ-BREAK-chat9-template-subview-recovery.test.ts (1 failing)
- Super Admin Projects: safe template subview failures > PROJ-BREAK-ux-15 handles missing templates as 404, but outage/revocation as explicit retry

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<ErrorState title="Template section u…'
  - Expected
  + Received
  - <ErrorState title="Template section unavailable"
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import {desc,eq} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/UX-chat15-hr-tracker-pages-15.test.ts (4 failing)
- UX-HR-TRACKER-15 recruiter reports and tracker security boundaries > HR activity never loads invalid filters or exposes a private application list

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Invalid activity filters.'
  - Expected
  + Received
  - Invalid activity filters.
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Tabs } from "@/components/ui/tabs";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  + import Link from "next/link";
  ```
- UX-HR-TRACKER-15 recruiter reports and tracker security boundaries > UX-TRACKER-ADMIN-15 tracker/logs/page.tsx checks global role before sensitive service access

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'redirect("/dashboard")'
  - Expected
  + Received
  - redirect("/dashboard")
  + import Link from "next/link";
  + import type { Metadata } from "next";
  + import { Tabs } from "@/components/ui/tabs";
  +
  ```
- UX-HR-TRACKER-15 recruiter reports and tracker security boundaries > tracker global logs and audit findings never use a college-admin or scoped Super Admin bypass

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'context.adminScope?.collegeId || cont…'
  - Expected
  + Received
  - context.adminScope?.collegeId || context.adminScope?.organizationId
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

## tests/unit/UX-college-college-classes-recurring-preview-01.test.ts (1 failing)
- UX-college-college-classes-recurring-preview-01 retains responsive forms, states and legacy copy

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeRecurringRouteModal } from "./route-modal";
  + import { PageHeader } from "@/components/ui/page-header";
  ```

## tests/unit/UX-college-college-lecture-halls-01.test.ts (1 failing)
- UX-college-college-lecture-halls-01 keeps accessible shared screen state

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```
