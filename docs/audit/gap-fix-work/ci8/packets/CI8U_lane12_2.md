# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-public-auth-role-journeys-02.test.ts (1 failing)
- chat-16 public auth and invitation page journeys > UX-campaign-unsubscribe-02 GET must never opt out without explicit POST

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'That didn\'t work. Please try again.'
  - Expected
  + Received
  - That didn't work. Please try again.
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```

## tests/unit/chat3-round9-origin-and-portal-regression.test.ts (1 failing)
- Chat-3 Round 9 restored contracts > TPO-drives-29/30/38 external employer portal uses noopener noreferrer

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain 'target="_blank" rel="noopener norefer…'
  - Expected
  + Received
  - target="_blank" rel="noopener noreferrer"
  + "use client";
  +
  + import { useId, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
