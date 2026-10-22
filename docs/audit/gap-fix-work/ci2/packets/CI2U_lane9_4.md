# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-tpo-announcements-01.test.ts (1 failing)
- UX-tpo-announcements-01 /tpo/announcements > preserves legacy UI while applying signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { DateInput } from "@/components/ui/date-input";
  + import { Tabs } from "@/components/ui/tabs";
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {TpoNoticeMessageCount} from "@/components/tpo/tpo-notice-message-count";
  ```

## tests/unit/UX-tpo-calendar-rounds-01.test.ts (1 failing)
- UX-tpo-calendar-rounds-01 /tpo/calendar/rounds > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {Input} from \"@/components/ui/input\";
  import {PageBackLink} from \"@/components/ui/page-back-link\";
  import Link from \"next/link\";
  ```

## tests/unit/UX-tpo-messages-04.test.ts (1 failing)
- UX-tpo-messages-04 > uses shared controls in existing authorized GET workflow

  ```
  AssertionError: expected 'import { TpoTeamMessagesDirectory } f…' to contain '<Input'
  - Expected
  + Received
  - <Input
  + import { TpoTeamMessagesDirectory } from "@/components/tpo/tpo-team-messages-directory";
  + import Link from "next/link";
  + import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";
  + import {getTpoRecruiterThreadDetail} from "@/modules/placements/tpo-recruiter-thread-detail-service";
  ```

## tests/unit/admin-module-access-trace-model.test.ts (1 failing)
- Super Admin learner module access trace > lets a locked lower-level placement rule win like any other module

  ```
  AssertionError: expected { module: 'placements', …(6) } to match object { enabled: false, …(1) }
  (5 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "enabled": false,
  -   "winnerLevel": "MEMBERSHIP",
  +   "enabled": true,
  ```

## tests/unit/chat11-faculty-attendance-confirm-round3.test.ts (2 failing)
- chat-11 faculty attendance confirmation and mobile marking > FAC-attendance-grades-04 uses styled Submit Attendance confirmation and exact count message

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain 'Attendance marked successfully.'
  - Expected
  + Received
  - Attendance marked successfully.
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Alert } from "@/components/ui/alert";
  + import { Textarea } from "@/components/ui/textarea";
  ```
- chat-11 faculty attendance confirmation and mobile marking > FAC-attendance-grades-20 keeps a narrow-screen sticky submission bar and responsive roster

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain 'className="sticky bottom-0'
  - Expected
  + Received
  - className="sticky bottom-0
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Alert } from "@/components/ui/alert";
  + import { Textarea } from "@/components/ui/textarea";
  ```

## tests/unit/chat11-super-admin-signin-readiness.test.ts (3 failing)
- SA-tenants-modules-LOGIN-01: per-college sign-in policy safety > requires origin, matching URL/body college, persisted role, active college and CAS

  ```
  AssertionError: expected 'import {NextResponse} from "next/serv…' to contain '!("collegeId" in body)||body.collegeI…'
  - Expected
  + Received
  - !("collegeId" in body)||body.collegeId!==collegeId
  + import {NextResponse} from "next/server";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {isSameOriginRequest} from "@/auth/origin";
  + import {apiErrorResponse} from "@/lib/api-error";
  ```
- SA-tenants-modules-READY-01: persisted readiness does not imply launch approval > all seven setup links are established routes and percent-encode the selected college

  ```
  AssertionError: expected [ { id: 'brand', …(3) }, …(7) ] to have a length of 7 but got 8
  - Expected
  + Received
  - 7
  + 8
  ```
- SA-tenants-modules-READY-01: persisted readiness does not imply launch approval > branding and module access read the selected tenant without a URL-supplied scope override

  ```
  AssertionError: expected 'import { notFound } from "next/naviga…' to contain 'getSuperAdminCollegeBrandingPreview(c…'
  - Expected
  + Received
  - getSuperAdminCollegeBrandingPreview(context, collegeId)
  + import { notFound } from "next/navigation";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {ErrorState} from "@/components/ui/error-state";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  ```
