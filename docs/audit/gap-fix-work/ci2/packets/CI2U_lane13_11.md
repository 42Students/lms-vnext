# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-admin-read-first-boundaries.test.ts (1 failing)
- College Admin read-first page boundaries > shared view components explicitly distinguish real empty pages from load failures

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to match /\.items\.length === 0/
  - Expected:
  /\.items\.length === 0/
  + Received:
  "import { Input } from \"@/components/ui/input\";
  import { Select } from \"@/components/ui/select\";
  import { Button } from \"@/components/ui/button\";
  import Link from \"next/link\";
  ```

## tests/unit/college-mapping-model.test.ts (1 failing)
- College Admin semester offering and faculty assignment models > validates teaching lifecycle filters and rejects unrecognised fields

  ```
  AssertionError: expected { role: 'ALL', q: '', …(2) } to deeply equal { q: '', status: 'ACTIVE', …(2) }
  - Expected
  + Received
  {
  "page": 1,
  "q": "",
  "role": "ALL",
  -   "status": "ACTIVE",
  ```

## tests/unit/faculty-courses-chat7-batched-list.test.ts (1 failing)
- faculty course cards use bounded scoped summaries > FAC-courses-09 uses fixed batched queries not one full workspace load per card

  ```
  AssertionError: expected 'import "server-only";\n\nimport { and…' to contain 'if (!assigned.length) return result'
  - Expected
  + Received
  - if (!assigned.length) return result
  + import "server-only";
  +
  + import { and, asc, eq, inArray, ne } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  ```

## tests/unit/graceful-alert-scheduler.test.ts (1 failing)
- scheduled Telegram alerts > GR-118 GR-119 GR-125 isolates failed optional checks without stopping later digest work

  ```
  AssertionError: expected 'import { cloudLoggingAccessToken, isC…' to contain 'withScheduledLease("telegram-digest"'
  - Expected
  + Received
  - withScheduledLease("telegram-digest"
  + import { cloudLoggingAccessToken, isCloudLogNamespace, isCloudLogProject, readCloudLogErrorPage } from "./cloud-log-reader";
  + import { reportErrorForAlert } from "./reporter";
  + import { reopenRegressedSignature } from "./policy";
  + import { randomUUID } from "node:crypto";
  ```

## tests/unit/learner-applications-browse-parity.test.ts (1 failing)
- Learner Applications list and detail route > supports shareable filters and an application-id detail drawer

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'item.applicationId === url.applicatio…'
  - Expected
  + Received
  - item.applicationId === url.applicationId
  + "use client";
  +
  + import Link from "next/link";
  + import { useCallback, useEffect, useRef, useState } from "react";
  ```

## tests/unit/learner-jobs-browse-parity.test.ts (1 failing)
- Learner Drives browse integration > preserves URL search/back navigation and does not mutate applications on filter

  ```
  AssertionError: expected '"use client";\n\nimport { useCallback…' to contain 'filterLearnerPlacementJobs(matchingIt…'
  - Expected
  + Received
  - filterLearnerPlacementJobs(matchingItems, filters, Date.parse(snapshotNowIso))
  + "use client";
  +
  + import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
