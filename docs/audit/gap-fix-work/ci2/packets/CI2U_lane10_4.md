# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-tpo-announcements-04.test.ts (1 failing)
- UX-tpo-announcements-04 > reuses audited form controls and preserves existing URL/submit behavior

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain '<input type="hidden" name="audience"'
  - Expected
  + Received
  - <input type="hidden" name="audience"
  + import { DateInput } from "@/components/ui/date-input";
  + import { Tabs } from "@/components/ui/tabs";
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {TpoNoticeMessageCount} from "@/components/tpo/tpo-notice-message-count";
  ```

## tests/unit/UX-tpo-companies-01.test.ts (1 failing)
- UX-tpo-companies-01 /tpo/companies > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {TpoCompaniesSpreadsheet} from…' not to contain 'text-on-primary'
  - Expected
  + Received
  - text-on-primary
  + import {TpoCompaniesSpreadsheet} from "@/components/tpo/tpo-companies-spreadsheet";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/UX-tpo-messages-05.test.ts (1 failing)
- UX-tpo-messages-05 > renders one accessible responsive inbox, preserving all status and link facts

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

## tests/unit/admin-program-directory.test.ts (4 failing)
- W06 admin Programs directory > matches legacy years while preserving exactly two terms per year

  ```
  AssertionError: expected '4 years' to be '4 years (8 terms)' // Object.is equality
  Expected: "4 years (8 terms)"
  Received: "4 years"
  ```
- W06 admin Programs directory > paginates with safe bounds

  ```
  AssertionError: expected [ { id: '0', …(5) }, …(23) ] to have a length of 10 but got 24
  - Expected
  + Received
  - 10
  + 24
  ```
- W06 admin Programs directory > exports only filtered programs and quotes untrusted cells

  ```
  AssertionError: expected '"id","name","durationYears","departme…' to contain '"Duration Terms"'
  - Expected
  + Received
  - "Duration Terms"
  + "id","name","durationYears","departmentId","semesters","batches","classes"
  + "BTECH","B.Tech ""Computer"", Engineering","4","department-1","","",""
  +
  ```
- W06 admin Programs directory > neutralizes formulas in imported department/program/code labels

  ```
  AssertionError: expected '"id","name","durationYears","departme…' to contain '"\'-BAD"'
  - Expected
  + Received
  - "'-BAD"
  + "id","name","durationYears","departmentId","semesters","batches","classes"
  + "'+SUM(1,1)","'  =CMD()","4","department-1","","",""
  +
  ```

## tests/unit/chat11-final-LEARNER-profile-misc-18.test.ts (1 failing)
- Learner profile academic and access record > LEARNER-profile-misc-18 makes academic enrollment and real recorded actions accessible to the active learner only

  ```
  AssertionError: expected 'import "server-only";\nimport {and,de…' to contain 'eq(activityEvents.organizationId,memb…'
  - Expected
  + Received
  - eq(activityEvents.organizationId,member.organizationId)
  + import "server-only";
  + import {and,desc,eq,inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships,placementApplications,placementJobs,placementCompanyRelationships,placementCompanies} from "@/db/schema";
  ```

## tests/unit/chat11-super-admin-student-progress-revocation.test.ts (2 failing)
- SA-tenants-modules-COURSE-STUDENTS-10 private learner names survive revocation > reconstructs persisted Super Admin system role and locks active college after slow roster queries

  ```
  AssertionError: expected -1 to be greater than 10437
  ❯ tests/unit/chat11-super-admin-student-progress-revocation.test.ts:21:20
  19|   expect(sqlRead).toBeGreaterThan(-1);
  20|   expect(checked).toBeGreaterThan(sqlRead);
  21|   expect(response).toBeGreaterThan(checked);
  |                    ^
  22|   expect(source).toContain("if(!college||college.status!==\"ACTIVE\")"…
  23|   expect(source).toContain('if(!isSuperAdmin(live))throw new Authoriza…
  ```
- SA-tenants-modules-COURSE-STUDENTS-10 private learner names survive revocation > authenticates student CSV first, parses exactly one offering and returns no-store private output

  ```
  AssertionError: expected 902 to be less than -1
  ❯ tests/unit/chat11-super-admin-student-progress-revocation.test.ts:35:19
  33|   expect(role).toBeGreaterThan(-1);
  34|   expect(role).toBeLessThan(filters);
  35|   expect(filters).toBeLessThan(reader);
  |                   ^
  36|   expect(source).toContain('const keys=[...search.keys()]');
  37|   expect(source).toContain("parseSuperAdminStudentProgressParams(");
  ```
