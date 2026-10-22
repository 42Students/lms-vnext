# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-college-projects-round4-evidence.test.ts (5 failing)
- College Projects gap closure round 4 > COL-projects-19 restores workspace, submissions and template page labels

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Workspaces"'
  - Expected
  + Received
  - title="Workspaces"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- College Projects gap closure round 4 > COL-projects-20 shows a recoverable no-college message without redirecting silently

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- College Projects gap closure round 4 > COL-projects-21 gives archived-workspace recovery and the existing creation/reassignment actions

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Archived workspaces'
  - Expected
  + Received
  - Archived workspaces
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- College Projects gap closure round 4 > COL-projects-22 is an improvement, not a missing legacy mentor/class/template filter

  ```
  AssertionError: expected '"use client";\nimport { useCallback, …' to contain 'name={legacyWorkspaces ? "search" : "…'
  - Expected
  + Received
  - name={legacyWorkspaces ? "search" : "q"}
  + "use client";
  + import { useCallback, useEffect, useState } from "react";
  + import { useRouter } from "next/navigation";
  + import Link from "next/link";
  ```
- College Projects gap closure round 4 > COL-projects-23 uses responsive wrappers but retains browser width acceptance as open

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'if (basePath === "/college/projects" …'
  - Expected
  + Received
  - if (basePath === "/college/projects" || basePath === "/admin/projects") return null;
  + import { Tabs } from "@/components/ui/tabs";
  + import styles from "./legacy-project-tabs.module.css";
  + import { PROJECT_ADMIN_SECTIONS } from "@/modules/projects/project-admin-navigation-model";
  +
  ```

## tests/unit/chat9-round6-reviewed-not-a-gaps.test.ts (3 failing)
- TPO settings review evidence > TPO-settings-audit-R02 shows helpful errors for job-type conflicts and invalid blocked dates without rendering raw codes

  ```
  AssertionError: expected '"use client";\n\nimport { TpoUnifiedJ…' to contain 'FriendlyFetchError'
  - Expected
  + Received
  - FriendlyFetchError
  + "use client";
  +
  + import { TpoUnifiedJobTypesEditor, type EditableJobType } from "./tpo-unified-job-types-editor";
  +
  ```
- TPO settings review evidence > TPO-settings-audit-R03 derives the public toggle from the live consented cohort instead of an unwritten population field

  ```
  AssertionError: expected 'import "server-only";\nimport { and,e…' to contain 'return {ready:true as const,settings:…'
  - Expected
  + Received
  - return {ready:true as const,settings:settings[0]??null,populationCount}
  + import "server-only";
  + import { and,eq,isNotNull,isNull,sql } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import {
  ```
- TPO settings review evidence > TPO-settings-audit-81 is NOT-A-GAP because editable email templates are absent from the legacy production Settings UI

  ```
  AssertionError: expected 'import Link from "next/link";\ntype S…' to contain 'Email templates'
  - Expected
  + Received
  - Email templates
  + import Link from "next/link";
  + type SettingsKey="season"|"rules"|"job-types"|"after-college"|"prep-readiness"|"blocked-dates"|"see"|"team"|"trusted"|"branding"|"notifications"|"recruiters"|"templates"|"notices"|"public-page"|"public-link";
  + /** Exactly five legacy-visible settings sections. Hidden panels and persisted
  +  * settings stay accessible by direct scoped URLs, never silently destroyed. */
  ```

## tests/unit/chat9-tpo-settings-legacy-graceful.test.ts (1 failing)
- TPO Settings legacy copy and graceful editing > TPO-settings-audit-03 uses the original placement settings section names

  ```
  AssertionError: expected 'import Link from "next/link";\ntype S…' to contain 'label:"Placement Rules"'
  - Expected
  + Received
  - label:"Placement Rules"
  + import Link from "next/link";
  + type SettingsKey="season"|"rules"|"job-types"|"after-college"|"prep-readiness"|"blocked-dates"|"see"|"team"|"trusted"|"branding"|"notifications"|"recruiters"|"templates"|"notices"|"public-page"|"public-link";
  + /** Exactly five legacy-visible settings sections. Hidden panels and persisted
  +  * settings stay accessible by direct scoped URLs, never silently destroyed. */
  ```

## tests/unit/college-drive-interviews-model.test.ts (1 failing)
- College drive interview filters > rejects forged college, invalid round status, and duplicate query params

  ```
  AssertionError: expected { kind: 'ALL', status: 'ALL', …(6) } to deeply equal { kind: 'ALL', status: 'ALL', page: 1 }
  - Expected
  + Received
  {
  +   "appointmentPage": 1,
  +   "appointmentPageSize": 20,
  +   "appointmentSort": "DATE_ASC",
  +   "candidatePage": 1,
  ```

## tests/unit/faculty-assessment-report.test.ts (2 failing)
- Faculty fractional grade bands > does not lose fractional percentages between labeled ranges

  ```
  AssertionError: expected 1 to be 5 // Object.is equality
  - Expected
  + Received
  - 5
  + 1
  ```
- Faculty assignment score precision > rounds the final average, not individual fractional marks

  ```
  AssertionError: expected 22 to be 21 // Object.is equality
  - Expected
  + Received
  - 21
  + 22
  ```

## tests/unit/graceful-alert-ops-contract.test.ts (1 failing)
- independent Telegram health monitoring > GR-118 allows a bounded Cloud Logging batch within the Cron tick HTTP timeout and lease

  ```
  AssertionError: expected 'import { cloudLoggingAccessToken, isC…' to contain 'let limit = 12'
  - Expected
  + Received
  - let limit = 12
  + import { cloudLoggingAccessToken, isCloudLogNamespace, isCloudLogProject, readCloudLogErrorPage } from "./cloud-log-reader";
  + import { reportErrorForAlert } from "./reporter";
  + import { reopenRegressedSignature } from "./policy";
  + import { randomUUID } from "node:crypto";
  ```

## tests/unit/learner-career-kind-count-model.test.ts (1 failing)
- learner calendar month totals > counts only events in selected IST month

  ```
  AssertionError: expected { total: 1, assessments: 1, …(3) } to deeply equal { total: 1, assessments: 1, …(2) }
  - Expected
  + Received
  {
  "assessments": 1,
  "interviews": 0,
  "other": 0,
  +   "talks": 0,
  ```

## tests/unit/learner-placement-parity.test.ts (1 failing)
- learner placement route parity > keeps every old learner placement sub-route materialized with real content

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'LearnerCareerRoundsWorkspace'
  - Expected
  + Received
  - LearnerCareerRoundsWorkspace
  + import { redirect } from "next/navigation";
  + import { z } from "zod";
  +
  + /** The old Interviews page was an alias for Schedule, not another independent
  ```
