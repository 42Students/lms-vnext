# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat11-tpo-settings-route-surfaces.test.ts (1 failing)
- TPO-settings-audit-ROUTES-01: all settings routes require a TPO-scoped reader > TPO-settings-audit-ROUTES-01 /job-types uses scoped server data and a recoverable or truthful state

  ```
  AssertionError: job-types: expected 'import { PageHeader } from "@/compone…' to contain 'Job types storage is awaiting migrati…'
  - Expected
  + Received
  - Job types storage is awaiting migration registration.
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat12-ineligibility-presets-round5.test.ts (1 failing)
- chat12 ineligibility and bulk actions > TPO-students-13 renders all legacy reason presets and the Other choice in single and bulk flows

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '>Other</button>'
  - Expected
  + Received
  - >Other</button>
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Input} from "@/components/ui/input";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat12-round4-bulk-safety.test.ts (1 failing)
- chat-12 round4 guarded TPO bulk, messages and saved views > GR-30 and GR-35 gate irreversible mutation with synchronous double submit guard

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<Dialog open={deleteTarget!==null}'
  - Expected
  + Received
  - <Dialog open={deleteTarget!==null}
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Radio} from "@/components/ui/radio";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/chat12-tpo-notes-authorization-behavior.test.ts (1 failing)
- TPO-BREAK-notes-01 authenticated writer and foreign-ID isolation > skips foreign student IDs even if forged in JSON and audits only active college rows

  ```
  AssertionError: expected { Object (ok, added, ...) } to deeply equal { added: 1, skipped: 1, …(1) }
  - Expected
  + Received
  {
  "added": 1,
  +   "ok": true,
  "savedMembershipIds": [
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  ```

## tests/unit/chat13-admin-placement-body-guard.test.ts (1 failing)
- SA-ADMIN-BODY-16 actual-byte-limited Super Admin mutation payloads > protects both route mutations after same-origin but before authentication

  ```
  AssertionError: expected 891 to be less than 595
  ❯ tests/unit/chat13-admin-placement-body-guard.test.ts:36:57
  34|    expect(s.indexOf("isSameOriginRequest(request)")).toBeLessThan(
  35|      s.indexOf("readAdminPlacementJson(request,"));
  36|    expect(s.indexOf("readAdminPlacementJson(request,")).toBeLessThan(
  |                                                         ^
  37|      s.indexOf("getCurrentRequestContext()"));
  38|    expect(s).toContain('error:"INVALID_REQUEST"');
  ```

## tests/unit/chat13-hiring-filters-selected-org.test.ts (1 failing)
- SA-HIRING-FILTER-ORG-21 persisted organization must own selected college > uses the same selected organization guard before the four college facets

  ```
  AssertionError: expected 964 to be less than -1
  ❯ tests/unit/chat13-hiring-filters-selected-org.test.ts:34:5
  32|   expect(source).toContain("eq(colleges.organizationId,scope.organizat…
  33|   expect(source.indexOf("if(!college)throw new AuthorizationError"))
  34|    .toBeLessThan(source.indexOf("Promise.all(["));
  |     ^
  35|   expect(source).toContain("eq(placementJobs.collegeId,scope.collegeId…
  36|   expect(source).toContain("eq(departments.collegeId,scope.collegeId)"…
  ```
