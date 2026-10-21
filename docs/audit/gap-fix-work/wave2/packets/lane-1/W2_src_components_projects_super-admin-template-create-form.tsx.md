# Work packet (wave 2): edit src/components/projects/super-admin-template-create-form.tsx

24 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u029-superadmin-project-template-create.md

## G2-5-029-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy successful create navigates directly to `/{id}/overview` to avoid redirect. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:135-140`
- vNext now: vNext routes to template `/{id}` with an additional detail redirect to first section. `src/components/projects/super-admin-template-create-form.tsx:23-26`
- Fix: Navigate directly to overview after create.

## G2-5-029-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy order: group shell, page head/back, Card generic help paragraph, full vertical Form. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:148-172`
- vNext now: vNext page header and unboxed grid form, introductory draft summary then basic fields. `src/app/(authenticated)/admin/projects/templates/new/page.tsx:14-19`, `src/components/projects/super-admin-template-create-form.tsx:38-56`
- Fix: Wrap form in original card, align header/help spacing and section dividers.

## G2-5-029-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy Basic info title+slug, Lifecycle settings row, then Content fields. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:173-243`
- vNext now: vNext title+slug with first release/sprint/task ahead of content, lifecycle status removed. `src/components/projects/super-admin-template-create-form.tsx:31-56,85-109`
- Fix: Reorder groups exactly and surface lifecycle selections.

## G2-5-029-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy help `Keep the template generic. Live meetings, activity, and submission state belong to workspaces.` `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:167-170`
- vNext now: vNext help `draft starts with one release, one sprint and one task...`. `src/components/projects/super-admin-template-create-form.tsx:38-39`
- Fix: Restore generic blueprint guidance.

## G2-5-029-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy title showCount 200 and editable slug helper `Auto-filled from the title...`. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:183-196`
- vNext now: vNext lacks input character count and auto-fill helper. `src/components/projects/super-admin-template-create-form.tsx:41-45`
- Fix: Show counters and exact slug explanatory helper.

## G2-5-029-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy action buttons `Create template` and `Cancel`. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:308-319`
- vNext now: vNext `Create draft template` and `Cancel`. `src/components/projects/super-admin-template-create-form.tsx:124-127`
- Fix: Match action title while distinguishing initial Draft in helper.

## G2-5-029-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy resources many, one row per resource with status/title/url/type fields. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:285-306`
- vNext now: vNext only one optional link pair, no list pagination. `src/components/projects/super-admin-template-create-form.tsx:110-122`
- Fix: Allow multiple resources and metadata, with row controls.

## G2-5-029-018  [P2] GAP  facet F06  effort M
- Legacy: Legacy form defaults status ACTIVE, lifecycle draft, empty arrays and blank goal. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:73-85`
- vNext now: vNext defaults release `Release 1`, sprint `Sprint 1`, priority MEDIUM, submissionType LINK. `src/components/projects/super-admin-template-create-form.tsx:15-18`
- Fix: Align initial value semantics; mark seeded plan rows if intentional.

## G2-5-029-019  [P2] GAP  facet F06  effort M
- Legacy: Legacy slug auto-generated from title until manually overridden, non-Latin fallback `template`. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:62-71`
- vNext now: vNext slug starts empty and is typed manually. `src/components/projects/super-admin-template-create-form.tsx:31-45`
- Fix: Add auto-generation, manual override and non-Latin fallback.

## G2-5-029-020  [P2] GAP  facet F06  effort M
- Legacy: Legacy Title required max200 showCount, slug required max80 kebab. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:175-196`
- vNext now: vNext title max200, slug max64 kebab. `src/components/projects/super-admin-template-create-form.tsx:31-45`
- Fix: Allow slug up to 80 or validate/migrate long existing keys.

## G2-5-029-034  [P2] GAP  facet F09  effort M
- Legacy: Legacy server failure opens showProjectError modal rather than inline. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:141-145`
- vNext now: vNext Banner tone error inline. `src/components/projects/super-admin-template-create-form.tsx:123-123`
- Fix: Match modal title, errors, dismissal and focus.

## G2-5-029-039  [P2] GAP  facet F10  effort M
- Legacy: Legacy after POST uses created integer ID, `/{id}/overview`. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:135-140`
- vNext now: vNext UUID ID in separate PG table, root detail navigation. `src/components/projects/super-admin-template-create-form.tsx:24-26`, `src/db/schema/projects.ts:26-36`
- Fix: Preserve old deep-link ID map where migrated data is used.

## G2-5-029-043  [P2] GAP  facet F12  effort M
- Legacy: Legacy summary <=160 from first line or title; no duplicate input. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:41-44`
- vNext now: vNext separately editable summary up to2000. `src/components/projects/super-admin-template-create-form.tsx:48-50`, `src/modules/projects/super-admin-template-create-model.ts:9-15`
- Fix: Derive default and permit override only with explicit reason.

