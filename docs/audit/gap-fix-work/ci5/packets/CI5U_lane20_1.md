# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat7-learner-board-filters-and-scroll.test.ts (1 failing)
- PROJ-BREAK-LEARNER-96/97 board filter and mobile navigation resilience > preserves keyboard and touch access when Board lanes overflow a 320px device

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'focus-visible:outline-2'
  - Expected
  + Received
  - focus-visible:outline-2
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/PROJ-BREAK-chat9-template-directory-service.test.ts (1 failing)
- IIT Dharwad: Super Admin template catalogue role and tenant behavior > PROJ-BREAK-scale-26 second page remains bounded, and empty results skip extra joins

  ```
  AssertionError: expected 5 to be 3 // Object.is equality
  - Expected
  + Received
  - 3
  + 5
  ```

## tests/unit/UX-college-college-faculty-membership-id-01.test.ts (1 failing)
- UX-college-college-faculty-membership-id-01 preserves keyboard states, responsive layout and exact labels

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import {and,eq} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/UX-mentor-cross-nav-closeout-01.test.ts (1 failing)
- Mentor cross audit delivery discovery and contrast > UX-mentor-cross-N02 ProjectList uses accessible text and keyboard focus on all roles

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { StatusBadge } from "@/components/ui/status-badge";
  +
  ```

## tests/unit/UX-tpo-placements-jobs-jobid-about-01.test.ts (1 failing)
- UX-tpo-placements-jobs-jobid-about-01 /tpo/placements/jobs/[jobId]/about > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {DataTable} from "@/components…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {DataTable} from \"@/components/ui/data-table\";
  import {EmptyState} from \"@/components/ui/empty-state\";
  import Link from \"next/link\";
  import {notFound,redirect} from \"next/navigation\";
  ```

## tests/unit/chat11-tpo-config-validation.test.ts (1 failing)
- TPO-settings-audit-CONFIG-01 canonical config and date inputs > allows bounded multilingual job-type names, not markup/newlines or oversized fields

  ```
  AssertionError: Sales
  Admin: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat12-tpo-student-marks-export-truth.test.ts (2 failing)
- TPO-students-export-TRUTH-02 marks-verification evidence provenance > retains explicit persisted Yes and No outcomes without inferring them from grades

  ```
  AssertionError: expected '""' to be '"Yes"' // Object.is equality
  Expected: ""Yes""
  Received: """"
  ```
- TPO-students-export-TRUTH-02 marks-verification evidence provenance > keeps marks verification in the same legacy CSV column

  ```
  AssertionError: expected '"10th %"' to be '"Marks verified"' // Object.is equality
  Expected: ""Marks verified""
  Received: ""10th %""
  ```

## tests/unit/chat13-placements-admin-mutations.test.ts (2 failing)
- chat-13 additional admin mutation and recruiter account security > SA-PUBLISHED-DRIVE-EDIT-01 refuses tampered versions, arbitrary labels, duplicate locations and reversed CTC

  ```
  AssertionError: expected 'import "server-only";\nimport {and,co…' to contain 'job.status!=="PUBLISHED"'
  - Expected
  + Received
  - job.status!=="PUBLISHED"
  + import "server-only";
  + import {and,count,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {placementApplications,placementJobs,placementJobRoleOptions,placementSeasons,placementCompanyRelationships} from "@/db/schema";
  ```
- chat-13 additional admin mutation and recruiter account security > SA-BULK-DRIVE-01 bounds destructive multi-action input and maintains partial failure ledger

  ```
  AssertionError: expected 'import "server-only";\nimport { and, …' to contain 'reason: "Could not update this drive.…'
  - Expected
  + Received
  - reason: "Could not update this drive. Refresh and retry."
  + import "server-only";
  + import { and, count, eq, inArray } from "drizzle-orm";
  + import { z } from "zod";
  + import { getDb } from "@/db/client";
  ```
