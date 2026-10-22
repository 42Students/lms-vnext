# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat12-academic-import-conflict-round7.test.ts (1 failing)
- TPO Students academic import resilience > TPO-students-33 protects an academic import preview and preserves selections on a stale-version response

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'cause instanceof FriendlyFetchError &…'
  - Expected
  + Received
  - cause instanceof FriendlyFetchError && cause.status===409
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {DataTable} from "@/components/ui/data-table";
  ```

## tests/unit/chat12-round17-verified-legacy-gaps.test.ts (3 failing)
- chat-12 independently verified legacy copy and summary > TPO-students-46 uses exact single Students header subtitle and primary import

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'description="Everyone in placements, …'
  - Expected
  + Received
  - description="Everyone in placements, from the batches you made eligible."
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  ```
- chat-12 independently verified legacy copy and summary > TPO-requests-verification-17 retains legacy Requests title/history/empty copy

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'No requests in this period.'
  - Expected
  + Received
  - No requests in this period.
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChipLink} from "@/components/ui/filter-chip";
  ```
- chat-12 independently verified legacy copy and summary > TPO-requests-verification-27 offers section-specific reason presets and custom text

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'The student sees your reason and fixe…'
  - Expected
  + Received
  - The student sees your reason and fixes it on their profile.
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/chat12-selected-students-csv-round5.test.ts (1 failing)
- chat12 selected student CSV > TPO-students-17 exports only the currently authorized visible page selection

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'anchor.download="selected-tpo-student…'
  - Expected
  + Received
  - anchor.download="selected-tpo-students.csv"
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat12-tpo-safe-export.test.ts (2 failing)
- chat-12 TPO export failure protection > GR-90 / GR-91 offers announced inline export failures and keyboard retry

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import {useRef,useState} from "react";
  ```
- chat-12 TPO export failure protection > TPO-students-36 uses the safeguarded filtered student CSV download

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain '<TpoSafeCsvDownload href={exportHref}…'
  - Expected
  + Received
  - <TpoSafeCsvDownload href={exportHref} filename="tpo-students.csv"
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  ```

## tests/unit/chat13-application-resume-preview.test.ts (1 failing)
- Super Admin verified private resume preview > SA-placements-projects-21 delegates private access to the established CLEAN-verified route

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'Resume Preview · Open securely'
  - Expected
  + Received
  - Resume Preview · Open securely
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat13-module-access-history-gap32.test.ts (2 failing)
- SA-tenants-modules-32 complete module access history > SA-tenants-modules-32 combines timeline ordering with stable and bounded cursor pagination

  ```
  AssertionError: expected 'import "server-only";\nimport {and,de…' to contain '.limit(51)'
  - Expected
  + Received
  - .limit(51)
  + import "server-only";
  + import {and,desc,eq,inArray,lt,or} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
- SA-tenants-modules-32 bulk history producer > SA-tenants-modules-32 records the actual applied student count and explicitly discloses a summary-audit failure

  ```
  AssertionError: expected 'import "server-only";\n\nimport { and…' to contain 'eventType:"MODULE_ACCESS_BULK_SET"'
  - Expected
  + Received
  - eventType:"MODULE_ACCESS_BULK_SET"
  + import "server-only";
  +
  + import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
  + import { z } from "zod";
  ```