## G2-5-029-044  [P2] GAP  facet F12  effort M
- Legacy: Legacy slugify strips non-ASCII and falls back to `template`. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:31-35`
- vNext now: vNext manually entered lower-kebab slug. `src/components/projects/super-admin-template-create-form.tsx:42-45`
- Fix: Use consistent transliteration/fallback and collision handling.

## G2-5-029-046  [P2] GAP  facet F13  effort M
- Legacy: Legacy pending prevents double create; errors reopen via modal, fields retained. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:88-95,141-145`
- vNext now: vNext saving disables form and shows banner; fields retained. `src/components/projects/super-admin-template-create-form.tsx:16-29,123-128`
- Fix: Retain original error hierarchy and duplicate protection.

## G2-5-029-047  [P2] GAP  facet F13  effort M
- Legacy: Legacy empty draft fields render blank; repeating sections say No ... yet. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:73-85,167-172`
- vNext now: vNext seeded required first items and collapsible panel, no empty repeats. `src/components/projects/super-admin-template-create-form.tsx:15-18,31-39`
- Fix: Restore blank initial repeating list state.

## G2-5-029-052  [P2] GAP  facet F16  effort M
- Legacy: Legacy Ant Card, row two columns xs24 md12 for lifecycle. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:167-241`
- vNext now: vNext md:grid-cols-2 basic fields with mobile full width. `src/components/projects/super-admin-template-create-form.tsx:38-56,124-127`
- Fix: Match lifecycle column split and card spacing at 375/768/1280.

## G2-5-029-053  [P2] GAP  facet F16  effort M
- Legacy: Legacy multiple form rows lengthen content; sticky/scroll behavior managed by antd. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:285-306`
- vNext now: vNext collapsible sections reduce height. `src/components/projects/super-admin-template-create-form.tsx:56-122`
- Fix: Check mobile access to all repeating rows and footer buttons.

## G2-5-029-054  [P2] GAP  facet F17  effort M
- Legacy: Legacy Form.Item labels and validation errors announced by antd; count display. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:172-196`
- vNext now: vNext nested labels/native input, no character counter or explicit aria-invalid mapping. `src/components/projects/super-admin-template-create-form.tsx:40-46`
- Fix: Add count, aria-invalid, field error associations.

## G2-5-029-056  [P2] GAP  facet F18  effort M
- Legacy: Legacy header subtitle and generic template help exact. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:151-170`
- vNext now: vNext extra publishing restriction and seeded draft text. `src/app/(authenticated)/admin/projects/templates/new/page.tsx:16-18`, `src/components/projects/super-admin-template-create-form.tsx:39-39`
- Fix: Restore original title/subtitle/help before adding safety notes.

## G2-5-029-057  [P2] GAP  facet F18  effort M
- Legacy: Legacy label `Template slug`, helper auto-filled from title. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:185-196`
- vNext now: vNext label `Slug` with no helper. `src/components/projects/super-admin-template-create-form.tsx:31-45`
- Fix: Use legacy label, exact placeholder and helper.

## G2-5-029-058  [P2] GAP  facet F18  effort M
- Legacy: Legacy label `Initial workspace status`, options Active/In progress/Ready/Blocked/Archived disabled. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:224-239`
- vNext now: vNext dropdown is `First task priority` and no initial status. `src/components/projects/super-admin-template-create-form.tsx:31-37,85-89`
- Fix: Restore visible initial-status control.

## G2-5-029-059  [P2] GAP  facet F18  effort M
- Legacy: Legacy `Project goal / description`, `Deliverables`, `Definition of done`, `Personas` helper examples. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:254-282`
- vNext now: vNext `Goal (optional)` and shortened labels in collapsed panel. `src/components/projects/super-admin-template-create-form.tsx:52-74`
- Fix: Restore exact field copy and sample multiline placeholders.

## G2-5-029-062  [P2] GAP  facet F20  effort M
- Legacy: Legacy manual slug edit stops auto-sync; preserves override on future title changes. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:62-71`
- vNext now: vNext manual slug only; no auto-sync race. `src/components/projects/super-admin-template-create-form.tsx:31-45`
- Fix: Add auto-slug state with once-user-edits stop.
