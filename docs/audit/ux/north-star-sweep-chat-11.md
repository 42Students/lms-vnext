# NORTH STAR — chat-11 TPO settings / tenant setup / readiness / course progress

Owner: chat-11. Branch: `chatgpt/chat-11-b`. Reference snapshot: `main` 2026-10-19. Visual target is the existing LMS shell and design system; **page contents, wording, tables, controls, forms, sections, navigation and behaviours must remain in their original order**. No CI or local app execution (owner directive).

## Legacy sources and shared ownership

- `docs/orchestrator/queues/master-queue.md` NORTH STAR, `docs/design/old-lms-shell.css`, `old-lms-shell-spec.md`, `old-lms-pages.md`, `vnext-vs-old-lms-gap.md`.
- `docs/design/legacy-styles/components___variables.scss`, `components___button.scss`, `components___form.scss`, `components___antddesign.scss`, `components___dropdown.scss`, `components___common.scss`, `components___fonts.scss`, `components___typo.scss`, `pages___admin-list-pages.scss`.
- Authoritative shell: one #fff canvas / #e5e9f0 hairline / radius 12 / padding 24 on #f1f4f9; heading 30px/600 #172033 on desktop; list/table hairlines; shared primary #0a7c88 with white text, 9px radius, 36px high. Inter and shared semantic tokens, never a parallel palette.
- Shared `src/components/ui/**`, `src/app/globals.css`, layout/canvas belong to chat-17. Sidebar/header belong to chat-19/chat-13. **Do not change them in this lane.** Page-specific utilities should defer to their shipped shared UI skins.

## Inventory to sweep (retain content)

| Route family | Pages / states | Local components |
| --- | --- | --- |
| TPO settings | `src/app/(authenticated)/tpo/settings/{page.tsx,layout.tsx,loading.tsx,error.tsx}`; `after-college`, `blocked-dates`, `branding`, `job-types`, `notices`, `notifications`, `prep-readiness`, `public-link`, `public-page`, `recruiters`, `rules`, `season`, `see`, `team`, `templates`, `trusted` pages | `src/components/tpo/tpo-{after-college-editor,after-college-bulk-editor,blocked-dates-editor,builtin-job-types-editor,communication-settings-editors,custom-job-type-placed,custom-job-type-rename,job-types-editor,my-notification-preferences-editor,optional-emails-editor,prep-percentage-editor,prep-readiness-editor,trusted-domain-editor}`, `src/components/placements/{tpo-settings-nav,tpo-college-rules-control,tpo-season-controls,tpo-recruiter-grant-controls,placement-season-manager}` |
| College setup / progress | `src/app/(authenticated)/college/{page.tsx,course-progress/**,branding/**,college-profile/**,domains/**}`; setup checklist embedded in College Admin | `src/components/admin/college-setup-checklist.tsx`, `college-branding-form.tsx`, `college-branding-preview.tsx` where used; restrict shared College Admin files to this surface |
| Super Admin tenant administration | `src/app/(authenticated)/admin/{tenants/**,colleges/[collegeId]/{page.tsx,branding/**,signin/**,readiness/**,subdomain/**},module-access/**,features/**,course-progress/**,settings/**}` | `src/components/admin/{college-branding-form,college-branding-preview,college-signin-method-form,college-logo-uploader,tenant-directory-csv-control,tenant-domain-manager,tenant-restore-action,tenant-settings-editor,tenant-settings-other-keys,college-at-glance-panel,college-feature-rule-editor,descendant-feature-rule-editor,academic-module-scope-inventory}` |
| Related creation/edit forms | `src/components/tpo/tpo-public-join-link-card.tsx`, `src/components/placements/tpo-public-placement-content-editor.tsx`, `tpo-public-placement-toggle.tsx`; any other component imported by settings pages | Follow imports, but avoid HR/Recruiter/other lane-owned unrelated components |

## Sweep execution checklist

1. Remove *page-level* duplicate canvas/card wrappers (`rounded-xl border border-border bg-surface p-4/5/6`, etc.) **only where they are generic section containers**. Keep meaningful separate objects, table edges, status strips, controls, controls' semantic regions, and ARIA labels.
2. Replace local hard-coded colors (`text-[#...]`, inline rgb/hex, `bg-white`, `text-slate-*`, `bg-blue-*`), and conflicting `font-*`, `text-xl` headings with semantic tokens or the exact old LMS heading recipe; keep status semantics and responsive constraints.
3. Replace manual button/input/select/text area skins with shared `Button`, `Input`, `Select`, `Textarea` when safe; otherwise keep native elements and use the exact shared control tokens/classes, no content/behavior changes.
4. Remove redundant top-level page padding/background that fights the shared `PageCanvas`. Preserve container `min-w-0`, scroll affordances, phone layouts and focus-visible rings.
5. Audit each route and imported component, update status below. Do not claim screenshot-perfect parity without browser evidence.

## Status

- [x] Source inventory and design references established; branch synchronized from main.
- [x] Source-level page and component sweep completed across the inventory; see exact changed paths below.
- [ ] Legacy-browser visual comparison at 320/360/390/1280px, CI/TypeScript and live runtime verification are deferred per owner direction.

## Execution record — 2026-10-19

