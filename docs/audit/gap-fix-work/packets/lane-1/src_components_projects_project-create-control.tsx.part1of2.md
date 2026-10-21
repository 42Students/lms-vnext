# Work packet: edit src/components/projects/project-create-control.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u028-superadmin-projects-section.md, docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md

## G2-5-028-020  [P1] GAP  facet F06  effort M
- Legacy: Legacy Create form defaults IN_PROGRESS, Planning, progress0, blank learners. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:216-225,817-885`
- vNext now: vNext form defaults PLANNED, template first, mentor empty, class empty. `src/components/projects/project-create-control.tsx:37-58,63-75`
- Fix: Document status transition and map existing defaults deliberately.

## G2-5-028-022  [P1] GAP  facet F06  effort M
- Legacy: Legacy Class and Mentor both required with remote-search picker. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:827-847`
- vNext now: vNext Class optional; Mentor optional unless status ACTIVE; choices preloaded. `src/components/projects/project-create-control.tsx:295-329`
- Fix: Decide optional role parity and restore typeahead for large colleges.

## G2-5-028-023  [P1] GAP  facet F06  effort M
- Legacy: Legacy Learners multi select searches all college learners. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:849-859`
- vNext now: vNext class-scoped roster checkboxes with Whole class/Clear buttons. `src/components/projects/project-create-control.tsx:340-358`
- Fix: Preserve ability to assign only selected class learners; clarify intentional stronger constraint.

## G2-5-028-024  [P1] GAP  facet F06  effort M
- Legacy: Legacy phase free-text, status four values, progress0..100. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:861-876`
- vNext now: vNext only PLANNED/ACTIVE status field, phase/progress derived later. `src/components/projects/project-create-control.tsx:332-338`
- Fix: Restore phase/progress edit contract or map explicitly to workspace summary.

## G2-5-028-025  [P1] MISSING  facet F06  effort M
- Legacy: Legacy Due Label max80, Blocker and Next Action textareas. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:877-885`
- vNext now: vNext creation has no Due Label, Blocker or Next Action controls. `src/components/projects/project-create-control.tsx:229-359`
- Fix: Add those optional project fields or approved subsequent editor.

## G2-5-028-027  [P1] GAP  facet F07  effort M
- Legacy: Legacy backend title required max160, courseLabel max160, progress0..100, dueLabel max80. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/AdminProjectCreateDTO.java:14-37`
- vNext now: vNext UI title max200, slug64 lower-kebab, summary max2000, template required. `src/components/projects/project-create-control.tsx:253-292`
- Fix: Reconcile DTO length/rules and define one migration validation policy.

## G2-5-028-035  [P1] GAP  facet F08  effort M
- Legacy: Legacy unsaved modal close prompts `Discard unsaved changes?`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:390-396`
- vNext now: vNext cancel closes create form without dirty-state confirm. `src/components/projects/project-create-control.tsx:371-380`
- Fix: Add unsaved-change guard for create/assign dialogs.

## G2-5-028-038  [P1] GAP  facet F09  effort M
- Legacy: Legacy Assign Learners 760px modal with replaceExisting checkbox. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:755-798`
- vNext now: vNext create checklist for learners, not replace-existing modal on list. `src/components/projects/project-create-control.tsx:340-359`, `src/components/projects/project-admin-workspace-list.tsx:101-107`
- Fix: Restore replace-existing selected-member confirmation.

## G2-5-028-039  [P1] GAP  facet F09  effort M
- Legacy: Legacy before replace displays up to 20 names, `and N more`, red Remove and save, Keep them. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:299-329`
- vNext now: vNext create roster not a removal action; no matching warning. `src/components/projects/project-create-control.tsx:340-359`
- Fix: List exact removals before membership revoke.

## G2-5-028-050  [P1] GAP  facet F12  effort M
- Legacy: Legacy project initial status IN_PROGRESS, phase Planning, progress0. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:216-225`
- vNext now: vNext defaults PLANNED with template-derived work items. `src/components/projects/project-create-control.tsx:58-69`
- Fix: Map legacy phases/status/progress to canonical projects.

## G2-5-028-053  [P1] GAP  facet F12  effort M
- Legacy: Legacy optional organizationId and classId accepted in payload. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:472-488`
- vNext now: vNext collegeId, templateId, class sectionId required by template context. `src/components/projects/project-create-control.tsx:177-190`
- Fix: Map organization resolution and section selection explicitly.

## G2-5-028-071  [P1] GAP  facet F20  effort M
- Legacy: Legacy replaceExisting warns removed learners, first20 listed. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:309-328`
- vNext now: vNext initial selection has no replacement transaction. `src/components/projects/project-create-control.tsx:340-359`
- Fix: Add atomic replace with sorted removal preview.

## G2-7-020-002  [P1] GAP  facet F01  effort M
- Legacy: new.js:95-111 positive numeric templateId query preselection
- vNext now: project-create-control.tsx:36-39 defaults to first, create/page.tsx:10-29 ignores templateId
- Fix: Honor template deep link and sanitize duplicated or invalid IDs

## G2-7-020-027  [P1] GAP  facet F05  effort L
- Legacy: new.js:186-246 400ms debounced server-side search for four selects
- vNext now: project-create-control.tsx:78-150 finite mentor100 and class roster; class-team-workspace-creator.tsx:165-175 static
- Fix: Add paged search for mentors, templates, classes and learners

## G2-7-020-029  [P1] GAP  facet F06  effort M
- Legacy: new.js:455-464 title required max160 and showCount, Campus Event Coordination
- vNext now: project-create-control.tsx:252-263 title required max200, Campus placement portal
- Fix: Enforce 160 limit and exact placeholder at both boundaries

## G2-7-020-031  [P1] GAP  facet F06  effort L
- Legacy: new.js:470-488 Status default ACTIVE, IN_PROGRESS READY BLOCKED and disabled ARCHIVED
- vNext now: project-create-control.tsx:332-339 default PLANNED and only ACTIVE or PLANNED
- Fix: Define status crosswalk and match create defaults and blocked state

## G2-7-020-032  [P1] GAP  facet F06  effort M
- Legacy: new.js:491-513 template required and no initial choice except URL handoff
- vNext now: project-create-control.tsx:36-39 first assigned template selected by default
- Fix: Default unset, honor valid preselection and show required error

## G2-7-020-034  [P1] GAP  facet F06  effort M
- Legacy: new.js:533-555 class only cohort/teams and required there
- vNext now: project-create-control.tsx:324-330 optional class in single; class-team-workspace-creator.tsx:165-169 required class
- Fix: Hide class field in single mode except deliberate add-class shortcut

## G2-7-020-035  [P1] GAP  facet F06  effort L
- Legacy: new.js:559-575 students multi-select optional with max500
- vNext now: project-create-control.tsx:340-359 checkbox roster only after class chosen
- Fix: Permit college-scope learner selection up to 500 without class

## G2-7-020-038  [P1] GAP  facet F06  effort M
- Legacy: new.js:74 dirty guard and :401-409 Back confirm
- vNext now: project-create-control.tsx:371-380 Cancel directly navigates without dirty guard
- Fix: Guard Back, Cancel, route changes and reload when dirty
