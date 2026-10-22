# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-live-access-behaviour.test.ts (1 failing)
- LEARNER-COURSE-ACCESS-01 persisted learner read identity > requires persisted cohort, tenant, active role and user for direct delivery reads

  ```
  AssertionError: expected 'import {\n  and,\n  eq,\n  inArray,\n…' to contain 'eq(sectionEnrollments.sectionId,'
  - Expected
  + Received
  - eq(sectionEnrollments.sectionId,
  + import {
  +   and,
  +   eq,
  +   inArray,
  ```

## tests/unit/chat7-round2-mentor-02.test.ts (1 failing)
- chat-7 mentor filters navigation and natural order > MEN-projects-meetings-09 number-aware Team ordering

  ```
  AssertionError: expected 'export type MentorProjectOrder = "REC…' to contain 'numeric: true'
  - Expected
  + Received
  - numeric: true
  + export type MentorProjectOrder = "RECENT" | "TITLE";
  + const titleCollator = new Intl.Collator("en-IN", { sensitivity: "base" });
  +
  + /** The old list applied numeric ordering only to Team N siblings with the
  ```

## tests/unit/chat7-superadmin-effective-content-visibility.test.ts (1 failing)
- SA-academics-people-62 effective student content visibility > reads live learning path and parent Course status in the selected-college query

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'Students {studentContentVisible(item)…'
  - Expected
  + Received
  - Students {studentContentVisible(item)?"Visible":"Hidden"}
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat9-college-projects-s2-closure.test.ts (1 failing)
- College Admin Projects S2 legacy gap closure > COL-projects-12 exposes active readiness overrides with CSV and workspace management

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

## tests/unit/chat9-round6-college-projects-parity.test.ts (4 failing)
- College Admin Projects round 6 > COL-projects-16 provides template search section counts details and a scoped CSV export

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Search templates'
  - Expected
  + Received
  - Search templates
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- College Admin Projects round 6 > COL-projects-19 displays the exact Workspaces, Templates, Submission and Audit headings plus the legacy risk description

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
- College Admin Projects round 6 > COL-projects-20 renders a recovery alert on all College Projects entry routes when college context is absent

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'ProjectAdminMissingCollege'
  - Expected
  + Received
  - ProjectAdminMissingCollege
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {z} from "zod";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- College Admin Projects round 6 > COL-projects-22 is NOT-A-GAP: mentor class and template filters were absent in the old Workspaces list

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

## tests/unit/chat9-tpo-audit-exact-legacy-no-internal.test.ts (1 failing)
- TPO legacy audit page customer-facing copy > TPO-settings-audit-96 hides data source implementation labels while retaining legacy copy

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'Export audit log CSV'
  - Expected
  + Received
  - Export audit log CSV
  + import { DateInput } from "@/components/ui/date-input";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
  + import { Tabs } from "@/components/ui/tabs";
  ```
