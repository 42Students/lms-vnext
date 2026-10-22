# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/mentor-meetings-chat7-schedule-legacy.test.ts (1 failing)
- Chat-7 mentor meeting legacy parity > MEN-projects-meetings-28 uses the exact legacy ceremony names and save wording

  ```
  AssertionError: expected '"use client";\n\nimport { type FormEv…' to contain 'title: meeting'
  - Expected
  + Received
  - title: meeting
  + "use client";
  +
  + import { type FormEvent, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/placement-report-model.test.ts (2 failing)
- placement report aggregations > counts distinct placed learners instead of counting offers as people

  ```
  AssertionError: expected 33.3 to be 33 // Object.is equality
  - Expected
  + Received
  - 33
  + 33.3
  ```
- placement report aggregations > returns truthful empty and denominator-zero results

  ```
  AssertionError: expected { drives: +0, liveDrives: +0, …(22) } to match object { drives: +0, registered: +0, …(6) }
  (16 matching properties omitted from actual)
  - Expected
  + Received
  @@ -2,9 +2,9 @@
  "applications": 0,
  "averagePackageInr": null,
  "drives": 0,
  ```

## tests/unit/public-placement-disclosure.test.ts (1 failing)
- public placement statistics privacy threshold > does not mutate the source metrics

  ```
  AssertionError: expected '10' to be '8' // Object.is equality
  Expected: "8"
  Received: "10"
  ```

## tests/unit/sa-tenants-modules-15-bulk-import.test.ts (3 failing)
- SA-tenants-modules-15 bulk college CSV > parses header, quoted commas and escaped quotes

  ```
  Error: Row 2: college code must use 3–63 letters, numbers or hyphens.
  ❯ src/modules/colleges/bulk-import-model.ts:76:11
  74|   }
  75|   if(!/^[A-Za-z0-9-]{3,63}$/.test(code))
  76|     throw Error("Row "+line+": college code must use 3–63 letters, num…
  |           ^
  77|   return {line,name,code,city:v(2)||null,state:v(3)||null,country:v(4)…
  78|  });
  ```
- SA-tenants-modules-15 bulk college CSV > parses five-column CSV without headers

  ```
  Error: Row 1: college code must use 3–63 letters, numbers or hyphens.
  ❯ src/modules/colleges/bulk-import-model.ts:76:11
  74|   }
  75|   if(!/^[A-Za-z0-9-]{3,63}$/.test(code))
  76|     throw Error("Row "+line+": college code must use 3–63 letters, num…
  |           ^
  77|   return {line,name,code,city:v(2)||null,state:v(3)||null,country:v(4)…
  78|  });
  ```
- SA-tenants-modules-15 bulk college CSV > rejects duplicates and oversize inputs before writing

  ```
  AssertionError: expected [Function] to throw error matching /Duplicate/ but got 'Row 2: duplicate college code abc (fi…'
  - Expected:
  /Duplicate/
  + Received:
  "Row 2: duplicate college code abc (first used on line 1)."
  ```

## tests/unit/super-admin-tracker-active-route-guards.test.ts (1 failing)
- DB10 tracker Super Admin active account route fences > checks an active actor before trackerAdminRuntimeEnabled() in src/app/(authenticated)/tracker/issues/…

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to match /platformStatus\s*!==\s*"ACTIVE"/
  - Expected:
  /platformStatus\s*!==\s*"ACTIVE"/
  + Received:
  "import Link from \"next/link\";
  import { redirect } from \"next/navigation\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { TrackerAdminNav } from \"@/components/tracker/tracker-admin-nav\";
  ```

## tests/unit/tpo-bell-notification-ack-chat2.test.ts (1 failing)
- TPO notification click acknowledgement > TPO-inbox-team-64 and GR-71 only navigate after a successful bounded acknowledgement

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'if (acknowledged && openHref) router.…'
  - Expected
  + Received
  - if (acknowledged && openHref) router.push(openHref)
  + "use client";
  +
  + import Link from "next/link";
  + import {Dialog} from "@/components/ui/dialog";
  ```

## tests/unit/tpo-home-02-need-line.test.ts (1 failing)
- TPO-home-02 exact legacy needs-you line > the server page renders the computed line from live seven-row data

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain '{tpoHomeNeedsLine(rows)}'
  - Expected
  + Received
  - {tpoHomeNeedsLine(rows)}
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import {TpoHomeReturnRefresh} from "@/components/tpo/tpo-home-return-refresh";
  + import {eq} from "drizzle-orm";
  ```

## tests/unit/tpo-student-quick-panel.test.ts (1 failing)
- TPO-students-02 roster student deep link and drawer > renders five panel tabs with safe detailed navigation

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```
