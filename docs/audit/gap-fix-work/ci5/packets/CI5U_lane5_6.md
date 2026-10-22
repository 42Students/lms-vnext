# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-team-message-corrections-chat2.test.ts (1 failing)
- TPO Team message edit and removal > TPO-inbox-team-24 locks the original author and scoped message during an optimistic mutation

  ```
  AssertionError: expected 'import {hasPlacementTeamMembership} f…' to contain 'metadata:{messageId:message.id}'
  - Expected
  + Received
  - metadata:{messageId:message.id}
  + import {hasPlacementTeamMembership} from "./placement-team-access-model";
  + import "server-only";
  + import {createHash} from "node:crypto";
  + import {and,eq,inArray,isNull,or,sql} from "drizzle-orm";
  ```

## tests/unit/ux-admin-first-third.test.ts (34 failing)
- Super Admin UX first-third rollout > UX-admin-batches-01 responsive shared DataTable with explicit empty text and preserved controls

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<PageHeader eyebrow="Super Admin · Ac…'
  - Expected
  + Received
  - <PageHeader eyebrow="Super Admin · Academic Setup" title="Batches"
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  ```
- Super Admin UX first-third rollout > UX-admin-classes-01 responsive shared DataTable with explicit empty text and preserved controls

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<PageHeader eyebrow="Super Admin · Ac…'
  - Expected
  + Received
  - <PageHeader eyebrow="Super Admin · Academic Setup" title="Classes"
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  ```
- Super Admin UX first-third rollout > UX-admin-academics-01 keeps scope-safe accessible route surface

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Super Admin UX first-third rollout > UX-admin-academics-sections-sectionId-01 keeps scope-safe accessible route surface

  ```
  AssertionError: expected 'import { notFound, redirect } from "n…' to contain 'min-w-0'
  - Expected
  + Received
  - min-w-0
  + import { notFound, redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { resolveSuperAdminSectionDetail } from "@/modules/admin-ui/super-admin-section-detail";
  + import { AcademicsSectionPage } from "@/components/academics/academics-section-page";
  ```
- Super Admin UX first-third rollout > UX-admin-announcements-01 keeps scope-safe accessible route surface

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import {Button} from "@/components/ui/button";
  + import {MetricBar} from "@/components/ui/metric-bar";
  + import chartStyles from "@/components/placements/report-bar-chart.module.css";
  + import {Select} from "@/components/ui/select";
  ```
- Super Admin UX first-third rollout > UX-admin-assignments-01 keeps scope-safe accessible route surface

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- Super Admin UX first-third rollout > UX-admin-attendance-01 supports mobile-safe navigation without changing legacy wording

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import Link from "next/link";
  + import {ErrorState} from "@/components/ui/error-state";
  + import {
  ```
- Super Admin UX first-third rollout > UX-admin-audit-01 supports mobile-safe navigation without changing legacy wording

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import ActivityPage from "@/app/(authenticated)/activity/page";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- Super Admin UX first-third rollout > UX-admin-batch-promotion-01 supports mobile-safe navigation without changing legacy wording

  ```
  AssertionError: expected 'import {Checkbox} from "@/components/…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```
- Super Admin UX first-third rollout > UX-admin-batches-batchId-students-01 supports mobile-safe navigation without changing legacy wording

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Breadcrumbs} from "@/components/ui/breadcrumbs";
  + import {DataTable} from "@/components/ui/data-table";
  ```
- … 24 more in this file

## tests/unit/w03-project-admin-surfaces.test.ts (1 failing)
- W03 project admin daily-use surface parity > keeps workspace search, status and pagination on both admin accounts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'const query: ProjectAdminCollectionQu…'
  - Expected
  + Received
  - const query: ProjectAdminCollectionQuery = parsed.data
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
