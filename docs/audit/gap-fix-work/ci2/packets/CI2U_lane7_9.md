# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-tpo-home-gap-closure.test.ts (7 failing)
- chat-4 verified TPO Home gap coverage > TPO-home-R06 avoids invented fallback copy or fabricated null counts

  ```
  AssertionError: expected 'Registration data unavailable' to be '' // Object.is equality
  - Expected
  + Received
  + Registration data unavailable
  ```
- chat-4 verified TPO Home gap coverage > TPO-home-36 renders dated notifications and screen-reader unread text

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'slice(0,20)'
  - Expected
  + Received
  - slice(0,20)
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { canOpenTpoWorkspace, hasTpoTooling } from "@/modules/placements/tpo-workspace-access-model";
  + import { TpoKeyboardShortcuts } from "@/components/tpo/tpo-keyboard-shortcuts";
  ```
- chat-4 verified TPO Home gap coverage > TPO-home-39 uses the accessible notification Drawer instead of an absolute region

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain '<Drawer open={open} onOpenChange={cha…'
  - Expected
  + Received
  - <Drawer open={open} onOpenChange={changeOpen} title="Notifications"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- chat-4 verified TPO Home gap coverage > TPO-home-18 verified legacy and graceful behavior

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'lg:grid-cols-[minmax(0,5fr)_minmax(0,…'
  - Expected
  + Received
  - lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import {TpoHomeReturnRefresh} from "@/components/tpo/tpo-home-return-refresh";
  + import {eq} from "drizzle-orm";
  ```
- chat-4 verified TPO Home gap coverage > TPO-home-20 verified legacy and graceful behavior

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain '<PageLoading label="Loading placement…'
  - Expected
  + Received
  - <PageLoading label="Loading placement home…" variant="kpi" count={4} />
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Skeleton } from "@/components/ui/skeleton";
  + export default function LoadingTpoHome() {
  +  return <div className="min-w-0 space-y-4" aria-label="Loading placement home">
  ```
- chat-4 verified TPO Home gap coverage > TPO-home-38 verified legacy and graceful behavior

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'unread>0?<button'
  - Expected
  + Received
  - unread>0?<button
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- chat-4 verified TPO Home gap coverage > TPO-home-28 opens an accessible Ctrl K palette with bounded live search

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="listbox"'
  - Expected
  + Received
  - role="listbox"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
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

## tests/unit/chat6-college-placements-remaining-decisions.test.ts (1 failing)
- College Placements additional UNCONFIRMED decisions > COL-placements-15 does not delete a company identity or silently restore a global company

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  eq,\n  il…' to contain 'status: "ARCHIVED"'
  - Expected
  + Received
  - status: "ARCHIVED"
  + import {
  +   and,
  +   asc,
  +   eq,
  ```

## tests/unit/chat6-final-sprint-rec-home-drives-r04.test.ts (1 failing)
- Final sprint recruiter closed drive access > REC-home-drives-R04 closed drives keep read-only history and hide write actions

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'This drive is finished, so a selectio…'
  - Expected
  + Received
  - This drive is finished, so a selection list can no longer be sent.
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```

## tests/unit/chat6-superadmin-course-pagination-54.test.ts (1 failing)
- Super Admin Courses bounded page size > SA-academics-people-54 wires bounded UI page size and Refresh into the Super Admin page

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'pageSize:query.pageSize'
  - Expected
  + Received
  - pageSize:query.pageSize
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {listSuperAdminGlobalCourses} from "@/modules/courses/super-admin-global-course-directory";
  + import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
  ```

## tests/unit/chat6-tracker-list-round3.test.ts (1 failing)
- Tracker issues list legacy parity > SA-placements-projects-105 filters reporter by literal substring with pagination and legacy labels

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'name="reporter"'
  - Expected
  + Received
  - name="reporter"
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
  ```
