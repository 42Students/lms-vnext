# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-cross-audit-recruiter-tracker-chat3.test.ts (2 failing)
- Chat-3 source cross-audit - actual UX and safety contracts > UX-tracker-audit-findings-publicId-02

  ```
  AssertionError: expected '"use client";\nimport {useRef,useStat…' to contain 'Save this finding update? An immutabl…'
  - Expected
  + Received
  - Save this finding update? An immutable audit event will be recorded.
  + "use client";
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  ```
- Chat-3 source cross-audit - actual UX and safety contracts > UX-tracker-02

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'if (pending) return;'
  - Expected
  + Received
  - if (pending) return;
  + "use client";
  +
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```
