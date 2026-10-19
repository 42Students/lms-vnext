# North Star visual sweep — chat-9

Owner: chat-9 · 2026-10-19 · branch `chatgpt/chat-9-b`

## Source of truth and boundaries
- `docs/orchestrator/queues/master-queue.md` NORTH STAR, `docs/design/old-lms-shell-spec.md`, `old-lms-shell.css`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md`, and `docs/design/legacy-styles/` SCSS.
- Body canvas is owned by chat-17: white `#fff` on `#f1f4f9`, 1px `#e5e9f0` border, 12px radius, 24px inner padding, no nested page shell. Heading h1: 30px / 600 / `#172033`. Primary controls: `#0a7c88`, white text, 36px height, 9px radius. Reuse semantic UI tokens, `PageHeader`, `Button`, `Input`, `Select`, `DataTable`, `StatusBadge`.
- Never modify `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/**`, `src/components/shell/**` (shared kit/sidebar/top bar belong to chat-17/19/13). Never change page sections, behavior, copy, or the order of content.
- Explicit exceptions: border around a real table/list, a modal/drawer, warning/alert, independently selectable object, or actionable metric tile is an internal component rather than an extra page canvas.

## Source inventory and remediation queue

| Surface | Source paths | Expected sweep |
| --- | --- | --- |
| Super Admin projects workspaces | `src/app/(authenticated)/admin/projects/**` | Native links styled as custom buttons, repeated rounded cards, outer wrappers, subview headings, table/list controls |
| College projects workspaces | `src/app/(authenticated)/college/projects/**` | Primary text contrast (`text-foreground` on `bg-primary`), icon/action sizing, multiple card shells, tabs |
| Super Admin project components | `src/components/projects/admin-*.tsx`, `project-admin-*.tsx`, `project-*-page*.tsx`, `super-admin-template-*.tsx` | Replace independent color/radius/size values with token-based styles and shared typography; keep semantic risk tiles and dialogs |
| College project components | `src/components/projects/college-project-*.tsx`, `class-team-*.tsx`, `project-template-*.tsx`, `project-workspace-*.tsx`, `project-readiness-*.tsx`, `project-create-control.tsx` | Remove nested presentation-only outer canvases, use common controls and text tokens, preserve form/collection structure |
| Super Admin last-third tenant/platform | `src/app/(authenticated)/admin/settings/**`, `tenants/**`, `verification/**`, `videos/**`; corresponding `src/components/admin/tenant-*.tsx`, `super-admin-*.tsx` | Shared input/table/button styling, typography, surface background and exception banners |
| Super Admin other last-third surfaces | `src/app/(authenticated)/admin/projects/**`, `resources/**`, `semester-courses/**`, `students/**`, `module-access/**` | Identify custom page shells and legacy-parity departures; do not overlap the separately owned placements or sidebar work |
| Project admin navigation and tabs | `src/components/projects/project-admin-nav.tsx`, `super-admin-template-tabs.tsx`, `src/components/admin/super-admin-legacy-group-tabs.tsx` | Retain legacy group/navigation wording, teal underline and single tab strip; no stacked segmented cards |

## Concrete defects identified before coding
1. `src/app/(authenticated)/college/projects/page.tsx` uses `bg-primary ... text-foreground` for its Create workspace primary CTA, which can produce dark primary text instead of legacy white.
2. Both project workspaces pages and template sections use hand-drawn `rounded-md`/`rounded` bordered action links with `min-h-11` and color overrides; these differ from the 36px by 9px old-LMS control.
3. `src/components/projects/project-admin-at-risk-page.tsx` uses `rounded-xl border bg-surface p-5` for every table-like risk entry; preserve rows and data but prefer separated rows on a single canvas.
4. `src/components/projects/super-admin-template-subview-page.tsx` uses `rounded-xl border bg-surface p-5` for every sprint/task entry; should be a continuous list with hairline separators where possible.
5. Dashboard/list shells must not apply a second white rounded 24px card inside chat-17's page canvas.
6. No changes to routing, shared sidebars, top bar or global tokens, and no page-content rearchitecture.

## Status
- [x] Branch fast-forwarded to `main` before the chat-9 sweep (previous lane head was behind without unique commits).
- [x] Initial file/style inventory and source-of-truth review.
- [x] First-pass page/component sweep and per-file review of the listed paths.
- [x] Record changed paths and intentionally exempt components.
- [x] Test/CI deliberately not run per owner's direction; source-level syntax review only.

## 2026-10-19 execution ledger — commit-backed source sweep

**Branch:** `chatgpt/chat-9-b`. **Head comparison when recorded:** 93 lane commits ahead of the moving `main` branch, 36 concurrent upstream commits behind; the branch was cleanly fast-forwarded to main before the first lane commit. No changes were sent to main.

**Source files changed (58 returned in the branch comparison):**

