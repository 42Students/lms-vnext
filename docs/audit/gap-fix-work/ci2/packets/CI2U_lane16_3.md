# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-projects-templates-templateId-01.test.ts (1 failing)
- /college/projects/templates/[templateId] UX > UX-college-projects-template-detail-01 preserves responsive or failure recovery contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Template sections"'
  - Expected
  + Received
  - aria-label="Template sections"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {z} from "zod";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/UX-courses-faculty-roster-attendance-tables-01.test.ts (1 failing)
- UX-courses-faculty-roster-attendance-tables-01 > faculty roster preserves authorized avatar preview, contacts, search and pagination in one DataTable

  ```
  AssertionError: expected '"use client";\n\nimport { useMemo, us…' to contain 'aria-label={"Preview avatar for "+nam…'
  - Expected
  + Received
  - aria-label={"Preview avatar for "+nameOf(learner)}
  + "use client";
  +
  + import { useMemo, useState } from "react";
  + import Link from "next/link";
  ```

## tests/unit/UX-learning-cross-audit-chat17.test.ts (11 failing)
- chat-17 learning cross-audit: inventory and all 84 authored route shells > UX-learn-/learn-01 never reintroduces native popups, new-window links or 40px interactive targets

  ```
  Error: ENOENT: no such file or directory, open '/home/runner/work/lms-vnext/lms-vnext/src/app/(authenticated)/learn/page.tsx'
  ❯ read tests/unit/UX-learning-cross-audit-chat17.test.ts:5:32
  3| import { join } from "node:path";
  4|
  5| const read = (path: string) => readFileSync(join(process.cwd(), path),…
  |                                ^
  6| const inventories = [
  7|   ["teacher", "pages-teacher.md", 36],
  ```
- chat-17 confirmed BLOCKER/MAJOR learning cross-audit fixes > UX-learn-my-placements-schedule-02 keeps online round and test labels, including assistive text (LX-02)

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain '<ThirdPartyLink href={join} label="Jo…'
  - Expected
  + Received
  - <ThirdPartyLink href={join} label="Join online round" />
  + import { Tabs } from "@/components/ui/tabs";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- chat-17 confirmed BLOCKER/MAJOR learning cross-audit fixes > UX-notifications-list-02 exposes a 44px notification selection action (LX-07)

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'min-h-11 items-center text-left'
  - Expected
  + Received
  - min-h-11 items-center text-left
  + "use client";
  +
  + import Link from "next/link";
  + import {Dialog} from "@/components/ui/dialog";
  ```
- chat-17 confirmed BLOCKER/MAJOR learning cross-audit fixes > UX-learn-courses-02 course list has a 44px Show more courses action (LX-08)

  ```
  AssertionError: expected '"use client";\n\nimport { MetricBar }…' to match /min-h-11 items-center rounded-md[^\n]…/
  - Expected:
  /min-h-11 items-center rounded-md[^\n]*Show more courses|className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4/
  + Received:
  "\"use client\";
  import { MetricBar } from \"@/components/ui/metric-bar\";
  import progressStyles from \"./learner-course-progress.module.css\";
  import { Alert } from \"@/components/ui/alert\";
  ```
- chat-17 confirmed BLOCKER/MAJOR learning cross-audit fixes > UX-quiz-attempt-02 quiz Back choices are reachable by keyboard and thumb (LX-09)

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to match /min-h-11 items-center[^\n]*>Ba…/button>
  - Expected:
  /min-h-11 items-center[^\n]*>Back<\/button>/
  + Received:
  "\"use client\";
  import { PageHeader } from \"@/components/ui/page-header\";
  import {Drawer} from \"@/components/ui/drawer\";
  import {isSafeInternalHref} from \"@/lib/safe-internal-href\";
  ```
