# Unit-test repair queue (unit13): lane chat-18

CI run 39849936419 on main (3c24c0c0), the LATEST run failed these unit tests. These STILL FAIL even though unit11 was ticked: ticking is not fixing. Read the CURRENT failure below, change code, and only tick after you pushed a real code or test change that makes the assertion pass. For each file: read the failure below, read the test and the code it tests, decide which side is wrong against the old LMS (docs/legacy-source) and fix THAT side (fix the product code if it regressed; update the test only if the test asserts outdated/wrong behaviour). Never delete tests, never .skip, never weaken assertions to pass. Push after every file and tick it here.

- [ ] `tests/unit/chat2-team-college-admin-access.test.ts` (1 failing)
- [ ] `tests/unit/learner-drive-error-recovery-lane18.test.ts` (1 failing)

## Failures (from CI log)

### tests/unit/chat2-team-college-admin-access.test.ts

```
 FAIL  tests/unit/chat2-team-college-admin-access.test.ts > College placement team access > TPO-inbox-team-37 lists college administrators in the Team People roster
AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/tpo/settings?tab=team")'

- Expected
+ Received

- redirect("/tpo/settings?tab=team")
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

### tests/unit/learner-drive-error-recovery-lane18.test.ts

```
 FAIL  tests/unit/learner-drive-error-recovery-lane18.test.ts > G2-15-005-030: learner drive not-found versus error > keeps privacy-preserving missing-drive copy distinct from broken data sources
AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="This drive can\'t be shown"'

- Expected
+ Received

- title="This drive can't be shown"
+ import Link from "next/link";
+ import { PageHeader } from "@/components/ui/page-header";
+ import { Banner } from "@/components/ui/banner";
+ import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";
+ import { Tabs } from "@/components/ui/tabs";
+ import { EmptyState } from "@/components/ui/empty-state";
+ import { ErrorState } from "@/components/ui/error-state";
+ import { AuthorizationError } from "@/modules/permissions/policy";
+ import { getCurrentRequestContext } from "@/auth/request-context";
```