- `src/app/(authenticated)/admin/module-access/page.tsx`
- `src/app/(authenticated)/admin/placements/student-lookup/page.tsx`
- `src/app/(authenticated)/admin/programs/page.tsx`
- `src/app/(authenticated)/admin/projects/page.tsx`
- `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx`
- `src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx`
- `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx`
- `src/app/(authenticated)/admin/projects/templates/new/page.tsx`
- `src/app/(authenticated)/admin/projects/templates/page.tsx`
- `src/app/(authenticated)/admin/projects/workspaces/new/page.tsx`
- `src/app/(authenticated)/admin/quizzes/page.tsx`
- `src/app/(authenticated)/admin/semesters/page.tsx`
- `src/app/(authenticated)/admin/settings/auth/page.tsx`
- `src/app/(authenticated)/admin/settings/page.tsx`
- `src/app/(authenticated)/admin/students/page.tsx`
- `src/app/(authenticated)/admin/tenants/create/page.tsx`
- `src/app/(authenticated)/admin/tenants/page.tsx`
- `src/app/(authenticated)/admin/tenants/setup/page.tsx`
- `src/app/(authenticated)/admin/verification/page.tsx`
- `src/app/(authenticated)/college/projects/create/page.tsx`
- `src/app/(authenticated)/college/projects/page.tsx`
- `src/app/(authenticated)/college/projects/templates/page.tsx`
- `src/app/(authenticated)/college/projects/workspaces/new/page.tsx`
- `src/components/admin/super-admin-attendance-settings-editor.tsx`
- `src/components/admin/super-admin-learning-filter-fields.tsx`
- `src/components/admin/super-admin-student-bulk-access.tsx`
- `src/components/admin/tenant-settings-editor.tsx`
- `src/components/admin/tenant-settings-other-keys.tsx`
- `src/components/projects/admin-readiness-workspace-picker.tsx`
- `src/components/projects/college-project-summary-editor-full.tsx`
- `src/components/projects/college-project-summary-editor.tsx`
- `src/components/projects/project-admin-at-risk-page.tsx`
- `src/components/projects/project-admin-audit-page.tsx`
- `src/components/projects/project-admin-collection-controls.tsx`
- `src/components/projects/project-admin-missing-college.tsx`
- `src/components/projects/project-admin-readiness-page.tsx`
- `src/components/projects/project-admin-reassign-mentor-page.tsx`
- `src/components/projects/project-admin-submission-review.tsx`
- `src/components/projects/project-admin-submissions-page.tsx`
- `src/components/projects/project-admin-workspace-list.tsx`
- `src/components/projects/project-create-control.tsx`
- `src/components/projects/project-readiness-override-form.tsx`
- `src/components/projects/project-resource-files-panel.tsx`
- `src/components/projects/project-resource-list.tsx`
- `src/components/projects/project-template-catalogue-export.tsx`
- `src/components/projects/project-template-view.tsx`
- `src/components/projects/project-workspace-page-export.tsx`
- `src/components/projects/project-workspace-readiness.tsx`
- `src/components/projects/super-admin-template-archive-control.tsx`
- `src/components/projects/super-admin-template-college-bulk.tsx`
- `src/components/projects/super-admin-template-create-form.tsx`
- `src/components/projects/super-admin-template-overview-editor.tsx`
- `src/components/projects/super-admin-template-page-export.tsx`
- `src/components/projects/super-admin-template-plan-editor.tsx`
- `src/components/projects/super-admin-template-resource-editor.tsx`
- `src/components/projects/super-admin-template-rollback-control.tsx`
- `src/components/projects/super-admin-template-subview-page.tsx`
- `src/components/projects/super-admin-template-tabs.tsx`

**Change types actually applied:**
1. Removed redundant nested full-width page cards, page-local max-width caps, repeated page padding and `main` wrappers in Projects creation and template flows. Existing content structure, headings, fields, routes and actions remain.
2. Converted native Project filters, Super Admin tenant policy fields, template editors, audit filters, student lookup controls and resource forms to the shared `Button`, `Input`, `Select` and `Textarea` components. Removed local border, font and background classes that overrode the shared controls; used secondary variants for cancellation and review, primary for writes, danger for resource removal.
3. Updated tab and action chrome toward the teal legacy underline and 9px button radius. Fixed primary CTA contrast: white on teal, not `text-foreground`.
4. Flattened purely decorative nested section cards into thin separators; independent template/workspace objects, user-selectable mentor tiles, independently actionable stats, actual upload rows, modals and warnings can retain their individual boundary.
5. Kept the common sidebar, shared top bar, global CSS and `src/components/ui/**` untouched. No page contents or functionality intentionally redesigned.

**Source-level verification:** inspected rendered TSX source and counted opening/closing converted `Button`, `Select` tags; repaired the multi-line native `select`/shared `Select` mismatch in the Project audit filter. No automated typecheck, lint, unit test, CI, runtime execution, screenshots, or browser acceptance was performed as directed; **strict TypeScript cleanliness and pixel parity are not certified**.

**Remaining checks:** independent browser comparison to old LMS, 320–390px viewport pass, acceptance of the 37 last-third routes, and reconciliation with upstream global token/sidebar/top-bar commits. Concurrent upstream commits arrived after initial branch sync, so this report does not certify integration with the latest `main`. Keep those issues visible rather than claiming full North Star completion.

