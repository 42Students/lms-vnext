# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat19-team-attribution.test.ts (1 failing)
- HR-BREAK-TEAM-ATTRIBUTION-40: count approved drives, never stale request history > college branch suggestions fail closed for mismatched recruiter principal

  ```
  AssertionError: expected 'import "server-only";\nimport {hasAct…' to contain 'isNull(departments.archivedAt)'
  - Expected
  + Received
  - isNull(departments.archivedAt)
  + import "server-only";
  + import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import { getRecruiterCollegeDemographics } from "./recruiter-college-demographics-service";
  ```

## tests/unit/UX-chat15-hr-tracker-pages-15.test.ts (3 failing)
- UX-HR-TRACKER-15 recruiter reports and tracker security boundaries > issue detail validates public ID then maps only genuine missing issues to 404

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'trackerPublicIdSchema.safeParse(canon…'
  - Expected
  + Received
  - trackerPublicIdSchema.safeParse(canonical)
  + import Link from "next/link";
  + import {TrackerIssueCopyActions} from "@/components/tracker/tracker-issue-copy-actions";
  + import {TrackerReporterIssueDetail} from "@/components/tracker/tracker-reporter-issue-detail";
  + import {TrackerScreenshotGallery} from "@/components/tracker/tracker-screenshot-gallery";
  ```
- UX-HR-TRACKER-15 recruiter reports and tracker security boundaries > tracker global logs and audit findings never use a college-admin or scoped Super Admin bypass

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Clear the Super Admin organization/co…'
  - Expected
  + Received
  - Clear the Super Admin organization/college safety scope
  + import Link from "next/link";
  + import type { Metadata } from "next";
  + import { Tabs } from "@/components/ui/tabs";
  +
  ```
- UX-HR-TRACKER-15 recruiter reports and tracker security boundaries > tracker reporter detail guards the owner context, validates URL ID and retains retryable failures

  ```
  AssertionError: expected 'import {notFound,redirect} from "next…' to contain 'trackerPublicIdSchema.safeParse(publi…'
  - Expected
  + Received
  - trackerPublicIdSchema.safeParse(publicId)
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  ```

## tests/unit/chat11-super-admin-signin-editor-cas.test.ts (1 failing)
- SA-tenants-modules-LOGIN-CAS-03 successive college sign-in saves > reads committed version/method from successful response before declaring a save, not stale props

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain 'Couldn\'t save sign-in settings: '
  - Expected
  + Received
  - Couldn't save sign-in settings:
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Alert} from "@/components/ui/alert";
  ```

## tests/unit/chat13-placement-admin-uncovered-services.test.ts (1 failing)
- Super Admin placements remaining service entrypoint checks > SA-COMPANY-IDENTITIES-03 requires actual current global role and domain/alias uniqueness before writes

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'Domain belongs to another company.'
  - Expected
  + Received
  - Domain belongs to another company.
  + import "server-only";
  + import {and,asc,eq,ilike,inArray,ne} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
