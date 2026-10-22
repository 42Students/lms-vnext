# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat14-final-pub-auth-public-29.test.ts (1 failing)
- chat-14 final sprint > PUB-auth-public-29 shows global 403 and portal-denial notices without changing shell

  ```
  AssertionError: expected 'import {Suspense} from "react";\nimpo…' to contain '<PortalAccessNotice/>'
  - Expected
  + Received
  - <PortalAccessNotice/>
  + import {Suspense} from "react";
  + import {PortalAccessNotice} from "@/components/auth/portal-access-notice";
  + import {ConnectionFailureNotice} from "@/components/auth/connection-failure-notice";
  + import { redirect } from "next/navigation";
  ```

## tests/unit/chat2-public-placements-heading-parity.test.ts (1 failing)
- TPO public college placements legacy framing > TPO-campaigns-public-36 renders only the college's actual name, not an invented Placements at prefix

  ```
  AssertionError: expected 'import { headers } from "next/headers…' to contain '{college?.collegeName??"College place…'
  - Expected
  + Received
  - {college?.collegeName??"College placements"}
  + import { headers } from "next/headers";
  + import {notFound} from "next/navigation";
  + import { PublicRecruitFromUs } from "@/components/placements/public-recruit-from-us";
  + import { resolveRequestTenant } from "@/modules/auth/request-tenant";
  ```
