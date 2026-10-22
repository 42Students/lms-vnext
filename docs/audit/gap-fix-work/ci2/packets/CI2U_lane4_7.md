# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-reassigned-tracker-parity.test.ts (3 failing)
- chat-16 reassigned tracker issue workflows > SA-placements-projects-101 binds reports to authenticated user and returns only that user's list/detail

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'context.user.platformStatus !== "ACTI…'
  - Expected
  + Received
  - context.user.platformStatus !== "ACTIVE"
  + import { Banner } from "@/components/ui/banner";
  + import { ErrorState } from "@/components/ui/error-state";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-16 reassigned tracker issue workflows > SA-placements-projects-106 selects page issues and performs authorized optimistic writes while retaining failed IDs

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'for(const id of selected)'
  - Expected
  + Received
  - for(const id of selected)
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```
- chat-16 reassigned tracker issue workflows > SA-placements-projects-107 saves, restores and deletes named views without persisting pagination cursors

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'Save current filters'
  - Expected
  + Received
  - Save current filters
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Dialog } from "@/components/ui/dialog";
  ```

## tests/unit/chat16-tracker-findings-sync-r6.test.ts (1 failing)
- chat-16 independent audit findings sync evidence > SA-placements-projects-120 shows only persisted sync history, never synthetic GitHub sync success

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'if(!independentAuditFindingsReady())r…'
  - Expected
  + Received
  - if(!independentAuditFindingsReady())return null;
  + import "server-only";
  + import {and,asc,count,desc,eq,ilike,inArray,or,sql,type SQL} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {db10AuditFindings,db10AuditFindingEvents,db10AuditFindingSyncs,db10AuditFindingFiles} from "@/db/schema/db10-audit-findings.draft";
  ```

## tests/unit/chat19-sidebar-hr-original-icons-and-secondary-surfaces.test.ts (4 failing)
- NORTH-STAR-SIDEBAR-03: measured original icons and mobile group parity > keeps only one expanded-logo rule and clips scroll horizontally

  ```
  AssertionError: expected '/*\n * Legacy sidebar shell (docs/des…' to contain 'box-shadow:inset 3px 0 #26bac7'
  - Expected
  + Received
  - box-shadow:inset 3px 0 #26bac7
  + /*
  +  * Legacy sidebar shell (docs/design/old-lms-shell.css).
  +  * Desktop: 96px rail -> 256px on hover/focus, content PUSHES right.
  +  * Mobile uses the existing focus-trapped drawer and always shows labels.
  ```
- NORTH-STAR-HR-03: secondary recruiter surfaces inherit page canvas > avoids nesting a separate full-panel card around the outside drive form

  ```
  AssertionError: expected 'import { Textarea } from "@/component…' to contain 'className="grid gap-4 sm:grid-cols-2"'
  - Expected
  + Received
  - className="grid gap-4 sm:grid-cols-2"
  + import { Textarea } from "@/components/ui/textarea";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```
- NORTH-STAR-HR-03: secondary recruiter surfaces inherit page canvas > retains the incoming 36px recruiter bell while enforcing legacy focus and radius

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'min-h-9 min-w-9'
  - Expected
  + Received
  - min-h-9 min-w-9
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import { Button } from "@/components/ui/button";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- NORTH-STAR-HR-03: secondary recruiter surfaces inherit page canvas > keeps every recruiter operation while using the 9px control token

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain 'if(!parsed.success)return <div role="…'
  - Expected
  + Received
  - if(!parsed.success)return <div role="alert" className="space-y-3">
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```

## tests/unit/chat2-company-memory-gap-parity.test.ts (2 failing)
- TPO Company Memory legacy parity > TPO-companies-09 maps stored placement status to readable legacy labels

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'PUBLISHED:"Live"'
  - Expected
  + Received
  - PUBLISHED:"Live"
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```
- TPO Company Memory legacy parity > TPO-companies-21 never exposes DB migration identifiers or raw not-found jargon

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'Company details are unavailable right…'
  - Expected
  + Received
  - Company details are unavailable right now. Try again.
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```

## tests/unit/chat2-public-join-states.test.ts (3 failing)
- Public recruiter invitation parity > TPO-campaigns-public-24 shows the college-link loading error and exact retry

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'We couldn&apos;t load this page'
  - Expected
  + Received
  - We couldn&apos;t load this page
  + import { PageHeader } from "@/components/ui/page-header";
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  + import Link from "next/link";
  + import {Card} from "@/components/ui/card";
  ```
- Public recruiter invitation parity > TPO-campaigns-public-R03 labels already joined versus first join from server outcome

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'setAlreadyJoined(result.outcome==="AL…'
  - Expected
  + Received
  - setAlreadyJoined(result.outcome==="ALREADY_JOINED")
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  ```
- Public recruiter invitation parity > TPO-campaigns-public-R07 permits approved company subdomains but rejects lookalikes

  ```
  AssertionError: expected 'import {publicWorkEmailIssue,publicWo…' to contain 'domain.endsWith("."+approvedDomain)'
  - Expected
  + Received
  - domain.endsWith("."+approvedDomain)
  + import {publicWorkEmailIssue,publicWorkEmailIssueCopy} from "@/modules/placements/public-work-email-policy";
  + import {publicRecruiterWorkEmailSchema} from "@/modules/placements/public-college-join-model";
  + /** REC-calendar-messages-profile-R04/39/45: identify recoverable public join errors
  +  * without leaking email existence, verifying the user client-side, or claiming success. */
  ```

## tests/unit/chat2-tpo-engage-companies-independent.test.ts (1 failing)
- TPO companies independent of recruiter lead filters > TPO-recruiters-R02 does not hide company-derived directory behind the lead empty state

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'href={"/tpo/companies?name="+encodeUR…'
  - Expected
  + Received
  - href={"/tpo/companies?name="+encodeURIComponent(company.name)}
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```
