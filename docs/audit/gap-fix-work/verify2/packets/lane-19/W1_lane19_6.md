# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-032-002 [P1] GAP facet F01
- Files: src/modules/placements/tpo-my-notifications-service.ts
- Legacy: Super Admin global notification fetchAll pageNo/pageSize (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:88-105`)
- Expected fix: Restore restricted platform-wide notification audit/list view.

## G2-12-024-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/tracker/logs/page.tsx
- Legacy: Query/detail separate endpoints `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:56-65`
- Expected fix: Restore Logs as primary page workbench.

## G2-4-027-004 [P1] GAP facet F01
- Files: src/app/api/lecture-halls/[hallId]/route.ts
- Legacy: PUT `/update/{id}` and DELETE `/delete/{id}` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:147-206`)
- Expected fix: Either implement legacy-compatible delete with schedule guard or explicitly retire it in navigation.

## G2-4-027-040 [P1] GAP facet F10
- Files: src/app/api/lecture-halls/[hallId]/route.ts
- Legacy: PUT edit, DELETE schedule-guarded removal (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:147-206`)
- Expected fix: Preserve mutation reachability by existing automation and UI.

## G2-4-026-090 [P1] GAP facet F23
- Files: src/modules/placements/public-page/content-model.ts
- Legacy: Below k=5 data entirely absent (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:101-113`)
- Expected fix: Do not reveal unavailable metric selection; align exact public disclosure.

## G2-4-025-017 [P1] GAP facet F05
- Files: src/modules/skills/catalog-service.ts
- Legacy: When fewer than 3 search results, try full-text then persisted synonyms; fuzzy only if zero (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SkillSearchService.java:118-145`)
- Expected fix: Implement tiered fallbacks including typo-distance ≤2 or formally approve changed relevance.

## G2-4-025-018 [P1] GAP facet F05
- Files: src/modules/skills/catalog-service.ts
- Legacy: Popular sorted by skills.usage_count DESC, displayName ASC (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SkillRepository.java:74-75`)
- Expected fix: Choose v1 vs v2 feed deliberately; expose separate popular endpoints if needed.

## G2-4-025-022 [P1] MISSING facet F06
- Files: src/app/api/skills/route.ts
- Legacy: Batch POST JSON `{skillIds:[integers]}`; null/empty accepted as success (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:114-125`)
- Expected fix: Implement authenticated POST with array validation and empty-batch idempotence.

## G2-4-025-037 [P1] MISSING facet F10
- Files: src/app/api/skills/route.ts
- Legacy: POST /{skillId}/select increments usage asynchronously (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:96-111`)
- Expected fix: Add secure usage-update endpoint; call on confirmed catalogue selection.

## G2-4-025-038 [P1] MISSING facet F10
- Files: src/app/api/skills/route.ts
- Legacy: POST /select/batch increments each unique matched ID once using `IN` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:114-133`)
- Expected fix: Add batch route with validated ID list, preserve set semantics.

## G2-4-025-045 [P1] GAP facet F12
- Files: src/modules/skills/catalog-service.ts
- Legacy: Hardcoded abbreviations e.g. js→javascript, py→python, k8s→kubernetes before query (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SkillSearchService.java:31-82,101-115`)
- Expected fix: Seed/retain all legacy synonym mapping, with deterministic fallback.

## G2-4-025-046 [P1] GAP facet F12
- Files: src/modules/skills/catalog-service.ts
- Legacy: Fuzzy Levenshtein edit distance ≤2, popularity tie-break (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SkillSearchService.java:229-249`)
- Expected fix: Add bounded typo tolerance without massive DB scans.

## G2-4-025-051 [P1] GAP facet F13
- Files: src/app/api/skills/route.ts
- Legacy: Read failure responds HTTP 500 with explicit envelope (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:65-75`)
- Expected fix: Register/replay DB10 and ensure normal reads available; show outage state until then.

## G2-4-025-080 [P1] MISSING facet F23
- Files: src/app/api/skills/route.ts
- Legacy: Legacy v1 seven public read/selection paths all in one controller (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:57-171`)
- Expected fix: Track dropped POSTs as explicit product decision, not accidental parity.

## G2-4-029-066 [P1] GAP facet F23
- Files: src/components/projects/project-workspace.tsx
- Legacy: Dedicated resource audit table (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:63-85`)
- Expected fix: Reinstate dedicated Resource activity view on Audit tab.

## G2-4-028-031 [P1] MISSING facet F10
- Files: src/app/(authenticated)/tpo/messages/page.tsx
- Legacy: Team conversations use getTeamPeople and TeamConversations (`docs/legacy-source/frontend/src/pages/tpo/messages.js:29-37,50-57`)
- Expected fix: Integrate internal threads into Messages Team tab.

## G2-13-031-094 [P1] GAP facet F06
- Files: src/components/placements/placement-report-ui.tsx
- Legacy: Legacy details include batch/branch/company/mode/category with report-specific filter hiding. `docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:203-217`
- Expected fix: Support Academic Setup batch and other report dimensions.

## G2-14-028-005 [P1] GAP facet F02
- Files: src/components/projects/project-workspace.tsx
- Legacy: Legacy Workspace health card contains status/template/phase, summary, overall progress and four facts. `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSummarySnapshot.jsx:73-112`
- Expected fix: Restore workspace health layout and quick facts.

## G2-14-028-007 [P1] MISSING facet F03
- Files: src/components/projects/project-workspace.tsx
- Legacy: Legacy Change template, Archive and Delete icon buttons in header. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:419-447`
- Expected fix: Add Change template and soft Delete actions in summary header.

## G2-14-028-011 [P1] GAP facet F04
- Files: src/components/projects/project-workspace.tsx
- Legacy: Legacy quick facts Team member count, task done, sprint done, target date. `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSummarySnapshot.jsx:66-70`
- Expected fix: Restore Team and Target facts.

## G2-14-028-014 [P1] GAP facet F04
- Files: src/modules/projects/college-project-summary-model.ts
- Legacy: Legacy status options ACTIVE, IN_PROGRESS, READY, BLOCKED, ARCHIVED read-only. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:63-80`
- Expected fix: Map legacy statuses and preserve historical values.

## G2-14-028-016 [P1] MISSING facet F05
- Files: src/components/projects/project-workspace.tsx, src/components/projects/college-project-summary-editor-full.tsx
- Legacy: Legacy template dropdown remote-search, preserve selected option during search. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:147-201`
- Expected fix: Restore server-filtered template picker and request-sequence guard.

## G2-14-028-035 [P1] MISSING facet F10
- Files: src/components/projects/project-workspace.tsx
- Legacy: Legacy attachProjectTemplate replaces plan and optionally blank defaults. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:314-330`
- Expected fix: Build safe attach/new-plan replacement with audit and confirmation.

## G2-14-028-041 [P1] GAP facet F12
- Files: src/modules/projects/college-project-summary-model.ts
- Legacy: Legacy can persist IN_PROGRESS/READY/BLOCKED, archived special workflow. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:63-80`
- Expected fix: Model historical status migration.

## G2-14-028-055 [P1] MISSING facet F18
- Files: src/components/projects/project-workspace.tsx
- Legacy: Legacy Change template… and warning about replacing tasks/sprints/resources. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:419-420,451-467`
- Expected fix: Restore exact action text and destructive warning.