## Second-pass verification after chat-17 shell rollout (2026-10-19)

- [x] Fast-forwarded `chatgpt/chat-9-b` to current `main` after confirming main contained prior chat-9 work (old head `f8dd4c4966`, main head at sync `ee999dda2fc7`); no force push or overwrite.
- [x] Re-read the current NORTH STAR, old LMS shell rules/spec, pages anatomy, and legacy SCSS token, button, form, dropdown, antd and common references.
- [x] Re-inventory all 37 last-third Super Admin routes and 61 Projects TSX components following chat-17's shared-kit changes; distinguish static delegates.
- [x] Second-pass replacement of identified bespoke buttons, fields, repeated canvas shells and local overrides with shared kit or exact legacy dimensions; native exceptions preserved.
- [x] Record changed paths, source-level checks and outstanding browser-level acceptance; no pixel-perfect certification.

### Current ownership boundaries
- Page shell and font tokens remain owned by chat-17; top bar chat-13; sidebar chat-19. Do not edit `src/components/ui/**`, `src/components/shell/**`, or `src/app/globals.css`.
- Last-third includes /admin routes 75–111 in `docs/orchestrator/ui-ux/pages-admin.md`; Projects includes `src/app/(authenticated)/admin/projects/**`, `src/app/(authenticated)/college/projects/**` and pages' `src/components/projects/**` dependencies, plus owned tenant/settings/verification/admin components. Placement-specific routes remain in other lanes except the existing scoped student lookup.
- Inspect literal color/spacing only where a role-local override fights the shared components; leave native controls where behavior depends on browser affordances (checkbox, radio, file input, live drag/drop).

### Second-pass execution and verification results (2026-10-19)

**Checked source inventory:** all 37 last-third `/admin` routes at positions 75–111 in `docs/orchestrator/ui-ux/pages-admin.md`, including route-only delegates/redirects, plus 61 non-`learner-*`/non-`mentor-*` Projects TSX components in `src/components/projects/`. Inspected related Super Admin inventory/editor components imported by those routes. This is **source inspection only**, not a visual-browser sign-off.

**Applied work on top of chat-17 merged shared styles:** replaced remaining raw searches/selects/textareas and custom buttons in Super Admin scoped directories, program directory, import history, membership lifecycle and Project activity/participant/resource filters, mentor reassignment, brief editor, task comment/assignee menus and CSV actions. Normalized navigation and contextual control shape to 36px by 9px with shared token foregrounds. Flattened ordinary section/overview wrappers while retaining separately actionable tiles, object cards, confirmation dialogs, native checkbox/radio/file controls and semantic warnings. Adjusted the Admin-mode project overview container to a hairline-separated section, without altering learner/mentor layout for that section.

**Files changed in this continuation:**
- Super Admin route files: `/admin/placements/student-lookup`, `projects/templates`, `projects/templates/[templateId]/colleges`, `quizzes`, `semesters`, `settings`, `settings/auth`, `tenants`, `tenants/setup`.
- Super Admin components: `admin-scoped-read-page`, `admin-scoped-live-search`, `admin-program-directory`, `scoped-membership-lifecycle-actions`, `super-admin-student-import-history`, `super-admin-placement-detail-view`, `super-admin-legacy-group-tabs`, `academic-setup-steps`.
- Projects components: `workspace-brief-editor`, `project-activity-filtered-list`, `project-mentor-reassignment`, `project-participant-list-controls`, `project-resource-controls`, `project-task-assignee-control`, `project-task-comments`, `project-submissions-page-export`, `project-audit-page-export`, `project-resource-open-link`, `project-delivery-file-uploader`, `class-team-workspace-creator`, `project-admin-submissions-page`, `project-admin-readiness-page`, `project-admin-reassign-mentor-page`, `project-admin-collection-controls`, `project-admin-audit-page`, `project-admin-nav`, `project-workspace`, `super-admin-template-tabs`, `super-admin-template-subview-page`.

**Source validation:** compared opening/closing native and shared `Button`/`Select` tags and searched for duplicate JSX `variant` props in all branch-modified TSX files. Corrected a duplicate refresh variant and a duplicate membership suspension variant as well as two missed active-tab styling substitutions. No reported tag/variant mismatches remain in those targeted source scans. Types, module resolution, lint, CI, screenshot-diff, behavior/keyboard navigation and device breakpoint checks remain **unverified** by design.

**Unchanged by intent:** API/permission code, page layout structure, user wording, `src/components/ui/**`, `src/components/shell/**`, `src/app/globals.css`, React control semantics and all native checkbox/radio/file controls. Standalone cards around independent actionable objects remain intentional and are not considered duplicate page canvases.

**Integration limitation:** During the second pass `main` advanced independently. The lane fast-forward was performed before edits; subsequent main changes are not merged into this source-only second pass. Integration conflict resolution and pixel acceptance must happen against final main; do not claim exact legacy screenshots from source inspection alone.
