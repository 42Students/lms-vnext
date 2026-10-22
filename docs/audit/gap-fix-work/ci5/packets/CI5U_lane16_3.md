# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-superadmin-branding-page-journey.test.tsx (2 failing)
- SA-colleges-branding-page-01 tenant branding permissions and honest editor state > rejects a missing or out-of-scope tenant preview

  ```
  AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times
  Received:
  1st vi.fn() call:
  Array [
  Object {
  "adminScope": Object {
  "collegeId": "11111111-1111-4111-8111-111111111111",
  "organizationId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  ```
- SA-colleges-branding-page-01 tenant branding permissions and honest editor state > renders persisted preview, real optimistic edit version and selected-college uploader

  ```
  AssertionError: expected '<div class="min-w-0 max-w-full space-…' to contain 'Look and feel'
  Expected: "Look and feel"
  Received: "<div class="min-w-0 max-w-full space-y-4" data-testid="superadmin.college.branding"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [
  ```

## tests/unit/chat5-ux-cross-tpo-last.test.ts (11 failing)
- Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85–126) > UX-tpo-requests-09 preserves legacy page wording while enforcing authenticated shell and contrast invariants

  ```
  AssertionError: expected 'import { Select } from "@/components/…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChipLink} from "@/components/ui/filter-chip";
  ```
- Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85–126) > UX-tpo-settings-09 preserves legacy page wording while enforcing authenticated shell and contrast invariants

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {TpoSettingsNav} from "@/components/placements/tpo-settings-nav";
  + import {TpoLegacySettingsRedirect,TpoSettingsHashRedirect} from "@/components/tpo/tpo-legacy-settings-redirect";
  ```
- Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85–126) > UX-tpo-settings-notifications-09 preserves legacy page wording while enforcing authenticated shell and contrast invariants

  ```
  AssertionError: expected 'import { SummaryStrip } from "@/compo…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  ```
- Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85–126) > UX-tpo-settings-prep-readiness-09 preserves legacy page wording while enforcing authenticated shell and contrast invariants

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
  ```
- Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85–126) > UX-tpo-settings-rules-09 preserves legacy page wording while enforcing authenticated shell and contrast invariants

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' not to match /<main(?=[\s>])/
  - Expected:
  /<main(?=[\s>])/
  + Received:
  "import { Disclosure } from \"@/components/ui/disclosure\";
  import type {ReactNode} from \"react\";
  import { PageHeader } from \"@/components/ui/page-header\";
  import Link from \"next/link\";
  ```
- Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85–126) > UX-tpo-verification-09 preserves legacy page wording while enforcing authenticated shell and contrast invariants

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import {TpoSafeCsvDownload} from "@/components/tpo/tpo-safe-csv-download";
  ```
- Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85–126) > UX-tpo-settings-notifications-10 exposes all list data and actions via mobile DataTable with explicit empty copy

  ```
  AssertionError: expected 'import { SummaryStrip } from "@/compo…' to contain 'empty={<p>'
  - Expected
  + Received
  - empty={<p>
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  ```
- Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85–126) > UX-tpo-settings-recruiters-10 exposes all list data and actions via mobile DataTable with explicit empty copy

  ```
  AssertionError: expected [ 'mobilePriority:"secondary"', …(6) ] to have a length of 6 but got 7
  - Expected
  + Received
  - 6
  + 7
  ```
- Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85–126) > UX-tpo-settings-team-10 exposes all list data and actions via mobile DataTable with explicit empty copy

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'empty={<p>'
  - Expected
  + Received
  - empty={<p>
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { TpoSettingsTeamManage, TpoSettingsTeamRemove } from "@/components/tpo/tpo-settings-team-manage";
  + import { listTpoTeamAssignableStaff } from "@/modules/placements/tpo-settings-team-actions-service";
  + import Link from "next/link";
  ```
- Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85–126) > UX-tpo-settings-trusted-13 uses a focus-managed domain confirmation and keeps verification warning

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'role="alert" className="text-sm text-…'
  - Expected
  + Received
  - role="alert" className="text-sm text-foreground"
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- … 1 more in this file

## tests/unit/chat6-faculty-assessments-create-legacy.test.ts (1 failing)
- faculty assessment create legacy two-step entry > FAC-assessments-12 requires course and lesson before Continue and exposes exact selection copy

  ```
  AssertionError: expected '"use client";\n\nimport {useId,useMem…' to contain 'Select a course and lesson first.'
  - Expected
  + Received
  - Select a course and lesson first.
  + "use client";
  +
  + import {useId,useMemo,useState} from "react";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/chat6-superadmin-content-verified-exports.test.ts (1 failing)
- Super Admin content CSV parity > SA-academics-people-69 exposes four selected-college bounded CSV endpoints

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '/api/admin/assignments/export'
  - Expected
  + Received
  - /api/admin/assignments/export
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/chat6-tracker-log-scope-policy.test.ts (1 failing)
- 42 Tracker secure log access policy > SA-placements-projects-118 NOT-A-GAP manager password bypass is disallowed by OD-27; log access remains Super Admin scoped

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'if (!isSuperAdmin(context)) redirect'
  - Expected
  + Received
  - if (!isSuperAdmin(context)) redirect
  + import Link from "next/link";
  + import type { Metadata } from "next";
  + import { Tabs } from "@/components/ui/tabs";
  +
  ```

## tests/unit/chat7-learner-course-list-model-coverage.test.ts (1 failing)
- chat-7 learner course discovery/list behavioural matrix > UX-learn-courses-tab-query-11 excludes selection-only keys and rejects oversized values

  ```
  AssertionError: expected null to be 'x' // Object.is equality
  - Expected:
  "x"
  + Received:
  null
  ```

## tests/unit/chat7-round2-mentor-03.test.ts (1 failing)
- chat-7 mentor overview evidence > MEN-projects-meetings-24 team card with explainer and count

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'See who is assigned, what role they p…'
  - Expected
  + Received
  - See who is assigned, what role they play
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat9-accreditation-placement-rule.test.ts (1 failing)
- Accreditation placed student policy > TPO-calendar-reports-R01 includes released offers for OFFER_RELEASED but not for OFFER_ACCEPTED

  ```
  AssertionError: expected [] to have a length of 1 but got +0
  - Expected
  + Received
  - 1
  + 0
  ```
