# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-super-admin-placements-s2-verification.test.ts (5 failing)
- Chat 13 Super Admin placement S1/S2 source contracts > SA-placements-projects-02 active-drive search

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'Open drive'
  - Expected
  + Received
  - Open drive
  + "use client";
  +
  + import { useEffect, useState } from "react";
  + import {SuperAdminDriveDuplicate} from "@/components/placements/super-admin-drive-duplicate";
  ```
- Chat 13 Super Admin placement S1/S2 source contracts > SA-placements-projects-10 drives table

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Search by drive or company'
  - Expected
  + Received
  - Search by drive or company
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- Chat 13 Super Admin placement S1/S2 source contracts > SA-placements-projects-17 drive navigation

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Overview'
  - Expected
  + Received
  - Overview
  + import Link from "next/link";
  + import type { ReactNode } from "react";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { getPlacementJob } from "@/modules/placements/job-service";
  ```
- Chat 13 Super Admin placement S1/S2 source contracts > SA-placements-projects-42 company report

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Export report (CSV)'
  - Expected
  + Received
  - Export report (CSV)
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  ```
- Chat 13 Super Admin placement S1/S2 source contracts > SA-placements-projects-49 announcement receipts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<progress'
  - Expected
  + Received
  - <progress
  + import {Button} from "@/components/ui/button";
  + import {MetricBar} from "@/components/ui/metric-bar";
  + import chartStyles from "@/components/placements/report-bar-chart.module.css";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat14-final-pub-auth-public-29.test.ts (1 failing)
- chat-14 final sprint > PUB-auth-public-29 shows global 403 and portal-denial notices without changing shell

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'new Event("lms:access-denied")'
  - Expected
  + Received
  - new Event("lms:access-denied")
  + "use client";
  +
  + import { useEffect, useState } from "react";
  + import { sessionExpiredHref } from "@/lib/return-to";
  ```

## tests/unit/chat15-missed-quiz-release.test.ts (2 failing)
- chat-15 learner missed quiz, release, and progress parity > LEARNER-course-detail-17 released missed quiz answer key is read-only

  ```
  AssertionError: expected '/** The learner sees grades only afte…' to contain 'quiz.resultsPublished === true'
  - Expected
  + Received
  - quiz.resultsPublished === true
  + /** The learner sees grades only after the recorded due time and an explicit
  +  * faculty resultsPublished flag. Published quizzes may still be open after
  +  * that time, matching legacy grading behavior; CLOSED is not a mandatory
  +  * extra step. DRAFT/ARCHIVED never release answer keys. */
  ```
- chat-15 learner missed quiz, release, and progress parity > LEARNER-learning-misc-28 quiz attempt has desktop progress and mobile Questions drawer

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain '<summary className="cursor-pointer te…'
  - Expected
  + Received
  - <summary className="cursor-pointer text-sm text-primary-text">Questions</summary>
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Radio } from "@/components/ui/radio";
  ```

## tests/unit/chat16-graceful-logs-ui-r8.test.ts (2 failing)
- chat-16 SA-placements-projects-113 GR-123/124 Logs UI and safeguards > SA-placements-projects-113 keeps the guarded Known Errors contract: No tracked errors yet

  ```
  AssertionError: expected '"use client";\nimport { EmptyState } …' to contain 'No tracked errors yet'
  - Expected
  + Received
  - No tracked errors yet
  + "use client";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { Dialog } from "@/components/ui/dialog";
  ```
- chat-16 SA-placements-projects-113 GR-123/124 Logs UI and safeguards > SA-placements-projects-113 keeps Cloud Logging explicitly disabled without opt-in

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Cloud Logging backup is not configure…'
  - Expected
  + Received
  - Cloud Logging backup is not configured.
  + import Link from "next/link";
  + import type { Metadata } from "next";
  + import { Tabs } from "@/components/ui/tabs";
  +
  ```

## tests/unit/chat16-messaging-provider-history-contract-16.test.ts (2 failing)
- chat-16 campaign provider and aggregate history export boundaries > MESSAGING-EXOTEL-ACCEPT-16 requires real SID and affirmative provider state

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- chat-16 campaign provider and aggregate history export boundaries > MESSAGING-HISTORY-PROJECTION-16 distinguishes provider acceptance from confirmed delivery and filters invalid queries

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat16-public-placements-route-16.test.tsx (3 failing)
- chat-16 public placements page role and safe-unavailability journeys > UX-chat16-public-placement-17 does not render an explicitly unpublished college page

  ```
  AssertionError: expected [Function] to throw error including 'NOT_FOUND' but got 'Invalid server environment configurat…'
  - Expected
  + Received
  - NOT_FOUND
  + Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  +   → at DATABASE_URL
  ```
- chat-16 public placements page role and safe-unavailability journeys > UX-chat16-public-placement-18 treats a failed stats lookup as unavailable, not evidence of being unpublished

  ```
  Error: Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  → at DATABASE_URL
  ❯ parseServerEnv src/lib/env.ts:88:11
  86|
  87|   if (!parsed.success) {
  88|     throw new Error(
  |           ^
  89|       "Invalid server environment configuration: " +
  ```
- chat-16 public placements page role and safe-unavailability journeys > UX-chat16-public-placement-19 never presents disabled public recruiting as active when no publication is verified

  ```
  Error: Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  → at DATABASE_URL
  ❯ parseServerEnv src/lib/env.ts:88:11
  86|
  87|   if (!parsed.success) {
  88|     throw new Error(
  |           ^
  89|       "Invalid server environment configuration: " +
  ```
