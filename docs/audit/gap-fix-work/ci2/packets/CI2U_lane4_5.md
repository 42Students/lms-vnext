# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat11-tpo-rules-pagination-adversarial.test.ts (1 failing)
- TPO-settings-audit-RULES-PAGE-01 placement rules URL parsing > does not query rules or job policy data for an invalid query

  ```
  AssertionError: expected -1 to be greater than 3188
  ❯ tests/unit/chat11-tpo-rules-pagination-adversarial.test.ts:31:16
  29|   expect(parsed).toBeGreaterThan(0);
  30|   expect(denied).toBeGreaterThan(parsed);
  31|   expect(read).toBeGreaterThan(denied);
  |                ^
  32|   expect(version).toBeGreaterThan(read);
  33|   expect(page).toContain("Invalid placement rules filters");
  ```

## tests/unit/chat12-general-requests-validation-r60.test.ts (1 failing)
- TPO-requests-verification-01: independent request-kind validation and 0134 safety > TPO-requests-verification-01 rejects zero pay despite a syntactically numeric salary

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat12-round37-xlsx-export.test.ts (1 failing)
- TPO-students-36 creates genuine ZIP-based XLSX with sorted scoped columns, mandatory batch/branch and an italic view provenance line

  ```
  AssertionError: expected [ 'student', 'batch', 'branch', …(3) ] to deeply equal [ 'batch', 'branch', 'cgpa', …(3) ]
  - Expected
  + Received
  [
  +   "student",
  "batch",
  "branch",
  "cgpa",
  ```

## tests/unit/chat12-tpo-first-third-role-pages.test.ts (3 failing)
- UX-tpo first-third role and failure-state contracts > UX-tpo-batches-01 returns recoverable invalid-filter states rather than database queries

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
  ```
- UX-tpo first-third role and failure-state contracts > UX-tpo-announcements-01 denies an expired membership and rejects forged tab filters

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { DateInput } from "@/components/ui/date-input";
  + import { Tabs } from "@/components/ui/tabs";
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {TpoNoticeMessageCount} from "@/components/tpo/tpo-notice-message-count";
  ```
- UX-tpo first-third role and failure-state contracts > UX-tpo-companies-01 scopes the directory before lookups and recovers invalid pagination

  ```
  AssertionError: expected 'import {TpoCompaniesSpreadsheet} from…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + import {TpoCompaniesSpreadsheet} from "@/components/tpo/tpo-companies-spreadsheet";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/chat13-admin-directory-strict-url-paging.test.ts (1 failing)
- chat-13 Super Admin scoped directories refuse coerced URL paging > SA-ADMIN-DRIVE-03 rejects arrays, non-decimal encodings, whitespace and forged sizes

  ```
  AssertionError: page="01": expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat13-final-sprint-public-share-zip.test.ts (1 failing)
- PUB-auth-public-55 blocks resume ZIP until signed malware-scanned file delivery is registered

  ```
  AssertionError: expected 'import {learnerProfileDocumentSchema}…' to contain 'RESUME:null'
  - Expected
  + Received
  - RESUME:null
  + import {learnerProfileDocumentSchema} from "@/modules/people/profile-validation";
  + import {placementReportCsv} from "../report-model";
  + export const COMPANY_SHARE_COLUMNS={
  +  APPLICATION_ID:"Applicant ID",NAME:"Name",ROLL_NUMBER:"Roll number",
  ```
