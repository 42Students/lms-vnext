# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-people-phone-session-and-mobile-round6.test.ts (1 failing)
- Chat-6 recruiter login and mobile layout safety > SA-academics-people-75 keeps create controls and scrolling course tables within mobile width

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'block w-full'
  - Expected
  + Received
  - block w-full
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import { TableSelectAll } from "@/components/ui/table-select-all";
  ```

## tests/unit/chat7-legacy-faculty-quiz-report-copy.test.ts (1 failing)
- Faculty QuizReportContent.jsx dev legacy headings and empty states > preserves dynamic report title and exact legacy section names

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '← My Quizzes'
  - Expected
  + Received
  - ← My Quizzes
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {FacultyReportBackButton} from "@/components/courses/faculty-report-back-button";
  ```

## tests/unit/chat9-college-sidebar-active-groups.test.ts (1 failing)
- College Admin legacy grouped sidebar highlight > the shared sidebar renders the active owner of nested College routes

  ```
  AssertionError: expected '"use client";\n\nimport {Fragment,use…' to contain 'collegeLegacyGroupForPath(pathname)'
  - Expected
  + Received
  - collegeLegacyGroupForPath(pathname)
  + "use client";
  +
  + import {Fragment,useEffect,useState} from "react";
  + import {apiFetch} from "@/lib/api-fetch";
  ```

## tests/unit/college-drive-applications-model.test.ts (1 failing)
- College drive applicant filters and CSV protection > validates bounded status filters and forbids caller college

  ```
  AssertionError: expected { q: '', status: 'ALL', …(8) } to be null
  - Expected:
  null
  + Received:
  {
  "attention": "ALL",
  "page": 1,
  "q": "",
  ```
