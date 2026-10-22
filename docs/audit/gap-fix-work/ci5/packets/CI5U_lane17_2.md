# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat15-learner-playback-settings.test.ts (2 failing)
- LEARNER-course-detail-12 playback settings > LEARNER-course-detail-12 accepts bounded persisted tunables and rejects malformed values

  ```
  AssertionError: expected 5000 to be null
  - Expected:
  null
  + Received:
  5000
  ```
- LEARNER-course-detail-12 playback settings > LEARNER-course-detail-12 applies college override to playback cadence and server completion

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useEffec…' to contain '}, saveIntervalMs);'
  - Expected
  + Received
  - }, saveIntervalMs);
  + "use client";
  +
  + import {
  +   useEffect,
  ```

## tests/unit/chat16-public-campaign-unsubscribe-body-bounds-26.test.ts (1 failing)
- chat-16 public campaign opt-out body limit and POST-only persistence > PUBLIC-UNSUB-SIZE-27 rejects invalid UTF-8 and malformed forms before privileged lookups

  ```
  AssertionError: expected 303 to be 400 // Object.is equality
  - Expected
  + Received
  - 400
  + 303
  ```

## tests/unit/chat16-tracker-findings-sync-r6.test.ts (1 failing)
- chat-16 independent audit findings sync evidence > SA-placements-projects-120 shows only persisted sync history, never synthetic GitHub sync success

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'refusedCount:row.refusedFiles.length'
  - Expected
  + Received
  - refusedCount:row.refusedFiles.length
  + import "server-only";
  + import {and,asc,count,desc,eq,ilike,inArray,or,sql,type SQL} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {db10AuditFindings,db10AuditFindingEvents,db10AuditFindingSyncs,db10AuditFindingFiles} from "@/db/schema/db10-audit-findings.draft";
  ```

## tests/unit/chat2-final-sprint-calendar-inbox-a.test.ts (2 failing)
- Final sprint recruiter calendar and inbox parity — group A > REC-calendar-messages-profile-03 shows scheduled start and end in IST when available

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'event.endsAt ? ` to ${eventTime(event…'
  - Expected
  + Received
  - event.endsAt ? ` to ${eventTime(event.endsAt)}`
  + import { DateInput } from "@/components/ui/date-input";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  ```
- Final sprint recruiter calendar and inbox parity — group A > REC-calendar-messages-profile-09 keeps unread and conversation count, general-chat summary and search copy

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain 'unread across '
  - Expected
  + Received
  - unread across
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```

## tests/unit/chat2-tpo-last-third-route-matrix.test.ts (1 failing)
- UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > TPO route-wide loading and error boundaries render recovery, not raw exceptions

  ```
  AssertionError: expected '"use client";\n\nimport { Button } fr…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  +
  + import { Button } from "@/components/ui/button";
  + import { ErrorState } from "@/components/ui/error-state";
  ```

## tests/unit/chat3-college-round12-parity-contracts.test.ts (2 failing)
- chat-3 college people and attendance source contract audit > COL-attendance-05 successful attendance corrections are announced

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain 'Marked present'
  - Expected
  + Received
  - Marked present
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```
- chat-3 college people and attendance source contract audit > COL-attendance-12 day-wise attendance CSV preserves discrete mark codes

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain 'return "P"'
  - Expected
  + Received
  - return "P"
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```

## tests/unit/chat4-college-academic-directory-strict-filter.test.ts (1 failing)
- COL-academics-directory-FILTER-01 strict college semester/batch URL filters > retains exact legacy search and page-size choices with normalized decimal inputs

  ```
  AssertionError: expected { q: '', page: 1, pageSize: 25, …(1) } to match object { Object (page, pageSize, ...) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 10,
  +   "pageSize": 25,
  ```

## tests/unit/chat4-college-ux-round2.test.ts (3 failing)
- Chat-4 college UX round 2 source contracts > UX-college-attendance-01 prevents width overflow and preserves accessible controls

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { z } from "zod";
  ```
- Chat-4 college UX round 2 source contracts > UX-college-attendance-settings-01 prevents width overflow and preserves accessible controls

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { isSuperAdmin } from "@/modules/identity/context";
  ```
- Chat-4 college UX round 2 source contracts > UX-college-batch-promotion-01 prevents width overflow and preserves accessible controls

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import Link from "next/link";
  + import { CollegePromotionConfirmation } from "@/components/academics/college-promotion-confirmation";
  ```
