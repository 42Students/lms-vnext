# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-auth-logout-revocation.test.ts (3 failing)
- AUTH-sessions-05 logout is truthful and clears shared-device credentials > only reports success after the server token is revoked

  ```
  AssertionError: expected { ok: true, …(2) } to deeply equal { ok: true }
  - Expected
  + Received
  {
  +   "message": "Logged out",
  "ok": true,
  +   "reloginRequired": true,
  }
  ```
- AUTH-sessions-05 logout is truthful and clears shared-device credentials > AUTH-sessions-05 DB outage reports 503, never ok:true; still expires this device's cookies

  ```
  AssertionError: expected { ok: false, …(4) } to deeply equal { ok: false, …(1) }
  - Expected
  + Received
  {
  "error": "LOGOUT_REVOKE_FAILED",
  +   "message": "Could not complete sign-out. Please retry.",
  "ok": false,
  +   "reloginRequired": true,
  ```
- AUTH-sessions-05 logout is truthful and clears shared-device credentials > no prior token is an idempotent logout and never mutates device sessions

  ```
  AssertionError: expected { ok: true, …(2) } to deeply equal { ok: true }
  - Expected
  + Received
  {
  +   "message": "Logged out",
  "ok": true,
  +   "reloginRequired": true,
  }
  ```

## tests/unit/chat6-superadmin-people-verified-closure.test.ts (3 failing)
- chat-6 selected-college People gap verification > SA-academics-people-78 uses the legacy exact no-college title and contextual noun

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'Choose a college in the header above …'
  - Expected
  + Received
  - Choose a college in the header above to see its
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```
- chat-6 selected-college People gap verification > SA-academics-people-82 validates the 500-row faculty sample and preserves row result feedback

  ```
  AssertionError: expected 'import { z } from "zod";\nimport { pa…' to contain 'result.length > 500'
  - Expected
  + Received
  - result.length > 500
  + import { z } from "zod";
  + import { parseTpoImportCsvRecords } from "@/modules/placements/tpo-import-csv-parser";
  +
  + /** A legacy LECTURER remains a FACULTY. An explicit MENTOR also gains MENTOR
  ```
- chat-6 selected-college People gap verification > SA-academics-people-87 NOT-A-GAP prohibits impersonation per OD-23

  ```
  AssertionError: expected 'import {getCurrentRequestContext} fro…' not to contain 'Impersonate'
  - Expected
  + Received
  - Impersonate
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  ```

## tests/unit/chat7-superadmin-course-catalogue-touch-pagination.test.ts (1 failing)
- SA-COURSES-TOUCH-13 Super Admin course catalogue mobile filters and safe pagination > renders accessible 44px Super Admin filters and all touch/keyboard course actions

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'Previous'
  - Expected
  + Received
  - Previous
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Alert } from "@/components/ui/alert";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat9-round6-project-risk-audit.test.ts (1 failing)
- College Projects risk and activity acceptance > COL-projects-18 enables admin resource change/search without overriding mentor Activity feed

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'resourceAudit={mode==="ADMIN"}'
  - Expected
  + Received
  - resourceAudit={mode==="ADMIN"}
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