- Pulled current `main` into the chat-11 branch before the first source edit (fast-forward), wrote this inventory **before** code changes, and later merged the new `main` non-destructively. No edits to shared `src/components/ui`, global CSS, top bar or sidebar.
- **147 applicable TSX sources reviewed:** 76 loading/error surfaces plus 71 pages/imported editors. Several inherited the newly shipped old-LMS shared skins and required no local override; **52 TSX sources changed** in this sweep.
- Changes were restricted to presentation: legacy desktop/mobile page headings, semantic link/primary colors, control borders/radii and white primary labels, eliminating ordinary section-card shells that duplicated `PageCanvas`, and fixing native retry controls. All existing page content, navigation, async logic, permission checks, and text are preserved.
- Primary source commits: `6f5b69e`, `99bb50d`, `8130287`, `ba44149`, `a178024`, `1ee4a0c`, `3c81fa7`, `5a7cb20`, `8f73477`, `738877b`. Follow-up class-token cleanup: `e98bec6`, `f7d74df`, `5705a4b`, `1e6b412`, `2c2826f`. Branch merge: `4df3d74`.
- Source-level re-review removed accidental standalone `-` utility tokens after flattening and aligned secondary bordered links to legacy 9px control radius. The component kit's measured Inter typeface and existing `PageHeader`/`Button`/`Input`/`Select` skins remain the canonical source of visual details.
- **Not certified:** No TypeScript, tests, CI, browser/screenshots, actual accessibility-tree audit, or legacy-vs-vNext pixel visual diff was executed. Owner's no-CI instruction applies. This is the authored source sweep, not proof of visual parity under production data.

### Exact changed TSX paths (compared with synced main baseline)

- `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx`
- `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx`
- `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx`
- `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx`
- `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx`
- `src/app/(authenticated)/admin/course-progress/page.tsx`
- `src/app/(authenticated)/admin/course-progress/students/page.tsx`
- `src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx`
- `src/app/(authenticated)/admin/features/[collegeId]/page.tsx`
- `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/history/page.tsx`
- `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/page.tsx`
- `src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx`
- `src/app/(authenticated)/admin/features/page.tsx`
- `src/app/(authenticated)/admin/module-access/page.tsx`
- `src/app/(authenticated)/admin/settings/auth/page.tsx`
- `src/app/(authenticated)/admin/settings/error.tsx`
- `src/app/(authenticated)/admin/settings/page.tsx`
- `src/app/(authenticated)/admin/tenants/create/page.tsx`
- `src/app/(authenticated)/admin/tenants/page.tsx`
- `src/app/(authenticated)/admin/tenants/setup/page.tsx`
- `src/app/(authenticated)/college/college-profile/page.tsx`
- `src/app/(authenticated)/college/course-progress/page.tsx`
- `src/app/(authenticated)/college/page.tsx`
- `src/app/(authenticated)/tpo/settings/after-college/error.tsx`
- `src/app/(authenticated)/tpo/settings/blocked-dates/error.tsx`
- `src/app/(authenticated)/tpo/settings/branding/error.tsx`
- `src/app/(authenticated)/tpo/settings/job-types/error.tsx`
- `src/app/(authenticated)/tpo/settings/notices/page.tsx`
- `src/app/(authenticated)/tpo/settings/notifications/error.tsx`
- `src/app/(authenticated)/tpo/settings/notifications/page.tsx`
- `src/app/(authenticated)/tpo/settings/prep-readiness/error.tsx`
- `src/app/(authenticated)/tpo/settings/public-page/page.tsx`
- `src/app/(authenticated)/tpo/settings/recruiters/error.tsx`
- `src/app/(authenticated)/tpo/settings/recruiters/page.tsx`
- `src/app/(authenticated)/tpo/settings/rules/error.tsx`
- `src/app/(authenticated)/tpo/settings/season/error.tsx`
- `src/app/(authenticated)/tpo/settings/see/error.tsx`
- `src/app/(authenticated)/tpo/settings/team/error.tsx`
- `src/app/(authenticated)/tpo/settings/team/page.tsx`
- `src/app/(authenticated)/tpo/settings/trusted/error.tsx`
- `src/app/(authenticated)/tpo/settings/trusted/page.tsx`
- `src/components/admin/college-branding-form.tsx`
- `src/components/admin/college-branding-preview.tsx`
- `src/components/admin/descendant-feature-rule-editor.tsx`
- `src/components/placements/placement-season-manager.tsx`
- `src/components/placements/tpo-college-rules-control.tsx`
- `src/components/placements/tpo-public-placement-content-editor.tsx`
- `src/components/placements/tpo-recruiter-grant-controls.tsx`
- `src/components/placements/tpo-season-controls.tsx`
- `src/components/tpo/tpo-after-college-bulk-editor.tsx`
- `src/components/tpo/tpo-job-types-editor.tsx`
- `src/components/tpo/tpo-public-join-link-card.tsx`

### Verified no-local-change class

- Unchanged pages and editor components already use semantic tokens, shared controls, or the intentionally separate card/tile objects. All remaining route-specific error/loading files were inspected: shared `GracefulPageLoading`, `GracefulErrorBoundary`, `ErrorState`, `Skeleton` and neutral `bg-muted` skeleton placeholders inherit chat-17's kit.
- No structural modifications were made to forms, tables, section order, search filters, statuses, permission checks, or response bodies.

### Visual handoff (for orchestrator with a running app)

Check at 320/360/390/768/1280px: page-canvas border/padding, TPO settings left navigation and sticky behavior, filter and save control height, keyboard focus and overlays, tenant setup steps, branding preview, sign-in-method radio rows, module-access hierarchy tabs, readiness evidence tables, College Admin course progress, TPO notice error/retry and contact settings. Diff screenshots against the old LMS before release.

## Follow-on sweep (2026-10-19)

The continuation after this initial source inventory is recorded in [`north-star-sweep-11.md`](./north-star-sweep-11.md). It contains the additional **222 cumulative source commits** on `chatgpt/chat-11-b`, the exact 93 edited source paths, legacy token fixes, standalone card-wrapper corrections, malformed utility cleanup, primary-button contrast fixes, and deferred browser/CI checks. This historical ledger remains intact as the first-pass baseline.
