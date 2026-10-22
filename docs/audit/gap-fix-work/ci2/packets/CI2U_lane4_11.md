# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-tpo-settings-source-closure.test.ts (7 failing)
- TPO settings audited source features > TPO-settings-audit-21 verifies existing implementation in src/components/tpo/tpo-job-types-editor.tsx

  ```
  AssertionError: expected '"use client";\n\nimport { TpoUnifiedJ…' to contain 'New job type'
  - Expected
  + Received
  - New job type
  + "use client";
  +
  + import { TpoUnifiedJobTypesEditor, type EditableJobType } from "./tpo-unified-job-types-editor";
  +
  ```
- TPO settings audited source features > TPO-settings-audit-57 verifies partial implementation in src/app/(authenticated)/tpo/settings/recruiters/page.tsx

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Access & verification'
  - Expected
  + Received
  - Access & verification
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```
- TPO settings audited source features > TPO-settings-audit-74 verifies partial implementation in src/app/(authenticated)/tpo/settings/public-page/page.tsx

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'How your public placements look'
  - Expected
  + Received
  - How your public placements look
  + import { PageHeader } from "@/components/ui/page-header";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- TPO settings audited source features > TPO-settings-audit-92 verifies existing implementation in src/app/(authenticated)/tpo/audit/page.tsx

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'Audit filters'
  - Expected
  + Received
  - Audit filters
  + import { DateInput } from "@/components/ui/date-input";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- TPO settings audited source features > TPO-settings-audit-25 verifies partial implementation in src/components/tpo/tpo-job-types-editor.tsx

  ```
  AssertionError: expected '"use client";\n\nimport { TpoUnifiedJ…' to contain 'Job types saved'
  - Expected
  + Received
  - Job types saved
  + "use client";
  +
  + import { TpoUnifiedJobTypesEditor, type EditableJobType } from "./tpo-unified-job-types-editor";
  +
  ```
- TPO settings audited source features > TPO-settings-audit-71 verifies partial implementation in src/app/(authenticated)/tpo/settings/notices/page.tsx

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'Student Notices &amp; Preparation'
  - Expected
  + Received
  - Student Notices &amp; Preparation
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  ```
- TPO settings audited source features > TPO-settings-audit-82 verifies existing implementation in src/components/placements/tpo-settings-nav.tsx

  ```
  AssertionError: expected 'import Link from "next/link";\ntype S…' to contain 'id:"season"'
  - Expected
  + Received
  - id:"season"
  + import Link from "next/link";
  + type SettingsKey="season"|"rules"|"job-types"|"after-college"|"prep-readiness"|"blocked-dates"|"see"|"team"|"trusted"|"branding"|"notifications"|"recruiters"|"templates"|"notices"|"public-page"|"public-link";
  + /** Exactly five legacy-visible settings sections. Hidden panels and persisted
  +  * settings stay accessible by direct scoped URLs, never silently destroyed. */
  ```

## tests/unit/college-directory-mobile-scroll.test.ts (2 failing)
- College Admin mobile tables > exposes keyboard-scrollable and mobile-annotated semester and batch results

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'max-w-full overflow-x-auto'
  - Expected
  + Received
  - max-w-full overflow-x-auto
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { StatusBadge } from "@/components/ui/status-badge";
  ```
- College Admin mobile tables > exposes keyboard-scrollable and mobile-annotated class and elective results

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'max-w-full overflow-x-auto'
  - Expected
  + Received
  - max-w-full overflow-x-auto
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/college-wording-copy.test.ts (2 failing)
- COL-academic-setup-18 departments > uses the exact legacy strings

  ```
  AssertionError: expected { …(11) } to match object { …(8) }
  (3 matching properties omitted from actual)
  - Expected
  + Received
  @@ -4,7 +4,7 @@
  "editTitle": "Edit Department",
  "existingTitle": "Existing Departments",
  "nameLabel": "Department Name",
  ```
- COL-academic-setup-11 semester course mapping > uses the exact legacy confirm and success wording

  ```
  AssertionError: expected '2 courses added to semester' to be 'Added 2 course(s) to this semester.' // Object.is equality
  Expected: "Added 2 course(s) to this semester."
  Received: "2 courses added to semester"
  ```

## tests/unit/faculty-profile-round9-6.test.ts (1 failing)
- finds reversed dates and invalid required values before a network request

  ```
  AssertionError: expected null not to be null
  ❯ tests/unit/faculty-profile-round9-6.test.ts:8:76
  6|  expect(facultyProfileRepeatableIssue("education",[{id,institutionName…
  7|  expect(facultyProfileRepeatableIssue("certifications",[{id,name:"A",c…
  8|  expect(facultyProfileRepeatableIssue("languages",[{id,language:""}]))…
  |                                                                            ^
  9|  expect(facultyProfileRepeatableIssue("about",[])).not.toBeNull();
  10| });
  ```

## tests/unit/hr-recruiter-exhaustive-chat15-02.test.ts (1 failing)
- HR interview slots, rounds, offers, messaging and drafts chat-15 > HR-round-schedule returns only valid scheduled rows, detects overlap and deep links to current job

  ```
  AssertionError: expected [ { …(8) }, { …(8) }, …(1) ] to have a length of 2 but got 3
  - Expected
  + Received
  - 2
  + 3
  ```

## tests/unit/learner-course-list-layout.test.ts (2 failing)
- learner Courses responsive layout source contract > keeps course-type filters mobile-responsive and accessible

  ```
  AssertionError: expected '"use client";\n\nimport { MetricBar }…' to contain 'aria-label="Filter by course type"'
  - Expected
  + Received
  - aria-label="Filter by course type"
  + "use client";
  +
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import progressStyles from "./learner-course-progress.module.css";
  ```
- learner Courses responsive layout source contract > keeps clickable cards linked to the correct learner course overview

  ```
  AssertionError: expected '"use client";\n\nimport { MetricBar }…' to contain 'href={`/learn/courses/${row.course.de…'
  - Expected
  + Received
  - href={`/learn/courses/${row.course.deliveryId}/home`}
  + "use client";
  +
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import progressStyles from "./learner-course-progress.module.css";
  ```
