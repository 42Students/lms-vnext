# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/template-college-availability-model.test.ts (1 failing)
- Template college availability > clamps stale pages and combines code search with assignment filters

  ```
  AssertionError: expected 3 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 3
  ```

## tests/unit/tpo-drive-applicant-partials-chat5.test.ts (1 failing)
- TPO drive applicant partial parity and query safety > TPO-drive-workspace-72 collapses mobile actions and filters

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain '<TpoGridFilterPanel fields={filters} …'
  - Expected
  + Received
  - <TpoGridFilterPanel fields={filters} mobileSheet/>
  + "use client";
  + import Link from "next/link";
  + import type {TpoGridColumn} from "@/modules/placements/tpo-grid-model";
  + import {applicantStage} from "@/modules/placements/tpo-applicant-pipeline-model";
  ```

## tests/unit/tpo-home-legacy-rows.test.ts (1 failing)
- TPO-home-03 legacy seven-row contract > uses authoritative inputs only, without pretending unknown counts are zero

  ```
  AssertionError: expected '2 requests · Messages unavailable' to be '2 requests' // Object.is equality
  Expected: "2 requests"
  Received: "2 requests · Messages unavailable"
  ```

## tests/unit/tpo-student-quick-panel.test.ts (1 failing)
- TPO-students-02 roster student deep link and drawer > renders five panel tabs with safe detailed navigation

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/ux-admin-chat9-batch-03.test.ts (5 failing)
- chat-9 last-third admin UX rollout, batch 03 > UX-admin-projects-workspaces-new-01 protects route accessibility and delegate

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { ClassTeamWorkspaceCreator } from "@/components/projects/class-team-workspace-creator";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-9 last-third admin UX rollout, batch 03 > UX-admin-quizzes-01 protects route accessibility and delegate

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  ```
- chat-9 last-third admin UX rollout, batch 03 > UX-admin-semester-courses-01 protects route accessibility and delegate

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {ErrorState} from "@/components/ui/error-state";
  ```
- chat-9 last-third admin UX rollout, batch 03 > UX-admin-semesters-01 protects route accessibility and delegate

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import { SemesterRefreshBoundary } from "@/components/admin/semester-refresh-boundary";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-9 last-third admin UX rollout, batch 03 > UX-admin-settings-01 protects route accessibility and delegate

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {getCollegeAttendancePolicy} from "@/modules/attendance/policy-service";
  + import {SuperAdminAttendanceSettingsEditor} from "@/components/admin/super-admin-attendance-settings-editor";
  + import {TenantSettingsEditor} from "@/components/admin/tenant-settings-editor";
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
