# Chat-5 North Star verification and extension — 2026-10-19

## Ownership and baseline
Branch `chatgpt/chat-5-b`, updated from `origin/main` at `ee999dda2fc72340cfd7daaa4c46292c194a8c0c` before edits. This is a **source-level** verification/extension, not a browser pixel-diff or CI run. Shared UI skins and authenticated page canvas now exist on main.

Inspected: `docs/orchestrator/queues/master-queue.md` NORTH STAR, `docs/design/old-lms-shell.css`, `old-lms-shell-spec.md`, `old-lms-pages.md`, legacy `components___variables.scss`, `components___common.scss`, `components___button.scss`, `components___form.scss`, `components___dropdown.scss`, `components___header.scss`, `components___antddesign.scss`, and shared `src/app/globals.css`, `src/components/ui/page-canvas.tsx`, `page-header.tsx`, `button.tsx`, `data-table.tsx`.

## Verified baseline
- `src/app/(authenticated)/layout.tsx` wraps every signed-in page with one `PageCanvas`; avoid an additional canvas within TPO routes.
- Global button skin: `bg-primary` resolves to `#0a7c88` and white text; 36px desktop minimum, 9px radius. Shared data table renders hairline row dividers. Shared page header sets desktop 30px/600 `#172033`.
- The initial chat-5 sweep covered 39 TPO drive/job/selection/offers/placements page routes plus direct components, but **did not** exhaustively normalize large `placement-*` workspaces or public placement pages.
- Source discrepancies discovered: `bg-surface-subtle`, `bg-surface-secondary`, and `text-warning-text` are not defined in the current Tailwind theme; nested bordered cards remain in several drive workspaces; `placement-job-create-form` still uses locally defined noncanonical control classes; the public placements page uses `text-3xl sm:text-4xl` instead of the measured 30px/600. Some older selectors remain in string-composed `className` expressions, requiring targeted review.

## Remediation scope and safety
1. Reinspect every implementation page in `src/app/(authenticated)/tpo/placements/**`, `tpo/drive-day/**`, and the drive/selection/offer-specific `src/components/placements/{tpo-*,placement-*}` and `src/components/tpo/tpo-*` components.
2. Normalize stray fixed palette classes to defined LMS tokens, preserve semantic warning/error variants and accessibility, avoid external token imports into the route layer.
3. Remove plain nested section cards fighting the PageCanvas while preserving genuinely distinct overlays, metric tiles and interactive data objects; retain sections, forms, tables, wording, and handlers.
4. Extend to placement-specific components directly used by HR-facing pages (do not edit HR/recruiter routes, owned by other lanes) and public placements `src/app/placements/page.tsx`, `src/components/placements/public-*.tsx`, `public-join-preview-retry.tsx`.
5. Keep mobile 44px touch areas; desktop 36px controls, 9px corners, white-on-primary; titles 30px/600 `#172033`. Never modify `src/components/ui/**`, `src/components/shell/**`, or global tokens.
6. Maintain exact source text, identifiers, business logic, and order. Commit/push frequently with `[chat-5]` titles. No CI, runtime execution, or test disabling.

## Tracking
Second-pass commits and discovered exceptions will be recorded below. Visual pixel parity remains **unconfirmed** until the orchestrator runs an old-LMS comparison.
