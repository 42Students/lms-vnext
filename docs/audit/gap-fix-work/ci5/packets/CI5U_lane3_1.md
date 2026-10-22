# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-drive-new-page-79.test.tsx (3 failing)
- HR-DRIVE-PAGE-79: actual recruiter request drive page role and stale-link journey > rejects duplicate college IDs and conflicting edit/fix links

  ```
  AssertionError: expected [] to include 'We couldn\'t load that drive'
  ❯ tests/unit/HR-BREAK-chat15-drive-new-page-79.test.tsx:63:29
  61|   for(const query of [{collegeId:[own,other]},{collegeId:own,edit:requ…
  62|    const rendered=await view(query);
  63|    expect(titles(rendered)).toContain("We couldn't load that drive");
  |                             ^
  64|   }
  65|   expect(m.requests).not.toHaveBeenCalled();
  ```
- HR-DRIVE-PAGE-79: actual recruiter request drive page role and stale-link journey > rejects other-college direct URL before searching request history

  ```
  AssertionError: expected [] to include 'We couldn\'t load that drive'
  ❯ tests/unit/HR-BREAK-chat15-drive-new-page-79.test.tsx:70:28
  68|  it("rejects other-college direct URL before searching request history…
  69|   const rendered=await view({collegeId:other});
  70|   expect(titles(rendered)).toContain("We couldn't load that drive");
  |                            ^
  71|   expect(m.requests).not.toHaveBeenCalled();
  72|   expect(m.branches).not.toHaveBeenCalled();
  ```
- HR-DRIVE-PAGE-79: actual recruiter request drive page role and stale-link journey > revoked or wrong-status request cannot be edited from a stale URL

  ```
  AssertionError: expected [] to include 'We couldn\'t load that drive'
  ❯ tests/unit/HR-BREAK-chat15-drive-new-page-79.test.tsx:100:28
  98|   m.requests.mockResolvedValue([{id:requestId,status:"REJECTED"}]);
  99|   const rendered=await view({collegeId:own,edit:requestId});
  100|   expect(titles(rendered)).toContain("We couldn't load that drive");
  |                            ^
  101|   expect(m.requests).toHaveBeenCalledWith(actor,own);
  102|  });
  ```

## tests/unit/PROJ-BREAK-chat9-admin-programs-page.test.tsx (2 failing)
- Super Admin last-third Programs: cross-role, partial outage and scoped directory > UX-admin-programs-37 missing selected college never performs cross-tenant fallback

  ```
  Error: [vitest] No "listGlobalProgramsForSuperAdmin" export is defined on the "@/modules/academics/program-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/academics/program-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- Super Admin last-third Programs: cross-role, partial outage and scoped directory > UX-admin-programs-38 any essential directory outage displays an honest retry, never a false zero-program list

  ```
  AssertionError: expected 'Programs We could not load this page …' to contain 'Programs unavailable'
  Expected: "Programs unavailable"
  Received: "Programs We could not load this page The selected college's program directory could not be verified. No changes were made. Retry loading programs /admin/programs"
  ```

## tests/unit/UX-activity-index-01.test.ts (1 failing)
- UX-activity-index-01 Activity Log > UX-activity-index-02 uses shared, accessible mobile-safe filter controls

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<Card as="article"'
  - Expected
  + Received
  - <Card as="article"
  + import Link from "next/link";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Fragment,type ReactNode} from "react";
  + import { StatusBadge } from "@/components/ui/status-badge";
  ```

## tests/unit/UX-college-college-lecture-halls-01.test.ts (1 failing)
- UX-college-college-lecture-halls-01 keeps accessible shared screen state

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```

## tests/unit/UX-superadmin-import-tables-chat17.test.ts (1 failing)
- UX-UNOWNED-TABLE-07/08 Super Admin import surfaces > faculty CSV import preserves CAS confirmation, upload bounds and per-row outcomes

  ```
  AssertionError: expected '"use client";\nimport { useRef, useSt…' not to match /<\s*table\b/i
  - Expected:
  /<\s*table\b/i
  + Received:
  "\"use client\";
  import { useRef, useState } from \"react\";
  import { useRouter } from \"next/navigation\";
  import { parseFacultyBulkCsv } from \"@/modules/people/faculty-bulk-import-model\";
  ```

## tests/unit/UX-tracker-cross-audit-controls.test.ts (1 failing)
- Cross-audit Tracker directory and actions > UX-tracker-shared-bulk-02 removes undersized actions and low-contrast link ink

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'focus-visible:'
  - Expected
  + Received
  - focus-visible:
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat11-tpo-trusted-domain-validation.test.ts (1 failing)
- TPO-settings-audit-TRUST-02 college-scoped company domain validation > rejects DNS labels with trailing hyphens, invalid separators, 64-byte labels and public mail providers

  ```
  AssertionError: example.com:443: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat12-verification-round2.test.ts (1 failing)
- chat-12 verified TPO verification workflows > TPO-requests-verification-29 provides history, roll, education table, private resume and masked-number explanation

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'Private supporting documents'
  - Expected
  + Received
  - Private supporting documents
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```
