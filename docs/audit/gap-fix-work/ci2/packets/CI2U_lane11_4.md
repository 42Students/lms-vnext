# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-tpo-announcements-05.test.ts (1 failing)
- UX-tpo-announcements-05 > keeps announcement links in the app tab without changing safe HTTPS CTA gating

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' not to contain 'target="_blank"'
  - Expected
  + Received
  - target="_blank"
  + import { DateInput } from "@/components/ui/date-input";
  + import { Tabs } from "@/components/ui/tabs";
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {TpoNoticeMessageCount} from "@/components/tpo/tpo-notice-message-count";
  ```

## tests/unit/UX-tpo-companies-05.test.ts (1 failing)
- UX-tpo-companies-05 > renders one responsive company directory with actions and every persisted statistic

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

## tests/unit/UX-tpo-messages-threadid-01.test.ts (1 failing)
- UX-tpo-messages-threadid-01 /tpo/messages/[threadId] > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import Link from \"next/link\";
  import {PageHeader} from \"@/components/ui/page-header\";
  import {TpoLiveRefresh} from \"@/components/tpo/tpo-live-refresh\";
  import {PageBackLink} from \"@/components/ui/page-back-link\";
  ```

## tests/unit/admin-tenant-lifecycle-model.test.ts (1 failing)
- Super Admin tenant lifecycle reads > preserves Active default and lifecycle filters through clamped paging

  ```
  AssertionError: expected { total: 21, totalPages: 1, …(2) } to deeply equal { total: 21, totalPages: 2, …(2) }
  - Expected
  + Received
  {
  -   "offset": 20,
  -   "page": 2,
  +   "offset": 0,
  +   "page": 1,
  ```

## tests/unit/chat11-final-SA-tenants-modules-R01.test.ts (1 failing)
- Super Admin control-page overview final sprint > SA-tenants-modules-R01 restores all three header-card contracts with truthful bounded counters

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'Colleges in scope'
  - Expected
  + Received
  - Colleges in scope
  + import {Button} from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/chat11-super-admin-tenant-lifecycle-races.test.ts (1 failing)
- SA-tenants-modules-LIFECYCLE-11 cross-tenant and concurrent lifecycle guards > serializes archived-parent change with active-child existence before activity

  ```
  AssertionError: expected -1 to be greater than 879
  ❯ tests/unit/chat11-super-admin-tenant-lifecycle-races.test.ts:44:22
  42|   expect(role).toBeGreaterThan(tx);
  43|   expect(parentLock).toBeGreaterThan(role);
  44|   expect(childCheck).toBeGreaterThan(parentLock);
  |                      ^
  45|   expect(update).toBeGreaterThan(childCheck);
  46|   expect(event).toBeGreaterThan(update);
  ```
