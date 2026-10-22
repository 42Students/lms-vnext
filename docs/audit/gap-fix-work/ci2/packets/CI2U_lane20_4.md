# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-tpo-batches-batchid-history-02.test.ts (1 failing)
- UX-tpo-batches-batchid-history-02 > uses the audited shared PageHeader and keeps existing actions

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<Button type="submit">Apply</Button>'
  - Expected
  + Received
  - <Button type="submit">Apply</Button>
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {batchDecisionLabel,batchHistoryDate} from "@/modules/placements/tpo-batch-labels-model";
  ```

## tests/unit/UX-tpo-drive-day-roundid-no-shows-01.test.ts (1 failing)
- UX-tpo-drive-day-roundid-no-shows-01 /tpo/drive-day/[roundId]/no-shows > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {DataTable} from "@/components…' not to contain 'text-on-primary'
  - Expected
  + Received
  - text-on-primary
  + import {DataTable} from "@/components/ui/data-table";
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/UX-tracker-issues-publicId-01.test.ts (1 failing)
- UX-tracker-issues-publicId-01 > preserves original wording, permissions and supported accessible UX

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'No screenshot metadata.'
  - Expected
  + Received
  - No screenshot metadata.
  + import Link from "next/link";
  + import {TrackerIssueCopyActions} from "@/components/tracker/tracker-issue-copy-actions";
  + import {TrackerReporterIssueDetail} from "@/components/tracker/tracker-reporter-issue-detail";
  + import {TrackerScreenshotGallery} from "@/components/tracker/tracker-screenshot-gallery";
  ```

## tests/unit/chat11-academic-register-regressions-round11.test.ts (4 failing)
- College Academic Setup open-register functional checks > COL-academic-setup-19 blocks archived departments with dependencies before mutation

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'disabled={pending || hasDependencies}'
  - Expected
  + Received
  - disabled={pending || hasDependencies}
  + "use client";
  +
  + import {
  +   useRef,
  ```
- College Academic Setup open-register functional checks > COL-academic-setup-29 rejects batch archival with linked classes or learners

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Move or remove its '
  - Expected
  + Received
  - Move or remove its
  + "use client";
  + import { Button } from "@/components/ui/button";
  +
  + import { useEffect, useState, useTransition, type FormEvent } from "react";
  ```
- College Academic Setup open-register functional checks > COL-academic-setup-32 retains a section-specific schedule action and class identifier

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'aria-label={"Schedule recurring sessi…'
  - Expected
  + Received
  - aria-label={"Schedule recurring sessions for " + item.name}
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- College Academic Setup open-register functional checks > COL-academic-setup-39 emits a real CSV rather than arbitrary HTML

  ```
  TypeError: Cannot read properties of undefined (reading 'replace')
  ❯ safeCollegeCsvCell src/modules/academics/college-directory-export-model.ts:6:22
  4|  * invisible prefixes that some spreadsheet engines silently strip. */
  5| function safeCollegeCsvCell(value:string):string {
  6|  const visible=value.replace(/^[\s\p{Cf}\p{Mn}]*/u,"");
  |                      ^
  7|  return escapeActivityCsvCell(/^[-=+@]/u.test(visible)?"'"+value:value…
  8| }
  ```

## tests/unit/chat11-super-admin-branding-save-adversarial.test.ts (2 failing)
- SA-tenants-modules-BRAND-04 safe unsaved logo preview > never renders embedded credentials, non-HTTPS assets or signed query/fragment URLs

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'const previewLogoUrl=uploadedLogoUrl|…'
  - Expected
  + Received
  - const previewLogoUrl=uploadedLogoUrl||safeTpoBrandLogoUrl(values.logoUrl)
  + "use client";
  +
  + import { useEffect, useRef, useState, useTransition } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- SA-tenants-modules-BRAND-03 branding writes require current scoped Super Admin > locks live actor/college before write and writes audit in the same transaction

  ```
  AssertionError: expected 'export async function saveCollegeBran…' to contain 'metadata: { version: row.version }'
  - Expected
  + Received
  - metadata: { version: row.version }
  + export async function saveCollegeBranding(
  +   context: RequestContext,
  +   collegeId: string,
  +   rawInput: unknown,
  ```

## tests/unit/chat11-tpo-outcome-labels-adversarial.test.ts (1 failing)
- TPO-settings-audit-OUTCOME-CAS-01 custom outcome label retries > checks live actor permissions before the locked read and all CAS/audit writes

  ```
  AssertionError: expected 3079 to be greater than 4037
  ❯ tests/unit/chat11-tpo-outcome-labels-adversarial.test.ts:36:21
  34|   const activity=service.indexOf("await tx.insert(activityEvents)");
  35|   expect(lock).toBeGreaterThan(0);
  36|   expect(persisted).toBeGreaterThan(lock);
  |                     ^
  37|   expect(same).toBeGreaterThan(persisted);
  38|   expect(stale).toBeGreaterThan(same);
  ```
