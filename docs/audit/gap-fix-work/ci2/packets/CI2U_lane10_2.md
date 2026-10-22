# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-project-list-page.test.tsx (4 failing)
- IIT Dharwad Super Admin Projects workspace page privacy and failure recovery > PROJ-BREAK-admin-resilience-24 DB outage returns a friendly retry with exact validated filters

  ```
  AssertionError: expected 'Project workspaces College project wo…' to contain 'Project workspaces unavailable'
  Expected: "Project workspaces unavailable"
  Received: "Project workspaces College project workspaces for students and mentors. Couldn't refresh workspaces. Your filters are unchanged, but previously fetched rows are not reused across college scopes. Workspaces Project workspace filters Failed to load project workspaces Couldn't refresh worksp
  ```
- IIT Dharwad Super Admin Projects workspace page privacy and failure recovery > PROJ-BREAK-admin-idor-26 missing selected college denies both data reads

  ```
  Error: NEXT_REDIRECT
  ❯ getRedirectError node_modules/next/src/client/components/redirect.ts:15:17
  ❯ getRedirectError node_modules/next/src/client/components/redirect.ts:40:9
  ```
- IIT Dharwad Super Admin Projects workspace page privacy and failure recovery > PROJ-BREAK-admin-idor-28 disabled and non-platform actors never reach any project read

  ```
  AssertionError: expected 'Project workspaces Project access den…' to contain 'Back to dashboard'
  Expected: "Back to dashboard"
  Received: "Project workspaces Project access denied Your account cannot access Super Admin project workspaces. /dashboard"
  ```
- IIT Dharwad Super Admin Projects workspace page privacy and failure recovery > PROJ-BREAK-admin-ux-29 table/card switch keeps authorized search, status, page and row count

  ```
  AssertionError: expected 'Project workspaces College project wo…' to contain '/admin/projects?view=table&search=IIT…'
  Expected: "/admin/projects?view=table&search=IIT+Dharwad&status=ACTIVE&page=3&pageSize=50"
  Received: "Project workspaces College project workspaces for students and mentors. Project workspace filters Showing  0  of  0  authorized college workspaces. CSV exports the current permissioned page, not all workspaces."
  ```

## tests/unit/PROJ-BREAK-chat9-mentor-workload-tenant.test.ts (1 failing)
- IIT Dharwad Projects: mentor reassignment workload tenant and input safety > PROJ-BREAK-mentor-90 authorized workload remains scoped, archived-free and read-only

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/PROJ-BREAK-chat9-template-directory-service.test.ts (1 failing)
- IIT Dharwad: Super Admin template catalogue role and tenant behavior > PROJ-BREAK-scale-26 second page remains bounded, and empty results skip extra joins

  ```
  AssertionError: expected 5 to be 3 // Object.is equality
  - Expected
  + Received
  - 3
  + 5
  ```

## tests/unit/UX-chat15-hr-tracker-pages-07.test.ts (11 failing)
- UX-HR-PAGES-07: recruiter and tracker page role, error and alias contracts > UX-HR-ROLE-07: hr/home/page.tsx rejects an inactive recruiter before private data

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'eyebrow="Recruiter"'
  - Expected
  + Received
  - eyebrow="Recruiter"
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  ```
- UX-HR-PAGES-07: recruiter and tracker page role, error and alias contracts > UX-HR-ROLE-07: hr/calendar/page.tsx rejects an inactive recruiter before private data

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'eyebrow="Recruiter"'
  - Expected
  + Received
  - eyebrow="Recruiter"
  + import { DateInput } from "@/components/ui/date-input";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  ```
- UX-HR-PAGES-07: recruiter and tracker page role, error and alias contracts > UX-HR-ROLE-07: hr/drives/page.tsx rejects an inactive recruiter before private data

  ```
  AssertionError: expected 'import {StatusBadge} from "@/componen…' to contain 'eyebrow="Recruiter"'
  - Expected
  + Received
  - eyebrow="Recruiter"
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- UX-HR-PAGES-07: recruiter and tracker page role, error and alias contracts > UX-HR-ROLE-07: hr/company/page.tsx rejects an inactive recruiter before private data

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'eyebrow="Recruiter"'
  - Expected
  + Received
  - eyebrow="Recruiter"
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```
- UX-HR-PAGES-07: recruiter and tracker page role, error and alias contracts > UX-HR-ROLE-07: hr/conversations/page.tsx rejects an inactive recruiter before private data

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain 'eyebrow="Recruiter"'
  - Expected
  + Received
  - eyebrow="Recruiter"
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- UX-HR-PAGES-07: recruiter and tracker page role, error and alias contracts > UX-HR-ROLE-07: hr/notifications/page.tsx rejects an inactive recruiter before private data

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'eyebrow="Recruiter"'
  - Expected
  + Received
  - eyebrow="Recruiter"
  + import { Tabs } from "@/components/ui/tabs";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  + import Link from "next/link";
  + import { Input } from "@/components/ui/input";
  ```
- UX-HR-PAGES-07: recruiter and tracker page role, error and alias contracts > UX-HR-ROLE-07: hr/profile/page.tsx rejects an inactive recruiter before private data

  ```
  AssertionError: expected 'import { DataTable } from "@/componen…' to contain 'redirect("/dashboard")'
  - Expected
  + Received
  - redirect("/dashboard")
  + import { DataTable } from "@/components/ui/data-table";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  + import { z } from "zod";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- UX-HR-PAGES-07: recruiter and tracker page role, error and alias contracts > UX-HR-ROLE-07: hr/placements/page.tsx rejects an inactive recruiter before private data

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'eyebrow="Recruiter"'
  - Expected
  + Received
  - eyebrow="Recruiter"
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { RecruiterPlacementPortfolio } from "@/components/placements/recruiter-placement-portfolio";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- UX-HR-PAGES-07: recruiter and tracker page role, error and alias contracts > UX-HR-INPUT-07: malformed recruiter page filters keep a visible recovery path

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain 'Invalid conversation filters.'
  - Expected
  + Received
  - Invalid conversation filters.
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- UX-HR-PAGES-07: recruiter and tracker page role, error and alias contracts > UX-HR-ALIAS-07: recruiter URLs reuse the protected HR pages, not a weaker second implementation

  ```
  AssertionError: expected 'import HrHome from "@/app/(authentica…' to contain 'export { default } from "@/app/(authe…'
  - Expected
  + Received
  - export { default } from "@/app/(authenticated)/hr/home/page"
  + import HrHome from "@/app/(authenticated)/hr/home/page";
  + /** Preserve /recruiter/home while forwarding the selected recruiter college. */
  + export default function RecruiterHome({searchParams}:{
  +  searchParams:Promise<{collegeId?:string|string[]}>
  ```
- … 1 more in this file

## tests/unit/UX-college-college-classes-01.test.ts (1 failing)
- UX-college-college-classes-01 retains responsive forms, states and legacy copy

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeStructureDirectory } from "@/components/academics/college-structure-directory";
  ```

## tests/unit/UX-college-college-hiring-dashboard-01.test.ts (1 failing)
- UX-college-college-hiring-dashboard-01 keeps accessible shared screen state

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { Alert } from "@/components/ui/alert";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
