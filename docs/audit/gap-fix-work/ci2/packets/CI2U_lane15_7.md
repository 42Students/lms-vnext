# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-recruiter-messaging-double-actions-16.test.ts (3 failing)
- chat-16 recruiter messaging double-action and draft recovery > UX-chat16-recruiter-message-reply-01 blocks same-tick duplicate POSTs even before React rerenders

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'if(sending||submitPendingRef.current)…'
  - Expected
  + Received
  - if(sending||submitPendingRef.current)return;
  + "use client";
  + import {useEffect,useRef,useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```
- chat-16 recruiter messaging double-action and draft recovery > UX-chat16-recruiter-message-reply-02 retains the draft after an unconfirmed send

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'else setNotice("Could not send. "+fee…'
  - Expected
  + Received
  - else setNotice("Could not send. "+feedback)
  + "use client";
  + import {useEffect,useRef,useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```
- chat-16 recruiter messaging double-action and draft recovery > UX-chat16-recruiter-message-read-03 serializes the initial acknowledgement with manual retries

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'role="status"'
  - Expected
  + Received
  - role="status"
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { Button } from "@/components/ui/button";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/chat19-hr-shared-controls-complete.test.ts (1 failing)
- NORTH-STAR chat-19 shared HR controls > leaves no raw interactive HTML controls across the 19 recruiter components

  ```
  AssertionError: hr-drive-draft-form: expected '"use client";\nimport { Alert } from …' not to match /<(?:button|input|select|textarea)\b/
  - Expected:
  /<(?:button|input|select|textarea)\b/
  + Received:
  "\"use client\";
  import { Alert } from \"@/components/ui/alert\";
  import { InlineNotice } from \"@/components/ui/inline-notice\";
  import { useToast } from \"@/components/ui/toast\";
  ```

## tests/unit/chat2-campaign-batch-persistence.test.ts (2 failing)
- TPO campaign delivery receipts and audit > TPO-campaigns-public-04 commits a college-scoped batch before sending and actual opaque statuses after

  ```
  AssertionError: expected 5232 to be less than -1
  ❯ tests/unit/chat2-campaign-batch-persistence.test.ts:11:66
  9|   expect(service).toContain("tx.insert(messagingDeliveryBatches).value…
  10|   expect(service).toContain("organizationId:college.organizationId,col…
  11|   expect(service.indexOf("tx.insert(messagingDeliveryBatches)")).toBeL…
  |                                                                  ^
  12|   expect(service).toContain("recipientKey:placementTpoEmailCampaignRec…
  13|   expect(service).toContain("eq(placementTpoEmailCampaignRecipients.co…
  ```
- TPO campaign delivery receipts and audit > TPO-campaigns-public-04 never claims delivery from provider acceptance or violates EMAIL event constraints

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'Provider acceptance does not prove re…'
  - Expected
  + Received
  - Provider acceptance does not prove recipient delivery
  + import { Alert } from "@/components/ui/alert";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Dropdown } from "@/components/ui/dropdown";
  ```

## tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts (14 failing)
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-26 gives separate bounded first and last names

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'key==="title"?160:100'
  - Expected
  + Received
  - key==="title"?160:100
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  + import { Alert } from "@/components/ui/alert";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-32 provides scoped company name, safe website, domain, industry fallback and initials

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'result.company.name.trim().charAt(0).…'
  - Expected
  + Received
  - result.company.name.trim().charAt(0).toUpperCase()
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-33 keeps a college-private trust classification from appearing as a recruiter permission

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'Linked by the placement cell'
  - Expected
  + Received
  - Linked by the placement cell
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-34 shows own-company teammates and actual attributed drive counts

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'drive(s) here'
  - Expected
  + Received
  - drive(s) here
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-35 distinguishes verified report status buckets and never counts withdrawals as offers

  ```
  AssertionError: expected 'import { SummaryStrip } from "@/compo…' to contain 'key:"applied",header:"Applications"'
  - Expected
  + Received
  - key:"applied",header:"Applications"
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Tabs } from "@/components/ui/tabs";
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-report-funnel.module.css";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-36 matches legacy recruiter company header label without CSS changes

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'eyebrow="Recruiter"'
  - Expected
  + Received
  - eyebrow="Recruiter"
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-41 keeps verified invite email read-only and discloses permission-bounded student access

  ```
  AssertionError: expected '"use client";\n\nimport authStyles fr…' to contain '<Input type="email" readOnly value={i…'
  - Expected
  + Received
  - <Input type="email" readOnly value={invite.contactEmail??""}
  + "use client";
  +
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-26 independent final-sprint acceptance regression

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'maxLength={key==="phone"?14:key==="ti…'
  - Expected
  + Received
  - maxLength={key==="phone"?14:key==="title"?160:100}
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  + import { Alert } from "@/components/ui/alert";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-30 independent final-sprint acceptance regression

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'window.confirm('
  - Expected
  + Received
  - window.confirm(
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-32 independent final-sprint acceptance regression

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'result.company.name.trim().charAt(0).…'
  - Expected
  + Received
  - result.company.name.trim().charAt(0).toUpperCase()
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```
- … 4 more in this file

## tests/unit/chat2-team-college-admin-access.test.ts (1 failing)
- College placement team access > TPO-inbox-team-37 lists college administrators in the Team People roster

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'member.roles.includes("COLLEGE_ADMIN")'
  - Expected
  + Received
  - member.roles.includes("COLLEGE_ADMIN")
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat2-tpo-member-workload-parity.test.ts (1 failing)
- TPO Team People persisted workloads > TPO-inbox-team-31 shows real drive, company, overdue follow-up and waiting-on-teammate numbers

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'readTpoTeamOwnershipWorkload(context)'
  - Expected
  + Received
  - readTpoTeamOwnershipWorkload(context)
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
