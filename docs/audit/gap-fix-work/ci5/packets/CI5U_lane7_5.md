# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-profile-learning-gap-closure.test.ts (2 failing)
- Learner Profile and Learning Round-R gap closure > LEARNER-profile-misc-R02 role, shift, city and specific role preferences have persisted schema and edit UI

  ```
  AssertionError: expected '"use client";\nimport {LEARNER_EDUCAT…' to contain 'jobPrefsDraft.rolePreferences'
  - Expected
  + Received
  - jobPrefsDraft.rolePreferences
  + "use client";
  + import {LEARNER_EDUCATION_TYPES,learnerQualifyingExamSuggestions,LEARNER_QUALIFYING_EXAM_DETAILS,learnerEducationValidationProblem} from "@/modules/people/learner-education-picker-model";
  + import {LearnerSkillCatalogInput} from "@/components/profile/learner-skill-catalog-input";
  + import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
  ```
- Learner Profile and Learning Round-R gap closure > LEARNER-profile-misc-R04 alternate phone validates ten-to-fifteen digits and deduplicates against primary

  ```
  AssertionError: expected 'import "server-only";\n\nimport { and…' to contain 'ALTERNATE_PHONE_SAME_AS_PRIMARY'
  - Expected
  + Received
  - ALTERNATE_PHONE_SAME_AS_PRIMARY
  + import "server-only";
  +
  + import { and, eq, sql } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  ```

## tests/unit/messaging-history-page-state.test.ts (1 failing)
- parses pagination with registered bounds

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/projects-phase2-workspace-copy-audit.test.ts (2 failing)
- Phase 2 exact old-LMS Projects headings and empty states > uses legacy Team and Resources copy, not implementation language

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Project people'
  - Expected
  + Received
  - Project people
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- Phase 2 exact old-LMS Projects headings and empty states > keeps one route-level tab strip for each role

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

## tests/unit/recruiter-drive-request-model.test.ts (1 failing)
- REC-home-drives-21 recruiter formal request contract > maps every request status without silently hiding declined or cancelled work

  ```
  AssertionError: expected 'Needs changes' to be 'Sent for review' // Object.is equality
  Expected: "Sent for review"
  Received: "Needs changes"
  ```

## tests/unit/super-admin-dashboard-navigation.test.ts (1 failing)
- Super Admin dashboard global vs college navigation > has no disabled placeholders for existing global routes

  ```
  AssertionError: expected [ 'Tenant setup', …(3) ] to deeply equal [ 'Tenant Setup', …(3) ]
  - Expected
  + Received
  [
  -   "Tenant Setup",
  +   "Tenant setup",
  +   "Feature controls",
  +   "Activity log",
  ```

## tests/unit/tpo-batches-40-chat5.test.ts (1 failing)
- TPO batch eligibility import presentation > TPO-batches-40 uses an accessible modal and exact import copy without raw identifiers

  ```
  AssertionError: expected '"use client";\nimport { Tabs } from "…' to contain 'disabled={busy||preview.ready===0||un…'
  - Expected
  + Received
  - disabled={busy||preview.ready===0||unresolved>0||!acknowledged}
  + "use client";
  + import { Tabs } from "@/components/ui/tabs";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```

## tests/unit/tpo-drive-tabs.test.ts (1 failing)
- TPO-inbox-team-07 navigates all drive workspaces including Discussion (seven primary, seven secondary) using encoded job identifiers

  ```
  AssertionError: expected [ 'Applicants', 'Rounds', …(4) ] to deeply equal [ 'Overview', 'Applicants', …(5) ]
  - Expected
  + Received
  @@ -1,7 +1,6 @@
  [
  -   "Overview",
  "Applicants",
  "Rounds",
  ```

## tests/unit/tpo-notifications-history-chat2.test.ts (2 failing)
- TPO Notifications history and refresh legacy fidelity > TPO-inbox-team-65 restores All (n), Latest n and legacy empty-state labels

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'allLabel={nextHref?"Latest "+items.le…'
  - Expected
  + Received
  - allLabel={nextHref?"Latest "+items.length:"All ("+items.length+")"}
  + import Link from "next/link";
  + import {TpoNotificationRefresh} from "@/components/tpo/tpo-notification-refresh";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- TPO Notifications history and refresh legacy fidelity > TPO-inbox-team-67 treats notifications over thirty days as read and keeps older-unread hints

  ```
  AssertionError: expected null to be an instance of Date
  ❯ tests/unit/tpo-notifications-history-chat2.test.ts:19:5
  17|   expect(now.getTime()-cutoff.getTime()).toBe(30*86400000);
  18|   expect(tpoEffectiveReadAt(null,new Date("2099-01-01T00:00:00.000Z"),…
  19|    .toBeInstanceOf(Date);
  |     ^
  20|   expect(tpoEffectiveReadAt(null,new Date("2099-12-30T00:00:00.000Z"),…
  21|   const page=src("src/app/(authenticated)/tpo/notifications/page.tsx");
  ```
