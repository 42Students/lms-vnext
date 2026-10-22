# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat7-learner-board-filters-and-scroll.test.ts (1 failing)
- PROJ-BREAK-LEARNER-96/97 board filter and mobile navigation resilience > preserves keyboard and touch access when Board lanes overflow a 320px device

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'className={styles.scrollRegion}'
  - Expected
  + Received
  - className={styles.scrollRegion}
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/UX-learning-cross-audit-chat17.test.ts (1 failing)
- chat-17 confirmed BLOCKER/MAJOR learning cross-audit fixes > UX-learn-offers-03 opens own offer letter in same tab without losing label (LX-14)

  ```
  AssertionError: expected '"use client";\n\nimport { useRef, use…' not to contain 'target="_blank"'
  - Expected
  + Received
  - target="_blank"
  + "use client";
  +
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/chat12-grid-columns-round3.test.ts (1 failing)
- chat-12 Students responsive grid and column preference > TPO-students-51 keeps mobile row actions always visible while preserving filters

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<TpoGridFilterPanel fields={filters} …'
  - Expected
  + Received
  - <TpoGridFilterPanel fields={filters} mobileSheet/>
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat13-ux-cross-audit-tpo.test.ts (1 failing)
- chat-13 TPO second-third cross-audit repairs > UX-cross-tpo-second-C13-027 recruiter directory and company communication remain accessible across viewports

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'mobilePriority:"action"'
  - Expected
  + Received
  - mobilePriority:"action"
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```
