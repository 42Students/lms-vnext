# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/college-drive-applications-model.test.ts (1 failing)
- College drive applicant filters and CSV protection > validates bounded status filters and forbids caller college

  ```
  AssertionError: expected { q: '', status: 'ALL', …(8) } to deeply equal { q: '', status: 'ALL', …(4) }
  - Expected
  + Received
  {
  +   "attention": "ALL",
  "page": 1,
  "q": "",
  "screening": "ALL",
  ```

## tests/unit/company-share-audit-columns-safety.test.ts (1 failing)
- public share service selects only preview-approved candidate identity fields

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'projectCompanyShareRows(records,grant…'
  - Expected
  + Received
  - projectCompanyShareRows(records,grant.selectedColumns)
  + import "server-only";
  + import {and,asc,count,eq,gt,ilike,inArray,isNull,sql} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/faculty-profile-skills-section.test.ts (1 failing)
- Faculty self-profile skills lifecycle > rejects duplicate record IDs and empty skill titles

  ```
  AssertionError: expected [Function] to throw an error
  ❯ tests/unit/faculty-profile-skills-section.test.ts:20:137
  18|   const skill={id,skill:"Java",proficiency:""};
  19|   expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{…
  20|   expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{…
  |                                                                                                                                         ^
  21|  });
  22| });
  ```

## tests/unit/hr-round-empty-workspace.test.ts (1 failing)
- shows an accessible empty state before mapping rounds

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'role="status"'
  - Expected
  + Received
  - role="status"
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {z} from "zod";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/learner-course-page-parity.test.ts (2 failing)
- learner Course page parity contract > keeps legacy Learning Path filters, lesson expansion and deep-link focus

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '<details'
  - Expected
  + Received
  - <details
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import type {ComponentProps} from "react";
  + import progressStyles from "./learner-course-progress.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- learner Course page parity contract > keeps Course Attendance learner-only and Discussions interactive

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'Attendance threshold'
  - Expected
  + Received
  - Attendance threshold
  + "use client";
  + import { Input } from "@/components/ui/input";
  +
  + import { learnerCourseAttendanceMonthShortcutVisible } from "@/modules/attendance/learner-course-attendance-month-shortcut-model";
  ```
