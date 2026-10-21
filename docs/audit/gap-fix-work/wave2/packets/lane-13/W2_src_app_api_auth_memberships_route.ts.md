# Work packet (wave 2): edit src/app/api/auth/memberships/route.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-1/cross-auth.md, docs/audit/gap2/lane-1/public-mobile-auth-controller.md, docs/audit/gap2/lane-2/cross-02-authorization-roles.md

## G2-1-002-001  [P2] GAP  facet F01  effort M
- Legacy: `AuthController.java:53,142-181` GET `/api/v1/auth/memberships` reachable from account/college switching.
- vNext now: `src/app/api/auth/memberships/route.ts:83-96` GET `/api/auth/memberships`; `src/app/api/auth/admin-scope/route.ts:18-30` splits Super Admin scope.
- Fix: Document replacement routes for legacy clients, and update navigation to membership chooser versus admin scope picker.

## G2-1-002-008  [P2] GAP  facet F02  effort S
- Legacy: `AuthController.java:142-181` membership response supplies list plus `currentMembershipKey` and current membership in one request.
- vNext now: `src/app/api/auth/memberships/route.ts:83-96` only `{memberships}`; active selection resolved from `context`/cookies elsewhere.
- Fix: Expose selected membership alongside choices when UI cannot infer active state securely, or document reliable selected-state source.

## G2-1-002-012  [P2] GAP  facet F04  effort M
- Legacy: `AuthController.java:152-181` exposes `memberships`, `currentMembershipKey`, optional `currentMembership` plus four `domain*`/proxy flags.
- vNext now: `src/app/api/auth/memberships/route.ts:87-92` only returns `memberships`; `hostCollegeScope:68-81` enforces tenant independently.
- Fix: Keep user-visible active-membership info and domain enforcement messaging; do not expose internal trust flags unless required.

## G2-1-002-053  [P2] GAP  facet F13  effort M
- Legacy: `AuthController.java:118-140,220-256,494-517,1093-1157` explicit 401/403/404/410/429/503 states but no rendered offline UI in controller.
- vNext now: `src/app/api/auth/memberships/route.ts:33-61,98-128` returns 401/403/400/413/503, device APIs use apiErrorResponse; UI recovers via full login and toast.
- Fix: Write and test per-error recovery for expired session, unreachable DB, invalid membership and stale tenant host.

## G2-1-002-063  [P2] GAP  facet F18  effort M
- Legacy: `AuthController.java:220-239` errors `Not a member of target org`; `:498-516` `token required`, `Invalid token`, `Expired token`.
- vNext now: `src/app/api/auth/memberships/route.ts:33-60,121-145`, `auth/handoff/page.tsx:3-8` machine-coded errors/redirect.
- Fix: Build literal old-to-new copy mapping at UI boundary; retain type-safe machine codes.

## G2-1-036-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:220-360: switch between organizations and roles, possibly cross-host.
- vNext now: src/app/api/auth/memberships/route.ts:83-177: GET memberships then POST role+membership; host scoped.
- Fix: Document role-switch navigation and legacy switch-token equivalent.

## G2-1-036-006  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:600-645: Available accounts radiogroup grouped by college.
- vNext now: src/app/api/auth/memberships/route.ts:83-177: memberships returned after authenticated identity, not in login form.
- Fix: Provide analogous post-login chooser UI and label/role badges.

## G2-1-036-031  [P2] GAP  facet F09  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AuthController.java:220-360: cross-host switch redirect/confirm by navigation.
- vNext now: src/app/api/auth/memberships/route.ts:98-177: membership switch POST and cookie set.
- Fix: Align signed-out target-host handoff error/retry states.

## G2-1-006-012  [P2] GAP  facet F04  effort M
- Legacy: `PublicMobileAuthController.java:1281-1294` choices include choiceId,key,userType,label,role,collegeId,orgId,host,verified,primary,suspended.
- vNext now: `src/app/api/auth/memberships/route.ts:83-96` authenticated `{memberships}`, scoped choices with UUID and statuses.
- Fix: Display legacy role/college/status semantics after OTP with mapped membership IDs.

## G2-2-036-041  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/RecruiterFenceFilter.java:30-52 recruiter own session actions
- vNext now: src/app/api/auth/memberships/route.ts:83-200 self role-switch handling
- Fix: Audit recruiter grant export/private requests for active college.
