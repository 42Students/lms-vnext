# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat19-report-joined.test.ts (1 failing)
- HR-BREAK-REPORT-JOINED-51: employer joined stage only includes accepted offers > leaves no shared applicant names or contacts in the funnel SQL

  ```
  AssertionError: expected '\n      select id from placement_jobs…' to contain 'sc.status=\'SHORTLISTED\''
  - Expected
  + Received
  - sc.status='SHORTLISTED'
  +
  +       select id from placement_jobs
  +       where college_id=${collegeId}::uuid
  +         and company_relationship_id=${relationshipId}::uuid
  ```

## tests/unit/UX-admin-courses-content-audit-01.test.ts (2 failing)
- UX-admin-courses-content-audit-01 Super Admin scoped courses and content > UX-admin-assignments-quizzes-01 requires scoped college and preserves builder/editor and failure states

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'Open offering builder / submissions'
  - Expected
  + Received
  - Open offering builder / submissions
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {Input} from "@/components/ui/input";
  ```
- UX-admin-courses-content-audit-01 Super Admin scoped courses and content > UX-admin-course-progress-01 distinguishes measured activity from fabricated completion

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Per student progress tabl…'
  - Expected
  + Received
  - aria-label="Per student progress table"
  + import Link from "next/link";
  + import {DataTable} from "@/components/ui/data-table";
  + import {EmptyState} from "@/components/ui/empty-state";
  + import {redirect} from "next/navigation";
  ```

## tests/unit/chat11-learner-projects-list-round3.test.ts (1 failing)
- chat-11 learner Projects legacy list behavior > COL-academic-setup-24 retains program form reset and valid page size persistence choices

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'options={[10,25,50,100]}'
  - Expected
  + Received
  - options={[10,25,50,100]}
  + "use client";
  +
  + import { useEffect, useState, useTransition, useSyncExternalStore, type FormEvent } from "react";
  + import { usePathname, useRouter } from "next/navigation";
  ```

## tests/unit/chat13-module-access-history-gap32.test.ts (1 failing)
- SA-tenants-modules-32 bulk history producer > SA-tenants-modules-32 records the actual applied student count and explicitly discloses a summary-audit failure

  ```
  AssertionError: expected 'import "server-only";\n\nimport { and…' to contain 'Review learner history.'
  - Expected
  + Received
  - Review learner history.
  + import "server-only";
  +
  + import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
  + import { z } from "zod";
  ```
