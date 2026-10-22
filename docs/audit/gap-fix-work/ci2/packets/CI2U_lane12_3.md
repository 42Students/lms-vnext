# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-programs-states-01.test.ts (1 failing)
- UX /college/programs loading, error and retry > UX-college-programs-loading-02 announces the exact route loading label

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'Loading college programs'
  - Expected
  + Received
  - Loading college programs
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { PageHeader } from "@/components/ui/page-header";
  + export default function CollegeProgramsLoading() {
  +   return <div className="min-w-0 space-y-6">
  ```

## tests/unit/UX-company-join-01.test.ts (2 failing)
- UX-company-join-01 company recruiter invitation > preserves company email proof, six-digit code and guarded shared actions

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'variant="secondary"'
  - Expected
  + Received
  - variant="secondary"
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  ```
- UX-company-join-01 company recruiter invitation > reuses accessible preview retry rather than conflating network errors and expired links

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'text-foreground'
  - Expected
  + Received
  - text-foreground
  + import { PageHeader } from "@/components/ui/page-header";
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  + import Link from "next/link";
  + import {Card} from "@/components/ui/card";
  ```

## tests/unit/UX-kit-scroll-motion-01.test.tsx (5 failing)
- UX-kit-scroll-motion owner invisible-scrollbar contracts > UX-kit-scroll-motion-02 drawer locks its container to one scrollable content region

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'className="min-h-0 flex-1"'
  - Expected
  + Received
  - className="min-h-0 flex-1"
  + "use client";
  +
  + import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- UX-kit-scroll-motion owner invisible-scrollbar contracts > UX-kit-scroll-motion-03 native modal semantics, focus trap and return survive edge-cue wrappers

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'showModal()'
  - Expected
  + Received
  - showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- UX-kit-scroll-motion owner invisible-scrollbar contracts > UX-kit-scroll-motion-04 tabs and filters disclose hidden horizontal and vertical scrolling

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'overflow-hidden'
  - Expected
  + Received
  - overflow-hidden
  + "use client";
  +
  + import { useId, useRef, useState, type ReactNode } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- UX-kit-scroll-motion owner invisible-scrollbar contracts > UX-kit-scroll-motion-05 wide DataTable has labelled focusable scroller and mobile disclosure

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'sm:sticky sm:top-0'
  - Expected
  + Received
  - sm:sticky sm:top-0
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import { TableSelectAll } from "@/components/ui/table-select-all";
  ```
- UX-kit-scroll-motion owner invisible-scrollbar contracts > UX-kit-scroll-motion-07 skeleton shimmer and disclosure honor reduced-motion defaults

  ```
  AssertionError: expected '@import "tailwindcss";\n@source not "…' to contain '--lms-motion-base: 200ms'
  - Expected
  + Received
  - --lms-motion-base: 200ms
  + @import "tailwindcss";
  + @source not "../../docs";
  + @source not "../../scripts";
  + @source not "../../tests";
  ```

## tests/unit/UX-mentor-scroll-motion-01.test.ts (4 failing)
- UX-mentor-scroll-motion-01 invisible scrollbar affordances > keeps the allocation workload responsive and uses DataTable's labelled ScrollCue

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'empty={<p>No learners to summarize ye…'
  - Expected
  + Received
  - empty={<p>No learners to summarize yet.</p>}
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { Badge } from "@/components/ui/badge";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- UX-mentor-scroll-motion-01 invisible scrollbar affordances > makes allocation cards discoverable and keyboard scrollable

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'overscroll-x-contain'
  - Expected
  + Received
  - overscroll-x-contain
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { Badge } from "@/components/ui/badge";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- UX-mentor-scroll-motion-01 invisible scrollbar affordances > makes the status lanes discoverable without clipping touch or keyboard scrolling

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'overflow-x-auto overscroll-x-contain'
  - Expected
  + Received
  - overflow-x-auto overscroll-x-contain
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import styles from "./legacy-project-board.module.css";
  + import { Select } from "@/components/ui/select";
  ```
- UX-mentor-scroll-motion-01 invisible scrollbar affordances > contains native task-dialog vertical scroll, keeps actions visible, and returns focus

  ```
  AssertionError: expected '"use client";\nimport { Banner } from…' to contain 'overflow-y-auto overscroll-contain'
  - Expected
  + Received
  - overflow-y-auto overscroll-contain
  + "use client";
  + import { Banner } from "@/components/ui/banner";
  + import { Dialog } from "@/components/ui/dialog";
  + import Link from "next/link";
  ```

## tests/unit/UX-teacher-assignment-editor-dialog.test.ts (1 failing)
- Faculty assignment authoring UX > UX-teacher-courses-deliveryId-assignments-manage-04 confirms archive with its established consequence copy

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'confirmVariant={confirmation?.kind===…'
  - Expected
  + Received
  - confirmVariant={confirmation?.kind==="ARCHIVE"?"danger":"primary"}
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { LoadingState } from "@/components/ui/loading-state";
  +
  ```

## tests/unit/UX-teacher-pages-round2.test.ts (6 failing)
- UX teacher rollout second ten source contracts > UX-teacher-courses-deliveryId-attendanceDetail-01 preserves authorized session deep link and attendance workspace

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Suspense } from "react";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  ```
- UX teacher rollout second ten source contracts > UX-teacher-courses-deliveryId-discussion-history-01 preserves recorded moderation events, filter and pagination

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Badge } from "@/components/ui/badge";
  + import { Select } from "@/components/ui/select";
  ```
- UX teacher rollout second ten source contracts > UX-teacher-courses-deliveryId-discussion-participation-01 preserves 12 most recent persisted messages only

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Badge } from "@/components/ui/badge";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- UX teacher rollout second ten source contracts > UX-teacher-courses-deliveryId-gradebook-01 preserves bounded published gradebook data and search pagination

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  ```
- UX teacher rollout second ten source contracts > UX-teacher-courses-deliveryId-gradebook-learnerMembershipId-01 preserves membership authorization and privacy-aware 404

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Badge } from "@/components/ui/badge";
  + import { notFound } from "next/navigation";
  ```
- UX teacher rollout second ten source contracts > UX-teacher-courses-deliveryId-quizzes-manage-01 preserves authorized quiz builder and registered-lessons empty state

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {getFacultyCourseWorkspace} from "@/modules/courses/faculty-course-service";
  + import {facultyQuizParamsSchema} from "@/modules/courses/faculty-quiz-authoring-model";
  ```
