# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-super-admin-hiring-report-model-behavior.test.ts (1 failing)
- SA-HIRING-REPORT-MODEL-10 strict filters and reconciled employer totals > keeps companies with identical display names separate and caps exports at the documented row limit

  ```
  AssertionError: expected [ 'Company', 'Job', …(10) ] to deeply equal [ 'Company', 'Drive', …(10) ]
  - Expected
  + Received
  @@ -1,8 +1,8 @@
  [
  "Company",
  -   "Drive",
  +   "Job",
  ```

## tests/unit/chat13-tenant-settings-other-keys-gap40.test.ts (1 failing)
- SA-tenants-modules-40 Other stored keys > SA-tenants-modules-40 displays unknown stored keys and wrong-scope warning

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Typos create unused keys'
  - Expected
  + Received
  - Typos create unused keys
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/chat15-final-sprint-tpo-batches.test.ts (2 failing)
- chat-15 final sprint: TPO batch workflow parity and adversarial boundaries > TPO-batches-11 supports checked multiselect facets with live counts and fails closed for forged choices

  ```
  AssertionError: expected '"use client";\nimport { Disclosure } …' to contain 'type="checkbox"'
  - Expected
  + Received
  - type="checkbox"
  + "use client";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Button} from "@/components/ui/button";
  ```
- chat-15 final sprint: TPO batch workflow parity and adversarial boundaries > TPO-batches-44 sends audited bounded learner nudges and offers scoped private notes

  ```
  AssertionError: expected [ 'Register', 'Upload resume', …(4) ] to deeply equal [ 'Register for placements', …(5) ]
  - Expected
  + Received
  @@ -1,7 +1,7 @@
  [
  -   "Register for placements",
  +   "Register",
  "Upload resume",
  ```

## tests/unit/chat16-email-bridge-hardening-02.test.ts (1 failing)
- chat-16 recruiter email bridge security and resend policy > email-bridge-quote-01 never repeats private quoted thread content

  ```
  AssertionError: expected 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx…' to be null
  - Expected:
  null
  + Received:
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```

## tests/unit/chat16-mentor-editor-guard-r5.test.ts (1 failing)
- chat-16 mentor editor safeguards > MEN-projects-meetings-75 guards sprint details across edit and confirmation dialogs

  ```
  AssertionError: expected '"use client";\n\nimport { type FormEv…' to contain 'You have unsaved project changes. Lea…'
  - Expected
  + Received
  - You have unsaved project changes. Leave this page and discard them?
  + "use client";
  +
  + import { type FormEvent, useEffect, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/chat16-public-legacy-invite-handoff-16.test.ts (1 failing)
- chat-16 legacy invitation and handoff page-level journeys > UX-handoff-direct-16 ignores legacy cross-host credentials and never accepts token exchange

  ```
  AssertionError: expected [Function] to throw an error
  - Expected:
  null
  + Received:
  undefined
  ```
