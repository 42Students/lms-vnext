# College Admin portal clone audit — chat-4

**Scope:** `src/app/(authenticated)/college/**`, `college-admin/**`, scoped Super Admin colleges/organizations/tenants/readiness/verification/branding, College Admin people/groups/academics components, tracker and in-scope notification/messaging components. **Branch:** `chatgpt/chat-4-b`.

## Baseline and work plan
- Source snapshot: synced `main` at `ca5572f28bd815ac394180d4269df3db5889e19f` into lane history before this sweep. Shared UI, globals, shell and cross-lane layout files are **not owned by chat-4**.
- Recursive Git tree inventory: **260** College Admin TSX routes, **8** college-admin aliases, **51** scoped Super Admin colleges/organizations/tenants/verification/domain routes, **48** college/groups/academics/people components, **72** shared-admin components (only tenant-relevant subset), **38** tracker routes/components, **8** verification components, **4** activity components. These sets may overlap and are **not summed**.
- Baseline source-token scan of 16 high-traffic college `page.tsx` routes: raw `<button>` **2**, `<input>` **10**, `<select>` **3**, `<textarea>` **0**, `<table>` **0**, hard-coded hex literals **0**, local `<h1>` **1**; 16 files scanned. These are limited sample counts, **not** all-scope clearance counts.
- Grep command family for final all-scope audit: `grep -RInE '<(button|input|select|textarea)([[:space:]>])' 'src/app/(authenticated)/college' src/components/college src/components/academics src/components/groups --include='*.tsx'` and parallel commands for `<table`, `role="dialog"`, `fixed inset-0`, `#[[:xdigit:]]{3,8}`, `<h1`, `PageHeader`. **Full repo grep is not yet executed** (source access is through GitHub); final counts require a complete crawl.
- Plan: migrate remaining raw controls with native prop/handler parity; strip local button/input skins in favor of shared tokens; replace hand-rolled tables/overlays with shared primitives only after inspection; normalize page heads without altering page sections; confirm the authenticated one-canvas layout; audit responsive and keyboard interaction; preserve unrelated lane work.

## Legacy value comparison — source-level, not an all-states certification

| Property | Legacy reference | vNext reference | Review |
| --- | --- | --- | --- |
| Canvas fill | `docs/design/old-lms-pages.md:6` white | `src/components/ui/page-canvas.tsx:17` `bg-white` | token matches |
| Canvas border | `docs/design/old-lms-pages.md:6` 1px #e5e9f0 | `src/components/ui/page-canvas.tsx:17` `border-[var(--lms-canvas-border)]` | variable value needs final verification |
| Canvas radius | `docs/design/old-lms-pages.md:6` 12px | `src/components/ui/page-canvas.tsx:17` `--lms-canvas-radius` | variable value needs final verification |
| Canvas padding | `docs/design/old-lms-pages.md:6` 24px | `src/components/ui/page-canvas.tsx:22` `--lms-canvas-padding` | variable value and breakpoints need verification |
| Page title | `docs/design/old-lms-pages.md:7` title with inline subtitle/actions | `src/components/ui/page-header.tsx:20-31` | individual portal use and states need verification |
| Primary button | `docs/design/old-lms-shell-spec.md:25` #0a7c88, white, 9px, 36px, 14px/650 | `src/components/ui/button.tsx:11-27` CSS custom properties | token value, hover/focus/disabled/loading comparison pending |

## Section H — STRICT TICK RULE
- [ ] College Admin routes (missing: all-route grep proof, value-by-value desktop/tablet/phone comparisons, zero unshared controls/tables/dialogs and complete PageHeader count).
- [ ] College Admin groups/academics/people components (missing: zero raw controls and hard-coded visual skins across all components; complete states and interaction proof).
- [ ] Super Admin colleges/organizations/tenants/readiness/verification/branding (missing: exhaustive scoped component/page scan and responsive/keyboard proof).
- [ ] Bug tracker and messaging/notification pages (missing: exhaustive routes/components scan, modal/table reconciliation, responsive and state proof).
- [ ] One authenticated canvas and PageHeader throughout owned portal (missing: exhaustive nested-card inventory and comparison against shell; shared shell/layout owned by other lanes).
- [ ] Final all-scope grep zero/exception ledger (missing: complete repository snapshot grep, documented exemptions and line numbers).
- [ ] Value/state table and responsive proof complete (missing: full default/hover/focus/active/disabled/loading/error/empty comparisons for every relevant component).

## Exceptions that must remain explicit
Native hidden inputs, file uploads, checkbox/radio controls and externally provided widget markup may need native semantics. An exemption requires a path, line and reason; the item stays unticked until counted and documented. Do not tick based only on an earlier north-star inventory marked `[x]`.

## Change batches
