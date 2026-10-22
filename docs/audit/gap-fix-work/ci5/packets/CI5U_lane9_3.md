# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-public-college-signin-policy-behaviour.test.ts (1 failing)
- Public host-derived college sign-in policy behaviour > SA-tenants-public-signin-03 unknown imported method falls back while flagging required admin review

  ```
  Error: INVALID_COLLEGE_SIGNIN_POLICY
  ❯ readStoredCollegeSignInMethod src/modules/colleges/public-signin-policy-service.ts:28:8
  26|  // A malformed persisted policy is not an unconfigured tenant:
  27|  // enabling every sign-in channel would undermine an existing college…
  28|  throw new Error("INVALID_COLLEGE_SIGNIN_POLICY");
  |        ^
  29| }
  30| export async function effectiveCollegeSignInMethod(collegeId:string|nu…
  ```

## tests/unit/chat5-fixed-on-main-more-evidence.test.ts (2 failing)
- Chat-5 second verified-main source contracts > TPO-students-35 keeps saved views on the scoped roster page

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'TpoStudentSavedViews'
  - Expected
  + Received
  - TpoStudentSavedViews
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  ```
- Chat-5 second verified-main source contracts > TPO-requests-verification-09 displays roster roll and branch evidence

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'Branch:'
  - Expected
  + Received
  - Branch:
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChipLink} from "@/components/ui/filter-chip";
  ```

## tests/unit/chat6-college-dashboard-verified.test.ts (5 failing)
- chat-6 College Admin dashboard verified legacy attention > COL-dashboard-03 shows today scheduled held and marked class counters

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'attendance.today.scheduled'
  - Expected
  + Received
  - attendance.today.scheduled
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- chat-6 College Admin dashboard verified legacy attention > COL-dashboard-04 flags held sessions missing marked attendance for 7 days

  ```
  AssertionError: expected 'import "server-only";\nimport { and, …' to contain 'attendanceStatus !== "MARKED"'
  - Expected
  + Received
  - attendanceStatus !== "MARKED"
  + import "server-only";
  + import { and, eq, desc, gte, lt, lte, sql } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import {
  ```
- chat-6 College Admin dashboard verified legacy attention > COL-dashboard-05 checks attendance below the college policy threshold over 30 days

  ```
  AssertionError: expected 'import "server-only";\nimport { and, …' to contain '30 * 86_400_000'
  - Expected
  + Received
  - 30 * 86_400_000
  + import "server-only";
  + import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import {
  ```
- chat-6 College Admin dashboard verified legacy attention > COL-dashboard-06 shows waiting-to-be-graded submissions per course

  ```
  AssertionError: expected 'import "server-only";\nimport { and, …' to contain '"PUBLISHED"'
  - Expected
  + Received
  - "PUBLISHED"
  + import "server-only";
  + import { and, asc, count, desc, eq, min } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import {
  ```
