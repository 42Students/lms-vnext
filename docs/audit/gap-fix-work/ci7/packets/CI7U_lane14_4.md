# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/hr-drive-draft-model.test.ts (1 failing)
- HR recruiter Request Drive draft preview > checks complete fixed/variable annual CTC against both endpoints of the advertised range

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/learner-placements-round2-source-contracts.test.ts (2 failing)
- Chat-7 learner placement verified-closure source contracts > LEARNER-placements-14 source behavior or reviewed disposition

  ```
  AssertionError: expected '"use client";\n\nimport { useCallback…' to contain 'Eligible only'
  - Expected
  + Received
  - Eligible only
  + "use client";
  +
  + import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
- Chat-7 learner placement verified-closure source contracts > LEARNER-placements-36 source behavior or reviewed disposition

  ```
  AssertionError: expected '"use client";\nimport { DateInput } f…' to contain 'Reason (3–900 characters)'
  - Expected
  + Received
  - Reason (3–900 characters)
  + "use client";
  + import { DateInput } from "@/components/ui/date-input";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts (1 failing)
- chat-14 recruiter ownership and private review gap closure > REC-home-drives-46 keeps inline legacy round controls and counts stage decisions

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Change / Remove:'
  - Expected
  + Received
  - Change / Remove:
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/tpo-drive-next-step-model.test.ts (2 failing)
- TPO-drive-workspace-02 next step > prioritizes staged results before pending requests, sharing and closing

  ```
  AssertionError: expected 'Review 4 request(s)' to be 'Review and apply 6 result(s)' // Object.is equality
  Expected: "Review and apply 6 result(s)"
  Received: "Review 4 request(s)"
  ```
- TPO-drive-workspace-02 next step > does not invent shortlist or request counts when unavailable

  ```
  AssertionError: expected 'No action needed' to be 'Applicants' // Object.is equality
  Expected: "Applicants"
  Received: "No action needed"
  ```
