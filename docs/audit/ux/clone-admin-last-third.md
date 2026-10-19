# UI clone: Super Admin last third and Projects admin/college — chat-10

Branch: `chatgpt/chat-10-b`. Owner: chat-10. Last sourced from `main` commit `1fae38d2c433f5b5b0a90a22be12754ab28796e0` (2026-10-19). Scope excludes first/second third of Super Admin, learner/mentor Projects, `src/components/ui/*`, the shared PageHeader implementation, and `src/styles/legacy-skin.css`.

## Audit protocol
- Source of truth: `docs/design/legacy-styles/`, `docs/design/old-lms-shell.css`, and `docs/design/old-lms-pages.md`.
- Inventory below is a recursive Git-tree path enumeration, **not a local grep or a visual verification**. Grep counts, computed-style comparisons, and phone/tablet side-by-side proof have NOT been obtained. Leave every STRICT TICK RULE item unticked until complete.
- Preserve existing vNext page contents, security controls, scopes, filter parameters and submit handlers; do not run code, tests, or CI.

## Work queue
### Super Admin last third (57 route pages)
- [ ] `src/app/(authenticated)/admin/placements/analytics/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/applications/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/calendar/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/drives/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/hiring/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/interviews/[roundId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/interviews/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/job-settings/[jobId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/job-settings/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/joining/[offerId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/joining/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/new/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/offers/[offerId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/offers/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/retention/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/screenings/[applicationId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/screenings/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/seasons/[seasonId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/seasons/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/shortlisted/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/student-lookup/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/readiness/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/at-risk/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/audit/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/readiness/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/submissions/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/overview/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/resources/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/new/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/workspaces/new/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/recruiters/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/settings/auth/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/settings/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/students/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/tenants/create/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/tenants/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/tenants/setup/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/verification/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/videos/page.tsx` — value/state/responsive/hand-rolled-element audit pending

### College Projects (16 route pages)
- [ ] `src/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/[projectId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/[projectId]/readiness/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/at-risk/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/audit/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/create/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/readiness/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/reassign-mentor/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/submissions/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/templates/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/workspaces/new/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/workspaces/page.tsx` — value/state/responsive/hand-rolled-element audit pending

### Admin/college-owned Projects UI (30 components)
- [ ] `src/components/projects/admin-project-section-page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/admin-readiness-workspace-picker.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/college-project-mentor-dialog.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/college-project-student-roster-dialog.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/college-project-summary-editor-full.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/college-project-summary-editor.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-at-risk-page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-audit-page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-collection-controls.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-missing-college.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-nav.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-readiness-page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-reassign-mentor-page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-submission-review.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-submissions-page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-workspace-list.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-workspace-page-export.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-template-catalogue-export.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-template-controls.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-template-view.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-archive-control.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-college-bulk.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-create-form.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-overview-editor.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-page-export.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-plan-editor.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-resource-editor.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-rollback-control.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-subview-page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-tabs.tsx` — value/state/responsive/hand-rolled-element audit pending

## Value comparisons and findings (no item falsely certified)
| Element/property | Legacy source and required value | vNext source and observed value | Status |
|---|---|---|---|
| Heading title on desktop | `docs/design/old-lms-pages.md:5` ~30px / 600 / #172033; `docs/design/legacy-styles/components___listing-page-header.scss:52-59` 28px / 600 / $text | `src/components/ui/page-header.tsx:31-35` desktop 30px / 600 / var(--lms-heading) | Shared owner controls final computed value; pending screenshot |
| Header title on phone | `components___listing-page-header.scss:130-143` column + 20px title | `src/components/ui/page-header.tsx:27-34` column and 20px mobile | Pending computed verification |
| Navigation tab text | `components___common.scss:365-374` 13px, 600, 16px line-height, $neutral-400 | `src/components/ui/tabs.tsx:83-91` 13px, 600, 16px line-height, --lms-neutral-400 | Match in source; token computed check pending |
| Navigation active underline | `components___common.scss:381-390,403-410` 3px teal active rule | `src/components/ui/tabs.tsx:83-91` 3px var(--lms-primary) active | Match in source; token computed check pending |
| Job workspace nav | `components___common.scss:365-410` underline tabs, active/hover states | `src/app/(authenticated)/admin/placements/jobs/[jobId]/layout.tsx:27-31` rounded gray outlined nav links with no active state | Mismatch to address in this lane |
| Title eyebrow | `docs/design/old-lms-pages.md:5` page head title with inline subtitle, **no separate eyebrow** | Multiple last-third `PageHeader eyebrow=` props append a prefix to subtitle | Repeating mismatch: codemod candidate; do not remove substantive description |

## Scans required before checking anything
```sh
grep -RnlE '<(button|select|textarea)([[:space:]>])' 'src/app/(authenticated)/admin/placements' 'src/app/(authenticated)/admin/projects' 'src/app/(authenticated)/college/projects' src/components/projects
grep -Rn 'eyebrow=' 'src/app/(authenticated)/admin/placements' 'src/app/(authenticated)/admin/projects' 'src/app/(authenticated)/college/projects'
grep -RnE 'role="tab"|role="tablist"|<nav|rounded-(xl|2xl|3xl)|#[0-9a-fA-F]{6}' 'src/app/(authenticated)/admin/placements' 'src/app/(authenticated)/admin/projects' 'src/app/(authenticated)/college/projects'
```
No counts claimed: this environment only has read/write GitHub connector access, and running repository scripts / CI is explicitly forbidden.

## Strict completion items
- [ ] Super Admin placements/jobs nav tabs (missing: source edit, remaining hand-roll scan, responsive proof, screenshot)
- [ ] Repeated PageHeader eyebrow cleanup (missing: apply reviewed codemod and review each transformed file)
- [ ] Remaining Super Admin last-third pages (missing: exhaustive file-by-file values, states, coverage, responsive, syntax verification)
- [ ] College Projects and owned Projects components (missing: exhaustive file-by-file values, states, coverage, responsive, syntax verification)
