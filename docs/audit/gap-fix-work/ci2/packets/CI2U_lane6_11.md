# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-unknown-report-recovery.test.ts (1 failing)
- TPO report unknown-route recovery > TPO-calendar-reports-53 shows Unknown report and return to reports only for authorized TPO members

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Back to reports'
  - Expected
  + Received
  - Back to reports
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/college-drive-interviews-model.test.ts (1 failing)
- College drive interview filters > rejects forged college, invalid round status, and duplicate query params

  ```
  AssertionError: expected { kind: 'ALL', status: 'ALL', …(6) } to deeply equal { kind: 'ALL', status: 'ALL', page: 1 }
  - Expected
  + Received
  {
  +   "appointmentPage": 1,
  +   "appointmentPageSize": 20,
  +   "appointmentSort": "DATE_ASC",
  +   "candidatePage": 1,
  ```

## tests/unit/company-share-mobile-cards.test.ts (2 failing)
- renders equivalent three-field mobile cards and desktop tables

  ```
  AssertionError: expected 'import authStyles from "@/components/…' to contain 'cell: row=>row.cells[key]??"Not recor…'
  - Expected
  + Received
  - cell: row=>row.cells[key]??"Not recorded"
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```
- discloses only the selected fields on either viewport

  ```
  AssertionError: expected [ 'APPLICATION_ID', 'NAME', …(2) ] to deeply equal [ 'NAME', 'ROLL_NUMBER', 'STAGE' ]
  - Expected
  + Received
  [
  +   "APPLICATION_ID",
  "NAME",
  "ROLL_NUMBER",
  "STAGE",
  ```

## tests/unit/faculty-report-pdf.test.ts (3 failing)
- Faculty PDF reports > keeps a section heading with its first row across a page boundary

  ```
  AssertionError: expected '0.039 0.486 0.533 rg 0 834 595 8 re f…' to contain '(LEARNER RESULTS)'
  - Expected
  + Received
  - (LEARNER RESULTS)
  + 0.039 0.486 0.533 rg 0 834 595 8 re f
  + 0.039 0.486 0.533 rg BT /F2 12 Tf 42 794 Td (FACULTY ASSIGNMENT REPORT) Tj ET
  + 0.851 0.890 0.925 RG 0.6 w 42 776 m 553 776 l S
  + 0.949 0.974 0.979 rg 42 704 164.33333333333334 50 re f
  ```
- Faculty PDF reports > normalizes non-ASCII text to PDF-safe printable content

  ```
  AssertionError: expected '%PDF-1.4\n1 0 obj\n<< /Type /Catalog …' to contain '(Ecole ? Report)'
  - Expected
  + Received
  - (Ecole ? Report)
  + %PDF-1.4
  + 1 0 obj
  + << /Type /Catalog /Pages 2 0 R >>
  + endobj
  ```
- Faculty monthly Attendance PDF > exports the current Section's marked and unknown outcomes as a valid PDF

  ```
  AssertionError: expected '%PDF-1.4\n1 0 obj\n<< /Type /Catalog …' to contain 'Unmarked: 3 excluded from percentage'
  - Expected
  + Received
  - Unmarked: 3 excluded from percentage
  + %PDF-1.4
  + 1 0 obj
  + << /Type /Catalog /Pages 2 0 R >>
  + endobj
  ```

## tests/unit/hr-team-pagination-model.test.ts (1 failing)
- HR exact-company team roster pagination > shows only the requested 25 of an already-authorized and searched set

  ```
  AssertionError: expected [ { id: 'r50' }, { id: 'r51' } ] to deeply equal []
  - Expected
  + Received
  - []
  + [
  +   {
  +     "id": "r50",
  +   },
  ```

## tests/unit/learner-course-tab-route-model.test.ts (1 failing)
- learner course tab routes > rejects nested, unknown, and empty tab paths

  ```
  AssertionError: expected 'home' to be null
  - Expected:
  null
  + Received:
  "home"
  ```
