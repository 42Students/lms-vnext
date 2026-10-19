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
- [ ] Page/control sweep in progress. Commit hashes and complete file list will be added as changes land.
- [ ] Legacy-browser visual comparison at 320/360/390/1280px, CI/TypeScript and live runtime verification are deferred per owner direction.
