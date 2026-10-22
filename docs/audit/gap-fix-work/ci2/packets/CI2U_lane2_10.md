# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-assessment-class-state.test.ts (3 failing)
- LEARNER-ASSESSMENTS-CLASS-01 truthful class and scoped assessments > does not label a learner with no published courses as having no class when current Section exists

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ [], …(2) ]
  Received:
  1st vi.fn() call:
  [
  [],
  "33333333-3333-4333-8333-333333333333",
  -   Any<Number>,
  +   1792646243882,
  ```
- LEARNER-ASSESSMENTS-CLASS-01 truthful class and scoped assessments > only narrows reads to the roster-authorized course ID and sorts deadlines, then title

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ [ { …(4) } ], …(2) ]
  Received:
  1st vi.fn() call:
  @@ -6,7 +6,8 @@
  "courseName": "Operating Systems",
  "deliveryId": "22222222-2222-4222-8222-222222222222",
  },
  ],
  ```
- LEARNER-ASSESSMENTS-CLASS-01 truthful class and scoped assessments > LEARNER-ASSESSMENTS-FILTER-01 refuses forged or malformed course filters instead of broadening to all courses

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ [ { …(4) } ], …(2) ]
  Received:
  1st vi.fn() call:
  @@ -6,7 +6,8 @@
  "courseName": "Operating Systems",
  "deliveryId": "22222222-2222-4222-8222-222222222222",
  },
  ],
  ```

## tests/unit/chat7-legacy-faculty-contacts-calendar-copy.test.ts (2 failing)
- Faculty contacts tabs, timetable and back-link wording > sets the contacts page H1 from the exact legacy tab titles

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'title={selected.label}'
  - Expected
  + Received
  - title={selected.label}
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  ```
- Faculty contacts tabs, timetable and back-link wording > uses Class Schedule and no invented calendar subtitle

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain '<PageHeader title="Class Schedule" />'
  - Expected
  + Received
  - <PageHeader title="Class Schedule" />
  + import { DateInput } from "@/components/ui/date-input";
  + import { Select } from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```

## tests/unit/chat7-round3-mentor-execution.test.ts (1 failing)
- chat-7 round 3 mentor execution controls > MEN-projects-meetings-38 mentor-visible release/sprint vocabulary and empty state

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'mode==="ADMIN"?"Execution":"Releases …'
  - Expected
  + Received
  - mode==="ADMIN"?"Execution":"Releases and Sprints"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat9-accreditation-placement-rule.test.ts (2 failing)
- Accreditation placed student policy > TPO-calendar-reports-R01 includes released offers for OFFER_RELEASED but not for OFFER_ACCEPTED

  ```
  AssertionError: expected [] to have a length of 1 but got +0
  - Expected
  + Received
  - 1
  + 0
  ```
- Accreditation placed student policy > TPO-calendar-reports-R01 includes a recorded selection with no released offer

  ```
  AssertionError: expected [] to have a length of 1 but got +0
  - Expected
  + Received
  - 1
  + 0
  ```

## tests/unit/chat9-final-SA-placements-projects-102.test.ts (1 failing)
- chat9 final quick-report launcher > SA-placements-projects-102 exposes the existing issue launcher in every authenticated shell without a new unguarded submit route

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'event.altKey&&!event.repeat&&event.ke…'
  - Expected
  + Received
  - event.altKey&&!event.repeat&&event.key.toLowerCase()==="b"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {useEffect,useState} from "react";
  ```

## tests/unit/chat9-round9-public-audit.test.ts (4 failing)
- chat9 public page, signature and audit evidence > TPO-settings-audit-74 only previews privacy-cleared published values and validates the selected public metrics

  ```
  AssertionError: expected null to be '(not enough data yet)' // Object.is equality
  - Expected:
  "(not enough data yet)"
  + Received:
  null
  ```
- chat9 public page, signature and audit evidence > TPO-settings-audit-92 scopes audit quick looks to the current TPO member and retains explicit category and date filters

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'aria-label="Filter audit by category"'
  - Expected
  + Received
  - aria-label="Filter audit by category"
  + import { DateInput } from "@/components/ui/date-input";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- chat9 public page, signature and audit evidence > TPO-settings-audit-93 uses authorized, bounded audit CSV from the same filtered log rather than raw unscoped activity

  ```
  AssertionError: expected 'import { gridExportFilename } from "@…' to contain 'page<=20'
  - Expected
  + Received
  - page<=20
  + import { gridExportFilename } from "@/modules/placements/grid-export-filename";
  + import {TPO_AUDIT_KIND_LABELS,formatTpoAuditEventType} from "@/modules/placements/tpo-audit-model";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {apiErrorResponse} from "@/lib/api-error";
  ```
- chat9 public page, signature and audit evidence > TPO-settings-audit-97 escapes formula-leading clipboard cells and exposes explicit copy selection

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'return /^[\s\uFEFF]*[=+\-@]/u.test(on…'
  - Expected
  + Received
  - return /^[\s\uFEFF]*[=+\-@]/u.test(oneLine)?"'"+oneLine:oneLine;
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
