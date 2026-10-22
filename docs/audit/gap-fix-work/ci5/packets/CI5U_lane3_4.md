# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-calendar-reports-existing-contracts.test.ts (3 failing)
- TPO calendar and reports verified source contracts > TPO-calendar-reports-04 opens a prefilled-hour modal from the week calendar grid

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="dialog"'
  - Expected
  + Received
  - role="dialog"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- TPO calendar and reports verified source contracts > TPO-calendar-reports-12 provides Show everything while calendar filters are active

  ```
  AssertionError: expected 'import {TpoWeekHourCalendar} from "@/…' to contain 'href={basePath}'
  - Expected
  + Received
  - href={basePath}
  + import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  + import Link from "next/link";
  +
  ```
- TPO calendar and reports verified source contracts > TPO-calendar-reports-47 calculates and labels answered-offer acceptance rate per company

  ```
  AssertionError: expected 'import {tpoReportHasAmbiguousFilters}…' to contain 'accepted / (accepted + declined)'
  - Expected
  + Received
  - accepted / (accepted + declined)
  + import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
  + import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
  + import {ReportBarChart} from "@/components/placements/report-bar-chart";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```

## tests/unit/chat9-phase2-college-shortlisted.test.ts (1 failing)
- college shortlisted route > forces submitted+shortlisted through the authorized college applicant read

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'hasMembershipRole(context,"COLLEGE_AD…'
  - Expected
  + Received
  - hasMembershipRole(context,"COLLEGE_ADMIN")
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat9-super-admin-unselected-college-copy.test.ts (1 failing)
- Super Admin exact dev-legacy unselected-college copy > departments exact copy

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' to contain 'Choose a college in the header above …'
  - Expected
  + Received
  - Choose a college in the header above to see its departments.
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { DepartmentCreateForm } from "@/components/admin/department-create-form";
  + import { DepartmentDirectory } from "@/components/admin/department-directory";
  ```

## tests/unit/college-contacts-empty-recovery.test.ts (1 failing)
- College Contacts filtered-empty recovery > clears filters while keeping the selected contact category

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'No matching contacts in this college.'
  - Expected
  + Received
  - No matching contacts in this college.
  + import { DateInput } from "@/components/ui/date-input";
  + import { Input } from "@/components/ui/input";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/college-student-csv-model.test.ts (1 failing)
- College student CSV import model > rejects junk after a closing quote rather than silently changing learner identity

  ```
  AssertionError: expected [ Array(1) ] to include 'INVALID_CSV_FORMAT'
  ❯ tests/unit/college-student-csv-model.test.ts:37:57
  35|   it("rejects junk after a closing quote rather than silently changing…
  36|     const malformed = header + "\n" + `"Alice"junk,+919876543210,,${pr…
  37|     expect(parseStudentCsv(malformed).structuralErrors).toContain("INV…
  |                                                         ^
  38|     expect(parseStudentCsv(header+"\n"+`"Alice" ,+919876543210,,${prog…
  39|       .toContain("INVALID_CSV_FORMAT");
  ```

## tests/unit/faculty-profile-skills-section.test.ts (1 failing)
- Faculty self-profile skills lifecycle > rejects duplicate record IDs and empty skill titles

  ```
  AssertionError: expected [Function] to throw an error
  ❯ tests/unit/faculty-profile-skills-section.test.ts:20:137
  18|   const skill={id,skill:"Java",proficiency:""};
  19|   expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{…
  20|   expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{…
  |                                                                                                                                         ^
  21|  });
  22| });
  ```

## tests/unit/inbound-mail-message-model.test.ts (1 failing)
- inbound mail search > rejects unknown filters and unbounded pages

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/learner-jobs-browse-model.test.ts (3 failing)
- Learner job browsing filters > never includes a closed role in eligible-only even if its historic canApply flag is true

  ```
  AssertionError: expected [ 'a', 'b' ] to deeply equal [ 'b' ]
  - Expected
  + Received
  [
  +   "a",
  "b",
  ]
  ```
- Learner job browsing filters > counts employment type using only authorized role options

  ```
  AssertionError: expected undefined to be 2 // Object.is equality
  - Expected:
  2
  + Received:
  undefined
  ```
- Learner job browsing filters > derives facets from real job rows

  ```
  AssertionError: expected { types: [ 'Full-time', …(1) ], …(1) } to deeply equal { types: [ 'FULL_TIME', …(1) ], …(1) }
  - Expected
  + Received
  @@ -3,9 +3,9 @@
  "Bengaluru",
  "Chennai",
  "Hyderabad",
  ],
  ```
