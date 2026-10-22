# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-csv-security.test.ts (2 failing)
- IIT Dharwad Projects admin exports: spreadsheet injection resilience > PROJ-BREAK-exports-17 college template catalogue rejects Unicode-mark hidden formulas

  ```
  AssertionError: expected 'import {projectAdminCsv} from "./proj…' to contain 'return projectAdminCsv(lines)'
  - Expected
  + Received
  - return projectAdminCsv(lines)
  + import {projectAdminCsv} from "./project-admin-csv-model";
  + /** COL-projects-16: safe projections for the college template catalogue. */
  + export type TemplateSectionCounts = {
  +   overview: number;
  ```
- IIT Dharwad Projects admin exports: spreadsheet injection resilience > PROJ-BREAK-exports-12/13/14/15 all six client exports use the tested sanitizer

  ```
  AssertionError: project-workspace-page-export.tsx: expected '"use client";\nimport { Button } from…' to contain 'from "@/modules/projects/project-admi…'
  - Expected
  + Received
  - from "@/modules/projects/project-admin-csv-model"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {useState} from "react";
  + import {projectWorkspacePageCsv} from "@/modules/projects/admin-workspace-page-export-model";
  ```

## tests/unit/UX-projects-shared-overlays-02.test.ts (1 failing)
- UX-projects-shared-overlays-02 guarded action/confirmation paths > project-archive-control keeps archive/restore actions distinct

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'onOpenChange={setOpen}'
  - Expected
  + Received
  - onOpenChange={setOpen}
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat12-round19-roster-responsive-counts.test.ts (1 failing)
- TPO Students phone presentation and scoped selection summary > TPO-students-51 shows two-column phone journey, focused row summary and collapsible details/actions

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'mobileActionsCollapsible&&mobileExtra…'
  - Expected
  + Received
  - mobileActionsCollapsible&&mobileExtra.length>0?<details
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChip} from "@/components/ui/filter-chip";
  + import {Button} from "@/components/ui/button";
  ```

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
