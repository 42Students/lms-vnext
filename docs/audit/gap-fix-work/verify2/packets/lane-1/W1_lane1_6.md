# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-6-022-026 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: Legacy invalid countsAsPlacedAt exact Counts as placed must be when the offer is released or accepted (TpoSettingsService.java:33-35).
- Expected fix: Reject SELECTED for this college rules API or document approved new business state.

## G2-13-023-009 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LBE/service/tpo/TpoScheduleService.java:349-354 schedule time uses slot.starts_at before round scheduled_date.
- Expected fix: Select actual booked candidate slot start/end and show it as first precedence.

## G2-14-030-035 [P1] MISSING facet F11
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:50-60,161-165 organizationId required for mutation.
- Expected fix: Use selected college/organization scope in SA edit route, fail closed on missing selection.

## G2-17-021-050 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LBE/dto/response/PublicJobResponseDTO.java:35-44 commented excluded list distinguishes public display fields and internal criteria.
- Expected fix: Keep public projection narrowly safe and never reuse learner eligibility view on public URLs.

## G2-19-027-059 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: LBE/controller/CourseController.java:195-265 denies unknown/foreign/deleted course identically as 404 on slug and ID reads.
- Expected fix: Ensure all detail aliases collapse unauthorized/unknown to same safe error and no slug oracle.

## G2-7-001-067 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/repository/ProjectWorkspaceRepository.java:118-149: AT_RISK* use p.updatedAt, ProjectDelivery review, blocker field.
- Expected fix: Reconcile query semantics and required indexes.

## G2-7-004-017 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:520-542: `State` from backend readinessState, `Reason` conditional no duplicate override note.
- Expected fix: Map full readinessState independently from override state; do not imply releases block legacy gate.

## G2-7-005-057 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:69-74: college read-only global template catalog.
- Expected fix: Ensure scope/authorization and catalog visibility meet product requirements.

## G2-7-008-034 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:56-58: review state based on delivery.reviewStatus (submitted/under review/accepted/changes requested/locked).
- Expected fix: Map legacy review statuses separately from submission lifecycle and preserve color/meaning.

## G2-7-011-004 [P1] GAP facet F02
- Files: src/components/projects/workspace-brief-editor.tsx
- Legacy: LFE/components/admin/projects/WorkspaceOverviewEditor.jsx:15-26: full `Project brief` Card, `Learner & mentor view` eyebrow, headline and descriptive paragraph above fields.
- Expected fix: Render legacy Card and intro in edit page without extra opening click.

## G2-7-011-012 [P1] GAP facet F04
- Files: src/components/projects/workspace-brief-editor.tsx
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:60-81: goal is from `workspace.overview.goal`, empty string fallback.
- Expected fix: Define migration/read-through mapping of legacy overview.goal into authoredBrief.goal including clearing semantics.

## G2-7-011-026 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:48,113-115: navigation guard covers unload and section switches for dirty form.
- Expected fix: Add dirty form route/unload/cancel confirmation with legacy exact message.

## G2-7-013-029 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:28-37: whole form dirty unload/tab guard
- Expected fix: Guard route/tab navigation and Cancel for any unsaved resource edit

## G2-7-014-041 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:78-83 stampSprintClientIds before links and save
- Expected fix: Maintain links across provisional key to final UUID conversion on migration

## G2-7-015-048 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:390-423 archiveProject and deleteProject separate API operations
- Expected fix: Expose recoverable delete endpoint and route to Deleted workspaces

## G2-7-016-064 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:66-80 latest sibling key snapshot + tasksToken
- Expected fix: Test concurrent add/edit/remove and stale sprint reference

## G2-7-017-045 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:253-285 assignProjectLearners POST supports append/replace
- Expected fix: Implement append affordance while preserving atomic replacement

## G2-7-018-038 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:87-95 restore may rehydrate prior task/sprint/resource/member state
- Expected fix: Restore soft-deleted child records where applicable; migration/recoverability indicator

## G2-7-019-044 [P1] MISSING facet F09
- Files: src/components/projects/project-admin-workspace-list.tsx
- Legacy: workspaces/index.js:219-236 No template Tag navigates to `summary?openTemplate=1`
- Expected fix: Restore navigation/auto-open attach-template modal per workspace.

## G2-7-019-071 [P1] GAP facet F17
- Files: src/components/projects/project-admin-workspace-list.tsx
- Legacy: workspaces/index.js:219-235 template Tag role=button tabIndex=0 Enter/Space
- Expected fix: Restore focusable keyboard activation and accessible label on attach-template prompt.

## G2-7-020-002 [P1] GAP facet F01
- Files: src/components/projects/project-create-control.tsx
- Legacy: new.js:95-111 positive numeric templateId query preselection
- Expected fix: Honor template deep link and sanitize duplicated or invalid IDs

## G2-7-020-027 [P1] GAP facet F05
- Files: src/components/projects/project-create-control.tsx, src/components/projects/class-team-workspace-creator.tsx
- Legacy: new.js:186-246 400ms debounced server-side search for four selects
- Expected fix: Add paged search for mentors, templates, classes and learners

## G2-7-020-029 [P1] GAP facet F06
- Files: src/components/projects/project-create-control.tsx
- Legacy: new.js:455-464 title required max160 and showCount, Campus Event Coordination
- Expected fix: Enforce 160 limit and exact placeholder at both boundaries

## G2-7-020-031 [P1] GAP facet F06
- Files: src/components/projects/project-create-control.tsx
- Legacy: new.js:470-488 Status default ACTIVE, IN_PROGRESS READY BLOCKED and disabled ARCHIVED
- Expected fix: Define status crosswalk and match create defaults and blocked state

## G2-7-020-032 [P1] GAP facet F06
- Files: src/components/projects/project-create-control.tsx
- Legacy: new.js:491-513 template required and no initial choice except URL handoff
- Expected fix: Default unset, honor valid preselection and show required error
