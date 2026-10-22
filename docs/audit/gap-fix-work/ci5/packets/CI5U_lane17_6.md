# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/ux-admin-chat9-batch-03.test.ts (5 failing)
- chat-9 last-third admin UX rollout, batch 03 > UX-admin-projects-workspaces-new-01 protects route accessibility and delegate

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { ClassTeamWorkspaceCreator } from "@/components/projects/class-team-workspace-creator";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-9 last-third admin UX rollout, batch 03 > UX-admin-quizzes-01 protects route accessibility and delegate

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  ```
- chat-9 last-third admin UX rollout, batch 03 > UX-admin-semester-courses-01 protects route accessibility and delegate

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {ErrorState} from "@/components/ui/error-state";
  ```
- chat-9 last-third admin UX rollout, batch 03 > UX-admin-semesters-01 protects route accessibility and delegate

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import { SemesterRefreshBoundary } from "@/components/admin/semester-refresh-boundary";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-9 last-third admin UX rollout, batch 03 > UX-admin-settings-01 protects route accessibility and delegate

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {getCollegeAttendancePolicy} from "@/modules/attendance/policy-service";
  + import {SuperAdminAttendanceSettingsEditor} from "@/components/admin/super-admin-attendance-settings-editor";
  + import {TenantSettingsEditor} from "@/components/admin/tenant-settings-editor";
  ```

## tests/unit/ux-learn-chat7-batch-02.test.ts (9 failing)
- UX learner route batch 2 > UX-learn-learn-courses-deliveryId-courseTab-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Banner } from "@/components/ui/banner";
  + import { CoursesServiceError } from "@/modules/courses/errors";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { ZodError } from "zod";
  ```
- UX learner route batch 2 > UX-learn-learn-courses-deliveryId-attendance-summary-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { StatTile } from "@/component…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Tabs } from "@/components/ui/tabs";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- UX learner route batch 2 > UX-learn-learn-courses-deliveryId-progress-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import progressStyles from "@/components/courses/learner-course-progress.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import {LearnerGeneralRequests} from "@/components/placements/learner-general-requests";
  + import {placementTableExists} from "@/modules/placements/staged-tables";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-announcements-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Banner } from "@/components/ui/banner";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-applications-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import { PageLoading } from "@/components/ui/page-loading";
  + import {StatusBadge,applicationStatusTone} from "@/components/ui/status-badge";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-applications-applicationId-01 maintains learner UX and route states

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
- UX learner route batch 2 > UX-learn-learn-my-placements-applications-applicationId-company-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Banner } from "@/components/ui/banner";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import Link from "next/link";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-applications-applicationId-history-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Tabs } from "@/components/ui/tabs";
  + import {ErrorState} from "@/components/ui/error-state";
  + import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  ```