- chat-17 confirmed BLOCKER/MAJOR learning cross-audit fixes > UX-learning-webview-fallback-01 makes validated destinations inspectable and focusable

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'aria-label={ariaLabel}'
  - Expected
  + Received
  - aria-label={ariaLabel}
  + "use client";
  +
  + import { useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- chat-17 confirmed BLOCKER/MAJOR learning cross-audit fixes > UX-learn-course-discussion-03 preserves draft navigation and destructive action confirmation (LX-11)

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'text-base text-foreground'
  - Expected
  + Received
  - text-base text-foreground
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  +
  +
  ```
- chat-17 confirmed BLOCKER/MAJOR learning cross-audit fixes > UX-learn-live-class-03 disables expired meeting but uses WebView-safe join (LX-12)

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain '<ThirdPartyLink href={href} label="Jo…'
  - Expected
  + Received
  - <ThirdPartyLink href={href} label="Join Meeting" />
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {useEffect,useRef,useState} from "react";
  + import { ThirdPartyLink } from "@/components/ui/third-party-link";
  ```
- chat-17 confirmed BLOCKER/MAJOR learning cross-audit fixes > UX-learn-assessment-overview-03 retains shared submitted URL and minimum action sizes (LX-13)

  ```
  AssertionError: expected '"use client";\nimport { StatTile } fr…' not to contain 'target="_blank"'
  - Expected
  + Received
  - target="_blank"
  + "use client";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import styles from "./learner-assessment-metrics.module.css";
  + import { AssessmentMetricGlyph } from "./learner-assessment-metric-glyph";
  ```
- chat-17 confirmed BLOCKER/MAJOR learning cross-audit fixes > UX-learn-offers-03 opens own offer letter in same tab without losing label (LX-14)

  ```
  AssertionError: expected '"use client";\n\nimport { useRef, use…' to contain 'View offer letter'
  - Expected
  + Received
  - View offer letter
  + "use client";
  +
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```
- … 1 more in this file

## tests/unit/UX-projects-shared-overlays-02.test.ts (9 failing)
- UX-projects-shared-overlays-02 guarded action/confirmation paths > college-project-mentor-dialog names reassignment and stops edits during pending work

  ```
  AssertionError: expected '"use client";\n\nimport {useRef,useSt…' to contain 'if(!busy)setOpen(next)'
  - Expected
  + Received
  - if(!busy)setOpen(next)
  + "use client";
  +
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  ```
- UX-projects-shared-overlays-02 guarded action/confirmation paths > college-project-student-roster-dialog requires review before replacement

  ```
  AssertionError: expected '"use client";\n\nimport {useRef,useSt…' to contain 'title="Manage students"'
  - Expected
  + Received
  - title="Manage students"
  + "use client";
  +
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  ```
- UX-projects-shared-overlays-02 guarded action/confirmation paths > learner-board-task-detail-dialog opens an accessible modal with a 44px close action

  ```
  AssertionError: expected '"use client";\nimport { useEffect, us…' to contain 'dialog.showModal()'
  - Expected
  + Received
  - dialog.showModal()
  + "use client";
  + import { useEffect, useRef } from "react";
  + import { Dialog } from "@/components/ui/dialog";
  + import Link from "next/link";
  ```
- UX-projects-shared-overlays-02 guarded action/confirmation paths > project-archive-control keeps archive/restore actions distinct

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'title="Archive project?"'
  - Expected
  + Received
  - title="Archive project?"
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```
- UX-projects-shared-overlays-02 guarded action/confirmation paths > project-create-control opens a named workspace creation dialog

  ```
  AssertionError: expected '"use client";\n\nimport { type FormEv…' to contain 'title="Create workspace"'
  - Expected
  + Received
  - title="Create workspace"
  + "use client";
  +
  + import { type FormEvent, useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```
- UX-projects-shared-overlays-02 guarded action/confirmation paths > project-mentor-reassignment confirms the selected scope and reports partial failures

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect,u…' to contain 'title="Some workspaces were not reass…'
  - Expected
  + Received
  - title="Some workspaces were not reassigned"
  + "use client";
  +
  + import { useEffect,useMemo, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```
- UX-projects-shared-overlays-02 guarded action/confirmation paths > project-template-controls distinguishes duplicate/revoke/archive confirmations

  ```
  AssertionError: expected '"use client";\n\nimport {type FormEve…' to contain 'title="Revoke college assignment?"'
  - Expected
  + Received
  - title="Revoke college assignment?"
  + "use client";
  +
  + import {type FormEvent,useEffect,useState} from "react";
  + import { useRouter } from "next/navigation";
  ```
- UX-projects-shared-overlays-02 guarded action/confirmation paths > super-admin-template-college-bulk confirms the selected number of colleges

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'actionable.length'
  - Expected
  + Received
  - actionable.length
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { StatusBadge } from "@/components/ui/status-badge";
  ```
- UX-projects-shared-overlays-02 guarded action/confirmation paths > template-metadata-edit-control blocks dismissal while a revision is pending

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'title="Revise draft metadata"'
  - Expected
  + Received
  - title="Revise draft metadata"
  + "use client";
  + import {useEffect,useRef,useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/UX-teacher-courses-coverage-01.test.ts (1 failing)
- Faculty UX route /teacher/courses > UX-teacher-courses-01: retains routing, access and learner-facing states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import Link from "next/link";
  + import { parseFacultyCourseListLocation } from "@/modules/courses/faculty-course-list-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { FacultyCourseList } from "@/components/courses/faculty-course-list";
  ```

## tests/unit/UX-teacher-profile-coverage-01.test.ts (1 failing)
- UX-teacher-profile-01 /teacher/profile keeps access and honest feedback

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<PageHeader\n        title="Profile"'
  - Expected
  + Received
  - <PageHeader
  -         title="Profile"
  + import Link from "next/link";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import {ErrorState} from "@/components/ui/error-state";
  ```
