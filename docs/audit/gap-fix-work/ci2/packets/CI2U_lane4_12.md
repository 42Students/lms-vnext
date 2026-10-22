# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-47-notice-audience.test.ts (1 failing)
- LEARNER-placements-47 notice origin and scope > LEARNER-placements-47 marks actual edited notices only when updated version is recorded

  ```
  AssertionError: expected '2099-01-02T00:00:00.000Z' to be null
  - Expected:
  null
  + Received:
  "2099-01-02T00:00:00.000Z"
  ```

## tests/unit/learner-projects-round2-gap-closure.test.ts (3 failing)
- learner/projects round-two gap verification > LEARNER-projects-04 supports legacy Active In progress Ready and Blocked status choices

  ```
  AssertionError: expected 'import { z } from "zod";\nimport Link…' to contain 'query.status==="IN_PROGRESS"'
  - Expected
  + Received
  - query.status==="IN_PROGRESS"
  + import { z } from "zod";
  + import Link from "next/link";
  + import { Banner } from "@/components/ui/banner";
  + import { redirect } from "next/navigation";
  ```
- learner/projects round-two gap verification > LEARNER-projects-09 retains Projects as the list heading and the real workspace title

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'title={workspace.project.title}'
  - Expected
  + Received
  - title={workspace.project.title}
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- learner/projects round-two gap verification > LEARNER-projects-21 shows project team role explanation and roster count

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain '"Project team"'
  - Expected
  + Received
  - "Project team"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/module-access.test.ts (1 failing)
- optional module access resolution > resolves Placements through the same specificity and lock chain as other modules

  ```
  AssertionError: expected { enabled: true, …(3) } to match object { enabled: true, …(2) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  "enabled": true,
  -   "level": "MEMBERSHIP",
  -   "locked": true,
  ```

## tests/unit/projects-phase2-task-comments-contract.test.ts (1 failing)
- PR-S2-04 registered comments > scopes comments to project and task in a composite FK and real transaction

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'scope.access==="OBSERVER"'
  - Expected
  + Received
  - scope.access==="OBSERVER"
  + import "server-only";
  + import {and,asc,eq,inArray,isNull,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {activityEvents,projectInstances,projectTaskComments,projectTasks,projectMembers,collegeMemberships,users} from "@/db/schema";
  ```

## tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts (4 failing)
- chat-14 recruiter ownership and private review gap closure > REC-home-drives-45 filters historical milestones only within TPO-shared applicants

  ```
  AssertionError: expected 'import "server-only";\nimport { and, …' to contain 'const stageCondition=and(where,filter…'
  - Expected
  + Received
  - const stageCondition=and(where,filters.stage==="ALL"?undefined:stageConditions[filters.stage])
  + import "server-only";
  + import { and, desc, eq, exists, gt, inArray, sql } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import { collegeMemberships, placementApplications, placementApplicationScreenings,
  ```
- chat-14 recruiter ownership and private review gap closure > REC-home-drives-46 keeps inline legacy round controls and counts stage decisions

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Online test'
  - Expected
  + Received
  - Online test
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```
- chat-14 recruiter ownership and private review gap closure > REC-home-drives-41 degrades safely when the proposed private-review table is not installed

  ```
  AssertionError: expected 'import {NextResponse} from "next/serv…' to contain 'if(!hasActiveRecruiter(context))'
  - Expected
  + Received
  - if(!hasActiveRecruiter(context))
  + import {NextResponse} from "next/server";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {hasActiveRecruiter} from "@/modules/identity/context";
  + import {isSameOriginRequest} from "@/auth/origin";
  ```
- chat-14 recruiter ownership and private review gap closure > REC-calendar-messages-profile-12 confirms in-app draft navigation rather than discarding it silently

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

## tests/unit/shell-page-titles.test.ts (1 failing)
- legacy browser titles (dev format `<title> · 42LMS`) > uses the bare 42LMS fallback when no title is known

  ```
  AssertionError: expected 'Home · 42LMS' to be '42LMS' // Object.is equality
  Expected: "42LMS"
  Received: "Home · 42LMS"
  ```
