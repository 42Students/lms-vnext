# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/ux-admin-chat9-batch-04.test.ts (5 failing)
- chat-9 last-third admin UX rollout, batch 04 > UX-admin-settings-auth-01 preserves shared UX and scoped route behavior

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- chat-9 last-third admin UX rollout, batch 04 > UX-admin-students-01 preserves shared UX and scoped route behavior

  ```
  AssertionError: expected 'import {getCurrentRequestContext} fro…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  ```
- chat-9 last-third admin UX rollout, batch 04 > UX-admin-tenants-01 preserves shared UX and scoped route behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { TenantDirectoryCsvControl } from "@/components/admin/tenant-directory-csv-control";
  + import { tenantDirectoryExportHref } from "@/modules/colleges/admin-tenant-export-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-9 last-third admin UX rollout, batch 04 > UX-admin-tenants-create-01 preserves shared UX and scoped route behavior

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {can} from "@/modules/permissions/policy";
  ```
- chat-9 last-third admin UX rollout, batch 04 > UX-admin-tenants-setup-01 preserves shared UX and scoped route behavior

  ```
  AssertionError: expected 'import {PageBackLink} from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import Link from "next/link";
  + import {notFound} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/ux-learn-chat7-batch-03.test.ts (10 failing)
- UX learner route batch 3 > UX-learn-learn-my-placements-assessments-01 keeps real learner data and accessible affordances

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
- UX learner route batch 3 > UX-learn-learn-my-placements-assessments-results-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Pagination } from "@/components/ui/pagination";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { Input } from "@/components/ui/input";
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-calendar-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'min-w-0'
  - Expected
  + Received
  - min-w-0
  + import { redirect } from "next/navigation";
  + import { z } from "zod";
  + import { parseLearnerCareerDate } from "@/modules/placements/learner-career-date-model";
  +
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-interviews-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'min-w-0'
  - Expected
  + Received
  - min-w-0
  + import { redirect } from "next/navigation";
  + import { z } from "zod";
  +
  + /** The old Interviews page was an alias for Schedule, not another independent
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-jobs-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Banner } from "@/components/ui/banner";
  + import { PageLoading } from "@/components/ui/page-loading";
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-jobs-jobId-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Banner } from "@/components/ui/banner";
  + import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-notification-preferences-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-offers-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Pagination } from "@/components/ui/pagination";
  + import { Banner } from "@/components/ui/banner";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-placement-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-preparation-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Tabs } from "@/components/ui/tabs";
  + import Link from "next/link";
  + import {LearnerPrepAssignmentCards} from "@/components/placements/learner-prep-assignment-cards";
  + import {placementTableExists} from "@/modules/placements/staged-tables";
  ```
