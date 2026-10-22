# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-discussion-scope-and-race.test.ts (2 failing)
- COURSES7-11 Learner discussion access and response isolation > COURSES7-11 guards repeated submit events and whitespace-only messages

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- COURSES7-11 Learner discussion access and response isolation > COURSES7-11 enforces the same finite message length used for all persisted writers

  ```
  AssertionError: expected 4000 to be 3900 // Object.is equality
  - Expected
  + Received
  - 3900
  + 4000
  ```

## tests/unit/chat7-round2-mentor-01.test.ts (2 failing)
- chat-7 round 2: mentor project card and read-only legacy parity > MEN-projects-meetings-14 real mentor/course subtitle

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain '"Mentor: "'
  - Expected
  + Received
  - "Mentor: "
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- chat-7 round 2: mentor project card and read-only legacy parity > MEN-projects-meetings-15 archived/completed read-only message

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'This workspace is archived. You can r…'
  - Expected
  + Received
  - This workspace is archived. You can read everything here
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat7-superadmin-courses-content-page-gates.test.ts (5 failing)
- Super Admin courses and content page-level scope, recovery and mobile access gates > SA-academics-people-50/54 selected-college catalogue exposes real create/search/error/empty states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Select a college to continue'
  - Expected
  + Received
  - Select a college to continue
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {listSuperAdminGlobalCourses} from "@/modules/courses/super-admin-global-course-directory";
  + import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
  ```
- Super Admin courses and content page-level scope, recovery and mobile access gates > SA-academics-people-56/57 lessons guard invalid filters, no-college and explicit authoring

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'adminLearningQuerySchema.safeParse'
  - Expected
  + Received
  - adminLearningQuerySchema.safeParse
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
- Super Admin courses and content page-level scope, recovery and mobile access gates > SA-academics-people-61/62 video, resource and live-class surfaces keep safe previews and disabled source edit state

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'Content editing is unavailable for an…'
  - Expected
  + Received
  - Content editing is unavailable for an inactive offering or lesson.
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
- Super Admin courses and content page-level scope, recovery and mobile access gates > SA-academics-people-64/65 assignments and quizzes preserve validation, scoped reads and interactive submissions

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'adminAssessmentQuerySchema.safeParse'
  - Expected
  + Received
  - adminAssessmentQuerySchema.safeParse
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- Super Admin courses and content page-level scope, recovery and mobile access gates > SA-academics-people-67 progress directory and per-student details keep scoped recovery and export parity

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'Select a college to continue'
  - Expected
  + Received
  - Select a college to continue
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  ```

## tests/unit/chat9-college-projects-round4-evidence.test.ts (5 failing)
- College Projects gap closure round 4 > COL-projects-19 restores workspace, submissions and template page labels

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
- College Projects gap closure round 4 > COL-projects-20 shows a recoverable no-college message without redirecting silently

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- College Projects gap closure round 4 > COL-projects-21 gives archived-workspace recovery and the existing creation/reassignment actions

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Archived workspaces'
  - Expected
  + Received
  - Archived workspaces
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- College Projects gap closure round 4 > COL-projects-22 is an improvement, not a missing legacy mentor/class/template filter

  ```
  AssertionError: expected '"use client";\nimport { useCallback, …' to contain 'name={legacyWorkspaces ? "search" : "…'
  - Expected
  + Received
  - name={legacyWorkspaces ? "search" : "q"}
  + "use client";
  + import { useCallback, useEffect, useState } from "react";
  + import { useRouter } from "next/navigation";
  + import Link from "next/link";
  ```
- College Projects gap closure round 4 > COL-projects-23 uses responsive wrappers but retains browser width acceptance as open

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

## tests/unit/chat9-round6-calendar-settings.test.ts (2 failing)
- chat-9 round 6 calendar and settings > TPO-calendar-reports-25 activates Move on a follow-up with Enter instead of navigating to a recruiter page

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'aria-label="Move recruiter follow-up"'
  - Expected
  + Received
  - aria-label="Move recruiter follow-up"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- chat-9 round 6 calendar and settings > TPO-settings-audit-03 uses the original Settings section names in the grouped navigation

  ```
  AssertionError: expected [ Array(5) ] to include 'Placement Rules'
  ❯ tests/unit/chat9-round6-calendar-settings.test.ts:28:20
  26|    // named Recruiters. Recruiter access remains the page heading only.
  27|    for(const text of ["Placement Rules","Recruiters","What Companies S…
  28|     expect(labels).toContain(text);
  |                    ^
  29|  });
  30|  it("TPO-settings-audit-13 shows the live offer-rules example and exac…
  ```

## tests/unit/chat9-super-admin-verification-copy.test.ts (1 failing)
- Super Admin legacy verification exact page copy > never selects the first college or exposes cross-college decisions

  ```
  AssertionError: expected 'import {Banner} from "@/components/ui…' to contain 'redirect(`/admin/colleges/${encodeURI…'
  - Expected
  + Received
  - redirect(`/admin/colleges/${encodeURIComponent(collegeId)}/verification`);
  + import {Banner} from "@/components/ui/banner";
  + import AdminCollegeVerification from "@/app/(authenticated)/admin/colleges/[collegeId]/verification/page";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