- chat-6 College Admin dashboard verified legacy attention > COL-dashboard-09 shows published quizzes closing in the next seven days

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain '7*86400000'
  - Expected
  + Received
  - 7*86400000
  + import "server-only";
  + import {and,asc,count,eq,gte,lt,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {courseQuizzes,courseLessons,courseLearningPaths,courseOfferings,courses,departments,courseSectionDeliveries,sections} from "@/db/schema";
  ```

## tests/unit/chat6-learner-calendar-round3.test.ts (2 failing)
- Learner calendar legacy copy > LEARNER-profile-misc-24 restores the today next and all courses schedule labels

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'value={todayEvents.length+" today"}'
  - Expected
  + Received
  - value={todayEvents.length+" today"}
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  + import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
  ```
- Learner calendar legacy copy > LEARNER-profile-misc-25 renders the legacy partial calendar failure with Retry

  ```
  AssertionError: expected '"use client";\n\nimport { PageHeader …' to contain 'Calendar events may be incomplete. Pl…'
  - Expected
  + Received
  - Calendar events may be incomplete. Please try refreshing the page.
  + "use client";
  +
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  ```

## tests/unit/chat6-superadmin-new-drive-auth.test.tsx (1 failing)
- Super Admin create-drive authorization before data lookup > SA-admin-middle-new-drive-auth-03 passes only selected college to the authorized write workspace

  ```
  Error: invariant expected app router to be mounted
  ❯ useRouter node_modules/next/src/client/components/navigation.ts:169:11
  ❯ AdminPlacementCreateDialog src/components/placements/admin-placement-create-dialog.tsx:12:15
  10|  * owns server validation and post-save navigation; no draft is synthe…
  11| export function AdminPlacementCreateDialog({children}:{children:ReactN…
  12|  const router=useRouter();
  |               ^
  13|  function close(){router.push("/admin/placements");router.refresh();}
  ```

## tests/unit/chat7-learner-assessment-feed-privacy.test.ts (5 failing)
- LEARNER-ASSESSMENT-FEED-PRIVACY-01 selected course dashboard projection > never queries the database for a learner with no authorized deliveries

  ```
  AssertionError: expected { assignments: [], quizzes: [], …(1) } to deeply equal { assignments: [], quizzes: [] }
  - Expected
  + Received
  {
  "assignments": [],
  "quizzes": [],
  +   "totals": {
  +     "assignments": 0,
  ```
- LEARNER-ASSESSMENT-FEED-PRIVACY-01 selected course dashboard projection > never exposes privately saved grades or feedback before publish, even when graded

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin(...).where(...).orderBy is not a function
  ❯ Module.listOwnLearnerAssessmentRows src/modules/courses/learner-assessment-flat-query.ts:47:5
  45|     eq(assignmentSubmissions.membershipId,membershipId)))
  46|    .where(and(...baseConditions,eq(courseAssignments.status,"PUBLISHED…
  47|    .orderBy(sql`coalesce(${courseAssignments.dueAt},'infinity'::timest…
  |     ^
  48|      courseAssignments.title,courseAssignments.id)
  49|    .limit(pageSize).offset(offset),
  ```
- LEARNER-ASSESSMENT-FEED-PRIVACY-01 selected course dashboard projection > reveals an explicitly published score only after the persisted flag changes

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin(...).where(...).orderBy is not a function
  ❯ Module.listOwnLearnerAssessmentRows src/modules/courses/learner-assessment-flat-query.ts:47:5
  45|     eq(assignmentSubmissions.membershipId,membershipId)))
  46|    .where(and(...baseConditions,eq(courseAssignments.status,"PUBLISHED…
  47|    .orderBy(sql`coalesce(${courseAssignments.dueAt},'infinity'::timest…
  |     ^
  48|      courseAssignments.title,courseAssignments.id)
  49|    .limit(pageSize).offset(offset),
  ```
- LEARNER-ASSESSMENT-FEED-PRIVACY-01 selected course dashboard projection > does not reveal even flagged quiz results until both the deadline and close rule hold

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin(...).where(...).orderBy is not a function
  ❯ Module.listOwnLearnerAssessmentRows src/modules/courses/learner-assessment-flat-query.ts:47:5
  45|     eq(assignmentSubmissions.membershipId,membershipId)))
  46|    .where(and(...baseConditions,eq(courseAssignments.status,"PUBLISHED…
  47|    .orderBy(sql`coalesce(${courseAssignments.dueAt},'infinity'::timest…
  |     ^
  48|      courseAssignments.title,courseAssignments.id)
  49|    .limit(pageSize).offset(offset),
  ```
- LEARNER-ASSESSMENT-FEED-PRIVACY-01 selected course dashboard projection > does not invent a passed quiz on a closed/missed attempt, or allow retries on closed quizzes

  ```
  TypeError: db.select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin(...).where(...).orderBy is not a function
  ❯ Module.listOwnLearnerAssessmentRows src/modules/courses/learner-assessment-flat-query.ts:47:5
  45|     eq(assignmentSubmissions.membershipId,membershipId)))
  46|    .where(and(...baseConditions,eq(courseAssignments.status,"PUBLISHED…
  47|    .orderBy(sql`coalesce(${courseAssignments.dueAt},'infinity'::timest…
  |     ^
  48|      courseAssignments.title,courseAssignments.id)
  49|    .limit(pageSize).offset(offset),
  ```

## tests/unit/chat7-legacy-learner-submission-form-copy.test.ts (1 failing)
- SubmitAssignmentModal.jsx dev copy in Learner submission form > uses exact drawer and submission-method labels

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Add your work using the method below'
  - Expected
  + Received
  - Add your work using the method below
  + "use client";
  + import { Select } from "@/components/ui/select";
  +
  + import {
  ```

## tests/unit/chat7-superadmin-course-catalogue-actionable-copy.test.ts (1 failing)
- Super Admin course catalogue action and copy parity > SA-academics-people-56 does not describe an actionable Lessons directory as read-only

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Open offering to add lessons'
  - Expected
  + Received
  - Open offering to add lessons
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
