# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-accreditation-students.test.ts (2 failing)
- TPO-calendar-reports-33 NAAC student evidence > emits one row per placed student, best accepted CTC and offer count

  ```
  AssertionError: expected [] to have a length of 1 but got +0
  - Expected
  + Received
  - 1
  + 0
  ```
- TPO-calendar-reports-33 NAAC student evidence > never exports duplicate accepted offers or spreadsheet formulas unsafely

  ```
  TypeError: Cannot read properties of undefined (reading 'offersHeld')
  ❯ tests/unit/tpo-accreditation-students.test.ts:22:18
  20|    {...base,offerId:"1",name:"=IMPORTXML()",status:"ACCEPTED",annualCt…
  21|   ]);
  22|   expect(rows[0].offersHeld).toBe(1);
  |                  ^
  23|   const csv=accreditationStudentCsv(rows);
  24|   expect(csv).toContain("Employer contact");
  ```

## tests/unit/tpo-drive-edit-model.test.ts (1 failing)
- TPO draft edit policy > permits only active-season drafts with consistent CTC

  ```
  AssertionError: expected 'ALLOW' to be 'READ_ONLY' // Object.is equality
  Expected: "READ_ONLY"
  Received: "ALLOW"
  ```

## tests/unit/tpo-inbox-team-graceful-round3.test.ts (9 failing)
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-18 projects the opposite participant and kind, not just a thread ID

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'row.counterpartName'
  - Expected
  + Received
  - row.counterpartName
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-39 preserves text and shows friendly inline failures rather than raw codes

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
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-52 GR-35 names consequences before destructive notice deletion, without window.confirm

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'aria-modal="true"'
  - Expected
  + Received
  - aria-modal="true"
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {Button} from "@/components/ui/button";
  + import {Dialog} from "@/components/ui/dialog";
  ```
- Chat-2 graceful messaging and TPO action acceptance > GR-90 and GR-91 announce errors and offer a keyboard-reachable Cancel action

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
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-67 counts only recent unread personal notifications

  ```
  AssertionError: expected 'import "server-only";\n\nimport { ran…' to contain 'tpoUnreadCutoff(new Date())'
  - Expected
  + Received
  - tpoUnreadCutoff(new Date())
  + import "server-only";
  +
  + import { randomUUID } from "node:crypto";
  + import { and, count, eq, inArray, isNull } from "drizzle-orm";
  ```
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-68 provides calm loading and failure screens with Retry

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
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-54 and GR-90 never surface a read-cell API error code

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import {useCallback,useEffect,useRef,useState} from "react";
  ```
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-19 GR-71/72/73/76 preserves Team search and shows Retry instead of false empty

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'status:"FAILED" as const'
  - Expected
  + Received
  - status:"FAILED" as const
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- Chat-2 graceful messaging and TPO action acceptance > TPO-inbox-team-45 GR-71/72/73 preserves audience preview filters when one section fails

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'const previewRequest='
  - Expected
  + Received
  - const previewRequest=
  + import { DateInput } from "@/components/ui/date-input";
  + import { Tabs } from "@/components/ui/tabs";
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {TpoNoticeMessageCount} from "@/components/tpo/tpo-notice-message-count";
  ```

## tests/unit/tpo-students-model.test.ts (4 failing)
- TPO Students journey derivation > recognizes an accepted offer but not an issued, declined or withdrawn offer as placed

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- TPO Students college and branch summaries > preserves one learner per row and keeps registered pool distinct from enrollment population

  ```
  AssertionError: expected { activeLearners: 5, …(9) } to match object { activeLearners: 5, …(9) }
  - Expected
  + Received
  {
  "activeLearners": 5,
  "applying": 0,
  "needsReadinessSupport": 1,
  "notRegistered": 1,
  ```
- TPO Students college and branch summaries > uses the registered placement pool as branch placement-rate denominator

  ```
  AssertionError: expected { activeLearners: 3, …(12) } to match object { activeLearners: 3, …(3) }
  (9 matching properties omitted from actual)
  - Expected
  + Received
  {
  "activeLearners": 3,
  -   "placedInPool": 1,
  +   "placedInPool": 0,
  ```
- TPO Students college and branch summaries > paginates and filters without changing source rows

  ```
  AssertionError: expected 1 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 1
  ```

## tests/unit/ux-admin-chat9-coverage-closure.test.ts (5 failing)
- chat-9 route coverage and native DataTable closure > UX-admin-course-progress-students-01 /admin/course-progress/students protects report totals and mobile student fields

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'caption="Student Course Progress"'
  - Expected
  + Received
  - caption="Student Course Progress"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {and,asc,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```
- chat-9 route coverage and native DataTable closure > UX-admin-features-collegeId-trace-04 /admin/features/[collegeId]/trace keeps the winner and ignored statuses in a scroll-safe table

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<StatusBadge tone="success">Winner</S…'
  - Expected
  + Received
  - <StatusBadge tone="success">Winner</StatusBadge>
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  ```
- chat-9 route coverage and native DataTable closure > UX-admin-projects-project-id-04 /admin/projects/[projectId] remains a canonical redirect with stable encoding

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'encodeURIComponent(projectId)'
  - Expected
  + Received
  - encodeURIComponent(projectId)
  + import { redirect } from "next/navigation";
  + import Link from "next/link";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-9 route coverage and native DataTable closure > UX-admin-projects-templates-template-id-overview-04 /admin/projects/templates/[templateId]/overview validates before redirect

  ```
  AssertionError: expected 'import {notFound,redirect} from "next…' to contain 'projectTemplateIdSchema.safeParse'
  - Expected
  + Received
  - projectTemplateIdSchema.safeParse
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requirePermission} from "@/modules/permissions/policy";
  + /** The canonical detail resolves UUID and legacy numeric/slug bookmarks.
  ```
- chat-9 route coverage and native DataTable closure > UX-admin-recruiters-04 /admin/recruiters retains the scoped Super Admin HR editor without a duplicate permission surface

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'export { default } from "../hr/page"'
  - Expected
  + Received
  - export { default } from "../hr/page"
  + import Link from "next/link";
  + import {PageHeader} from "@/components/ui/page-header";
  + import SuperAdminHrPage from "../hr/page";
  + /** Legacy Recruiter accounts is a Placements section, not a separate
  ```

## tests/unit/ux-learn-chat7-batch-02.test.ts (9 failing)
- UX learner route batch 2 > UX-learn-learn-courses-deliveryId-courseTab-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Banner } from "@/components/ui/banner";
  + import { CoursesServiceError } from "@/modules/courses/errors";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { ZodError } from "zod";
  ```
- UX learner route batch 2 > UX-learn-learn-courses-deliveryId-attendance-summary-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { StatTile } from "@/component…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Tabs } from "@/components/ui/tabs";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- UX learner route batch 2 > UX-learn-learn-courses-deliveryId-progress-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import progressStyles from "@/components/courses/learner-course-progress.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import {LearnerGeneralRequests} from "@/components/placements/learner-general-requests";
  + import {placementTableExists} from "@/modules/placements/staged-tables";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-announcements-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Banner } from "@/components/ui/banner";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-applications-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import { PageLoading } from "@/components/ui/page-loading";
  + import {StatusBadge,applicationStatusTone} from "@/components/ui/status-badge";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-applications-applicationId-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- UX learner route batch 2 > UX-learn-learn-my-placements-applications-applicationId-company-01 maintains learner UX and route states

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
- UX learner route batch 2 > UX-learn-learn-my-placements-applications-applicationId-history-01 maintains learner UX and route states

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Tabs } from "@/components/ui/tabs";
  + import {ErrorState} from "@/components/ui/error-state";
  + import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  ```
