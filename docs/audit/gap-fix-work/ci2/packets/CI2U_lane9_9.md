# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-tpo-home-team-asks-09.test.ts (1 failing)
- TPO-home-09 persisted team attention > TPO-home-09 computes only verified ask counts and never fabricates mentions from messages

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'type:"TEAM_MESSAGES",priority:4'
  - Expected
  + Received
  - type:"TEAM_MESSAGES",priority:4
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import {TpoHomeReturnRefresh} from "@/components/tpo/tpo-home-return-refresh";
  + import {eq} from "drizzle-orm";
  ```

## tests/unit/chat6-admin-middle-37-route-contracts.test.ts (2 failing)
- SA-admin-middle-route-01: exact second third entrypoint authorization audit > /admin/placements/hiring delegates rendering to a real authenticated context and scoped loader

  ```
  AssertionError: /admin/placements/hiring lacks authenticated context: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- SA-admin-middle-route-01: exact second third entrypoint authorization audit > SA-admin-middle-route-03 private inbound-mail never resolves to a send action

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Private incoming messages.'
  - Expected
  + Received
  - Private incoming messages.
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Tabs} from "@/components/ui/tabs";
  ```

## tests/unit/chat6-college-placements-round3-ui.test.ts (1 failing)
- College Admin drive UI and graceful failure > COL-placements-25 renders selectable action-capable mobile application and drive cards

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'caption="College placement drives"'
  - Expected
  + Received
  - caption="College placement drives"
  + import { DateInput } from "@/components/ui/date-input";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  ```

## tests/unit/chat6-friendly-fetch-adoption.test.ts (2 failing)
- Chat 6 friendly fetch adoption > GR-32 chat-6 edit forms keep draft state and show shared conflict message

  ```
  AssertionError: expected '/**\n * Shared, client-safe message c…' to contain 'This changed while you were working.'
  - Expected
  + Received
  - This changed while you were working.
  + /**
  +  * Shared, client-safe message catalog. Usage:
  +  *   friendlyApiError({ status: response.status, code: body.error, network: false })
  +  *   // Display only this text, never the provider or API code.
  ```
- Chat 6 friendly fetch adoption > GR-90 chat-6 inline fetch failures have alert semantics

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat6-superadmin-lecture-hall-role-24.test.tsx (1 failing)
- SA-middle-lecture-halls-24 platform role and selected college > scoped Super Admin gets a bounded empty room listing and selected-college loader

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4 md:spac…' to contain 'IIT Dharwad'
  - Expected
  + Received
  - IIT Dharwad
  + <div class="min-w-0 space-y-4 md:space-y-6"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page
  ```

## tests/unit/chat6-tracker-parity-round4.test.ts (2 failing)
- chat-6 tracker report and manager navigation parity > SA-placements-projects-104 supports shortcut submit, source-linked success and permission-scoped similar reports

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain '"/api/tracker/issues?"+query.toString…'
  - Expected
  + Received
  - "/api/tracker/issues?"+query.toString()
  + "use client";
  +
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```
- chat-6 tracker report and manager navigation parity > SA-placements-projects-112 exposes the legacy manager nav destinations with an accessible skip target

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'href="/tracker/issues"'
  - Expected
  + Received
  - href="/tracker/issues"
  + "use client";
  +
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  ```
