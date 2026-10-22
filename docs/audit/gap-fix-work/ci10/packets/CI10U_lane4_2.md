# CI unit-test packet (round 10)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-tpo-profile-avatar-verification.test.ts (1 failing)
- TPO profile photo: legacy square avatar with accessible editing > provides keyboard-accessible 44px editing and image-link controls

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'min-h-11 items-center text-left'
  - Expected
  + Received
  - min-h-11 items-center text-left
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```
