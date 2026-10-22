# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-tpo-batches-batchid-history-01.test.ts (1 failing)
- UX-tpo-batches-batchid-history-01 /tpo/batches/[batchId]/history > preserves legacy UI while applying signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {Select} from \"@/components/ui/select\";
  import {PageHeader} from \"@/components/ui/page-header\";
  import {batchDecisionLabel,batchHistoryDate} from \"@/modules/placements/tpo-batch-labels-model\";
  ```

## tests/unit/UX-tpo-drive-day-01.test.ts (1 failing)
- UX-tpo-drive-day-01 /tpo/drive-day > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to contain 'text-on-primary'
  - Expected
  + Received
  - text-on-primary
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  ```

## tests/unit/UX-tracker-issues-01.test.ts (1 failing)
- UX-tracker-issues-01 > preserves original wording, permissions and supported accessible UX

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<Card as="article"'
  - Expected
  + Received
  - <Card as="article"
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
  ```

## tests/unit/chat-7-graceful-actions.test.ts (1 failing)
- chat-7 graceful operation on touched pages > GR-35 MEN-projects-meetings-46 confirms destructive task deletion in an accessible dialog

  ```
  AssertionError: expected '"use client";\nimport {useRef,useStat…' to contain 'if(pending)return'
  - Expected
  + Received
  - if(pending)return
  + "use client";
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {projectMutation} from "./project-api";
  ```

## tests/unit/chat11-session-course-gap-verification.test.ts (1 failing)
- chat-11 session and attendance parity > FAC-attendance-grades-10 offers the legacy class selector on the attendance tab

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'activeTab==="attendanceDetail"?"Selec…'
  - Expected
  + Received
  - activeTab==="attendanceDetail"?"Select class to view attendance"
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Tabs } from "@/components/ui/tabs";
  + import Link from "next/link";
  ```

## tests/unit/chat11-tpo-notices-college-count.test.ts (1 failing)
- TPO-settings-audit-NOTICES-04 college notice settings counts > distinguishes 0, exact counts, truncated pages and absent storage

  ```
  AssertionError: expected 'College notices unavailable' to be '0 recorded college notices' // Object.is equality
  Expected: "0 recorded college notices"
  Received: "College notices unavailable"
  ```
