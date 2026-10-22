# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-audit-actor-display.test.ts (1 failing)
- TPO-settings-audit-90 actor column > returns the display name without exposing internal UUIDs

  ```
  AssertionError: expected 'System' to be 'System / unknown' // Object.is equality
  Expected: "System / unknown"
  Received: "System"
  ```

## tests/unit/tpo-drive-header.test.ts (1 failing)
- TPO-drive-workspace-03 header facts > distinguishes request, published, closed, cancelled and declined

  ```
  AssertionError: expected 'Open · Expired' to be 'Published' // Object.is equality
  Expected: "Published"
  Received: "Open · Expired"
  ```

## tests/unit/tpo-inbox-team-round4-graceful.test.ts (6 failing)
- TPO Inbox and Team round-4 failure recovery > TPO-inbox-team-64 keeps clickable bell rows and accessible error feedback

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'focus-visible:outline-primary'
  - Expected
  + Received
  - focus-visible:outline-primary
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- TPO Inbox and Team round-4 failure recovery > TPO-inbox-team-09 keeps recruiter drafts after failed sends or stalled network

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- TPO Inbox and Team round-4 failure recovery > GR-70 isolates Everyone history failure to a retryable in-page section

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- TPO Inbox and Team round-4 failure recovery > GR-90 announces friendly errors from Everyone, bell, recruiter and announcement widgets

  ```
  AssertionError: expected '"use client";\nimport {Textarea} from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```
- TPO Inbox and Team round-4 failure recovery > GR-91 keeps retry and dismissal actions reachable by keyboard

  ```
  AssertionError: expected '"use client";\nimport {Textarea} from…' to contain 'focus-visible:outline-primary'
  - Expected
  + Received
  - focus-visible:outline-primary
  + "use client";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```
- TPO Inbox and Team round-4 failure recovery > GR-92 does not depend on color alone for failures

  ```
  AssertionError: expected '"use client";\nimport {Textarea} from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```

## tests/unit/tpo-team-away-chat2.test.ts (1 failing)
- TPO Team away until > TPO-inbox-team-31 displays verified away intervals and a Back now action only for the member

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'awayByMember.get(member.membershipId)'
  - Expected
  + Received
  - awayByMember.get(member.membershipId)
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/ux-admin-chat9-interactions.test.ts (4 failing)
- chat-9 UX last-third substantive interactions > UX-admin-semesters-03 enforces the accessible interaction contract

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' to contain 'No semesters found. Create a program …'
  - Expected
  + Received
  - No semesters found. Create a program first, then add semesters.
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import { SemesterRefreshBoundary } from "@/components/admin/semester-refresh-boundary";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-9 UX last-third substantive interactions > UX-admin-placements-shortlisted-application-id-03 enforces the accessible interaction contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'return <div className="min-w-0 space-…'
  - Expected
  + Received
  - return <div className="min-w-0 space-y-5">
  + import Link from "next/link";
  + import type { ReactNode } from "react";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  ```
- chat-9 UX last-third substantive interactions > UX-admin-placements-student-lookup-03 enforces the accessible interaction contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- chat-9 UX last-third substantive interactions > UX-admin-projects-templates-03 enforces the accessible interaction contract

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain '<Input'
  - Expected
  + Received
  - <Input
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```

## tests/unit/ux-learn-chat7-batch-04.test.ts (9 failing)
- UX learner route batch 4 > UX-learn-learn-my-placements-rules-01 keeps learner route accessible and honest

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Badge } from "@/components/ui/badge";
  + import { Banner } from "@/components/ui/banner";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- UX learner route batch 4 > UX-learn-learn-my-placements-schedule-01 keeps learner route accessible and honest

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Tabs } from "@/components/ui/tabs";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- UX learner route batch 4 > UX-learn-learn-my-placements-support-01 keeps learner route accessible and honest

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { getOwnUnifiedLearnerRequests } from "@/modules/placements/learner-support-request-service";
  ```
- UX learner route batch 4 > UX-learn-learn-notifications-01 keeps learner route accessible and honest

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Suspense } from "react";
  + import { z } from "zod";
  + import Link from "next/link";
  + import { Alert } from "@/components/ui/alert";
  ```
- UX learner route batch 4 > UX-learn-learn-notifications-history-01 keeps learner route accessible and honest

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { NotificationList, type NotificationListItem } from "@/components/activity/notification-list";
  ```
- UX learner route batch 4 > UX-learn-learn-profile-01 keeps learner route accessible and honest

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Suspense } from "react";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  ```
- UX learner route batch 4 > UX-learn-learn-profile-academic-record-01 keeps learner route accessible and honest

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Badge} from "@/components/ui/badge";
  ```
- UX learner route batch 4 > UX-learn-learn-profile-completeness-01 keeps learner route accessible and honest

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- UX learner route batch 4 > UX-learn-learn-profile-verification-01 keeps learner route accessible and honest

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import { PageHeader } from "@/components/ui/page-header";
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {Banner} from "@/components/ui/banner";
  + import Link from "next/link";
  ```
