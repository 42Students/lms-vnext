# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat11-tpo-settings-config-read-revocation.test.ts (1 failing)
- TPO-settings-audit-CONFIG-READ-11 tenant settings role-revocation barrier > rechecks persisted active role before private getTpoJobTypes data, including unavailable-table results

  ```
  AssertionError: expected -1 to be greater than or equal to 611
  ❯ tests/unit/chat11-tpo-settings-config-read-revocation.test.ts:58:18
  56|   expect(persisted).toBeGreaterThan(active);
  57|   expect(read).toBeGreaterThan(persisted);
  58|   expect(output).toBeGreaterThanOrEqual(read);
  |                  ^
  59|   expect(fn.slice(persisted,read)).toContain("collegeId,organizationId…
  60|   expect(fn.slice(read)).toContain(table);
  ```

## tests/unit/chat12-graceful-tpo.test.ts (4 failing)
- chat-12 touched TPO pages degrade gracefully > TPO-requests-verification-18 / GR-19 / GR-20 provide request loading and friendly error screens

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'aria-busy="true"'
  - Expected
  + Received
  - aria-busy="true"
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  +
  + export default function Loading() {
  +   return <GracefulPageLoading label="Loading requests…" shape="directory" />;
  ```
- chat-12 touched TPO pages degrade gracefully > GR-71 / GR-73 keep filters on requests and verification failure with a keyboard retry

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'focus-visible:ring-2'
  - Expected
  + Received
  - focus-visible:ring-2
  + "use client";
  +
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  ```
- chat-12 touched TPO pages degrade gracefully > GR-90 / GR-91 offer plain announced retryable student-panel errors

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain 'Retry loading student details'
  - Expected
  + Received
  - Retry loading student details
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {Tabs} from "@/components/ui/tabs";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- chat-12 touched TPO pages degrade gracefully > GR-32 preserves the academic import draft on conflict and never renders the raw backend code

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'This changed while you were working.'
  - Expected
  + Received
  - This changed while you were working.
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {DataTable} from "@/components/ui/data-table";
  ```

## tests/unit/chat12-round38-roster-header-filters.test.ts (1 failing)
- TPO-students-24 supports per-column live header filters sharing URLs and counts with Filter students drawer

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'aria-label={"Filter "+col.label}'
  - Expected
  + Received
  - aria-label={"Filter "+col.label}
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChip} from "@/components/ui/filter-chip";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat12-tpo-first-third-second-pass.test.ts (3 failing)
- UX-tpo-first-third-12 explicit denial, recovery and scope contracts > UX-tpo-find-01 redirects wrong-role and expired TPO members before record reads

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import {Button} from "@/components/ui/button";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  ```
- UX-tpo-first-third-12 explicit denial, recovery and scope contracts > UX-tpo-more-01 keeps accessible navigation inside an authorized role shell

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'aria-label="More TPO destinations"'
  - Expected
  + Received
  - aria-label="More TPO destinations"
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- UX-tpo-first-third-12 explicit denial, recovery and scope contracts > UX-tpo-drive-day-01 distinguishes learner coordinator from TPO operational scope

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'hasMembershipRole(context, "TPO") && …'
  - Expected
  + Received
  - hasMembershipRole(context, "TPO") && !hasMembershipRole(context, "LEARNER")
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  ```

## tests/unit/chat13-admin-drive-deadline-boundary.test.ts (1 failing)
- SA-ADMIN-DRIVE-04 Super Admin drive expiry boundary > treats an exact deadline as expired and preserves status before it

  ```
  AssertionError: expected 'Expired' to be 'Open · Expired' // Object.is equality
  Expected: "Open · Expired"
  Received: "Expired"
  ```

## tests/unit/chat13-final-sprint-public-share.test.ts (2 failing)
- chat-13 final sprint public company share > PUB-auth-public-50 requires a separate six-digit salted access code and a server-side signed proof

  ```
  AssertionError: expected 'import authStyles from "@/components/…' to contain 'Enter the 6-digit share code'
  - Expected
  + Received
  - Enter the 6-digit share code
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```
- chat-13 final sprint public company share > PUB-auth-public-53 filters every selected column and never exports an unselected phone or URL

  ```
  AssertionError: expected [ 'APPLICATION_ID', 'EMAIL', 'NAME' ] to deeply equal [ 'EMAIL', 'NAME' ]
  - Expected
  + Received
  [
  +   "APPLICATION_ID",
  "EMAIL",
  "NAME",
  ]
  ```
