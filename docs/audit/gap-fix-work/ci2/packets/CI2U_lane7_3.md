# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-placements-jobs-jobId-settings-01.test.ts (2 failing)
- /college/placements/jobs/[jobId]/settings UX > UX-college-placements-jobs-settings-01 keeps audited user-visible behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Legacy drive settings"'
  - Expected
  + Received
  - aria-label="Legacy drive settings"
  + import Link from "next/link";
  + import {ErrorState} from "@/components/ui/error-state";
  + import {Tabs} from "@/components/ui/tabs";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  ```
- /college/placements/jobs/[jobId]/settings UX > UX-college-placements-jobs-settings-02 keeps audited user-visible behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'className="min-w-0 space-y-3"'
  - Expected
  + Received
  - className="min-w-0 space-y-3"
  + import Link from "next/link";
  + import {ErrorState} from "@/components/ui/error-state";
  + import {Tabs} from "@/components/ui/tabs";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  ```

## tests/unit/UX-college-students-membershipId-01.test.ts (1 failing)
- /college/students/[membershipId] UX > UX-college-students-detail-02 preserves the new accessible state and responsive contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'focus-visible:outline-2'
  - Expected
  + Received
  - focus-visible:outline-2
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```

## tests/unit/UX-hr-page-states-chat15-01.test.ts (10 failing)
- UX-hr-page-states-chat15-01 recruiter route coverage > HR-page /hr/activity has role isolation, safe UX states and exact relevant copy

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Tabs } from "@/components/ui/tabs";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  + import Link from "next/link";
  ```
- UX-hr-page-states-chat15-01 recruiter route coverage > HR-page /hr/company/reports has role isolation, safe UX states and exact relevant copy

  ```
  AssertionError: expected 'import { SummaryStrip } from "@/compo…' to contain 'Company Reports'
  - Expected
  + Received
  - Company Reports
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Tabs } from "@/components/ui/tabs";
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-report-funnel.module.css";
  ```
- UX-hr-page-states-chat15-01 recruiter route coverage > HR-page /hr/conversations has role isolation, safe UX states and exact relevant copy

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- UX-hr-page-states-chat15-01 recruiter route coverage > HR-page /hr/conversations/[threadId] has role isolation, safe UX states and exact relevant copy

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'No messages on this page.'
  - Expected
  + Received
  - No messages on this page.
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import Link from "next/link";
  + import {RecruiterConversationReplyForm} from "@/components/hr/recruiter-conversation-reply-form";
  ```
- UX-hr-page-states-chat15-01 recruiter route coverage > HR-page /hr/drives has role isolation, safe UX states and exact relevant copy

  ```
  AssertionError: expected 'import {StatusBadge} from "@/componen…' to contain 'No active college access'
  - Expected
  + Received
  - No active college access
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- UX-hr-page-states-chat15-01 recruiter route coverage > HR-page /hr/drives/new has role isolation, safe UX states and exact relevant copy

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No active college access'
  - Expected
  + Received
  - No active college access
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { and, countDistinct, eq } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  ```
- UX-hr-page-states-chat15-01 recruiter route coverage > HR-page /hr/notifications has role isolation, safe UX states and exact relevant copy

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
- UX-hr-page-states-chat15-01 recruiter route coverage > HR-page /hr/placements/jobs/[jobId] has role isolation, safe UX states and exact relevant copy

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'redirect("/dashboard")'
  - Expected
  + Received
  - redirect("/dashboard")
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- UX-hr-page-states-chat15-01 recruiter route coverage > HR-page /hr/profile has role isolation, safe UX states and exact relevant copy

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
- UX-hr-page-states-chat15-01 recruiter route coverage > HR-page /hr/colleges redirects obsolete standalone college list to current role-scoped Today

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'redirect("/hr/home")'
  - Expected
  + Received
  - redirect("/hr/home")
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {hasActiveRecruiter} from "@/modules/identity/context";
  ```

## tests/unit/UX-mentor-index-01.test.ts (1 failing)
- Mentor UX cross-audit /mentor > UX-mentor-index-02 preserves route copy and live recovery/workflow

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<PageHeader'
  - Expected
  + Received
  - <PageHeader
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
  ```

## tests/unit/UX-superadmin-legacy-01.test.ts (1 failing)
- UX-superadmin-legacy-01 > preserves original wording, permissions and supported accessible UX

  ```
  AssertionError: expected 'import { createHash } from "node:cryp…' to contain 'legacySuperAdminDestination(legacy,ty…'
  - Expected
  + Received
  - legacySuperAdminDestination(legacy,type)
  + import { createHash } from "node:crypto";
  + import { and, eq, isNull, sql } from "drizzle-orm";
  + import { notFound, redirect } from "next/navigation";
  + import { ErrorState } from "@/components/ui/error-state";
  ```

## tests/unit/UX-teacher-native-controls-round5.test.ts (4 failing)
- Faculty native control UX > UX-teacher-calendar-02 keeps readable phone fields and visible link focus

  ```
  AssertionError: teacher/calendar link needs visible keyboard focus: expected 'mt-2 inline-flex min-h-9 items-center…' to contain 'focus-visible:outline-2'
  Expected: "focus-visible:outline-2"
  Received: "mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline"
  ```
- Faculty native control UX > UX-teacher-contacts-contactsTab-02 keeps readable phone fields and visible link focus

  ```
  AssertionError: teacher/contacts/[contactsTab] link needs visible keyboard focus: expected 'font-semibold text-primary-text under…' to contain 'focus-visible:outline-2'
  Expected: "focus-visible:outline-2"
  Received: "font-semibold text-primary-text underline"
  ```
- Faculty native control UX > UX-teacher-courses-02 keeps readable phone fields and visible link focus

  ```
  AssertionError: teacher/courses link needs visible keyboard focus: expected 'inline-flex min-h-11 items-center fon…' to contain 'focus-visible:outline-2'
  Expected: "focus-visible:outline-2"
  Received: "inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9"
  ```
- Faculty native control UX > UX-teacher-notifications-02 keeps readable phone fields and visible link focus

  ```
  AssertionError: teacher/notifications link needs visible keyboard focus: expected 'ml-2 font-semibold text-link underline' to contain 'focus-visible:outline-2'
  Expected: "focus-visible:outline-2"
  Received: "ml-2 font-semibold text-link underline"
  ```
