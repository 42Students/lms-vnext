# Work packet (wave 2): edit src/components/shell/shell-model.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/cross-02-authorization-roles.md, docs/audit/gap2/lane-2/l12-u031-global-shell.md, docs/audit/gap2/lane-8/l11-u027-feature-flags.md

## G2-2-036-001  [P2] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/configuration/WebSecurityConfig.java:113-199 role-fenced Spring routes /api/v1/v2
- vNext now: src/components/shell/shell-model.ts:141-330 seven distinct account portal routes
- Fix: Map every old role+method+path to new UI and API route.

## G2-2-036-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/RecruiterFenceFilter.java:30-52 recruiter API-only entry scope
- vNext now: src/components/shell/shell-model.ts:309-315 recruiter Today,Drives,Calendar,Messages,Company & Team
- Fix: Document precise recruiter role entry and private API fence.

## G2-2-036-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/configuration/WebSecurityConfig.java:155-158 /api/v1/tpo TPO/Admin/Faculty
- vNext now: src/components/shell/shell-model.ts:291-307 TPO 15-row nav
- Fix: Gate each visible tab on TPO role/delegation and tenant.

## G2-2-036-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/common/adminNavGroups.js:1-15 grouped College Admin tabs
- vNext now: src/components/shell/shell-model.ts:319-329 College Admin compact links
- Fix: Clone inner grouped-tab order, spacing and active highlight.

## G2-2-036-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/TpoTeamAccessFilter.java:21-23 TPO access only college team
- vNext now: src/components/shell/shell-model.ts:291-307 TPO links defined for role
- Fix: Hide denied TPO links while preserving server denial.

## G2-2-036-007  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/common/superAdminNavGroups.js:98-108 standalone global tools
- vNext now: src/components/shell/shell-model.ts:142-155 Tenant Setup,Feature Controls,Module Access,Activity Log
- Fix: Show scope-required affordances independently of menu presence.

## G2-2-036-008  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/TpoTeamAccessFilter.java:60-63 my-access discovery returns empty role for nonteam faculty
- vNext now: src/components/shell/shell-model.ts:291-307 TPO workspace nav only
- Fix: Provide no-team explanation when exploring placement team access.

## G2-2-036-015  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/security/RecruiterFenceFilter.java:97-119 recruiter hub only me and pending invites
- vNext now: src/components/shell/shell-model.ts:309-315 full recruiter menu list
- Fix: Hide inaccessible HR sections until selected active college grant.

## G2-12-031-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/common/lists.js:55-123 learner sidebar exact course/quiz/assignment/calendar routes
- vNext now: src/components/shell/shell-model.ts:157-225 learner nav under /learn
- Fix: Map old URL aliases and active tab fallback on redirects.

## G2-11-027-026  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:15-17 nav consumers use flags across viewport from same API.
- vNext now: src/components/shell/shell-model.ts:1-80 supports responsive roles; src/modules/module-access/learner-shell-access.ts:18-56 only learner flag helper.
- Fix: Verify mobile and desktop hide identical disabled modules for every role.
