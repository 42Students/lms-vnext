# Unit-test repair queue (unit13): lane chat-6

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/PROJ-BREAK-chat9-admin-programs-page.test.tsx` (1 failing)
- [ ] `tests/unit/chat4-super-admin-projects-gap-closure.test.ts` (1 failing)
- [ ] `tests/unit/tpo-recruiters-13-invite-readiness.test.ts` (2 failing)

## Failures (from CI log)

### tests/unit/PROJ-BREAK-chat9-admin-programs-page.test.tsx

```
 FAIL  tests/unit/PROJ-BREAK-chat9-admin-programs-page.test.tsx > Super Admin last-third Programs: cross-role, partial outage and scoped directory > UX-admin-programs-37 missing selected college never performs cross-tenant fallback
AssertionError: expected 'Programs Choose a college in the head…' to contain 'Read-only program catalogue'

Expected: "Read-only program catalogue"
Received: "Programs Choose a college in the header above to create or edit Programs. This program catalogue is read-only until a college is selected. 0  active programs across active colleges. Page  1  of  1 . No programs found No active college programs are available in the platform catalogue. This list is informational. Changes require an explicitly selected college."

 ❯ tests/unit/PROJ-BREAK-chat9-admin-programs-page.test.tsx:81:21
     79|     state.selected=false;
     80|     const content=readable(await SuperAdminProgramsPage({searchParams:…
     81|     expect(content).toContain("Read-only program catalogue");
       |                     ^
     82|     expect(content).toContain("Changes require an explicitly selected …
     83|     expect(state.global).toBe(1);

```

### tests/unit/chat4-super-admin-projects-gap-closure.test.ts

```
 FAIL  tests/unit/chat4-super-admin-projects-gap-closure.test.ts > chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-92 preserves origin, reason, breadcrumb and admin shortcut URLs
AssertionError: expected 'import {redirect,notFound} from "next…' to contain 'from={one(query.from)}'

- Expected
+ Received

- from={one(query.from)}
+ import {redirect,notFound} from "next/navigation";
+ import {z} from "zod";
+ import {and,eq,isNull} from "drizzle-orm";
+ import {getDb} from "@/db/client";
+ import {projectInstances} from "@/db/schema";
+ import {getCurrentRequestContext} from "@/auth/request-context";
+ import {isSuperAdmin} from "@/modules/identity/context";
+ import {requireProjectManageAccess} from "@/modules/projects/access";
+ import {AdminProjectSectionPage} from "@/components/projects/admin-project-section-page";
```

### tests/unit/tpo-recruiters-13-invite-readiness.test.ts

```
 FAIL  tests/unit/tpo-recruiters-13-invite-readiness.test.ts > TPO-recruiters-13 PUB-auth-public-40 cannot issue dead-end invitations > requires a linked company before token rotation and avoids claiming delivery without a verified work email
AssertionError: expected -1 to be greater than -1
 ❯ tests/unit/tpo-recruiters-13-invite-readiness.test.ts:8:17
      6|   // Both persisted requirements must be enforced before a credential …
      7|   const pivot=service.indexOf("if(!lead.emailNorm||!lead.companyRelati…
      8|   expect(pivot).toBeGreaterThan(-1);
       |                 ^
      9|   expect(pivot).toBeLessThan(service.indexOf("let credential;",pivot));
     10|   expect(service).toContain("TPO_RECRUITER_INVITE_NOT_ALLOWED");


 FAIL  tests/unit/tpo-recruiters-13-invite-readiness.test.ts > TPO-recruiters-13 PUB-auth-public-40 cannot issue dead-end invitations > shows the requirement in both row and detail actions
AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'Add a work email and link a company b…'

- Expected
+ Received

- Add a work email and link a company before inviting.
+ "use client";
+ import { PageHeader } from "@/components/ui/page-header";
+ import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
+ import { Banner } from "@/components/ui/banner";
+ import { Button } from "@/components/ui/button";
+ import { Input } from "@/components/ui/input";
+ import { Select } from "@/components/ui/select";
+ import { Textarea } from "@/components/ui/textarea";
+ import { StatusBadge } from "@/components/ui/status-badge";
```

