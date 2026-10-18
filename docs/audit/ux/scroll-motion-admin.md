# /admin last third — hidden scrollbar, scroll cue and motion pass (chat-9)

Date: 2026-10-18. Source basis: `docs/orchestrator/briefs/ux-scroll-motion-pass.md`, `docs/audit/ui-surfaces/UI-SURFACES.md`, and signed-off UX Playbook. Assigned slice: **37 routes**, /admin route positions 75–111. No legacy copy, role permissions or mutation semantics changed.

## Cues and containment applied

| File / route-facing component | Scroll area | Cue, keyboard behavior and state |
|---|---|---|
| `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx` | Version before/after code blocks (1 template location) | Bottom fade, `overscroll-contain`, focusable named region; long content remains selectable and scrollable |
| `src/components/admin/tenant-settings-editor.tsx` | High-impact confirmation list and change result list (2) | Named keyboard regions with vertical edge fade and overscroll containment; shared ConfirmDialog remains responsible for focus trap/history |
| `src/components/admin/super-admin-student-import-history.tsx` | Import history native dialog and embedded table (2) | `dvh`-bounded overlay, vertical bottom fade, horizontal right fade, named keyboard-scroll region, touch-safe close controls |
| `src/components/projects/project-admin-workspace-list.tsx` | Workspace table (1) | Horizontal right-edge fade, overscroll containment and keyboard focus |
| `src/components/projects/super-admin-template-subview-page.tsx` | Template subview inventory table (1) | Horizontal fade, keyboard region, 44px link targets and accessible link colour |
| `src/components/projects/project-admin-submissions-page.tsx` | Unsubmitted-project table (1) | Horizontal fade, accessible region and keyboard navigation |
| `src/components/projects/class-team-workspace-creator.tsx` | Preflight and per-learner result panes (2) | Vertical fades on bounded panes, overscroll containment and visible keyboard focus |
| `src/components/projects/super-admin-template-tabs.tsx` | Template tabs (1) | Right-edge fade, horizontal overscroll containment, named tab strip, 44px links and deep-teal focus state |
| `src/components/ui/data-table.tsx` | Responsive table at `sm` and above (1 shared archetype) | Named focusable region, horizontal right-edge fade and overscroll containment; phone retains the existing row-card and “More details” disclosure |
| `src/components/admin/super-admin-student-bulk-access.tsx` | Bulk learner choice list (1) | Bottom fade, focusable named region, touch targets upgraded to 44px |
| `src/components/projects/project-admin-readiness-page.tsx` | Active overrides and selected-workspace release tables (2 eliminated) | Migrated to one responsive DataTable per dataset with primary fields, explicit empties and visible mobile Manage action |
| `src/app/(authenticated)/admin/settings/page.tsx` | Settings inventory and SMS source template tables (2 eliminated) | Replaced duplicate mobile cards/desktop raw tables with shared DataTable; no independent horizontal scroll |
| `src/app/(authenticated)/admin/course-progress/students/page.tsx` | Student progress table (1 eliminated) | Shared DataTable, explicit empty copy and all five measured fields recoverable on phone |
| `src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx` | Scope-resolution table (1 eliminated) | Shared DataTable with Winner/Ignored statuses and unchanged explanation |
 
**Count: 19 scrolling areas evaluated: 13 given explicit fades/named scroll regions (counting the shared DataTable archetype once), six raw scrolling table instances replaced with responsive DataTables.** Table caller counts are not multiplied across data rows or rendered route instances.

## Motion review

Global `src/app/globals.css` owns the 150ms fast and 200ms base motion tokens, overlay enter/fade and reduced-motion fallback. New scroll cues are static mask/edge fades: no JS animation, manual clock, hard-coded duration or animation of width/height/top/left introduced. Overlay focus and native dialog behavior still require real-browser/native-host validation; no fake screenshot or accessibility result is claimed.

## Regression and acceptance

`tests/unit/ux-admin-chat9-scroll-motion.test.ts`: **12** named `UX-admin-scroll-motion-NN` source regressions. Routes still have the 37 prior `UX-admin-<route>-01` contracts. The same-commit `typecheck`, `lint`, `ux:guard`, `ux:audit:verify` and hydrated 320/360/390/768/1280px, reduced-motion, wheel/touch/keyboard and screen-reader checks remain to be run by the orchestrator. Until then: **SOURCE WORK DONE; DEVICE/CI EVIDENCE OPEN**.
