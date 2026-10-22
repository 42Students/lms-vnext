# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-13-saved-wiring.test.ts (1 failing)
- LEARNER-placements-13 saved job request wiring > LEARNER-placements-13 only exposes current membership and published scoped saved jobs

  ```
  AssertionError: expected 'import { and, desc, eq } from "drizzl…' to contain 'eq(placementJobs.status, "PUBLISHED")'
  - Expected
  + Received
  - eq(placementJobs.status, "PUBLISHED")
  + import { and, desc, eq } from "drizzle-orm";
  + import { z } from "zod";
  + import { getDb } from "@/db/client";
  + import { placementJobs } from "@/db/schema";
  ```

## tests/unit/learner-project-sort-model.test.ts (1 failing)
- learner project list sorting > handles unknown progress without inventing zero progress

  ```
  AssertionError: expected [ '1', '2', '3' ] to deeply equal [ '2', '1', '3' ]
  - Expected
  + Received
  [
  -   "2",
  "1",
  +   "2",
  "3",
  ```

## tests/unit/mentor-resource-dirty-round5.test.ts (1 failing)
- mentor editor draft safety > MEN-projects-meetings-75 keeps dirty project resource drafts on close or unload

  ```
  AssertionError: expected '"use client";\n\nimport {\n  type For…' to contain 'You have unsaved project changes.'
  - Expected
  + Received
  - You have unsaved project changes.
  + "use client";
  +
  + import {
  +   type FormEvent,
  ```

## tests/unit/projects-phase2-legacy-labels.test.ts (1 failing)
- exact legacy Mentor Projects copy > preserves exact legacy project tabs from the source catalogue

  ```
  AssertionError: expected 'import { MentorProjectsUnavailable } …' to contain 'delivery: "Delivery"'
  - Expected
  + Received
  - delivery: "Delivery"
  + import { MentorProjectsUnavailable } from "@/components/projects/mentor-projects-unavailable";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
  + import Link from "next/link";
  ```

## tests/unit/recruiter-chat14-round1.test.ts (4 failing)
- chat-14 recruiter reassigned exact-parity round 1 > REC-calendar-messages-profile-12 preserves the message draft on in-app navigation until explicit Discard

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'consequence="Your draft reply will be…'
  - Expected
  + Received
  - consequence="Your draft reply will be lost."
  + "use client";
  + import {useEffect,useRef,useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```
- chat-14 recruiter reassigned exact-parity round 1 > REC-calendar-messages-profile-28 preserves recruiter profile card titles and legacy help

  ```
  AssertionError: expected 'import { DataTable } from "@/componen…' to contain 'Manage your recruiter details.'
  - Expected
  + Received
  - Manage your recruiter details.
  + import { DataTable } from "@/components/ui/data-table";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  + import { z } from "zod";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- chat-14 recruiter reassigned exact-parity round 1 > REC-calendar-messages-profile-47 redirects legacy recruiter and colleges entrypoints to Today

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'redirect("/hr/home")'
  - Expected
  + Received
  - redirect("/hr/home")
  + import {redirect} from "next/navigation";
  + /** Preserve the legacy recruiter entrypoint while using the canonical Today workspace. */
  + export default function RecruiterIndex(){redirect("/recruiter/home");}
  +
  ```
- chat-14 recruiter reassigned exact-parity round 1 > REC-home-drives-11 offers the legacy account load recovery and Retry action

  ```
  AssertionError: expected '"use client";\nimport { ErrorState } …' to contain 'We couldn&apos;t load your account'
  - Expected
  + Received
  - We couldn&apos;t load your account
  + "use client";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { Button } from "@/components/ui/button";
  + import { PageHeader } from "@/components/ui/page-header";
  ```

## tests/unit/sa-tenants-modules-26-impact.test.ts (1 failing)
- SA-tenants-modules-26 preview carries live-impact counts without pretending to certify safety

  ```
  AssertionError: expected 'Impact counts unavailable. Recheck th…' to contain '2 active drives, 9 in-progress applic…'
  Expected: "2 active drives, 9 in-progress applications and 4 pending offers"
  Received: "Impact counts unavailable. Recheck this college before changing module access; this is not proof that disabling it is safe."
  ```
