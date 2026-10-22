# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-legacy-faculty-assessments-copy.test.ts (1 failing)
- Faculty My Assignments and My Quizzes legacy headers > allAssignments uses exact Faculty legacy H1 rather than Learner All

  ```
  AssertionError: expected 'import { assignmentFilesRuntimeEnable…' to contain 'title="My Assignments"'
  - Expected
  + Received
  - title="My Assignments"
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {RetainedFacultyAssignments} from "@/components/courses/faculty-assignments-retention";
  + import { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";
  ```

## tests/unit/chat7-round3-faculty-contracts.test.ts (1 failing)
- chat-7 round 3 faculty course contracts > FAC-courses-34 keeps faculty tab navigation horizontally reachable by keyboard on small screens

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'overflow-x-auto'
  - Expected
  + Received
  - overflow-x-auto
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Tabs } from "@/components/ui/tabs";
  + import Link from "next/link";
  ```

## tests/unit/chat7-superadmin-student-progress-export-boundary.test.ts (3 failing)
- SA-academics-people-67 course-progress students export boundary > rejects ambiguous duplicate offeringId and foreign query keys before checking any membership or reading data

  ```
  AssertionError: expected 403 to be 400 // Object.is equality
  - Expected
  + Received
  - 400
  + 403
  ```
- SA-academics-people-67 course-progress students export boundary > passes only one requested offering ID with the live Super Admin scope, and escapes formula-like learner names

  ```
  AssertionError: expected 403 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 403
  ```
- SA-academics-people-67 course-progress students export boundary > keeps the student browser page from arbitrarily selecting the first duplicated URL parameter

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'typeof query.offeringId==="string"?qu…'
  - Expected
  + Received
  - typeof query.offeringId==="string"?query.offeringId:null
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {and,asc,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat9-final-LEARNER-course-detail-07.test.ts (1 failing)
- chat-9 final sprint > LEARNER-course-detail-07 preserves verified functionality and safe failure states

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'Materials ({materials.length}/20)'
  - Expected
  + Received
  - Materials ({materials.length}/20)
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Textarea } from "@/components/ui/textarea";
  +
  ```

## tests/unit/chat9-round6-settings-course-nav.test.ts (1 failing)
- TPO settings responsive navigation and course policy > TPO-settings-audit-07 offers vertical sticky grouped sections on desktop while retaining mobile wrapping and aria-current

  ```
  AssertionError: expected 'import Link from "next/link";\ntype S…' to contain 'md:float-left md:mr-6 md:w-56'
  - Expected
  + Received
  - md:float-left md:mr-6 md:w-56
  + import Link from "next/link";
  + type SettingsKey="season"|"rules"|"job-types"|"after-college"|"prep-readiness"|"blocked-dates"|"see"|"team"|"trusted"|"branding"|"notifications"|"recruiters"|"templates"|"notices"|"public-page"|"public-link";
  + /** Exactly five legacy-visible settings sections. Hidden panels and persisted
  +  * settings stay accessible by direct scoped URLs, never silently destroyed. */
  ```

## tests/unit/chat9-tpo-job-type-policy-round8.test.ts (2 failing)
- chat9 TPO job-type and drive-approval verification > TPO-settings-audit-21 requires an explicit placed decision for each new custom job type

  ```
  AssertionError: expected '"use client";\n\nimport { TpoUnifiedJ…' to contain 'countsAsPlaced===null'
  - Expected
  + Received
  - countsAsPlaced===null
  + "use client";
  +
  + import { TpoUnifiedJobTypesEditor, type EditableJobType } from "./tpo-unified-job-types-editor";
  +
  ```
- chat9 TPO job-type and drive-approval verification > TPO-settings-audit-22 preserves in-use job-type history by deactivating instead of deleting a referenced category

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' not to match /delete\(placementTpoJobTypes\)/
  - Expected:
  /delete\(placementTpoJobTypes\)/
  + Received:
  "import \"server-only\";
  import {and,eq,sql} from \"drizzle-orm\";
  import {z} from \"zod\";
  import {getDb} from \"@/db/client\";
  ```
