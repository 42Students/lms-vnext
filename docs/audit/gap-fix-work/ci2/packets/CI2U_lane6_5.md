# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat11-tpo-settings-final-hardening.test.ts (2 failing)
- TPO settings final-sprint hardening (chat-11) > TPO-settings-audit-11 allows only released/accepted and enforces legacy values at the API boundary

  ```
  AssertionError: expected '"use client";\nimport { useEffect, us…' to contain 'if (inFlight.current) return'
  - Expected
  + Received
  - if (inFlight.current) return
  + "use client";
  + import { useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  + import {TPO_RULE_LIMITS,tpoRuleBoundsValid} from "@/modules/placements/tpo-rule-limits";
  ```
- TPO settings final-sprint hardening (chat-11) > TPO-settings-audit-80 guards repeat saves, handles session expiry and never renders arbitrary API error text

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'if((!dirty&&version!==null)||saving.c…'
  - Expected
  + Received
  - if((!dirty&&version!==null)||saving.current)return
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import {useRef,useState} from "react";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat12-grid-columns-round3.test.ts (1 failing)
- chat-12 Students responsive grid and column preference > TPO-students-51 keeps mobile row actions always visible while preserving filters

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<TpoSpreadsheetGrid mobilePrimaryKeys='
  - Expected
  + Received
  - <TpoSpreadsheetGrid mobilePrimaryKeys=
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat12-round4-after-college.test.ts (1 failing)
- chat-12 after-college graceful outcomes > GR-90 uses an announced role alert for failed requests

  ```
  AssertionError: expected '"use client";\nimport {Select} from "…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import {Select} from "@/components/ui/select";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  +
  ```

## tests/unit/chat12-tpo-general-request-review-facts.test.ts (1 failing)
- TPO general requests review evidence > TPO-requests-verification-01 safely warns for missing, unsafe or credential-bearing proof

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useS…' to contain 'role="alert" className="text-warning-…'
  - Expected
  + Received
  - role="alert" className="text-warning-text">No proof attached
  + "use client";
  + import {useEffect,useState} from "react";
  + import {apiFetch} from "@/lib/api-fetch";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/chat13-admin-first-third-audit.test.ts (37 failing)
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-academics requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to match /min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import Link from \"next/link\";
  import { redirect } from \"next/navigation\";
  import { isSuperAdmin } from \"@/modules/identity/context\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-announcements requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {MetricBar} from \"@/components/ui/metric-bar\";
  import chartStyles from \"@/components/placements/report-bar-chart.module.css\";
  import {Select} from \"@/components/ui/select\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-assignments requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to match /min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import Link from \"next/link\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import {isSuperAdmin} from \"@/modules/identity/context\";
  import { EmptyState } from \"@/components/ui/empty-state\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-attendance requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' not to match /min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import { getCurrentRequestContext } from \"@/auth/request-context\";
  import Link from \"next/link\";
  import {ErrorState} from \"@/components/ui/error-state\";
  import {
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-audit requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to match /<table(?:\s|>)/
  - Expected:
  /<table(?:\s|>)/
  + Received:
  "import Link from \"next/link\";
  import {redirect} from \"next/navigation\";
  import ActivityPage from \"@/app/(authenticated)/activity/page\";
  import {getCurrentRequestContext} from \"@/auth/request-context\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-batch-promotion requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import {Checkbox} from "@/components/…' not to match /min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import {Checkbox} from \"@/components/ui/checkbox\";
  import {Button} from \"@/components/ui/button\";
  import {Select} from \"@/components/ui/select\";
  import {Input} from \"@/components/ui/input\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-batches requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {Select} from \"@/components/ui/select\";
  import {Input} from \"@/components/ui/input\";
  import { AcademicSetupSteps } from \"@/components/admin/academic-setup-steps\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-batches-[batchId]-students requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to match /min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import Link from \"next/link\";
  import {PageHeader} from \"@/components/ui/page-header\";
  import {Breadcrumbs} from \"@/components/ui/breadcrumbs\";
  import {DataTable} from \"@/components/ui/data-table\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-classes requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {Select} from \"@/components/ui/select\";
  import {Input} from \"@/components/ui/input\";
  import { AcademicSetupSteps } from \"@/components/admin/academic-setup-steps\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-colleges requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {inArray,sql} from \"drizzle-orm\";
  import {getDb} from \"@/db/client\";
  import {collegeMemberships} from \"@/db/schema\";
  ```
- … 27 more in this file

## tests/unit/chat13-final-sprint-tpo-home-r08.test.ts (1 failing)
- TPO-home-R08 loads independent Home signals concurrently and fails each heavy source independently

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'const batches=batchResult??{ready:fal…'
  - Expected
  + Received
  - const batches=batchResult??{ready:false,batches:[]}
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import {TpoHomeReturnRefresh} from "@/components/tpo/tpo-home-return-refresh";
  + import {eq} from "drizzle-orm";
  ```
