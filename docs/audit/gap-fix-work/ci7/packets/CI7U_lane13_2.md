# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat19-college-cross-audit.test.ts (1 failing)
- chat-19 college UX cross-audit > COL-XA-09 keeps workspaces visible when optional template labels fail

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ { …(2) }, 'college-a', …(1) ]
  Received:
  1st vi.fn() call:
  @@ -7,11 +7,12 @@
  "id": "actor",
  "platformStatus": "ACTIVE",
  },
  },
  ```

## tests/unit/chat2-tpo-settings-team-trusted-page-behavior.test.ts (1 failing)
- UX-tpo-LAST-THIRD-01 settings people page server states > UX-tpo-LAST-THIRD-01 team page does not invent coordinator counts from unavailable tables

  ```
  ReferenceError: readTpoUnownedWork is not defined
  ❯ Module.TpoPlacementTeamPage src/app/(authenticated)/tpo/settings/team/page.tsx:63:17
  61|
  62|   const { members, summary, sources } = data;
  63|   const unowned=await readTpoUnownedWork(context).catch(()=>({ready:fa…
  |                 ^
  64|   const workload=await readTpoTeamAskWorkload(context).catch(()=>({rea…
  65|   const workloadByMember=new Map(workload.items.map(item=>[item.member…
  ```

## tests/unit/chat4-final-fac-courses-28.test.ts (1 failing)
- FAC-courses-28 roster parity with secure image fallback > FAC-courses-28 makes a keyboard-operable, namespaced avatar preview and always-visible result count

  ```
  AssertionError: expected '"use client";\n\nimport { useMemo, us…' to contain 'focus-visible:outline-2'
  - Expected
  + Received
  - focus-visible:outline-2
  + "use client";
  +
  + import { useMemo, useState } from "react";
  + import Link from "next/link";
  ```

## tests/unit/chat5-tpo-closure-ux-boundary.test.ts (1 failing)
- chat-5 TPO drive closure and correction journeys > UX-PLACEMENTS-JOINING-23 retains correction evidence and confirmation while preventing duplicate updates

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain '<InlineNotice tone="error" message={e…'
  - Expected
  + Received
  - <InlineNotice tone="error" message={error}/>
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```
