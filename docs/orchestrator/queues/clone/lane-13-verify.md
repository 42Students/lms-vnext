# UI/UX polish VERIFICATION queue: lane chat-13 (surfaces polished by OTHER lanes)

57 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-13.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-13-b with [chat-13] after every 2 surfaces.

- [x] `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/new/draft/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/new/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/overview/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/recorded-outside/[recordId]/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/recorded-outside/page.tsx`
- [x] `src/app/(authenticated)/tpo/placements/schedule-conflicts/page.tsx`
- [x] `src/app/(authenticated)/tpo/profile/page.tsx`
- [x] `src/app/(authenticated)/tpo/recruiters/[leadId]/page.tsx`
- [x] `src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/page.tsx`
- [x] `src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx`
- [x] `src/app/(authenticated)/tpo/recruiters/campaigns/new/page.tsx`
- [x] `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx`
- [x] `src/app/(authenticated)/tpo/recruiters/campaigns/preview/page.tsx`
- [x] `src/app/(authenticated)/tpo/recruiters/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/[slug]/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/accreditation/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/after-college/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/branch-season/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/by-branch/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/by-company/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/ctc/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/failure-reasons/page.tsx`
- [x] `src/app/(authenticated)/tpo/reports/intelligence/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/joining-followups/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/joining-status/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/leads/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/offers-acceptance/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/offers-expiry/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/placed-branch/page.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/placement-summary/page.tsx`
- [ ] `src/components/placements/learner-placement-academic-evidence.tsx`
- [ ] `src/components/placements/placement-candidate-evidence-editor.tsx`
- [ ] `src/components/placements/placement-employer-relationships.tsx`
- [ ] `src/components/placements/placement-request-queue.tsx`
- [ ] `src/components/placements/recruiter-interview-slot-form.tsx`
- [ ] `src/components/placements/super-admin-drive-deadline.tsx`
- [ ] `src/components/placements/tpo-college-rules-control.tsx`
- [ ] `src/components/placements/tpo-drive-close-preview-form.tsx`
- [ ] `src/components/placements/tpo-interview-reschedule-form.tsx`
- [ ] `src/components/placements/tpo-recruiter-grant-controls.tsx`
- [ ] `src/components/placements/tpo-round-results-import.tsx`
- [ ] `src/components/placements/tpo-waitlist-promotion-control.tsx`
- [ ] `src/components/tpo/tpo-audit-saved-views.tsx`
- [ ] `src/components/tpo/tpo-batch-student-saved-views.tsx`
- [ ] `src/components/tpo/tpo-due-followup-workspace.tsx`
- [ ] `src/components/tpo/tpo-public-join-link-card.tsx`
- [ ] `src/components/tpo/tpo-trusted-domain-editor.tsx`
- [ ] `src/components/academics/college-term-mapping-manager.tsx`
- [ ] `src/components/courses/college-assignment-create.tsx`
- [ ] `src/components/courses/learner-course-discussion.tsx`
- [ ] `src/components/tracker/audit-finding-status-action.tsx`
- [ ] `src/components/courses/faculty-assessment-lifecycle.tsx`
- [ ] `src/components/courses/resource-progress-control.tsx`
- [ ] `src/app/(authenticated)/teach/not-found.tsx`
