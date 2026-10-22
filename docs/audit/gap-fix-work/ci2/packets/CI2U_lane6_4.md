# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-teacher-scroll-motion-pass.test.ts (2 failing)
- Faculty scroll and motion cues > UX-teacher-scroll-motion-02 cues horizontal attendance and retains sticky learner column

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain '<ScrollCue axis="x" label="Faculty at…'
  - Expected
  + Received
  - <ScrollCue axis="x" label="Faculty attendance monthly grid"
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Alert } from "@/components/ui/alert";
  + import { Textarea } from "@/components/ui/textarea";
  ```
- Faculty scroll and motion cues > UX-teacher-scroll-motion-03 cues desktop roster scrolling while retaining phone cards

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'sm:table-row'
  - Expected
  + Received
  - sm:table-row
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import { TableSelectAll } from "@/components/ui/table-select-all";
  ```

## tests/unit/UX-tpo-batches-batchid-students-01.test.ts (1 failing)
- UX-tpo-batches-batchid-students-01 /tpo/batches/[batchId]/students > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {Disclosure} from \"@/components/ui/disclosure\";
  import {Badge} from \"@/components/ui/badge\";
  import {DataTable} from \"@/components/ui/data-table\";
  ```

## tests/unit/UX-tpo-follow-ups-01.test.ts (1 failing)
- UX-tpo-follow-ups-01 /tpo/follow-ups > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import { Pagination } from \"@/components/ui/pagination\";
  import {Button} from \"@/components/ui/button\";
  import {Input} from \"@/components/ui/input\";
  import { tpoCrmTablesReady } from \"@/modules/placements/tpo-crm-storage-readiness\";
  ```

## tests/unit/admin-attendance-grid.test.ts (1 failing)
- College Admin attendance center > COL-attendance-R01 keeps unmarked classmates uncounted after one admin correction

  ```
  AssertionError: expected { code: 'A', label: 'Absent', …(2) } to match object { code: 'A', label: 'Absent', …(2) }
  - Expected
  + Received
  {
  "code": "A",
  -   "counted": false,
  +   "counted": true,
  "label": "Absent",
  ```

## tests/unit/chat11-college-projects-role-journeys.test.ts (6 failing)
- IIT Dharwad College Admin Projects role journeys > PROJ-COL-QUERY-03 refuses number-coercion bypasses and retains canonical decimal navigation

  ```
  AssertionError: 1e2: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- IIT Dharwad College Admin Projects role journeys > PROJ-COL-QUERY-02 retains valid filters and pagination across navigation

  ```
  AssertionError: expected { Object (view, page, ...) } to match object { Object (view, page, ...) }
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 25,
  -   "view": "cards",
  +   "pageSize": 20,
  ```
- IIT Dharwad College Admin Projects role journeys > PROJ-COL-SCOPE-04/05 all College Admin Projects creation, templates, detail, audit and reassignment routes check selected college

  ```
  AssertionError: src/app/(authenticated)/college/projects/workspaces/new/page.tsx: expected 'import {redirect} from "next/navigati…' to contain 'getProjectAdminCollegeId(context)'
  - Expected
  + Received
  - getProjectAdminCollegeId(context)
  + import {redirect} from "next/navigation";
  + /** Retain team-creation bookmarks; the canonical create page now offers
  +  * single, team and cohort workspace modes side by side.
  +  */
  ```
- IIT Dharwad College Admin Projects role journeys > PROJ-COL-BADINPUT-01 prevents a duplicate student or active unmentored workspace

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- IIT Dharwad College Admin Projects role journeys > PROJ-COL-STALE-05 refuses Enter-key submit with a pending/wrong class roster and ignores aborted candidates

  ```
  AssertionError: expected '"use client";\n\nimport { type FormEv…' to contain 'if (!controller.signal.aborted) setMe…'
  - Expected
  + Received
  - if (!controller.signal.aborted) setMentors(body.mentors ?? [])
  + "use client";
  +
  + import { type FormEvent, useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```
- IIT Dharwad College Admin Projects role journeys > PROJ-COL-STALE-06 prevents mentorless activation after a Mentor selection is cleared

  ```
  AssertionError: expected '"use client";\n\nimport { type FormEv…' to contain 'Assign a Mentor before making this Pr…'
  - Expected
  + Received
  - Assign a Mentor before making this Project active.
  + "use client";
  +
  + import { type FormEvent, useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/chat11-super-admin-module-query-adversarial.test.ts (2 failing)
- SA-tenants-modules-MOD-02 safe Module Access URL filters > supports normal decimal page strings and numeric internal paging while retaining filters

  ```
  AssertionError: expected { q: 'projects', pageSize: 20, …(7) } to match object { Object (page, q, ...) }
  (6 matching properties omitted from actual)
  - Expected
  + Received
  {
  "page": 2,
  -   "q": "Projects",
  +   "q": "projects",
  ```
- SA-tenants-modules-MOD-02 safe Module Access URL filters > requires Super Admin before parsing or listing filters

  ```
  AssertionError: expected -1 to be greater than 0
  ❯ tests/unit/chat11-super-admin-module-query-adversarial.test.ts:41:16
  39|   const parse=page.indexOf("parseAdminFeaturePageParams(await searchPa…
  40|   const list=page.indexOf("listSuperAdminFeatureControls(context,parse…
  41|   expect(auth).toBeGreaterThan(0);
  |                ^
  42|   expect(parse).toBeGreaterThan(auth);
  43|   expect(list).toBeGreaterThan(parse);
  ```
