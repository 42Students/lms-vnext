# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/chat9-round9-public-audit.test.ts (1 failing)
- chat9 public page, signature and audit evidence > TPO-settings-audit-97 escapes formula-leading clipboard cells and exposes explicit copy selection

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'Select all visible rows'
  - Expected
  + Received
  - Select all visible rows
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/chat9-unconfirmed-public-auth-round7.test.ts (4 failing)
- chat-9 public auth unconfirmed decisions > PUB-auth-public-22 shows static college when there is only one active choice

  ```
  AssertionError: expected '"use client";\n\nimport { useState, u…' to contain 'activeChoices.length === 1 && activeM…'
  - Expected
  + Received
  - activeChoices.length === 1 && activeMembershipId === activeChoices[0].id
  + "use client";
  +
  + import { useState, useTransition } from "react";
  + import { useRouter } from "next/navigation";
  ```
- chat-9 public auth unconfirmed decisions > PUB-auth-public-23 ignores blank selection and never clears membership through the switcher

  ```
  AssertionError: expected '"use client";\n\nimport { useState, u…' to contain 'if (!membershipId || membershipId ===…'
  - Expected
  + Received
  - if (!membershipId || membershipId === activeMembershipId) return;
  + "use client";
  +
  + import { useState, useTransition } from "react";
  + import { useRouter } from "next/navigation";
  ```
- chat-9 public auth unconfirmed decisions > PUB-auth-public-30 explains disabled projects without leaking private projects

  ```
  AssertionError: expected 2769 to be less than -1
  ❯ tests/unit/chat9-unconfirmed-public-auth-round7.test.ts:25:50
  23|   const s=read("src/app/(authenticated)/learn/projects/page.tsx");
  24|   expect(s).toContain("This module is currently disabled for your coll…
  25|   expect(s.indexOf("return <section className")).toBeLessThan(s.indexO…
  |                                                  ^
  26|  });
  27|  it("PUB-auth-public-35 retains five-day absolute expiry without slidi…
  ```
- chat-9 public auth unconfirmed decisions > PUB-auth-public-36 retains registered provider OTP copy without leaking codes to logs

  ```
  AssertionError: expected 'import { outboundFetch } from "@/lib/…' to contain 'learnerName: message.displayName'
  - Expected
  + Received
  - learnerName: message.displayName
  + import { outboundFetch } from "@/lib/outbound";
  + import { writeStructuredLog } from "@/observability/logger";
  + import type { EmailProvider } from "./types";
  + import { isValidRecipient, normalizeRecipient } from "@/modules/messaging/model";
  ```

## tests/unit/college-elective-slot-mutation-model.test.ts (1 failing)
- college elective slot mutation model > requires a version and confirmation for editing

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/faculty-attendance-source-round5.test.ts (4 failing)
- chat-11 faculty attendance gap closure verification > FAC-attendance-grades-07 validates end after start, 12-hour bound and successful scheduling

  ```
  AssertionError: expected 'import { authoringLocalDateTime, auth…' to contain 'A class can be at most 12 hours. Chec…'
  - Expected
  + Received
  - A class can be at most 12 hours. Check AM/PM.
  + import { authoringLocalDateTime, authoringDueInstant } from "@/modules/courses/faculty-authoring-datetime-model";
  +
  + /** Editor wall times are always IST; persisted values remain UTC instants.
  +  * The authenticated delivery route owns the faculty/class assignment; it must
  ```
- chat-11 faculty attendance gap closure verification > FAC-attendance-grades-08 shows legacy monthly attendance legend and Active days

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain 'P = Present · A = Absent'
  - Expected
  + Received
  - P = Present · A = Absent
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Alert } from "@/components/ui/alert";
  + import { Textarea } from "@/components/ui/textarea";
  ```
- chat-11 faculty attendance gap closure verification > FAC-attendance-grades-09 shows marked and unmarked session counts with monthly report tiles

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain 'session(s) not yet marked'
  - Expected
  + Received
  - session(s) not yet marked
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Alert } from "@/components/ui/alert";
  + import { Textarea } from "@/components/ui/textarea";
  ```
- chat-11 faculty attendance gap closure verification > FAC-attendance-grades-17 shows Download Report and safe PDF error feedback

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Couldn\\'t generate the attendance re…'
  - Expected
  + Received
  - Couldn\'t generate the attendance report. Please try again.
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { useRef, useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/graceful-logs-ui-contract.test.ts (2 failing)
- known error triage UI resilience > GR-123 preserves legacy Known errors empty and mute confirmation wording

  ```
  AssertionError: expected '"use client";\nimport { EmptyState } …' to contain 'No tracked errors yet'
  - Expected
  + Received
  - No tracked errors yet
  + "use client";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { Dialog } from "@/components/ui/dialog";
  ```
- known error triage UI resilience > GR-124 does not imply Cloud Logging backup is active when unconfigured

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Cloud Logging backup is not configure…'
  - Expected
  + Received
  - Cloud Logging backup is not configured.
  + import Link from "next/link";
  + import type { Metadata } from "next";
  + import { Tabs } from "@/components/ui/tabs";
  +
  ```

## tests/unit/learner-coding-profile-link.test.ts (1 failing)
- only accepts named HTTPS coding platforms

  ```
  AssertionError: expected 'https://github.com/learner' to be null
  - Expected:
  null
  + Received:
  "https://github.com/learner"
  ```

## tests/unit/learner-placements-14-drive-filter-copy.test.ts (1 failing)
- LEARNER-placements-14 drive filter copy > LEARNER-placements-14 uses the legacy search prompt, deadline sort and clear action

  ```
  AssertionError: expected '"use client";\n\nimport { useCallback…' to contain 'Search by title, company, location…'
  - Expected
  + Received
  - Search by title, company, location…
  + "use client";
  +
  + import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
