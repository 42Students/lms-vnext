# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-chat7-queue-review.test.ts (4 failing)
- chat-7 learner placements queued closure audit > LEARNER-placements-53 describe only stored college offer rules

  ```
  AssertionError: expected 'export type LearnerCollegeRule={\n co…' to contain 'When counted placed:'
  - Expected
  + Received
  - When counted placed:
  + export type LearnerCollegeRule={
  +  countsAsPlacedAt:string;maxHeldOffers:number;upliftPct:number;minResponseHours:number;
  + };
  + export type LearnerHeldOfferFact={kind:string;status:string;annualCtcInr:number|null};
  ```
- chat-7 learner placements queued closure audit > LEARNER-placements-55 keeps three anchored placement cell sections

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'id="registration"'
  - Expected
  + Received
  - id="registration"
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-7 learner placements queued closure audit > LEARNER-placements-18 retains approved vNext published-drive summary and saved bookmark count

  ```
  AssertionError: expected '"use client";\n\nimport { useCallback…' to contain 'All published drives summary'
  - Expected
  + Received
  - All published drives summary
  + "use client";
  +
  + import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
- chat-7 learner placements queued closure audit > LEARNER-placements-10 retains OD-38 approved dashboard counts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Placement snapshot"'
  - Expected
  + Received
  - aria-label="Placement snapshot"
  + import Link from "next/link";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import type { learnerPlacementDashboard } from "@/modules/placements/learner-dashboard-model";
  ```

## tests/unit/mentor-projects-chat7-round6.test.ts (1 failing)
- chat-7 mentor projects round-six legacy parity > MEN-projects-meetings-24 shows the project team heading and roster count for mentors

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'See who is assigned, what role they p…'
  - Expected
  + Received
  - See who is assigned, what role they play
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/projects-mentor-route-guards-chat14.test.ts (1 failing)
- chat-14 mentor route guards and friendly API error handling > requires a confirmed release version from a same-origin authenticated DELETE

  ```
  AssertionError: expected 'import {NextResponse} from "next/serv…' to contain 'releaseId,"DELETE",await request.json…'
  - Expected
  + Received
  - releaseId,"DELETE",await request.json()
  + import {NextResponse} from "next/server";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {isSameOriginRequest} from "@/auth/origin";
  + import {apiErrorResponse} from "@/lib/api-error";
  ```

## tests/unit/recruiter-chat14-message-email-policy.test.ts (1 failing)
- REC-calendar-messages-profile-R01 unread recruiter mail policy > REC-calendar-messages-profile-R01 preserves new multiline replies while rejecting oversize

  ```
  AssertionError: expected 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx…' to be null // Object.is equality
  - Expected:
  null
  + Received:
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```

## tests/unit/scheduled-job-runner.test.ts (1 failing)
- DB10 worker executor with existing fenced lease > acquires and verifies storage-backed ownership before job start

  ```
  AssertionError: expected [ 'acquire', 'check', 'work', …(3) ] to deeply equal [ 'acquire', 'check', 'work', …(2) ]
  - Expected
  + Received
  @@ -2,6 +2,7 @@
  "acquire",
  "check",
  "work",
  "renew",
  ```

## tests/unit/template-college-availability-model.test.ts (1 failing)
- Template college availability > clamps stale pages and combines code search with assignment filters

  ```
  AssertionError: expected 3 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 3
  ```

## tests/unit/tpo-drive-edit-model.test.ts (1 failing)
- TPO draft edit policy > permits only active-season drafts with consistent CTC

  ```
  AssertionError: expected 'ALLOW' to be 'READ_ONLY' // Object.is equality
  Expected: "READ_ONLY"
  Received: "ALLOW"
  ```

## tests/unit/tpo-inbox-team-round2.test.ts (12 failing)
- Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-09 refreshes recruiter messages every four seconds and on focus without GET writes

  ```
  AssertionError: expected 'import { TpoTeamMessagesDirectory } f…' to contain '<TpoLiveRefresh intervalMs={4000}/>'
  - Expected
  + Received
  - <TpoLiveRefresh intervalMs={4000}/>
  + import { TpoTeamMessagesDirectory } from "@/components/tpo/tpo-team-messages-directory";
  + import Link from "next/link";
  + import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";
  + import {getTpoRecruiterThreadDetail} from "@/modules/placements/tpo-recruiter-thread-detail-service";
  ```
- Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-11 never passes off own notification deliveries as recruiter messages

  ```
  AssertionError: expected 'import { TpoTeamMessagesDirectory } f…' to contain 'Recruiter conversations are temporari…'
  - Expected
  + Received
  - Recruiter conversations are temporarily unavailable
  + import { TpoTeamMessagesDirectory } from "@/components/tpo/tpo-team-messages-directory";
  + import Link from "next/link";
  + import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";
  + import {getTpoRecruiterThreadDetail} from "@/modules/placements/tpo-recruiter-thread-detail-service";
  ```
- Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-13 provides phone-friendly conversation cards and All conversations back control

  ```
  AssertionError: expected 'import { TpoTeamMessagesDirectory } f…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + import { TpoTeamMessagesDirectory } from "@/components/tpo/tpo-team-messages-directory";
  + import Link from "next/link";
  + import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";
  + import {getTpoRecruiterThreadDetail} from "@/modules/placements/tpo-recruiter-thread-detail-service";
  ```
- Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-27 polls open Team conversations every 30 seconds and on focus

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain '<TpoLiveRefresh intervalMs={30000}/>'
  - Expected
  + Received
  - <TpoLiveRefresh intervalMs={30000}/>
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-39 maps API failures to inline feedback and retains unsent text

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
- Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-40 restores the exact legacy Team subtitle

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'Who does what, and what you decided. …'
  - Expected
  + Received
  - Who does what, and what you decided. Recruiters and students never see this.
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-48 shows scheduled and ended notices in the author list

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain '>Ended</p>'
  - Expected
  + Received
  - >Ended</p>
  + import { DateInput } from "@/components/ui/date-input";
  + import { Tabs } from "@/components/ui/tabs";
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {TpoNoticeMessageCount} from "@/components/tpo/tpo-notice-message-count";
  ```
- Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-58 rejects overlong announcement titles and bodies in create and edit forms

  ```
  AssertionError: expected 'import "server-only";\nimport {z} fro…' to contain 'max(8000)'
  - Expected
  + Received
  - max(8000)
  + import "server-only";
  + import {z} from "zod";
  + import {placementTpoNoticeAudiences,placementTpoNoticeRecipients} from "@/db/schema/placement-tpo-notice-audiences";
  + import {freezeTpoNoticeRecipients} from "./tpo-notice-audience-snapshot-model";
  ```
- Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-55 returns a user-facing error for invalid notice fields instead of JSON post navigation

  ```
  AssertionError: expected '/** Safe user-facing message for know…' to contain 'Give it a title.'
  - Expected
  + Received
  - Give it a title.
  + /** Safe user-facing message for known form errors; unknown query values are ignored. */
  + const MESSAGES:Record<string,string>={
  +  INVALID_BODY:"Check the announcement title, message, audience and dates before saving.",
  +  BUTTON_URL_INVALID:"The link has to start with https://",
  ```
- Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-64 makes bell rows clickable and includes New and relative date cues

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'w-full min-h-11'
  - Expected
  + Received
  - w-full min-h-11
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- … 2 more in this file
