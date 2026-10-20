# Clone queue: lane chat-5

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (10)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [x] `src/components/placements/placement-offer-controls.tsx` (score 31: raw <select> x2, raw text <input> x7)
- [x] `src/components/placements/placement-role-options.tsx` (score 25: raw <select> x2, raw text <input> x5)
- [x] `src/components/placements/tpo-company-feedback-form.tsx` (score 5: raw <button> x1)
- [x] `src/components/placements/tpo-company-interaction-form.tsx` (score 5: raw <button> x1)
- [x] `src/components/tpo/tpo-draft-drive-step-one-form.tsx` (score 5: raw <button> x1)
- [x] `src/components/placements/drive-day-roster.tsx` (score 4: raw text <input> x1, arbitrary px size x1)
- [x] `src/components/placements/placement-drive-workspace.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/placements/tpo-drive-clone-action.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/placements/tpo-drive-workspace-nav.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/placements/tpo-general-requests-panel.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (38)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [x] `src/app/(authenticated)/tpo/batches/[batchId]/invitation-prep/page.tsx`
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/nudge-prep/page.tsx`
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/reminder-prep/page.tsx`
- [x] `src/app/(authenticated)/tpo/batches/page.tsx`
- [x] `src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/page.tsx`
- [x] `src/app/(authenticated)/tpo/drive-day/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/about/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/cancel-preview/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/close-preview/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/closeout/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/drive-day/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/extend-deadline/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/interview-slots/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/selections/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/waitlist/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/new/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/overview/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/recorded-outside/[recordId]/page.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/recorded-outside/page.tsx`
