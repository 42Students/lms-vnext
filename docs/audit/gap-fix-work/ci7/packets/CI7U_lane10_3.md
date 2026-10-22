# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-faculty-assignment-role-cas-101.test.ts (1 failing)
- SA-academics-people-101 teaching role concurrency > passes only the persisted version from directory into a single guarded UI PATCH

  ```
  AssertionError: expected '"use client";\n\nimport {useState, ty…' to contain 'body:JSON.stringify({role,expectedUpd…'
  - Expected
  + Received
  - body:JSON.stringify({role,expectedUpdatedAt:revision})
  + "use client";
  +
  + import {useState, type FormEvent} from "react";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts (4 failing)
- chat-7 final sprint Super Admin courses and content > SA-academics-people-50 validates short title, optional official code and colour independently from internal code

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- chat-7 final sprint Super Admin courses and content > SA-academics-people-56 can edit archive reorder and open offering creation from the lesson directory

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Course / Offering'
  - Expected
  + Received
  - Course / Offering
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  +
  ```
- chat-7 final sprint Super Admin courses and content > SA-academics-people-64 connects assignments to publish archive and existing builder

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'assignment?"assignments":"quizzes"'
  - Expected
  + Received
  - assignment?"assignments":"quizzes"
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {Input} from "@/components/ui/input";
  ```
- chat-7 final sprint Super Admin courses and content > SA-academics-people-65 exposes quiz transitions, result releases and existing builder entry

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Export quizzes.csv'
  - Expected
  + Received
  - Export quizzes.csv
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  ```

## tests/unit/chat9-calendar-reports-existing-contracts.test.ts (3 failing)
- TPO calendar and reports verified source contracts > TPO-calendar-reports-04 opens a prefilled-hour modal from the week calendar grid

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="dialog"'
  - Expected
  + Received
  - role="dialog"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- TPO calendar and reports verified source contracts > TPO-calendar-reports-12 provides Show everything while calendar filters are active

  ```
  AssertionError: expected 'import {TpoWeekHourCalendar} from "@/…' to contain 'href={basePath}'
  - Expected
  + Received
  - href={basePath}
  + import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  + import Link from "next/link";
  +
  ```
- TPO calendar and reports verified source contracts > TPO-calendar-reports-47 calculates and labels answered-offer acceptance rate per company

  ```
  AssertionError: expected 'import {tpoReportHasAmbiguousFilters}…' to contain 'accepted / (accepted + declined)'
  - Expected
  + Received
  - accepted / (accepted + declined)
  + import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
  + import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
  + import {ReportBarChart} from "@/components/placements/report-bar-chart";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```

## tests/unit/chat9-tpo-job-type-policy-round8.test.ts (2 failing)
- chat9 TPO job-type and drive-approval verification > TPO-settings-audit-21 requires an explicit placed decision for each new custom job type

  ```
  AssertionError: expected '"use client";\n\nimport { TpoUnifiedJ…' to contain 'countsAsPlaced===null'
  - Expected
  + Received
  - countsAsPlaced===null
  + "use client";
  +
  + import { TpoUnifiedJobTypesEditor, type EditableJobType } from "./tpo-unified-job-types-editor";
  +
  ```
- chat9 TPO job-type and drive-approval verification > TPO-settings-audit-22 preserves in-use job-type history by deactivating instead of deleting a referenced category

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' not to match /delete\(placementTpoJobTypes\)/
  - Expected:
  /delete\(placementTpoJobTypes\)/
  + Received:
  "import \"server-only\";
  import {and,eq,sql} from \"drizzle-orm\";
  import {z} from \"zod\";
  import {getDb} from \"@/db/client\";
  ```
