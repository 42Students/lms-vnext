# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/l11-u029-superadmin-template-sprints.md

19 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l11-u029-superadmin-template-sprints.md

## G2-11-029-002  [P2] GAP  facet F02  effort M
- Legacy: Shell shows template selected-college name, subtitle 'The sprints every workspace created from this template starts with.' (sprints.js:127-134).
- vNext now: PageHeader uses template.title, summary or 'Read-only global project template details'; subtitle only under Sprint plan editor (super-admin-template-subview-page.tsx:179-185; plan-editor.tsx:124-134).
- Fix: Place exact legacy subtitle under main template title; preserve contextual section heading.

## G2-11-029-003  [P2] GAP  facet F02  effort M
- Legacy: Editable RepeatingItemEditor permanently visible inside admin-form-card (sprints.js:138-160).
- vNext now: Read-only blueprint sprint listing plus collapsible Edit sprints editor (super-admin-template-subview-page.tsx:209-218,234-313; plan-editor.tsx:124-142).
- Fix: Restore default visible editable form when authorized; preserve read-only view for archived users.

## G2-11-029-006  [P2] GAP  facet F03  effort M
- Legacy: Sprint rows rendered as editable repeating inputs without read-only dueKey badges (sprints.js:145-153).
- vNext now: Read-only sprints list key, release, due, goal/description by default (super-admin-template-subview-page.tsx:259-310).
- Fix: Make editor primary surface, list secondary when user not editing.

## G2-11-029-008  [P2] GAP  facet F04  effort S
- Legacy: Original Sprint goal (optional) one-line text placeholder 'One sentence: what this sprint is trying to achieve' (projectSectionFieldConfigs.js:30-35).
- vNext now: Sprint goal (optional) Textarea with no placeholder (plan-editor.tsx:188-192).
- Fix: Use single-line input and exact example placeholder.

## G2-11-029-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy multiline label 'What does done look like?', acceptance criteria placeholder (projectSectionFieldConfigs.js:64-69).
- vNext now: New multiline field labelled Description without placeholder (plan-editor.tsx:193-197).
- Fix: Restore acceptance criteria label and instructional placeholder.

## G2-11-029-010  [P2] GAP  facet F04  effort M
- Legacy: Release key free text, placeholder Shared by every sprint that ships together... (projectSectionFieldConfigs.js:44-51).
- vNext now: New Release key select bound to draft.releases list (plan-editor.tsx:171-177).
- Fix: Provide legacy free-text release key or approved converted release ladder workflow.

## G2-11-029-011  [P2] GAP  facet F04  effort M
- Legacy: Release title (optional) field linked to sprint's first releaseKey (projectSectionFieldConfigs.js:52-57).
- vNext now: No per-sprint Release title; separate editable release title blocks and Add release (plan-editor.tsx:148-162).
- Fix: Support explicit releaseLabel semantics and migrate to release entity, avoid silent loss.

## G2-11-029-012  [P2] GAP  facet F04  effort M
- Legacy: Key (optional), auto-generated slug preview from title (projectSectionFieldConfigs.js:262-320).
- vNext now: Key (optional) input marked required, maxLength64, new key pre-assigned (plan-editor.tsx:163-170,54-65).
- Fix: Restore optional blank key, slug preview, deterministic collision-safe materialization.

## G2-11-029-013  [P2] GAP  facet F05  effort M
- Legacy: Order of repeat rows is stored array order, add/remove supported (sprints.js:58,145-153).
- vNext now: Sort sprint view by releaseKey,sequence,key, plus Move up/down controls in form (super-admin-template-subview-page.tsx:259-269; plan-editor.tsx:198-209).
- Fix: Preserve displayed author order and reorder semantics; avoid accidental regroup.

## G2-11-029-014  [P2] GAP  facet F05  effort S
- Legacy: Template Sprints page dedicated tab shell without read-only list (sprints.js:127-165).
- vNext now: Shared tab strip and list with count (super-admin-template-subview-page.tsx:199-207,234-313).
- Fix: Match legacy tab and page structure.

