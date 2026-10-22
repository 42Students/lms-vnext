# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-college-projects-template-catalogue.test.ts (2 failing)
- chat-9 College Projects template catalogue > COL-projects-16 counts all template sections, filters on the server and exports only visible rows

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'role="search"'
  - Expected
  + Received
  - role="search"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- chat-9 College Projects template catalogue > COL-projects-08 renders template tags in both list and cards without introducing a new status

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'item.templateTitle ? "Template: " + i…'
  - Expected
  + Received
  - item.templateTitle ? "Template: " + item.templateTitle
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "./project-workspace-readiness.module.css";
  + import Link from "next/link";
  + import { ProjectArchiveControl } from "@/components/projects/project-archive-control";
  ```

## tests/unit/chat9-round6-settings-course-nav.test.ts (1 failing)
- TPO settings responsive navigation and course policy > TPO-settings-audit-07 offers vertical sticky grouped sections on desktop while retaining mobile wrapping and aria-current

  ```
  AssertionError: expected 'import Link from "next/link";\ntype S…' to contain 'md:float-left md:mr-6 md:w-56'
  - Expected
  + Received
  - md:float-left md:mr-6 md:w-56
  + import Link from "next/link";
  + type SettingsKey="season"|"rules"|"job-types"|"after-college"|"prep-readiness"|"blocked-dates"|"see"|"team"|"trusted"|"branding"|"notifications"|"recruiters"|"templates"|"notices"|"public-page"|"public-link";
  + /** Exactly five legacy-visible settings sections. Hidden panels and persisted
  +  * settings stay accessible by direct scoped URLs, never silently destroyed. */
  ```

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

## tests/unit/college-drive-read-model.test.ts (1 failing)
- College drives filters > strictly validates bounded filters and never accepts caller college

  ```
  AssertionError: expected { q: '', status: 'ALL', …(3) } to deeply equal { q: '', status: 'PUBLISHED', …(2) }
  - Expected
  + Received
  {
  "page": 1,
  +   "pageSize": 20,
  "q": "",
  -   "sort": "TITLE",
  ```

## tests/unit/faculty-attendance-grid-model.test.ts (2 failing)
- W02 Faculty attendance daily aggregation > collapses a mixed two-session day to the legacy 1/2 ratio with accessible detail

  ```
  AssertionError: expected { code: 'MIXED', …(7) } to deeply equal { code: 'MIXED', …(7) }
  - Expected
  + Received
  @@ -1,9 +1,9 @@
  {
  "absent": 1,
  "code": "MIXED",
  -   "label": "1 present, 1 absent, 0 not marked of 2 sessions",
  ```
- W02 Faculty attendance daily aggregation > treats absence evidence as marked for imported sessions lacking session metadata

  ```
  AssertionError: expected { code: 'P', label: 'Present', …(6) } to match object { code: 'A', absent: 1, notMarked: +0 }
  (5 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "absent": 1,
  -   "code": "A",
  +   "absent": 0,
  ```

## tests/unit/graceful-alert-scheduler.test.ts (1 failing)
- scheduled Telegram alerts > GR-118 GR-119 GR-125 isolates failed optional checks without stopping later digest work

  ```
  AssertionError: expected 'import { cloudLoggingAccessToken, isC…' to contain 'withScheduledLease("telegram-digest"'
  - Expected
  + Received
  - withScheduledLease("telegram-digest"
  + import { cloudLoggingAccessToken, isCloudLogNamespace, isCloudLogProject, readCloudLogErrorPage } from "./cloud-log-reader";
  + import { reportErrorForAlert } from "./reporter";
  + import { reopenRegressedSignature } from "./policy";
  + import { randomUUID } from "node:crypto";
  ```

## tests/unit/learner-closing-drives-filter.test.ts (1 failing)
- Own published drive closing-soon filter > selects only non-expired persisted deadlines within inclusive seven days

  ```
  AssertionError: expected [ 'within', 'boundary', 'beyond' ] to deeply equal [ 'within', 'boundary' ]
  - Expected
  + Received
  [
  "within",
  "boundary",
  +   "beyond",
  ]
  ```

## tests/unit/learner-placements-13-saved-drives.test.ts (1 failing)
- LEARNER-placements-13 saved drive bookmarks > LEARNER-placements-13 uses the exact legacy saved-drive button and toast text

  ```
  AssertionError: expected { action: 'Save for later', …(4) } to deeply equal { action: 'Save for later', …(1) }
  - Expected
  + Received
  {
  "action": "Save for later",
  +   "iconLabel": "Not saved",
  +   "showToast": true,
  "toast": "Saved for later",
  ```
