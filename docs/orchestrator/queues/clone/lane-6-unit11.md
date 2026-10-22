# Unit-test repair queue (unit11): lane chat-6

CI run 39819012064 on main (3bc2f60a) failed these unit tests. Do this AFTER your deep packets 1-2 in lane-6-deep.md. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/PROJ-BREAK-SA-workspace-brief-isolation.test.ts` (1 failing)
- [ ] `tests/unit/chat11-super-admin-tenant-route-guard.test.ts` (1 failing)
- [x] `tests/unit/chat2-UX-tpo-overlay-01.test.ts` (branch already has corrected canonical More page assertion; verified footer wiring) (1 failing)
- [ ] `tests/unit/chat5-program-server-directory-wiring.test.ts` (1 failing)
- [ ] `tests/unit/chat8-verify2-audit-credits.test.ts` (1 failing)
- [x] `tests/unit/learner-coding-profile-privacy.test.ts` (branch already expects valid HTTPS GitHub URL; rejects spoofed hosts and HTTP) (1 failing)
- [ ] `tests/unit/tpo-team-workload-chat2.test.ts` (2 failing)

## Failures (from CI log)

### tests/unit/PROJ-BREAK-SA-workspace-brief-isolation.test.ts

```
 FAIL  tests/unit/PROJ-BREAK-SA-workspace-brief-isolation.test.ts > Super Admin workspace brief isolation and malformed persisted JSON > PROJ-BREAK-SA-24 retains strict, bounded, independent valid brief parsing
AssertionError: expected { goal: 'Ship a project', …(4) } to deeply equal { goal: '', description: '', …(3) }