## G2-11-029-015  [P2] GAP  facet F06  effort M
- Legacy: Validate via validateRepeatingItems(SPRINT_FIELDS), mandatory title/releaseKey; optional key/goal/description (sprints.js:145-152; projectSectionFieldConfigs.js:30-70).
- vNext now: Zod blueprint validation on submit and DOM required on key/title/release, goal and description max lengths (plan-editor.tsx:90-99,163-197).
- Fix: Map validations and exact messages per field; key optional, releaseKey required.

## G2-11-029-023  [P2] GAP  facet F09  effort M
- Legacy: No dismissible Edit sprints expansion state; editing always ready (sprints.js:138-160).
- vNext now: Edit sprints toggles form and resets draft to props blueprint on each click (plan-editor.tsx:124-142).
- Fix: Prevent inadvertent unsaved resets or require explicit discard.

## G2-11-029-024  [P2] GAP  facet F10  effort M
- Legacy: getProjectTemplateById(templateId,selectedCollegeId) on load and immediately before write repair (sprints.js:47-58,101-106).
- vNext now: getSuperAdminTemplateSubview via server context; PATCH /api/projects/templates/:id (super-admin-template-subview-page.tsx:102-113; plan-editor.tsx:101-109).
- Fix: Trace legacy college-scoped write context and new global template policy.

## G2-11-029-029  [P2] GAP  facet F12  effort M
- Legacy: Generated stable _clientId for keyless sprint, no title-based identity after rename (sprints.js:40-45).
- vNext now: Eager nextTemplatePlanKey creates stored string key (plan-editor.tsx:54-65).
- Fix: Preserve identity across rename, collisions, reorder and deletion.

## G2-11-029-030  [P2] GAP  facet F13  effort M
- Legacy: Skeleton active eight paragraph rows while loading; error alert and Template not found warning (sprints.js:134-164).
- vNext now: SSR ErrorState with Retry, `notFound()` for missing; read-only current-version unavailable EmptyState (super-admin-template-subview-page.tsx:113-132,234-244).
- Fix: Reproduce loading skeleton/alert vs 404 state and exact text.

## G2-11-029-033  [P2] GAP  facet F16  effort M
- Legacy: Legacy Admin Form/Card with repeating nested rows; scrollbar from surrounding module (sprints.js:127-165).
- vNext now: New 2-column md controls in expanded plan + read-only list (plan-editor.tsx:163-207; subview-page.tsx:259-310).
- Fix: Match desktop 2-col placement and phone stacking, compare 375/768/1280.

## G2-11-029-035  [P2] GAP  facet F18  effort M
- Legacy: Title fallback Template, subtitle and explanation 'No start/end dates here on purpose — ...' (sprints.js:129-144).
- vNext now: Title from template, plan explanation shortened, inline template summary (subview-page.tsx:180-185; plan-editor.tsx:130-145).
- Fix: Restore full copy on primary page.

## G2-11-029-036  [P2] GAP  facet F19  effort M
- Legacy: Load one section; form.resetFields after save and reload from backend (sprints.js:47-80,117-120).
- vNext now: SSR template blueprint plus client draft, router.refresh after save (subview-page.tsx:143-156; plan-editor.tsx:111-115).
- Fix: Ensure save returns persisted normalized row keys and UI refresh reflects new version.

## G2-11-029-040  [P2] GAP  facet F22  effort M
- Legacy: Legacy template stores nested sprint arrays and keys, links tasks via sprintKey (sprints.js:53-58,88-115).
- vNext now: ProjectTemplateBlueprint versioned releases/sprints/tasks, row key/sequence and dueLabel (subview-page.tsx:143-170,259-308).
- Fix: Document blueprint migration from inline releaseLabel to release entity and orphan repair.
