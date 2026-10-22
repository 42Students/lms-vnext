# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/ux-admin-chat9-cross-audit-second.test.ts (10 failing)
- UX cross-audit /admin second third (chat-9) > UX-admin-inbound-mail-02 shows an honest unavailable-storage retry and accessible filters

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-11 items-center justify-center'
  - Expected
  + Received
  - min-w-11 items-center justify-center
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Tabs} from "@/components/ui/tabs";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-lecture-halls-03 keeps every action visible on a phone and preserves failed drafts

  ```
  AssertionError: expected '"use client";\n\nimport { useRouter }…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + "use client";
  +
  + import { useRouter } from "next/navigation";
  + import Link from "next/link";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-organizations-02 mounts one responsive DataTable, not duplicate action forms

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No organizations in this scope'
  - Expected
  + Received
  - No organizations in this scope
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { OrganizationActions } from "@/components/admin/organization-actions";
  + import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-people-directory-02 preserves college privacy and focusable filters/pagination

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'label="Users pages"'
  - Expected
  + Received
  - label="Users pages"
  + import Link from "next/link";
  + import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
  + import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-placements-analytics-02 shows missing-college help before invoking scoped services

  ```
  AssertionError: expected -1 to be greater than -1
  ❯ tests/unit/ux-admin-chat9-cross-audit-second.test.ts:62:17
  60|   const page=route("placements/analytics");
  61|   const guard=page.indexOf('if(!context.adminScope?.collegeId)');
  62|   expect(guard).toBeGreaterThan(-1);
  |                 ^
  63|   expect(guard).toBeLessThan(page.indexOf("getSuperAdminCompanyHiringR…
  64|   expect(page).toContain("Select a college to continue");
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-placements-jobs-schedule-02 retains persisted round DataTable and real candidate actions

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'No candidate interviews have been sch…'
  - Expected
  + Received
  - No candidate interviews have been scheduled for this drive.
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import {useToast} from "@/components/ui/toast";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-placements-new-02 keeps scoped creation without a blank-page redirect

  ```
  AssertionError: expected 'import { ErrorState } from "@/compone…' to contain '<PlacementJobCreateWorkspace'
  - Expected
  + Received
  - <PlacementJobCreateWorkspace
  + import { ErrorState } from "@/components/ui/error-state";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-live-classes-02 public content links are same-tab, https vetted and phone reachable

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'label="Open public link"'
  - Expected
  + Received
  - label="Open public link"
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-placements-calendar-02 all calendar chips/events meet phone size and high contrast focus

  ```
  AssertionError: expected 'import {TpoWeekHourCalendar} from "@/…' not to contain 'min-h-9'
  - Expected
  + Received
  - min-h-9
  + import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  + import Link from "next/link";
  +
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-placements-jobs-04 all drive tabs are 44px and contrast safe

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  +
  + const tabs = [
  ```

## tests/unit/w03-archived-project-readonly.test.ts (1 failing)
- W03 archived project read-only UI contract > derives one read-only flag from persisted ARCHIVED status

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Archived workspace · read only'
  - Expected
  + Received
  - Archived workspace · read only
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
