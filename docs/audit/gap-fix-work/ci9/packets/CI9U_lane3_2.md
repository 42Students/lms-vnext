# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat12-verification-reasons-round3.test.ts (1 failing)
- chat-12 Verification legacy send-back reason selector > TPO-requests-verification-27 permits a custom-only reason but prevents an empty send-back

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain '?"Send "+(row.section==="EDUCATION"?"…'
  - Expected
  + Received
  - ?"Send "+(row.section==="EDUCATION"?"Education":"Identity")+" back"
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```
