# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-results-service-scoping.test.ts (3 failing)
- COURSES7-07 / COURSES7-08 learner owner isolation and historical submission continuity > uses quiz ID and own membership, after authorizing the requested delivery

  ```
  TypeError: getDb(...).select(...).from(...).where(...).orderBy(...).limit is not a function
  ❯ Module.getMyQuizAttempts src/modules/courses/quiz-attempt-service.ts:529:6
  527|     )
  528|     .orderBy(desc(quizAttempts.attemptNumber),desc(quizAttempts.id))
  529|     .limit(100).offset((page-1)*100);
  |      ^
  530|
  531|   const reveal = mayRevealLearnerResults(
  ```
- COURSES7-07 / COURSES7-08 learner owner isolation and historical submission continuity > does not reveal answer keys just because an open quiz has a stale published flag

  ```
  TypeError: getDb(...).select(...).from(...).where(...).orderBy(...).limit is not a function
  ❯ Module.getMyQuizAttempts src/modules/courses/quiz-attempt-service.ts:529:6
  527|     )
  528|     .orderBy(desc(quizAttempts.attemptNumber),desc(quizAttempts.id))
  529|     .limit(100).offset((page-1)*100);
  |      ^
  530|
  531|   const reveal = mayRevealLearnerResults(
  ```
- COURSES7-07 / COURSES7-08 learner owner isolation and historical submission continuity > reveals score and correctness only after CLOSED plus explicit result release

  ```
  TypeError: getDb(...).select(...).from(...).where(...).orderBy(...).limit is not a function
  ❯ Module.getMyQuizAttempts src/modules/courses/quiz-attempt-service.ts:529:6
  527|     )
  528|     .orderBy(desc(quizAttempts.attemptNumber),desc(quizAttempts.id))
  529|     .limit(100).offset((page-1)*100);
  |      ^
  530|
  531|   const reveal = mayRevealLearnerResults(
  ```

## tests/unit/chat7-round2-mentor-04.test.ts (2 failing)
- chat-7 mentor meetings and release contracts > MEN-projects-meetings-26 bounded historic meetings with reveal control

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Past meetings / Meeting history'
  - Expected
  + Received
  - Past meetings / Meeting history
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {useEffect,useState} from "react";
  +
  ```
- chat-7 mentor meetings and release contracts > MEN-projects-meetings-34 release-first sprint scheduling and definition of done

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'Ships in release'
  - Expected
  + Received
  - Ships in release
  + "use client";
  +
  + import { useState } from "react";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat7-superadmin-progress-roster-security.test.ts (2 failing)
- SA-academics-people-67 selected-college learner progress hardening > SA-academics-people-67 fetches a sentinel row before marking the 500-row export/page as truncated

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to match /limit\s+501\s*`\)/
  - Expected:
  /limit\s+501\s*`\)/
  + Received:
  "import \"server-only\";
  import {and,eq,sql} from \"drizzle-orm\";
  import {colleges,courses,courseOfferings,courseSectionDeliveries,departments,sections} from \"@/db/schema\";
  import {assertPersistedPlatformPermission} from \"@/modules/permissions/persisted-actor\";
  ```
- SA-academics-people-67 selected-college learner progress hardening > SA-academics-people-67 restricts each learner's item denominator to active delivery audience

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'row.videos+"/"+row.totalVideos'
  - Expected
  + Received
  - row.videos+"/"+row.totalVideos
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {and,asc,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat9-college-sidebar-active-groups.test.ts (1 failing)
- College Admin legacy grouped sidebar highlight > the shared sidebar renders the active owner of nested College routes

  ```
  AssertionError: expected '"use client";\n\nimport {Fragment,use…' to contain 'collegeLegacyGroupForPath(pathname)'
  - Expected
  + Received
  - collegeLegacyGroupForPath(pathname)
  + "use client";
  +
  + import {Fragment,useEffect,useState} from "react";
  + import {apiFetch} from "@/lib/api-fetch";
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

## tests/unit/chat9-tpo-calendar-validation-export.test.ts (1 failing)
- TPO calendar scheduling and accreditation export > TPO-calendar-reports-R03 exports student records without a WARNING pseudo-row

  ```
  AssertionError: expected [] to have a length of 1 but got +0
  - Expected
  + Received
  - 1
  + 0
  ```
