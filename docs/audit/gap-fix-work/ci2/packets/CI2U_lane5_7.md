# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-recruiter-digest-delivery-12.test.ts (3 failing)
- chat-16 recruiter unread mail bridge fail-closed and privacy behaviors > REC-MAIL-DIGEST-03 escapes HTML controls, caps excerpts to latest three and never retries POST

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- chat-16 recruiter unread mail bridge fail-closed and privacy behaviors > REC-MAIL-DIGEST-04 network outage or rejection never reports a successful message notification

  ```
  AssertionError: expected "vi.fn()" to be called 2 times, but got 0 times
  ❯ tests/unit/chat16-recruiter-digest-delivery-12.test.ts:82:27
  80|     vi.mocked(outboundFetch).mockResolvedValueOnce(new Response(null, …
  81|     expect(await sendRecruiterMessageDigest(payload, env)).toBe(false);
  82|     expect(outboundFetch).toHaveBeenCalledTimes(2);
  |                           ^
  83|   });
  84|   it("REC-MAIL-TEMPLATE-01 refuses authentication or password-reset te…
  ```
- chat-16 recruiter unread mail bridge fail-closed and privacy behaviors > REC-MAIL-TEMPLATE-02 invalid digest template disables worker before looking up private messages

  ```
  AssertionError: expected { examined: +0, sent: +0, …(3) } to deeply equal { examined: +0, sent: +0, …(1) }
  - Expected
  + Received
  {
  "enabled": false,
  "examined": 0,
  +   "operatorAlert": "Recruiter email bridge is not ready: TEMPLATE_NOT_CONFIGURED",
  +   "readinessReason": "TEMPLATE_NOT_CONFIGURED",
  ```

## tests/unit/chat16-tracker-live-log-severity-r6.test.ts (1 failing)
- chat-16 live log severity and privacy > SA-placements-projects-113 allows ERROR/WARNING only and never accepts arbitrary provider filters

  ```
  AssertionError: expected 'import {NextResponse} from "next/serv…' to contain 'const keys=["windowMinutes","pageToke…'
  - Expected
  + Received
  - const keys=["windowMinutes","pageToken","query","minimumSeverity"]
  + import {NextResponse} from "next/server";
  + import {z} from "zod";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {isSameOriginRequest} from "@/auth/origin";
  ```

## tests/unit/chat19-sidebar-hr-value-parity.test.ts (5 failing)
- NORTH-STAR-CHAT19-POLISH: measured legacy sidebar and HR control tokens > matches the legacy collapsed badge position, icon opacity and body/footer spacing

  ```
  AssertionError: expected '/*\n * Legacy sidebar shell (docs/des…' to contain 'border-right:1px solid #f1f4f9;'
  - Expected
  + Received
  - border-right:1px solid #f1f4f9;
  + /*
  +  * Legacy sidebar shell (docs/design/old-lms-shell.css).
  +  * Desktop: 96px rail -> 256px on hover/focus, content PUSHES right.
  +  * Mobile uses the existing focus-trapped drawer and always shows labels.
  ```
- NORTH-STAR-CHAT19-POLISH: measured legacy sidebar and HR control tokens > shows the drawer only below 768px and avoids a duplicate tablet menu slot

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'className="shrink-0 md:hidden"'
  - Expected
  + Received
  - className="shrink-0 md:hidden"
  + "use client";
  +
  + import Link from "next/link";
  + import { Suspense } from "react";
  ```
- NORTH-STAR-CHAT19-POLISH: measured legacy sidebar and HR control tokens > uses shared measured 9px radius and primary focus ring across all 22 HR routes

  ```
  AssertionError: src/app/(authenticated)/hr/company/reports/page.tsx: expected 'import { SummaryStrip } from "@/compo…' not to match /focus-visible:outline-primary(?:-text…/
  - Expected:
  /focus-visible:outline-primary(?:-text)?(?=[\s"'])/
  + Received:
  "import { SummaryStrip } from \"@/components/ui/summary-strip\";
  import { Tabs } from \"@/components/ui/tabs\";
  import { MetricBar } from \"@/components/ui/metric-bar\";
  import funnelStyles from \"@/components/hr/recruiter-report-funnel.module.css\";
  ```
- NORTH-STAR-CHAT19-POLISH: measured legacy sidebar and HR control tokens > keeps HR cards and controls on semantic legacy radii, not Tailwind defaults

  ```
  AssertionError: recruiter-profile-details-editor.tsx: expected '"use client";\nimport { Button } from…' not to match /\brounded-(?:md|lg|xl|2xl)\b/
  - Expected:
  /\brounded-(?:md|lg|xl|2xl)\b/
  + Received:
  "\"use client\";
  import { Button } from \"@/components/ui/button\";
  import { Input } from \"@/components/ui/input\";
  import { Alert } from \"@/components/ui/alert\";
  ```
- NORTH-STAR-CHAT19-POLISH: measured legacy sidebar and HR control tokens > prevents reintroducing numeric-radius and stale focus classes in HR client widgets

  ```
  AssertionError: hr-company-reports-grid.tsx: expected '"use client";\n\nimport Link from "ne…' not to match /focus-visible:outline-primary(?:-text…/
  - Expected:
  /focus-visible:outline-primary(?:-text)?(?=[\s"'])/
  + Received:
  "\"use client\";
  import Link from \"next/link\";
  import {useRouter} from \"next/navigation\";
  import type {MouseEvent} from \"react\";
  ```

## tests/unit/chat2-company-team-draft-route.test.ts (1 failing)
- Company Team posting routes and graceful draft retention > TPO-inbox-team-29 restricts company activity bell to active college placement-team recipients and links directly to a message

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'notifyIds.delete(membership.id)'
  - Expected
  + Received
  - notifyIds.delete(membership.id)
  + import "server-only";
  + import {and,asc,desc,eq,inArray} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat2-public-link-service-security-races.test.ts (1 failing)
- TPO-settings-audit-55 public links: live access and failure semantics > TPO-settings-audit-55 accepts placement admin role but never guesses a foreign college context

  ```
  AssertionError: expected { ready: false, domain: null, …(6) } to deeply equal { ready: false, domain: null, …(1) }
  - Expected
  + Received
  {
  "domain": null,
  +   "legacyEngagement": {
  +     "createdAt": null,
  +     "enabled": false,
  ```

## tests/unit/chat2-tpo-inbox-audience-44.test.ts (1 failing)
- TPO notice audience choice parity > TPO-inbox-team-44 supports multiple batch and branch choices without accepting arbitrary IDs as choices

  ```
  AssertionError: expected '"use client";\nimport {useState} from…' to contain 'multiple value={targets}'
  - Expected
  + Received
  - multiple value={targets}
  + "use client";
  + import {useState} from "react";
  + import {Input} from "@/components/ui/input";
  + import {Select} from "@/components/ui/select";
  ```
