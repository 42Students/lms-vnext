# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat5-placements-core-extended-state-machines.test.ts (1 failing)
- chat-5 placements core — offer state transition matrix > PLACEMENTS-TPO-CASCADE-17 applies the learner sibling cascade atomically with TPO evidence, attribution and rollback

  ```
  2026-10-22T05:24:47.7283312Z AssertionError: expected 'import "server-only";\n\nimport { and…' to contain 'cascade=await cascadeTpoRecordedAccep…'
  - Expected
  + Received
  - cascade=await cascadeTpoRecordedAcceptance(tx,{
  + import "server-only";
  +
  + import { and, asc, eq, inArray, isNull, lte, ne, notExists, sql } from "drizzle-orm";
  + import {z} from "zod";
  ```

## tests/unit/chat6-auth-admin-scope-private-16.test.ts (3 failing)
- AUTH-handoff-16 account scope response cache safety > GET never caches selected college identity and role choices

  ```
  Error: [vitest] No "AdminScopeServiceError" export is defined on the "@/modules/admin-scope/service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/admin-scope/service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- AUTH-handoff-16 account scope response cache safety > POST returns a private response and only server-resolved scope as a secure cookie

  ```
  Error: [vitest] No "AdminScopeServiceError" export is defined on the "@/modules/admin-scope/service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/admin-scope/service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- AUTH-handoff-16 account scope response cache safety > DELETE clears the admin scope cookie without caching the prior scope

  ```
  Error: [vitest] No "AdminScopeServiceError" export is defined on the "@/modules/admin-scope/service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/admin-scope/service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/chat6-faculty-assignment-role-cas-101.test.ts (2 failing)
- SA-academics-people-101 teaching role concurrency > retains exact scope, row locks, active membership and primary-teacher uniqueness in the same transaction

  ```
  AssertionError: expected 'export async function changeCourseTea…' to contain 'if(locked.role===role)return locked'
  - Expected
  + Received
  - if(locked.role===role)return locked
  + export async function changeCourseTeachingAssignmentRole(
  +   context: RequestContext,
  +   assignmentIdInput: string,
  +   roleInput: unknown,
  ```
- SA-academics-people-101 teaching role concurrency > passes only the persisted version from directory into a single guarded UI PATCH

  ```
  AssertionError: expected 'import {and,eq,isNull,sql} from "driz…' to contain 'role&&row.revision?'
  - Expected
  + Received
  - role&&row.revision?
  + import {and,eq,isNull,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {courseTeachingAssignments,courseSectionDeliveries,courseOfferings,courses,departments} from "@/db/schema";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/chat6-recruiter-identity-and-expiry-round5.test.ts (2 failing)
- Super Admin recruiter identity and college grant expiry > SA-academics-people-108 provides structured recruiter name, designation, new company and multi-college creation

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain 'First Name'
  - Expected
  + Received
  - First Name
  + "use client";
  +
  + import { useId, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- Super Admin recruiter identity and college grant expiry > SA-academics-people-110 preserves grant expiry and scoped active revoked expired history

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain 'College access history'
  - Expected
  + Received
  - College access history
  + "use client";
  +
  + import { useId, useState } from "react";
  + import Link from "next/link";
  ```

## tests/unit/chat6-superadmin-middle-third-adversarial.test.ts (3 failing)
- Chat-6 /admin middle-third read and application correctness > SA-admin-middle-applications-filters-02 rejects wrong-shape and cross-tenant filter IDs before querying

  ```
  AssertionError: expected { q: '', status: 'ALL', …(8) } to be null
  - Expected:
  null
  + Received:
  {
  "attention": "ALL",
  "page": 1,
  "q": "",
  ```
- Chat-6 /admin middle-third read and application correctness > SA-admin-middle-placements-settings-01 uses IST for an instant near midnight rather than UTC calendar day

  ```
  AssertionError: expected 'import {SuperAdminDriveDeadline} from…' to contain 'timeZone:"Asia/Kolkata"'
  - Expected
  + Received
  - timeZone:"Asia/Kolkata"
  + import {SuperAdminDriveDeadline} from "@/components/placements/super-admin-drive-deadline";
  + import {SuperAdminDriveDuplicate} from "@/components/placements/super-admin-drive-duplicate";
  + import {SuperAdminDriveArchive} from "@/components/placements/super-admin-drive-archive";
  + import {SuperAdminPublishedDriveEdit} from "@/components/placements/super-admin-published-drive-edit";
  ```
- Chat-6 /admin middle-third read and application correctness > SA-admin-middle-read-04 rejects missing college selection before rendering candidate-level data

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'EmptyState title="Select a college to…'
  - Expected
  + Received
  - EmptyState title="Select a college to continue"
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```

## tests/unit/chat7-college-project-legacy-one-tab.test.ts (2 failing)
- College Admin Projects legacy Workspaces and one tab strip > shows legacy Projects group and single Workspaces page heading

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
- College Admin Projects legacy Workspaces and one tab strip > hides group strip on College/Admin detail routes where section strip owns navigation

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