- Expected
+ Received

  {
-   "completionConditions": [],
-   "deliverables": [],
-   "description": "",
-   "goal": "",
-   "personas": [],
+   "completionConditions": [
+     "compiled",
+   ],
+   "deliverables": [
```

### tests/unit/chat11-super-admin-tenant-route-guard.test.ts

```
 FAIL  tests/unit/chat11-super-admin-tenant-route-guard.test.ts > SA-tenants-modules-SEC-01: never render admin filter recovery before authorization > authenticates every route before handling hostile and repeated query parameters
AssertionError: src/app/(authenticated)/admin/tenants/page.tsx: expected -1 to be greater than -1
 ❯ tests/unit/chat11-super-admin-tenant-route-guard.test.ts:61:22
     59|    const noSpace=source.indexOf("if(!parsed)");
     60|    const recovery=[invalid,invalidNoSpace,whitespace,noSpace].filter(i…
     61|    expect(auth,file).toBeGreaterThan(-1);
       |                      ^
     62|    // Module Access delegates URL validation to the college hierarchy …
     63|    // its own selection and authorization are checked before that hand…

```

### tests/unit/chat2-UX-tpo-overlay-01.test.ts

```
 FAIL  tests/unit/chat2-UX-tpo-overlay-01.test.ts > UX-tpo-overlay: focus-safe mobile and desktop workflows > UX-tpo-overlay-03 mobile More menu traps focus and dismisses by Escape/backdrop
AssertionError: expected '"use client";\nimport Image from "nex…' to contain '<BottomSheet open={moreOpen} onOpenCh…'

- Expected
+ Received

- <BottomSheet open={moreOpen} onOpenChange={setMoreOpen} title="More TPO workspaces"
+ "use client";
+ import Image from "next/image";
+ import Link from "next/link";
+ import "@/components/shell/legacy-mobile-footer.css";
+ import { usePathname } from "next/navigation";
+
+ /** Legacy phone footer destinations. More opens the actual /tpo/more page
+  * instead of a competing BottomSheet that hid the page navigation. */
+ const links = [
```

### tests/unit/chat5-program-server-directory-wiring.test.ts

```
 FAIL  tests/unit/chat5-program-server-directory-wiring.test.ts > G2-18-026-048 Super Admin program server directory > wires selected-college pagination to a bounded SQL reader
AssertionError: expected 'export async function listProgramsPag…' to contain 'q ? or(ilike(programs.name,like)'

- Expected
+ Received

- q ? or(ilike(programs.name,like)
+ export async function listProgramsPage(
+   context: RequestContext,
+   collegeIdInput: string,
+   raw: { departmentId?: string | null; q?: string; page?: number; pageSize?: number; includeArchived?: boolean } = {},
+ ) {
+   const collegeId = collegeIdSchema.parse(collegeIdInput);
+   const college = await loadAcademicCollegeScope(collegeId);
+   requirePermission(context, "academics.read", {
+     organizationId: college.organizationId, collegeId,
```

### tests/unit/chat8-verify2-audit-credits.test.ts

```
 FAIL  tests/unit/chat8-verify2-audit-credits.test.ts > lane-8 verify2: semester credits and audit stale recovery > distinguishes blank credits from valid zero-credit legacy mappings
AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'creditsValue.trim() ? "Enter credits …'

- Expected
+ Received

- creditsValue.trim() ? "Enter credits from 0 to 30" : "Enter credits"
+ "use client";
+
+ import { Select } from "@/components/ui/select";
+ import { Input } from "@/components/ui/input";
+ import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
+ import { usePathname, useRouter } from "next/navigation";
+ import Link from "next/link";
+ import { Alert } from "@/components/ui/alert";
+ import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
```

### tests/unit/learner-coding-profile-privacy.test.ts

```
 FAIL  tests/unit/learner-coding-profile-privacy.test.ts > never renders spoofed profile hosts or unsafe schemes
AssertionError: expected 'https://github.com/real' to be null

- Expected:
null

+ Received:
"https://github.com/real"

 ❯ tests/unit/learner-coding-profile-privacy.test.ts:1:473


```

### tests/unit/tpo-team-workload-chat2.test.ts

```
 FAIL  tests/unit/tpo-team-workload-chat2.test.ts > Team workload sorting > TPO-inbox-team-31 uses only scoped OPEN ask records for real per-person workload
AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/tpo/settings/team")'

- Expected
+ Received

- redirect("/tpo/settings/team")
+ import { redirect } from "next/navigation";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
+ import { hasMembershipRole } from "@/modules/identity/context";
+
+ type LegacyTeamSearch = Record<string, string | string[] | undefined>;
+
+ function first(value: string | string[] | undefined): string | undefined {
+   return Array.isArray(value) ? value[0] : value;

 FAIL  tests/unit/tpo-team-workload-chat2.test.ts > Team workload sorting > TPO-inbox-team-22 exposes ask status in People without fabricating work for other colleges
AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/tpo/settings/team")'

- Expected
+ Received

- redirect("/tpo/settings/team")
+ import { redirect } from "next/navigation";
+ import { getCurrentRequestContext } from "@/auth/request-context";
+ import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
+ import { hasMembershipRole } from "@/modules/identity/context";
+
+ type LegacyTeamSearch = Record<string, string | string[] | undefined>;
+
+ function first(value: string | string[] | undefined): string | undefined {
+   return Array.isArray(value) ? value[0] : value;
```


## Branch repair verification (chat-6)

- `chat2-UX-tpo-overlay-01.test.ts`: existing branch test asserts `/tpo/more` navigation, accessible landmark, keyboard focus and same-tab `Link`; verified in `src/components/tpo/tpo-mobile-footer.tsx:8-42`. The original main CI assertion required a BottomSheet even though the canonical More destination is an accessible page. Assertion was already corrected on this branch; no test weakening.
- `learner-coding-profile-privacy.test.ts`: branch test correctly accepts an HTTPS `github.com` profile and still rejects unsafe schemes, userinfo, spoofed hosts and HTTP. `src/modules/placements/learner-coding-profile-link.ts:5-11` applies the safe profile normalization. The original CI assertion incorrectly required a valid profile URL to be null. Existing branch correction verified; no product mutation required.
