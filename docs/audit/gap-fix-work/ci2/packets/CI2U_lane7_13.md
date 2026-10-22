# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-applicants-zero-result-recovery.test.ts (1 failing)
- TPO empty applicant grid recovery > keeps filters and spreadsheet mounted even without matching records

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain 'TpoGridFilterPanel'
  - Expected
  + Received
  - TpoGridFilterPanel
  + "use client";
  + import Link from "next/link";
  + import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
  + import {applicantStage} from "@/modules/placements/tpo-applicant-pipeline-model";
  ```

## tests/unit/tpo-drive-graceful-chat5-round4.test.ts (2 failing)
- Drive action resilience and accessibility > TPO-drive-workspace-70 and GR-35 require an explicit reviewed destructive-action confirmation

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'type="checkbox"'
  - Expected
  + Received
  - type="checkbox"
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Button } from "@/components/ui/button";
  ```
- Drive action resilience and accessibility > GR-90 and GR-91 expose persistent alert copy and a keyboard confirmation control

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Button } from "@/components/ui/button";
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

## tests/unit/tpo-team-activity-notices-chat2.test.ts (1 failing)
- Team inbox activity and participant notices > TPO-inbox-team-18 orders private conversations by last real message and shows last activity in IST

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'Last activity ·'
  - Expected
  + Received
  - Last activity ·
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/ux-admin-chat9-cross-audit-second.test.ts (10 failing)
- UX cross-audit /admin second third (chat-9) > UX-admin-inbound-mail-02 shows an honest unavailable-storage retry and accessible filters

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-11 items-center justify-center'
  - Expected
  + Received
  - min-w-11 items-center justify-center
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Tabs} from "@/components/ui/tabs";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-lecture-halls-03 keeps every action visible on a phone and preserves failed drafts

  ```
  AssertionError: expected '"use client";\n\nimport { useRouter }…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + "use client";
  +
  + import { useRouter } from "next/navigation";
  + import Link from "next/link";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-organizations-02 mounts one responsive DataTable, not duplicate action forms

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No organizations in this scope'
  - Expected
  + Received
  - No organizations in this scope
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { OrganizationActions } from "@/components/admin/organization-actions";
  + import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-people-directory-02 preserves college privacy and focusable filters/pagination

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'label="Users pages"'
  - Expected
  + Received
  - label="Users pages"
  + import Link from "next/link";
  + import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
  + import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-placements-analytics-02 shows missing-college help before invoking scoped services

  ```
  AssertionError: expected -1 to be greater than -1
  ❯ tests/unit/ux-admin-chat9-cross-audit-second.test.ts:62:17
  60|   const page=route("placements/analytics");
  61|   const guard=page.indexOf('if(!context.adminScope?.collegeId)');
  62|   expect(guard).toBeGreaterThan(-1);
  |                 ^
  63|   expect(guard).toBeLessThan(page.indexOf("getSuperAdminCompanyHiringR…
  64|   expect(page).toContain("Select a college to continue");
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-placements-jobs-schedule-02 retains persisted round DataTable and real candidate actions

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'No candidate interviews have been sch…'
  - Expected
  + Received
  - No candidate interviews have been scheduled for this drive.
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import {useToast} from "@/components/ui/toast";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-placements-new-02 keeps scoped creation without a blank-page redirect

  ```
  AssertionError: expected 'import { ErrorState } from "@/compone…' to contain '<PlacementJobCreateWorkspace'
  - Expected
  + Received
  - <PlacementJobCreateWorkspace
  + import { ErrorState } from "@/components/ui/error-state";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-live-classes-02 public content links are same-tab, https vetted and phone reachable

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'label="Open public link"'
  - Expected
  + Received
  - label="Open public link"
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-placements-calendar-02 all calendar chips/events meet phone size and high contrast focus

  ```
  AssertionError: expected 'import {TpoWeekHourCalendar} from "@/…' not to contain 'min-h-9'
  - Expected
  + Received
  - min-h-9
  + import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  + import Link from "next/link";
  +
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-placements-jobs-04 all drive tabs are 44px and contrast safe

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  +
  + const tabs = [
  ```

## tests/unit/ux-learn-chat7-batch-03.test.ts (10 failing)
- UX learner route batch 3 > UX-learn-learn-my-placements-assessments-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Banner } from "@/components/ui/banner";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import Link from "next/link";
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-assessments-results-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Pagination } from "@/components/ui/pagination";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { Input } from "@/components/ui/input";
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-calendar-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'min-w-0'
  - Expected
  + Received
  - min-w-0
  + import { redirect } from "next/navigation";
  + import { z } from "zod";
  + import { parseLearnerCareerDate } from "@/modules/placements/learner-career-date-model";
  +
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-interviews-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'min-w-0'
  - Expected
  + Received
  - min-w-0
  + import { redirect } from "next/navigation";
  + import { z } from "zod";
  +
  + /** The old Interviews page was an alias for Schedule, not another independent
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-jobs-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Banner } from "@/components/ui/banner";
  + import { PageLoading } from "@/components/ui/page-loading";
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-jobs-jobId-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Banner } from "@/components/ui/banner";
  + import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-notification-preferences-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-offers-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Pagination } from "@/components/ui/pagination";
  + import { Banner } from "@/components/ui/banner";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-placement-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- UX learner route batch 3 > UX-learn-learn-my-placements-preparation-01 keeps real learner data and accessible affordances

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Tabs } from "@/components/ui/tabs";
  + import Link from "next/link";
  + import {LearnerPrepAssignmentCards} from "@/components/placements/learner-prep-assignment-cards";
  + import {placementTableExists} from "@/modules/placements/staged-tables";
  ```
