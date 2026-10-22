# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-recruiters-13-invite-readiness.test.ts (1 failing)
- TPO-recruiters-13 PUB-auth-public-40 cannot issue dead-end invitations > requires a work email and linked college company before rotating the token

  ```
  AssertionError: expected -1 to be greater than -1
  ❯ tests/unit/tpo-recruiters-13-invite-readiness.test.ts:7:17
  5|   const service=readFileSync("src/modules/placements/tpo-recruiter-inv…
  6|   const pivot=service.indexOf("if(!lead.emailNorm||!lead.companyRelati…
  7|   expect(pivot).toBeGreaterThan(-1);
  |                 ^
  8|   expect(pivot).toBeLessThan(service.indexOf("let credential;",pivot));
  9|  });
  ```

## tests/unit/ux-learn-chat7-batch-02.test.ts (9 failing)
- UX learner route batch 2 > UX-learn-learn-courses-deliveryId-courseTab-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import { Banner } from "@/components/ui/banner";
  + import { CoursesServiceError } from "@/modules/courses/errors";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { ZodError } from "zod";
  ```
- UX learner route batch 2 > UX-learn-learn-courses-deliveryId-attendance-summary-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { StatTile } from "@/component…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Tabs } from "@/components/ui/tabs";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- UX learner route batch 2 > UX-learn-learn-courses-deliveryId-progress-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import progressStyles from "@/components/courses/learner-course-progress.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import {LearnerGeneralRequests} from "@/components/placements/learner-general-requests";
  + import {placementTableExists} from "@/modules/placements/staged-tables";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-announcements-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import { Banner } from "@/components/ui/banner";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-applications-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import { Alert } from "@/components/ui/alert";
  + import { PageLoading } from "@/components/ui/page-loading";
  + import {StatusBadge,applicationStatusTone} from "@/components/ui/status-badge";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-applications-applicationId-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-applications-applicationId-company-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import { Banner } from "@/components/ui/banner";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import Link from "next/link";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-applications-applicationId-history-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + import { Tabs } from "@/components/ui/tabs";
  + import {ErrorState} from "@/components/ui/error-state";
  + import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  ```
