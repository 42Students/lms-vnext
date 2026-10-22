# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-batches-chat5-round3.test.ts (9 failing)
- TPO batches chat-5 verified source and behavior > TPO-batches-01: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Ineligible'
  - Expected
  + Received
  - Ineligible
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-02: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Verified profiles'
  - Expected
  + Received
  - Verified profiles
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-04: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Open for placements'
  - Expected
  + Received
  - Open for placements
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-05: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Last batch decision'
  - Expected
  + Received
  - Last batch decision
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-06: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'not in any active class'
  - Expected
  + Received
  - not in any active class
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-29: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-current={tab.slug === active ? "…'
  - Expected
  + Received
  - aria-current={tab.slug === active ? "page" : undefined}
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  +
  + const primary = [
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-30: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'students !== undefined ? ` (${student…'
  - Expected
  + Received
  - students !== undefined ? ` (${students})` : ""
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  +
  + const primary = [
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-34: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'Roll number:'
  - Expected
  + Received
  - Roll number:
  + import {Button} from "@/components/ui/button";
  + import {Disclosure} from "@/components/ui/disclosure";
  + import {Badge} from "@/components/ui/badge";
  + import {DataTable} from "@/components/ui/data-table";
  ```
- TPO batches chat-5 verified source and behavior > TPO-batches-48: verifies persisted batch workflow contract

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '!finished&&!s.ambiguous'
  - Expected
  + Received
  - !finished&&!s.ambiguous
  + import {Button} from "@/components/ui/button";
  + import {Disclosure} from "@/components/ui/disclosure";
  + import {Badge} from "@/components/ui/badge";
  + import {DataTable} from "@/components/ui/data-table";
  ```

## tests/unit/tpo-drive-workspace-s1-gap-closure.test.ts (2 failing)
- TPO drive workspace verified S1 gaps > TPO-drive-workspace-60 validates scoped two-way field changes and decision acknowledgements

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- TPO drive workspace verified S1 gaps > TPO-drive-workspace-62 displays source-backed deal category and company compensation without guessing dates

  ```
  AssertionError: expected 'Open' to be 'Published' // Object.is equality
  Expected: "Published"
  Received: "Open"
  ```

## tests/unit/tpo-recruiter-invite-policy.test.ts (1 failing)
- W05 recruiter invite token and privacy policy > expires at exactly day 7, fails closed for future-issued or invalid-date token

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/tpo-utility-model.test.ts (5 failing)
- TPO profile role formatting > preserves the TPO acronym

  ```
  AssertionError: expected 'Placement officer' to be 'TPO' // Object.is equality
  Expected: "TPO"
  Received: "Placement officer"
  ```
- TPO profile role formatting > formats other stored membership roles

  ```
  AssertionError: expected 'Placement team' to be 'Faculty' // Object.is equality
  Expected: "Faculty"
  Received: "Placement team"
  ```
- TPO More navigation > contains the required utility destinations

  ```
  AssertionError: expected [ '/tpo/batches', …(10) ] to deeply equal [ '/tpo/students', …(7) ]
  - Expected
  + Received
  [
  -   "/tpo/students",
  +   "/tpo/batches",
  "/tpo/requests",
  "/tpo/calendar",
  ```
- TPO More navigation > uses the working companies view rather than a name-dependent redirect

  ```
  AssertionError: expected undefined to be '/tpo/recruiters?view=companies' // Object.is equality
  - Expected:
  "/tpo/recruiters?view=companies"
  + Received:
  undefined
  ```
- TPO More navigation > does not link unimplemented utilities

  ```
  AssertionError: expected [ '/tpo/batches', …(10) ] to not include '/tpo/messages'
  ❯ tests/unit/tpo-utility-model.test.ts:111:32
  109|       "/tpo/settings",
  110|     ]) {
  111|       expect(destinations).not.toContain(
  |                                ^
  112|         unavailable,
  113|       );
  ```

## tests/unit/ux-chat14-mentor-01.test.ts (1 failing)
- chat-14 mentor UX rollout batch 01 > UX-mentor-mentor-01 preserves route layout, wording, and touch/scroll source contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 max-w-full'
  - Expected
  + Received
  - min-w-0 max-w-full
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
  ```
