# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/mentor-project-order.test.ts (1 failing)
- uses stable id for matching titles and times

  ```
  AssertionError: expected 0 to be less than 0
  ❯ tests/unit/mentor-project-order.test.ts:5:97
  3| it("sorts by latest update",()=>expect([...p].sort((a,b)=>c(a,b,"RECEN…
  4| it("supports title order with archived last",()=>expect([...p].sort((a…
  5| it("uses stable id for matching titles and times",()=>expect(c({...p[0…
  |                                                                                                 ^
  ```

## tests/unit/proj-break-chat9-models.test.ts (1 failing)
- IIT Dharwad Projects adversarial admin/college models > PROJ-BREAK-exports-02 quoted commas, quotes and multiline fields do not create a new column

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/rec-notification-bell.test.ts (1 failing)
- REC-calendar-messages-profile-21 recruiter notification bell > polls every 30 s, and scopes mark-read to caller and employer grants

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Loading notifications…'
  - Expected
  + Received
  - Loading notifications…
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/sa-tenants-modules-20-primary-domain-transition.test.ts (1 failing)
- SA-tenants-modules-20 clears any former primary before promoting managed address

  ```
  AssertionError: expected 'if(current){\n   await tx.update(tena…' to contain 'eq(tenantDomains.isPrimary,true)'
  - Expected
  + Received
  - eq(tenantDomains.isPrimary,true)
  + if(current){
  +    await tx.update(tenantDomains).set({
  +     deletedAt:now,isPrimary:false,isVerified:false,verificationToken:null,
  +     updatedAt:now,lastCheckResult:"MANAGED_RETIRED",
  ```

## tests/unit/super-admin-videos-directory.test.ts (1 failing)
- Super Admin Videos directory pure model > includes hosted and YouTube videos, not other content

  ```
  AssertionError: expected 'YouTube' to be 'YouTube Video' // Object.is equality
  Expected: "YouTube Video"
  Received: "YouTube"
  ```

## tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts (2 failing)
- chat-5 OPEN gap regression baselines > TPO-drive-workspace-63 partial baseline — further implementation required

  ```
  AssertionError: expected '"use client";\n\nimport { Disclosure …' to contain 'Force'
  - Expected
  + Received
  - Force
  + "use client";
  +
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {
  ```
- chat-5 OPEN gap regression baselines > TPO-batches-34 partial baseline — further implementation required

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'Roll number:'
  - Expected
  + Received
  - Roll number:
  + import {Button} from "@/components/ui/button";
  + import {Disclosure} from "@/components/ui/disclosure";
  + import {Badge} from "@/components/ui/badge";
  + import {DataTable} from "@/components/ui/data-table";
  ```

## tests/unit/tpo-home-31-new-followup.test.ts (1 failing)
- TPO-home-31 quick-create follow-up modal > uses the pre-existing scoped leads and calendar follow-up routes

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain '"/api/placements/tpo/leads?collegeId=…'
  - Expected
  + Received
  - "/api/placements/tpo/leads?collegeId="+encodeURIComponent(collegeId)
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/tpo-students-csv.test.ts (1 failing)
- TPO Students CSV safety > exports only selected rows with stable column order

  ```
  AssertionError: expected '"Student","Roll number","Batch","Bran…' to contain '"READY_NOT_APPLYING"'
  - Expected
  + Received
  - "READY_NOT_APPLYING"
  + "Student","Roll number","Batch","Branch","Stage","After college","Profile verification","Best so far","Applications","Offers","Registration number","Email","Program","Placement registration","Participation","Readiness evidence","CGPA","10th %","12th %","Diploma %","UG %","Passing year","Gap years"
  + "'=HYPERLINK(""https://invalid.test"")","42","2026","Computer Science","Ready, not applying","","UNKNOWN","Not applied","0","0","","learner@example.test","B.Tech","PLACEMENTS","ELIGIBLE","Academic details recorded","8","","","","","","","Not verified","","0","","Ready, not applying","0","0","0","0
  +
  ```
