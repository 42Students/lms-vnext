# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-batch-promotion-model.test.ts (1 failing)
- College Admin batch promotion preview policy > accepts only bounded query fields and valid academic year overrides

  ```
  ZodError: [
  {
  "expected": "number",
  "code": "invalid_type",
  "received": "NaN",
  "path": [
  "yearStart"
  ],
  ```

## tests/unit/college-program-mutation-model.test.ts (1 failing)
- College Admin program write contracts > confirms before discarding dirty inputs, even invalid drafts

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/faculty-learner-attendance-detail.test.ts (2 failing)
- Faculty attendance learner detail (read-only) > uses persisted absence evidence on historic sessions without a session marker

  ```
  AssertionError: expected { …(7) } to match object { absent: 1, marked: 1, …(1) }
  (4 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "absent": 1,
  -   "attendedPercent": 0,
  +   "absent": 0,
  ```
- Faculty monthly class-health report > excludes unmarked, future and out-of-roster historical marks

  ```
  AssertionError: expected { learnerCount: 2, …(11) } to match object { learnerCount: 2, …(10) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  @@ -3,11 +3,11 @@
  "averagePercent": 50,
  "learnerCount": 2,
  "markedMarks": 2,
  ```

## tests/unit/graceful-logs-ui-contract.test.ts (2 failing)
- known error triage UI resilience > GR-123 preserves legacy Known errors empty and mute confirmation wording

  ```
  AssertionError: expected '"use client";\nimport { EmptyState } …' to contain 'No tracked errors yet'
  - Expected
  + Received
  - No tracked errors yet
  + "use client";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { Dialog } from "@/components/ui/dialog";
  ```
- known error triage UI resilience > GR-124 does not imply Cloud Logging backup is active when unconfigured

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Cloud Logging backup is not configure…'
  - Expected
  + Received
  - Cloud Logging backup is not configured.
  + import Link from "next/link";
  + import type { Metadata } from "next";
  + import { Tabs } from "@/components/ui/tabs";
  +
  ```

## tests/unit/learner-career-calendar-url-model.test.ts (1 failing)
- learner calendar URL date/view/event filters > rejects impossible dates, duplicates and untrusted scope selectors

  ```
  AssertionError: expected { date: '2026-10-14', …(2) } to deeply equal { date: '2026-10-14', …(2) }
  - Expected
  + Received
  {
  "date": "2026-10-14",
  "kind": "ALL",
  -   "view": "agenda",
  +   "view": "month",
  ```

## tests/unit/learner-notice-sender-provenance.test.ts (1 failing)
- distinguishes persisted publisher and audience without inventing a TPO source

  ```
  AssertionError: expected { id: 'a', …(12) } to match object { senderLabel: 'Placement cell', …(1) }
  (11 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "audienceLabel": "College",
  +   "audienceLabel": null,
  "senderLabel": "Placement cell",
  ```
