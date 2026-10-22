# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-team-away-chat2.test.ts (1 failing)
- TPO Team away until > TPO-inbox-team-31 displays verified away intervals and a Back now action only for the member

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'awayByMember.get(member.membershipId)'
  - Expected
  + Received
  - awayByMember.get(member.membershipId)
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/ux-admin-chat9-interactions.test.ts (4 failing)
- chat-9 UX last-third substantive interactions > UX-admin-semesters-03 enforces the accessible interaction contract

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' to contain 'No semesters found. Create a program …'
  - Expected
  + Received
  - No semesters found. Create a program first, then add semesters.
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import { SemesterRefreshBoundary } from "@/components/admin/semester-refresh-boundary";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-9 UX last-third substantive interactions > UX-admin-placements-shortlisted-application-id-03 enforces the accessible interaction contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'return <div className="min-w-0 space-…'
  - Expected
  + Received
  - return <div className="min-w-0 space-y-5">
  + import Link from "next/link";
  + import type { ReactNode } from "react";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  ```
- chat-9 UX last-third substantive interactions > UX-admin-placements-student-lookup-03 enforces the accessible interaction contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- chat-9 UX last-third substantive interactions > UX-admin-projects-templates-03 enforces the accessible interaction contract

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain '<Input'
  - Expected
  + Received
  - <Input
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```

## tests/unit/w03-db07-history-retention.test.ts (1 failing)
- W03 DB07 staged history/comment retention > does not confuse staging with registered PostgreSQL acceptance

  ```
  AssertionError: expected '/**\n * W03 DB07 schema candidates. M…' to contain 'SOURCE-ONLY schema candidates'
  - Expected
  + Received
  - SOURCE-ONLY schema candidates
  + /**
  +  * W03 DB07 schema candidates. Meeting/resource audits promoted by 0196;
  +  * run against live endpoints or assume tables exist until W01 registers/replays
  +  * the corresponding Drizzle migration and verifies composite tenant/project FKs.
  ```
