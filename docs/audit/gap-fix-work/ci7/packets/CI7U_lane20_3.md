# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-superadmin-middle-inbound-mail-26.test.tsx (3 failing)
- SA-middle-inbound-mail-26 private inbox role and partial states > does not query inbox data on duplicate selector keys or impossible pages

  ```
  Error: [vitest] No "INBOUND_ROUTING_METADATA_READY" export is defined on the "@/modules/inbound-mail/admin-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/inbound-mail/admin-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- SA-middle-inbound-mail-26 private inbox role and partial states > distinguishes a missing deployment from a genuinely empty inbox

  ```
  Error: [vitest] No "INBOUND_ROUTING_METADATA_READY" export is defined on the "@/modules/inbound-mail/admin-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/inbound-mail/admin-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- SA-middle-inbound-mail-26 private inbox role and partial states > passes only schema-validated tenant actor and normalized inbox pagination

  ```
  Error: [vitest] No "INBOUND_ROUTING_METADATA_READY" export is defined on the "@/modules/inbound-mail/admin-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/inbound-mail/admin-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/chat7-round2-mentor-04.test.ts (2 failing)
- chat-7 mentor meetings and release contracts > MEN-projects-meetings-26 bounded historic meetings with reveal control

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Past meetings / Meeting history'
  - Expected
  + Received
  - Past meetings / Meeting history
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {useEffect,useState} from "react";
  +
  ```
- chat-7 mentor meetings and release contracts > MEN-projects-meetings-34 release-first sprint scheduling and definition of done

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'Ships in release'
  - Expected
  + Received
  - Ships in release
  + "use client";
  +
  + import { useState } from "react";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat9-phase2-college-shortlisted.test.ts (1 failing)
- college shortlisted route > forces submitted+shortlisted through the authorized college applicant read

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'status:"SUBMITTED"'
  - Expected
  + Received
  - status:"SUBMITTED"
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/college-section-mutation-model.test.ts (1 failing)
- College Admin class mutation model > requires explicit edit confirmation and rejects parent reassignment

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
