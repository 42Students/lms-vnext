# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-teacher-shared-surfaces.test.ts (4 failing)
- Faculty shared surface mobile and focus rollout > UX-teacher-courses-shared-02 preserves course summary roles and 44px filter disclosures

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'min-h-11 cursor-pointer items-center'
  - Expected
  + Received
  - min-h-11 cursor-pointer items-center
  + import { Badge } from "@/components/ui/badge";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {FacultyCourseCover} from "./faculty-course-cover";
  ```
- Faculty shared surface mobile and focus rollout > UX-teacher-contacts-shared-02 keeps explicit directory empty copy and accessible pagination

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No public directory members found'
  - Expected
  + Received
  - No public directory members found
  + import Link from "next/link";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Table } from "@/components/ui/table";
  ```
- Faculty shared surface mobile and focus rollout > UX-teacher-reports-shared-02 uses both phone cards and desktop report rows with 44px paging

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
- Faculty shared surface mobile and focus rollout > UX-teacher-assessments-shared-02 has honest zero results and keyboard-size review links

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import {PageHeader} from "@/components/ui/page-header";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/UX-tpo-calendar-interviews-01.test.ts (1 failing)
- UX-tpo-calendar-interviews-01 /tpo/calendar/interviews > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {Select} from \"@/components/ui/select\";
  import {Input} from \"@/components/ui/input\";
  import Link from \"next/link\";
  ```

## tests/unit/UX-tpo-messages-01.test.ts (1 failing)
- UX-tpo-messages-01 /tpo/messages > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import { TpoTeamMessagesDirectory } f…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { TpoTeamMessagesDirectory } from "@/components/tpo/tpo-team-messages-directory";
  + import Link from "next/link";
  + import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";
  + import {getTpoRecruiterThreadDetail} from "@/modules/placements/tpo-recruiter-thread-detail-service";
  ```

## tests/unit/admin-module-access-read-model.test.ts (3 failing)
- Super Admin feature-control model > uses the real source defaults when no persisted rule exists

  ```
  AssertionError: expected [ { module: 'projects', …(3) }, …(1) ] to deeply equal [ { module: 'projects', …(3) }, …(2) ]
  - Expected
  + Received
  @@ -9,12 +9,6 @@
  "enabled": false,
  "level": "DEFAULT",
  "module": "placements",
  "source": "SOURCE_DEFAULT",
  ```
- Super Admin feature-control model > distinguishes college, organization and global persisted rules

  ```
  AssertionError: expected [ { enabled: false, …(2) }, …(1) ] to deeply equal [ { enabled: false, …(2) }, …(2) ]
  - Expected
  + Received
  @@ -7,11 +7,6 @@
  {
  "enabled": true,
  "level": "ORGANIZATION",
  "source": "PERSISTED",
  ```
- Super Admin feature-control model > resolves placements through the same hierarchy as other modules (lowest rule wins)

  ```
  AssertionError: expected { enabled: false, …(3) } to match object { enabled: true, level: 'MEMBERSHIP' }
  (2 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "enabled": true,
  -   "level": "MEMBERSHIP",
  +   "enabled": false,
  ```

## tests/unit/chat11-college-unconfirmed-decisions-round10.test.ts (4 failing)
- chat-11 delegated College Admin decisions > COL-academic-setup-41 supports long cards and keyboard-scrollable tables at 375px

  ```
  AssertionError: expected '"use client";\nimport {useState,useTr…' to contain 'break-words'
  - Expected
  + Received
  - break-words
  + "use client";
  + import {useState,useTransition} from "react";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Button } from "@/components/ui/button";
  ```
- chat-11 delegated College Admin decisions > COL-course-tabs-23 uses bounded route Retry and avoids showing stale progress as current

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' not to contain 'error.message'
  - Expected
  + Received
  - error.message
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {ErrorState} from "@/components/ui/error-state";
  + import {useLastCollegeProgressReport} from "@/components/courses/college-progress-last-good";
  ```
- chat-11 delegated College Admin decisions > COL-dashboard-17 exposes 375px-safe cards and a single-column first checklist

  ```
  AssertionError: expected '"use client";\nimport {useState,useTr…' to contain 'min-[375px]:grid-cols-2'
  - Expected
  + Received
  - min-[375px]:grid-cols-2
  + "use client";
  + import {useState,useTransition} from "react";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Button } from "@/components/ui/button";
  ```
- chat-11 delegated College Admin decisions > COL-people-20 requires Super Admin for granting or revoking the college admin role

  ```
  AssertionError: expected 'export async function addMembershipRo…' to contain 'if (input.role === "COLLEGE_ADMIN")'
  - Expected
  + Received
  - if (input.role === "COLLEGE_ADMIN")
  + export async function addMembershipRole(
  +   context: RequestContext,
  +   membershipIdInput: string,
  +   rawInput: unknown,
  ```

## tests/unit/chat11-super-admin-signin-editor-cas.test.ts (1 failing)
- SA-tenants-modules-LOGIN-CAS-03 successive college sign-in saves > reads committed version/method from successful response before declaring a save, not stale props

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain 'Could not save sign-in settings.'
  - Expected
  + Received
  - Could not save sign-in settings.
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Alert} from "@/components/ui/alert";
  ```
