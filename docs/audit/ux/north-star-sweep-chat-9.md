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
- [ ] Page/component sweep and per-file review.
- [ ] Record all changed paths and intentionally exempt components.
- [ ] Test/CI deliberately not run per owner's direction; source-level syntax review only.
