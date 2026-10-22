# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-course-quiz-release-consistency.test.ts (1 failing)
- LEARNER-QUIZ-WORKSPACE-EMBARGO-01 consistent quiz result release across learner views > never announces quiz correctness before deadline, closure and explicit results publication

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat7-quiz-result-release-embargo.test.ts (1 failing)
- COURSES7-07 private answer-key release boundary > COURSES7-07 stale published flag cannot release results before closing quiz

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat7-superadmin-course-tenant-bulk.test.ts (3 failing)
- SA-academics-people-52/53 GR-COURSES-TENANT-01 safe scoped Super Admin visibility and progress > the initial lesson-content query filters both college-owned departments and periods to acting scope before counting matches

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'inArray(lessonContents.lessonId,input…'
  - Expected
  + Received
  - inArray(lessonContents.lessonId,input.lessonIds)
  + import "server-only";
  + import {and,eq,sql} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
- SA-academics-people-52/53 GR-COURSES-TENANT-01 safe scoped Super Admin visibility and progress > never propagates raw database, SQL, secret or permission exceptions in per-item results

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'safeCourseVisibilityFailure(error)'
  - Expected
  + Received
  - safeCourseVisibilityFailure(error)
  + import "server-only";
  + import {and,eq,sql} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
- SA-academics-people-52/53 GR-COURSES-TENANT-01 safe scoped Super Admin visibility and progress > builds only matching content route with bounded filter state and known content kind

  ```
  AssertionError: expected 10 to be 25 // Object.is equality
  - Expected
  + Received
  - 25
  + 10
  ```

## tests/unit/chat9-college-project-team-entry.test.ts (1 failing)
- College projects team and resource evidence > COL-projects-15 links workspace Team to an authorized preselected reassignment without inferring a different tenant

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'z.string().uuid().safeParse'
  - Expected
  + Received
  - z.string().uuid().safeParse
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat9-project-team-mentor-modal.test.ts (1 failing)
- College Admin workspace Team actions > COL-projects-15 offers a scoped mentor search and confirmed reassignment modal without changing member roles directly

  ```
  AssertionError: expected '"use client";\n\nimport {useRef,useSt…' to contain 'New primary mentor'
  - Expected
  + Received
  - New primary mentor
  + "use client";
  +
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/chat9-super-admin-projects-tabs.test.ts (1 failing)
- Super Admin Projects Templates-first legacy strip > never duplicates the list strip inside workspace/template detail

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'basePath === "/admin/projects") retur…'
  - Expected
  + Received
  - basePath === "/admin/projects") return null;
  + import { Tabs } from "@/components/ui/tabs";
  + import styles from "./legacy-project-tabs.module.css";
  + import { PROJECT_ADMIN_SECTIONS } from "@/modules/projects/project-admin-navigation-model";
  +
  ```
