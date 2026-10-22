# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/ux-admin-chat9-coverage-closure.test.ts (5 failing)
- chat-9 route coverage and native DataTable closure > UX-admin-course-progress-students-01 /admin/course-progress/students protects report totals and mobile student fields

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'caption="Student Course Progress"'
  - Expected
  + Received
  - caption="Student Course Progress"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {and,asc,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```
- chat-9 route coverage and native DataTable closure > UX-admin-features-collegeId-trace-04 /admin/features/[collegeId]/trace keeps the winner and ignored statuses in a scroll-safe table

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<StatusBadge tone="success">Winner</S…'
  - Expected
  + Received
  - <StatusBadge tone="success">Winner</StatusBadge>
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  ```
- chat-9 route coverage and native DataTable closure > UX-admin-projects-project-id-04 /admin/projects/[projectId] remains a canonical redirect with stable encoding

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'encodeURIComponent(projectId)'
  - Expected
  + Received
  - encodeURIComponent(projectId)
  + import { redirect } from "next/navigation";
  + import Link from "next/link";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-9 route coverage and native DataTable closure > UX-admin-projects-templates-template-id-overview-04 /admin/projects/templates/[templateId]/overview validates before redirect

  ```
  AssertionError: expected 'import {notFound,redirect} from "next…' to contain 'projectTemplateIdSchema.safeParse'
  - Expected
  + Received
  - projectTemplateIdSchema.safeParse
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requirePermission} from "@/modules/permissions/policy";
  + /** The canonical detail resolves UUID and legacy numeric/slug bookmarks.
  ```
- chat-9 route coverage and native DataTable closure > UX-admin-recruiters-04 /admin/recruiters retains the scoped Super Admin HR editor without a duplicate permission surface

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'export { default } from "../hr/page"'
  - Expected
  + Received
  - export { default } from "../hr/page"
  + import Link from "next/link";
  + import {PageHeader} from "@/components/ui/page-header";
  + import SuperAdminHrPage from "../hr/page";
  + /** Legacy Recruiter accounts is a Placements section, not a separate
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
