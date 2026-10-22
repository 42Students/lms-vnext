# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/ux-admin-chat9-batch-01.test.ts (3 failing)
- chat-9 last-third admin UX rollout, batch 01 > UX-admin-placements-student-lookup-01 preserves authorized route and accessible UX surface

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- chat-9 last-third admin UX rollout, batch 01 > UX-admin-programs-01 preserves authorized route and accessible UX surface

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  ```
- chat-9 last-third admin UX rollout, batch 01 > UX-admin-projects-01 preserves authorized route and accessible UX surface

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```

## tests/unit/ux-hr-rollout.test.ts (20 failing)
- UX-hr-activity-01 preserves legacy copy, focus and contrast

  ```
  AssertionError: The input did not match the regular expression /text-\[var\(--lms-teal-deep\)\]/. Input:
  'import { EmptyState } from "@/components/ui/empty-state";\n' +
  'import { Tabs } from "@/components/ui/tabs";\n' +
  'import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";\n' +
  'import Link from "next/link";\n' +
  'import { Input } from "@/components/ui/input";\n' +
  'import { Button } from "@/components/ui/button";\n' +
  'import { ErrorState } from "@/components/ui/error-state";\n' +
  ```
- UX-hr-calendar-01 preserves legacy copy, focus and contrast

  ```
  AssertionError: The input did not match the regular expression /text-\[var\(--lms-teal-deep\)\]/. Input:
  'import { DateInput } from "@/components/ui/date-input";\n' +
  'import { EmptyState } from "@/components/ui/empty-state";\n' +
  'import { ErrorState } from "@/components/ui/error-state";\n' +
  'import { CalendarGrid } from "@/components/ui/calendar-grid";\n' +
  'import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";\n' +
  'import styles from "@/components/hr/recruiter-calendar-legacy.module.css";\n' +
  'import { Tabs } from "@/components/ui/tabs";\n' +
  ```
- UX-hr-colleges-01 retired route remains recruiter redirect

  ```
  AssertionError: The input did not match the regular expression /redirect\("\/hr\/home"\)/. Input:
  'import Link from "next/link";\n' +
  'import {redirect} from "next/navigation";\n' +
  'import {getCurrentRequestContext} from "@/auth/request-context";\n' +
  'import {hasActiveRecruiter} from "@/modules/identity/context";\n' +
  'import {getRecruiterSelfGrantOverview} from "@/modules/placements/recruiter-self-grants-service";\n' +
  'import {recruiterCollegeCardDetail} from "@/modules/placements/recruiter-college-card-service";\n' +
  'import {PageHeader} from "@/components/ui/page-header";\n' +
  ```
- UX-hr-company-01 preserves legacy copy, focus and contrast

  ```
  AssertionError: The input did not match the regular expression /text-\[var\(--lms-teal-deep\)\]/. Input:
  'import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";\n' +
  'import {getDb} from "@/db/client";\n' +
  'import {placementCompanies} from "@/db/schema";\n' +
  'import {eq} from "drizzle-orm";\n' +
  'import {AuthorizationError} from "@/modules/permissions/policy";\n' +
  'import { SummaryStrip } from "@/components/ui/summary-strip";\n' +
  'import { Pagination } from "@/components/ui/pagination";\n' +
  ```
- UX-hr-company-reports-01 preserves legacy copy, focus and contrast

  ```
  AssertionError: The input did not match the regular expression /text-\[var\(--lms-teal-deep\)\]/. Input:
  'import { SummaryStrip } from "@/components/ui/summary-strip";\n' +
  'import { Tabs } from "@/components/ui/tabs";\n' +
  'import { MetricBar } from "@/components/ui/metric-bar";\n' +
  'import funnelStyles from "@/components/hr/recruiter-report-funnel.module.css";\n' +
  'import { HrCompanyReportsGrid } from "@/components/hr/hr-company-reports-grid";\n' +
  'import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";\n' +
  'import { Select } from "@/components/ui/select";\n' +
  ```
- UX-hr-conversations-01 preserves legacy copy, focus and contrast

  ```
  AssertionError: The input did not match the regular expression /text-\[var\(--lms-teal-deep\)\]/. Input:
  'import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";\n' +
  'import { EmptyState } from "@/components/ui/empty-state";\n' +
  'import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";\n' +
  'import { Tabs } from "@/components/ui/tabs";\n' +
  'import { Input } from "@/components/ui/input";\n' +
  'import { Textarea } from "@/components/ui/textarea";\n' +
  'import { Select } from "@/components/ui/select";\n' +
  ```
- UX-hr-conversations-threadId-01 preserves legacy copy, focus and contrast

  ```
  AssertionError: The input did not match the regular expression /text-\[var\(--lms-teal-deep\)\]/. Input:
  'import { EmptyState } from "@/components/ui/empty-state";\n' +
  'import { ScrollCue } from "@/components/ui/scroll-cue";\n' +
  'import Link from "next/link";\n' +
  'import {RecruiterConversationReplyForm} from "@/components/hr/recruiter-conversation-reply-form";\n' +
  'import {RecruiterConversationReadControl} from "@/components/hr/recruiter-conversation-read-control";\n' +
  'import {RecruiterConversationLiveRefresh} from "@/components/hr/recruiter-conversation-live-refresh";\n' +
  'import {notFound,redirect} from "next/navigation";\n' +
  ```
- UX-hr-drives-01 preserves legacy copy, focus and contrast

  ```
  AssertionError: The input did not match the regular expression /text-\[var\(--lms-teal-deep\)\]/. Input:
  'import {StatusBadge} from "@/components/ui/status-badge";\n' +
  'import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";\n' +
  'import { Pagination } from "@/components/ui/pagination";\n' +
  'import { Tabs } from "@/components/ui/tabs";\n' +
  'import Link from "next/link";\n' +
  'import { notFound, redirect } from "next/navigation";\n' +
  'import { getCurrentRequestContext } from "@/auth/request-context";\n' +
  ```
- UX-hr-drives-jobId-interview-slots-01 preserves legacy copy, focus and contrast

  ```
  AssertionError: The input did not match the regular expression /text-\[var\(--lms-teal-deep\)\]/. Input:
  'import Link from "next/link";\n' +
  'import {Alert} from "@/components/ui/alert";\n' +
  'import {EmptyState} from "@/components/ui/empty-state";\n' +
  'import {PageBackLink} from "@/components/ui/page-back-link";\n' +
  'import {notFound,redirect} from "next/navigation";\n' +
  'import {z} from "zod";\n' +
  'import {getCurrentRequestContext} from "@/auth/request-context";\n' +
  ```
- UX-hr-drives-jobId-messages-01 preserves legacy copy, focus and contrast

  ```
  AssertionError: The input did not match the regular expression /text-\[var\(--lms-teal-deep\)\]/. Input:
  'import { Button } from "@/components/ui/button";\n' +
  'import { Input } from "@/components/ui/input";\n' +
  'import { Textarea } from "@/components/ui/textarea";\n' +
  'import { EmptyState } from "@/components/ui/empty-state";\n' +
  'import Link from "next/link";\n' +
  'import {notFound,redirect} from "next/navigation";\n' +
  'import {z} from "zod";\n' +
  ```
- … 10 more in this file
