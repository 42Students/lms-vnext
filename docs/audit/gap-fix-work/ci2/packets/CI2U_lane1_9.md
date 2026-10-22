# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-superadmin-college-verification-page.test.tsx (1 failing)
- SA-colleges-verification-FILTER-01 scoped queue and fail-closed paging > checks persisted Super Admin authority before any queue or college details

  ```
  AssertionError: expected [Function] to throw error including 'FORBIDDEN' but got '[vitest] No "VerificationAccessCheckE…'
  - Expected
  + Received
  - FORBIDDEN
  + [vitest] No "VerificationAccessCheckError" export is defined on the "@/modules/verification/super-admin-scope" mock. Did you forget to return it from "vi.mock"?
  + If you need to partially mock a module, you can use "importOriginal" helper inside:
  +
  ```

## tests/unit/chat5-requests-sequential-notices.test.ts (1 failing)
- Chat-5 previously authored TPO verification workflow parity > TPO-requests-verification-25 preserves ordered sequential review, next and finish with no forced decision

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Review one by one'
  - Expected
  + Received
  - Review one by one
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import {useRouter,useSearchParams} from "next/navigation";
  ```

## tests/unit/chat6-auth-memberships-private-16.test.ts (3 failing)
- AUTH-handoff-16 scoped membership cookies and no-store > GET exposes only host-college membership and refuses HTTP caching

  ```
  AssertionError: expected 500 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 500
  ```
- AUTH-handoff-16 scoped membership cookies and no-store > POST stores only the active persisted college membership with private cache headers

  ```
  AssertionError: expected 500 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 500
  ```
- AUTH-handoff-16 scoped membership cookies and no-store > AUTH-handoff-18 distinguishes temporary domain outage from invalid or revoked session

  ```
  AssertionError: expected { …(2) } to deeply equal { error: 'TENANT_LOOKUP_UNAVAILABLE' }
  - Expected
  + Received
  {
  "error": "TENANT_LOOKUP_UNAVAILABLE",
  +   "message": "Service unavailable. Try again from your college LMS address.",
  }
  ```

## tests/unit/chat6-faculty-schedule-and-tracker-evidence-round17.test.ts (1 failing)
- chat-6 source-evidence gaps > SA-placements-projects-102 mounts authenticated Alt+B report drawer with captured page/browser/viewport context

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'event.altKey&&!event.repeat&&event.ke…'
  - Expected
  + Received
  - event.altKey&&!event.repeat&&event.key.toLowerCase()==="b"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {useEffect,useState} from "react";
  ```

## tests/unit/chat6-super-admin-session-service-races.test.ts (2 failing)
- AUTH-sessions-09 transactional admin revoke adversarial contracts > AUTH-sessions-09 zero-row retry is idempotent and does not append a second audit

  ```
  AssertionError: expected { revoked: +0, …(1) } to deeply equal { revoked: +0 }
  - Expected
  + Received
  {
  +   "message": "No active sessions.",
  "revoked": 0,
  }
  ```
- AUTH-sessions-09 transactional admin revoke adversarial contracts > AUTH-sessions-09 revokes all live sessions and audits exactly the affected count

  ```
  AssertionError: expected { revoked: 2, …(1) } to deeply equal { revoked: 2 }
  - Expected
  + Received
  {
  +   "message": "All sessions revoked",
  "revoked": 2,
  }
  ```

## tests/unit/chat6-superadmin-placement-scope-06.test.ts (1 failing)
- SA-admin-middle-placement-scope-06 private Super Admin screen entrypoints > bounded hiring analytics explicitly warns that a truncated sample cannot represent total KPIs

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'data.truncated?<p role="alert"'
  - Expected
  + Received
  - data.truncated?<p role="alert"
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  ```
