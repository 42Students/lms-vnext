# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-faculty-bulk-stale-file-guard.test.ts (1 failing)
- SA-FACULTY-CSV-17 prevent stale bulk onboarding after replacement file > guards against invalid replacement files, out-of-order File.text and double confirm

  ```
  AssertionError: expected '"use client";\nimport { useRef, useSt…' to contain 'body:JSON.stringify({collegeId,csv:in…'
  - Expected
  + Received
  - body:JSON.stringify({collegeId,csv:inputCsv,confirmed:true})
  + "use client";
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  + import { parseFacultyBulkCsv } from "@/modules/people/faculty-bulk-import-model";
  ```

## tests/unit/chat2-final-sprint-conversations-b.test.ts (1 failing)
- Final sprint recruiter conversation parity — group B > REC-calendar-messages-profile-11 exposes in-place general conversation with history and reply

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain 'Open general conversation'
  - Expected
  + Received
  - Open general conversation
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```
