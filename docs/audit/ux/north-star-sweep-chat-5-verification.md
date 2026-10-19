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

## Second-pass implementation results (2026-10-19)

- Fast-forwarded this branch to origin/main baseline `ee999dda2fc72340cfd7daaa4c46292c194a8c0c` **before** modifying code. Source-level recheck identified and updated 69 source files across 16 commits through the closeout point. No changes were made to global CSS, the shared UI kit, sidebar, top bar or authentication middleware.
- Rechecked all 39 TPO placements and drive-day implementation routes and the TPO-specific components that render their drives, jobs, selection, interviews, rounds, offers, joining, exports and lists. Corrected remaining status/notice cards, raw `text-warning-text`, inconsistent h1 classes, input/button corners, white primary foregrounds, unsupported `bg-surface-subtle` and `bg-surface-secondary` utilities, and nested builder/workspace section borders.
- Extended the same token and surface pass to placement workspaces shared with College Admin, placement components directly imported by HR routes (`RecruiterResultControls`, `RecruiterPlacementPortfolio`, `RecruiterResumeDownload`, applicant notes and interview controls), and the public `/placements` page plus the recruiter-enquiry/join/preview UI. Public placement metrics remain separate legitimate stat objects. Form actions and data paths remain unchanged.
- The shared authenticated layout already supplies `PageCanvas`; TPO pages were **not** double-wrapped. Kept individual `Next step`, status/metric tiles, alert/empty states, overlays and action menus as standalone objects where their separation is functional.
- Explicitly reserved: `src/components/ui/**`, `src/components/shell/**`, `src/app/globals.css` (chat-17/19/13). Shared TPO quick-access header remains in `src/app/(authenticated)/tpo/layout.tsx`; the top-bar owner should confirm that its controls are not duplicated after full integration. Error/loading boundaries rely on the new common skin.
- **Verification limitation:** compared checked-in source and commit diffs to documented SCSS/tokens; no runtime, screenshots, browser pixel-diff, unit tests, typecheck or CI were executed by instruction. A source-level pass does not establish literal pixel-perfect parity; final rendering must be compared against the legacy app by the orchestrator.

### Changed second-pass source files

- `src/app/(authenticated)/tpo/drive-day/page.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/page.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/cancel-preview/page.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/page.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/close-preview/page.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/closeout/page.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/drive-day/page.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/extend-deadline/page.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/page.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/page.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/page.tsx`
- `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/company-share-controls.tsx`
- `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx`
- `src/app/placements/page.tsx`
- `src/components/placements/applicant-notes-panel.tsx`
- `src/components/placements/placement-bulk-add-applicants.tsx`
- `src/components/placements/placement-bulk-offer-withdraw.tsx`
- `src/components/placements/placement-draft-edit-form.tsx`
- `src/components/placements/placement-drive-controls.tsx`
- `src/components/placements/placement-drive-day-overview.tsx`
- `src/components/placements/placement-drive-workspace.tsx`
- `src/components/placements/placement-employer-relationships.tsx`
- `src/components/placements/placement-job-create-form.tsx`
- `src/components/placements/placement-job-create-workspace.tsx`
- `src/components/placements/placement-job-lifecycle-controls.tsx`
- `src/components/placements/placement-offer-controls.tsx`
- `src/components/placements/placement-operations-overview.tsx`
- `src/components/placements/placement-recruiter-access.tsx`
- `src/components/placements/placement-report-ui.tsx`
- `src/components/placements/placement-role-options.tsx`
- `src/components/placements/public-join-preview-retry.tsx`
- `src/components/placements/public-recruit-from-us.tsx`
- `src/components/placements/public-recruiter-join-form.tsx`
- `src/components/placements/recorded-outside-form.tsx`
- `src/components/placements/recruiter-placement-portfolio.tsx`
- `src/components/placements/recruiter-result-controls.tsx`
- `src/components/placements/recruiter-resume-download.tsx`
- `src/components/placements/tpo-applicant-review-form.tsx`
- `src/components/placements/tpo-bulk-drive-reminder.tsx`
- `src/components/placements/tpo-bulk-round-result-recorder.tsx`
- `src/components/placements/tpo-college-rules-control.tsx`
- `src/components/placements/tpo-company-lifecycle-editor.tsx`
- `src/components/placements/tpo-drive-act-on-panel.tsx`
- `src/components/placements/tpo-drive-cancel-form.tsx`
- `src/components/placements/tpo-drive-change-requests.tsx`
- `src/components/placements/tpo-drive-clone-action.tsx`
- `src/components/placements/tpo-drive-close-preview-form.tsx`
- `src/components/placements/tpo-drive-saved-views.tsx`
- `src/components/placements/tpo-drive-selection-manager.tsx`
- `src/components/placements/tpo-interview-slot-planner.tsx`
- `src/components/placements/tpo-public-placement-content-editor.tsx`
- `src/components/placements/tpo-recruiter-grant-controls.tsx`
- `src/components/placements/tpo-remind-non-applicants.tsx`
- `src/components/placements/tpo-request-bulk-decision.tsx`
- `src/components/placements/tpo-request-decision-control.tsx`
- `src/components/placements/tpo-round-apply-control.tsx`
- `src/components/placements/tpo-round-calendar-control.tsx`
- `src/components/placements/tpo-round-drive-day-read-only.tsx`
- `src/components/placements/tpo-round-reorder.tsx`
- `src/components/placements/tpo-round-result-recorder.tsx`
- `src/components/placements/tpo-round-results-import.tsx`
- `src/components/placements/tpo-selection-import.tsx`
- `src/components/placements/tpo-sequential-request-review.tsx`
- `src/components/placements/tpo-waitlist-promotion-control.tsx`
- `src/components/placements/tpo-week-hour-calendar.tsx`
- `src/components/tpo/tpo-drive-request-actions.tsx`
