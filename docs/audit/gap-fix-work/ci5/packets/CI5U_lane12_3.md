# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-super-admin-projects-gap-closure.test.ts (23 failing)
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-51 accepted archive-and-restore design

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'Archive project?'
  - Expected
  + Received
  - Archive project?
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-52 retains the verified Projects behavior

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'Live projects, each run by a mentor w…'
  - Expected
  + Received
  - Live projects, each run by a mentor with a team of students.
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-64 retains the verified Projects behavior

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Export overrides CSV'
  - Expected
  + Received
  - Export overrides CSV
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Badge } from "@/components/ui/badge";
  + import {getProjectReadiness} from "@/modules/projects/readiness-service";
  + import {ProjectReadinessOverrideForm} from "./project-readiness-override-form";
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-74 retains the verified Projects behavior

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' to contain 'label:"Today"'
  - Expected
  + Received
  - label:"Today"
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {type ReactNode} from "react";
  + import {ProjectAuditRefreshButton} from "@/components/projects/project-audit-filters";
  + import {StatusBadge} from "@/components/ui/status-badge";
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-78 retains the verified Projects behavior

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'No college selected'
  - Expected
  + Received
  - No college selected
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-80 retains the verified Projects behavior

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'Template title or slug'
  - Expected
  + Received
  - Template title or slug
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-58 preserves actual at-risk mentor reassignment and overload semantics

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'encodeURIComponent(project.mentorMemb…'
  - Expected
  + Received
  - encodeURIComponent(project.mentorMembershipId ?? "UNASSIGNED")
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  +   ProjectAdminFilters,
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-65 preserves its implemented foundation while legacy parity remains open

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Submission status'
  - Expected
  + Received
  - Submission status
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requireProjectManageAccess} from "@/modules/projects/access";
  + import {getProjectReadiness} from "@/modules/projects/readiness-service";
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-55 uses the legacy workspaces search URL key, size 20 and page sizes

  ```
  AssertionError: expected 'import { z } from "zod";\n\n// URL nu…' to contain 'pageSize: positiveDecimal(10, 100, 20)'
  - Expected
  + Received
  - pageSize: positiveDecimal(10, 100, 20)
  + import { z } from "zod";
  +
  + // URL numbers are decimal-only: coercion would also admit 0x10, 1e2 and whitespace.
  + const positiveDecimal = (min: number, max: number, fallback: number) =>
  ```
- chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-58 shows average-based mentor overload, not a fixed cap

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- … 13 more in this file

## tests/unit/chat5-placements-retention-and-joining-followups.test.ts (2 failing)
- PLACEMENTS-RETENTION-01 read-only application retention boundary > uses exactly the 180-day lookback and refuses malformed clocks

  ```
  AssertionError: expected 365 to be 180 // Object.is equality
  - Expected
  + Received
  - 180
  + 365
  ```
- PLACEMENTS-RETENTION-01 read-only application retention boundary > PLACEMENTS-RETENTION-02 keeps every old row college scoped and read-only in the persisted report

  ```
  AssertionError: expected 'import "server-only";\nimport {and,co…' to contain 'collegeApplicationRetentionCutoff(new…'
  - Expected
  + Received
  - collegeApplicationRetentionCutoff(new Date())
  + import "server-only";
  + import {and,count,desc,eq,inArray,lt,notExists,or,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships,placementApplications,placementApplicationScreenings,
  ```

## tests/unit/chat6-college-placements-round2-verified.test.ts (3 failing)
- College placement verified operational parity > COL-placements-11 retention report and college student placement lookup are accessible

  ```
  AssertionError: expected 'import "server-only";\nimport {and,co…' to contain 'collegeApplicationRetentionCutoff(new…'
  - Expected
  + Received
  - collegeApplicationRetentionCutoff(new Date())
  + import "server-only";
  + import {and,count,desc,eq,inArray,lt,notExists,or,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships,placementApplications,placementApplicationScreenings,
  ```
- College placement verified operational parity > COL-placements-13 drive settings support draft edit reopen and impact-preview archive

  ```
  AssertionError: expected '"use client";\nimport {useState} from…' to contain 'View delete impact'
  - Expected
  + Received
  - View delete impact
  + "use client";
  + import {useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {apiFetch} from "@/lib/api-fetch";
  ```
- College placement verified operational parity > COL-placements-17 analytics provide department program batch date funnel company and export

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain 'Export CSV'
  - Expected
  + Received
  - Export CSV
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Input } from "@/components/ui/input";
  + import { StatTile } from "@/components/ui/stat-tile";
  ```

## tests/unit/chat6-recruiter-identity-and-expiry-round5.test.ts (2 failing)
- Super Admin recruiter identity and college grant expiry > SA-academics-people-108 provides structured recruiter name, designation, new company and multi-college creation

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain 'First Name'
  - Expected
  + Received
  - First Name
  + "use client";
  +
  + import { useId, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- Super Admin recruiter identity and college grant expiry > SA-academics-people-110 preserves grant expiry and scoped active revoked expired history

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain 'College access history'
  - Expected
  + Received
  - College access history
  + "use client";
  +
  + import { useId, useState } from "react";
  + import Link from "next/link";
  ```

## tests/unit/chat6-superadmin-scoped-directory-filters.test.ts (1 failing)
- Super Admin selected-college directory filters > SA-academics-people-66 filters selected college assessments by course, section scope and result publication

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'courseCode:raw.courseCode'
  - Expected
  + Received
  - courseCode:raw.courseCode
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/chat7-learner-course-delivery-security.test.ts (2 failing)
- LEARNER-courses-roster-01 active course and elective ownership matrix > includes only explicitly authorized group electives and never duplicates host-section visibility

  ```
  AssertionError: expected [ { …(2) } ] to deeply equal [ { …(2) }, { …(2) } ]
  - Expected
  + Received
  [
  {
  "courseName": "Core",
  "deliveryId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  },
  ```
- LEARNER-courses-roster-01 active course and elective ownership matrix > enforces exact offering cohort and period against persisted section and program rows

  ```
  AssertionError: expected 'import {\n  and,\n  asc,\n  desc,\n  …' to contain 'eq(sections.cohortId,courseOfferings.…'
  - Expected
  + Received
  - eq(sections.cohortId,courseOfferings.cohortId)
  + import {
  +   and,
  +   asc,
  +   desc,
  ```

## tests/unit/chat7-project-task-comments-legacy-copy.test.ts (1 failing)
- Mentor and Learner 0090 task comments exact legacy copy > uses TaskDetailsModal dev comment labels, empty and button strings

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useS…' to contain 'Notes and progress updates people on …'
  - Expected
  + Received
  - Notes and progress updates people on this task have written.
  + "use client";
  + import {useEffect,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
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
