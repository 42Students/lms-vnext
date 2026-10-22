# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-scope-pages.test.tsx (1 failing)
- IIT Dharwad Super Admin last-third Project route authorization > PROJ-BREAK-admin-idor-30 all four admin queues reject college-only and disabled actors before scope or data lookup

  ```
  AssertionError: At Risk: expected 'At Risk Project access denied Your ac…' to contain 'Back to dashboard'
  Expected: "Back to dashboard"
  Received: "At Risk Project access denied Your account cannot access Super Admin project workspaces. /dashboard"
  ```

## tests/unit/UX-teacher-live-editor-dialog.test.ts (1 failing)
- Faculty live class authoring overlay UX > UX-teacher-live-classes-03 confirms schedule/edit/cancel in a focus-managed shared ConfirmDialog

  ```
  AssertionError: expected '"use client";\n\nimport {useRouter} f…' to contain 'onConfirm={()=>void save(true)}'
  - Expected
  + Received
  - onConfirm={()=>void save(true)}
  + "use client";
  +
  + import {useRouter} from "next/navigation";
  + import {useMemo,useState} from "react";
  ```

## tests/unit/chat12-tpo-first-third-second-pass.test.ts (2 failing)
- UX-tpo-first-third-12 explicit denial, recovery and scope contracts > UX-tpo-find-01 redirects wrong-role and expired TPO members before record reads

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<Alert tone="error">Search must conta…'
  - Expected
  + Received
  - <Alert tone="error">Search must contain 2–100 characters.</Alert>
  + import {Button} from "@/components/ui/button";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  ```
- UX-tpo-first-third-12 explicit denial, recovery and scope contracts > UX-tpo-messages-thread-01 fails closed when storage is absent and when thread is missing

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'if(!data)notFound()'
  - Expected
  + Received
  - if(!data)notFound()
  + import Link from "next/link";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {TpoLiveRefresh} from "@/components/tpo/tpo-live-refresh";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  ```

## tests/unit/chat15-calendar-window-bounds.test.ts (1 failing)
- chat-15 bounded calendar retrieval > LEARNER-learning-misc-34 bounds academic schedule to IST visible month and week spillover

  ```
  AssertionError: expected 'import "server-only";\n\nimport { z }…' to contain 'gte(sectionScheduleEvents.endsAt,visi…'
  - Expected
  + Received
  - gte(sectionScheduleEvents.endsAt,visibleWindow.from)
  + import "server-only";
  +
  + import { z } from "zod";
  +
  ```
