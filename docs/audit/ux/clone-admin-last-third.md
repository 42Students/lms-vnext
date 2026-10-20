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
- [ ] `src/app/(authenticated)/admin/placements/calendar/page.tsx` — source-level patch applied; Missing computed width and 375px/768px proof (still unticked)
- [ ] `src/app/(authenticated)/admin/placements/drives/page.tsx` — source-level patch applied; Missing statuses and full row rendering proof (still unticked)
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
- [ ] `src/app/(authenticated)/admin/placements/page.tsx` — source-level patch applied; Missing phone/tablet overflow proof (still unticked)
- [ ] `src/app/(authenticated)/admin/placements/retention/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/screenings/[applicationId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/screenings/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/seasons/[seasonId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/seasons/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/shortlisted/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/student-lookup/page.tsx` — source-level clone patch applied; strict visual and runtime proofs outstanding
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/readiness/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/at-risk/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/audit/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/readiness/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/submissions/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx` — source-level clone edit re-read; awaiting computed/responsive/runtime proof
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/overview/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx` — source-level clone patch applied; strict visual and runtime proofs outstanding
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/resources/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx` — source-level clone edit re-read; awaiting computed/responsive/runtime proof
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/new/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/projects/templates/page.tsx` — source-level clone patch applied; strict visual and runtime proofs outstanding
- [ ] `src/app/(authenticated)/admin/projects/workspaces/new/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/recruiters/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/settings/auth/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/settings/page.tsx` — reviewed source-level clone edit; missing full grep, computed values, phone/tablet and runtime proof
- [ ] `src/app/(authenticated)/admin/students/page.tsx` — reviewed source-level clone edit; missing full grep, computed values, phone/tablet and runtime proof
- [ ] `src/app/(authenticated)/admin/tenants/create/page.tsx` — reviewed source-level clone edit; missing full grep, computed values, phone/tablet and runtime proof
- [ ] `src/app/(authenticated)/admin/tenants/page.tsx` — source-level clone patch applied; strict visual and runtime proofs outstanding
- [ ] `src/app/(authenticated)/admin/tenants/setup/page.tsx` — source patch applied: setup warnings use shared Banner, empty college uses EmptyState; missing full grep/computed values/phone-tablet proof
- [ ] `src/app/(authenticated)/admin/verification/page.tsx` — reviewed source-level clone edit; missing full grep, computed values, phone/tablet and runtime proof
- [ ] `src/app/(authenticated)/admin/videos/page.tsx` — value/state/responsive/hand-rolled-element audit pending

### College Projects (16 route pages)
- [ ] `src/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/[projectId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/[projectId]/readiness/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/at-risk/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/audit/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/create/page.tsx` — reviewed source-level clone edit; missing full grep, computed values, phone/tablet and runtime proof
- [ ] `src/app/(authenticated)/college/projects/page.tsx` — source-level patch applied; Missing banner state snapshots and scoped grep (still unticked)
- [ ] `src/app/(authenticated)/college/projects/readiness/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/reassign-mentor/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/submissions/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx` — source-level clone patch applied; strict visual and runtime proofs outstanding
- [ ] `src/app/(authenticated)/college/projects/templates/page.tsx` — source-level clone patch applied; strict visual and runtime proofs outstanding
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/workspaces/new/page.tsx` — reviewed source-level clone edit; missing full grep, computed values, phone/tablet and runtime proof
- [ ] `src/app/(authenticated)/college/projects/workspaces/page.tsx` — value/state/responsive/hand-rolled-element audit pending

### Admin/college-owned Projects UI (30 components)
- [ ] `src/components/projects/admin-project-section-page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/admin-readiness-workspace-picker.tsx` — source-level patch applied; Missing picker keyboard/mobile/surface proof (still unticked)
- [ ] `src/components/projects/college-project-mentor-dialog.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/college-project-student-roster-dialog.tsx` — source-level patch applied; Missing checked/indeterminate/disabled browser proof (still unticked)
- [ ] `src/components/projects/college-project-summary-editor-full.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/college-project-summary-editor.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-at-risk-page.tsx` — source-level patch applied; Missing full chip-state and responsive proof (still unticked)
- [ ] `src/components/projects/project-admin-audit-page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-collection-controls.tsx` — source-level patch applied; Missing scripted DOM keyboard and pagination boundary proof (still unticked)
- [ ] `src/components/projects/project-admin-missing-college.tsx` — source-level clone patch applied; strict visual and runtime proofs outstanding
- [ ] `src/components/projects/project-admin-nav.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-readiness-page.tsx` — source-level patch applied; Missing full statuses and keyboard/phone proof (still unticked)
- [ ] `src/components/projects/project-admin-reassign-mentor-page.tsx` — source-level clone edit re-read; awaiting computed/responsive/runtime proof
- [ ] `src/components/projects/project-admin-submission-review.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-admin-submissions-page.tsx` — source-level patch applied; Missing complete unsubmitted table scan (still unticked)
- [ ] `src/components/projects/project-admin-workspace-list.tsx` — reviewed source-level clone edit; missing full grep, computed values, phone/tablet and runtime proof
- [ ] `src/components/projects/project-admin-workspace-page-export.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-template-catalogue-export.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-template-controls.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/project-template-view.tsx` — source-level clone patch applied; strict visual and runtime proofs outstanding
- [ ] `src/components/projects/super-admin-template-archive-control.tsx` — source-level clone patch applied; strict visual and runtime proofs outstanding
- [ ] `src/components/projects/super-admin-template-college-bulk.tsx` — source-level clone patch applied; strict visual and runtime proofs outstanding
- [ ] `src/components/projects/super-admin-template-create-form.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-overview-editor.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-page-export.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-plan-editor.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-resource-editor.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/components/projects/super-admin-template-rollback-control.tsx` — source-level clone patch applied; strict visual and runtime proofs outstanding
- [ ] `src/components/projects/super-admin-template-subview-page.tsx` — source patch applied: template version pagination uses shared Pagination; missing complete tab/status/keyboard/responsive proof
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


## Bounded turn 1: committed visual and state corrections
All changes below are committed on `chatgpt/chat-10-b`. **None is ticked complete under STRICT TICK RULE** because no local grep/runtime/screenshot execution was permitted.

1. `src/app/(authenticated)/admin/placements/jobs/[jobId]/layout.tsx`: replaced outlined, equally-styled nav links (old lines 27-31) with `AdminPlacementJobTabs`. New route-aware client component at `src/app/(authenticated)/admin/placements/jobs/[jobId]/admin-placement-job-tabs.tsx` provides Overview/Applications/Schedule/Settings through shared underline `Tabs`. Matches 13px/600/16px tab text and 3px selected underline from `docs/design/legacy-styles/components___common.scss:365-410`. The selected segment is derived from Next.js layout navigation; phone overflow is handled by `src/components/ui/tabs.tsx:70-93`. Manual mobile/runtime proof pending.
2. `src/app/(authenticated)/college/projects/page.tsx`: removed the duplicate export control from the display-tab section; kept the export control inside shared `ListToolbar` (legacy list-toolbar placement: `docs/design/old-lms-pages.md:9`). Converted missing-college custom alert block to shared `ErrorState`, retaining its message and back link.
3. `src/app/(authenticated)/admin/placements/analytics/page.tsx`: converted invalid-filter raw alert to shared `ErrorState` with existing clear-filter link and 5,000-drive cap inline notice to shared warning `Banner`. Intentional copy and warning condition unchanged. Matches the legacy slim banner pattern described by `docs/design/old-lms-pages.md:10`; visual verification pending.
4. `src/app/(authenticated)/admin/placements/drives/page.tsx`: moved the sole `Create drive →` link from beneath the heading into `PageHeader.actions` with existing primary tokens (old-LMS heading/action row: `docs/design/old-lms-pages.md:6`); retained remaining navigation links and route/filters.
5. `scripts/codemods/chat10-admin-eyebrows.cjs`: AST codemod for repeated `PageHeader eyebrow` attributes across the assigned Super Admin last-third and college Projects routes. It is dry-run by default and requires `--write`; **not executed**. Run locally later: `node scripts/codemods/chat10-admin-eyebrows.cjs --write`, inspect changed files, re-run greps and compile/syntax gate. The script does not modify the shared PageHeader or any prohibited directory.

### Re-read evidence after edits (source line anchors)
- `src/app/(authenticated)/admin/placements/jobs/[jobId]/layout.tsx` — `6:import { AdminPlacementJobTabs } from "./admin-placement-job-tabs";`; `22:<AdminPlacementJobTabs basePath={base} />`
- `src/app/(authenticated)/admin/placements/jobs/[jobId]/admin-placement-job-tabs.tsx` — `3:import { useSelectedLayoutSegment } from "next/navigation";`; `12:export function AdminPlacementJobTabs({ basePath }: { basePath: string }) {`; `13:const segment = useSelectedLayoutSegment();`; `17:return <Tabs ariaLabel="Drive workspace" value={active} renderPanel={false}`
- `src/app/(authenticated)/admin/placements/analytics/page.tsx` — `27:<PageHeader eyebrow="Super Admin · Placements" title="Analytics"/>`; `28:<ErrorState title="Invalid analytics filters"`; `34:<PageHeader eyebrow="Super Admin · Placements" title="Placement Analytics"`; `76:<PageHeader eyebrow="Super Admin · Placements" title="Placement Analytics"`; `98:{data.truncated?<Banner tone="warning">`
- `src/app/(authenticated)/admin/placements/drives/page.tsx` — `22:<PageHeader eyebrow="Super Admin · Placements" title="All drives"/>`; `30:<PageHeader eyebrow="Super Admin · Placements" title="All drives"/>`; `31:<ErrorState title="Invalid drive filters" description="Choose valid filters and page number."`; `40:<PageHeader eyebrow="Super Admin · Placements" title="All drives"/>`; `41:<ErrorState`; `75:<PageHeader eyebrow="Super Admin · Placements" title="All drives"`; `78:className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover sm:min-h-9">Create drive →</Link>} />`
- `src/app/(authenticated)/college/projects/page.tsx` — `36:<PageHeader title="Workspaces" description="Select a college to continue."/>`; `37:<ErrorState title="No college selected"`; `46:<PageHeader title="Workspaces" description="Live projects, each run by a mentor with a team of students." />`; `47:<ErrorState title="Invalid project filters"`; `78:<PageHeader title="Workspaces"`; `80:<ErrorState title="Project workspaces unavailable"`; `107:<PageHeader`; `121:<Tabs ariaLabel="Workspace display and archive" renderPanel={false}`; `132:exportAction={<ProjectAdminWorkspacePageExport items={items}/>} />`

### Next work
- [ ] Finish line-by-line review of `src/app/(authenticated)/admin/placements/analytics/page.tsx` (report funnel, export bar, scoped error and responsive states), then `src/app/(authenticated)/admin/placements/applications/page.tsx`.
- [ ] Review shared Projects helpers whose `eyebrow` is passed via component props (e.g. `src/components/projects/project-admin-submissions-page.tsx:44-64`), which the route PageHeader codemod deliberately does not touch.
- [ ] Repeat repo-wide grep coverage and compute responsive snapshots when the orchestrator runs code; only then mark a STRICT TICK item complete.


### Additional scoped codemod
- `scripts/codemods/chat10-project-helper-eyebrows.cjs` targets 6 admin/college-owned Projects helpers (`project-admin-{at-risk,audit,readiness,reassign-mentor,submissions}-page.tsx` and `super-admin-template-subview-page.tsx`). These have repeated `PageHeader eyebrow` overrides; 4 also destructure an `eyebrow` prop solely to forward it to PageHeader. The codemod strips JSX eyebrow attributes and removes unused binding entries while retaining typed props for existing callers. Run `node scripts/codemods/chat10-project-helper-eyebrows.cjs --write` when scripts may be executed. Not yet run or ticked; review generated files and repeat syntax, grep and responsive proofs first.


### Follow-on Projects admin component fixes
- `src/components/projects/project-admin-missing-college.tsx`: replaced hand-rolled border-bottom alert with shared `EmptyState`, preserving no-silent-redirect flow and the Back to dashboard link. Matches shared empty-state behaviour from `docs/design/old-lms-pages.md:5-10`; runtime visual proof pending.
- `src/components/projects/project-admin-audit-page.tsx`: replaced the ignored-filters inline warning with `Banner tone="warning" role="alert"` (legacy pale warning strip: `docs/design/old-lms-pages.md:10`); converted the Today/7 days/30 days/All time hand-rolled outlined links to one `Tabs` navigation strip with active underlining only when the saved date filter matches the selected preset. `components___common.scss:365-410` defines legacy font, active underline and hover. The new links retain `action`, `importance`, `subjectType` and `subjectId`; no custom-range filter pretends to be a preset. Needs local date-boundary, mobile scroll and keyboard checks before any tick.
- [ ] Remaining owned Projects helper and route pages (the two eyebrow codemods are committed but intentionally have not been executed). Verification deferred to the orchestrator's local run, not claimed complete.


## Replacement lane bounded turn — continuation after main fast-forward (2026-10-19)

Repository synchronization: `origin/chatgpt/chat-10-b` was at `8c7566b78e37` and was **behind** `origin/main` by 1,622 commits with zero ahead; `8c7566b78e37` was the merge base. The branch was safely fast-forwarded to `12ee0a58fd9a` before new writes. Previously completed chat-10 commits were retained on main.

### Scoped files corrected and re-read from the remote branch
| File and exact revised source line | Legacy requirement | Current source behaviour | Remaining STRICT TICK proof |
| --- | --- | --- | --- |
| `src/app/(authenticated)/admin/placements/analytics/page.tsx:77-81,96` | `docs/design/old-lms-pages.md:6`: export and primary actions in the page-head action row; count remains in results region | Moved the *existing filtered* CSV export link to `PageHeader.actions`; retained `params` and CSV endpoint; the status row now contains only the matching count. One `Export report (CSV)` control in the re-read source | Runtime/phone/tablet comparison and full scoped grep |
| `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx:3,27` | `docs/design/ui-clone-checklist.md` F5: list empty states through shared component; canvas should remain continuous `docs/design/old-lms-pages.md:5-10` | Replaced custom history-empty paragraph with `EmptyState`; exact explanatory sentence retained; no changes to history data or actions | Shared component computed styles, responsive screenshot, scoped raw-empty grep |
| `src/app/(authenticated)/admin/settings/page.tsx:42-46` | `docs/design/old-lms-pages.md:6`: heading before page body and recovery state | Invalid-filter branch now preserves `PageHeader` and the same recovery link, using `min-w-0` | Side-by-side error state and full error-branch scan |
| `src/app/(authenticated)/admin/placements/retention/page.tsx:8,29-31` | `docs/design/old-lms-pages.md:10`: slim pale warning strip with info dot | Replaced raw coloured paragraph with `Banner tone="warning"`; legal-review wording and cutoff/report remain unchanged; shared `src/components/ui/banner.tsx` supplies warning border, colour, dot, padding and `role="status"` | Exact computed token checks, phone/tablet screenshot, full notice grep |
| `src/app/(authenticated)/admin/settings/auth/page.tsx:7,27-29` | `docs/design/old-lms-pages.md:10`: slim inline notice rather than a custom message row | Configuration caveat now `Banner tone="info"`; no policy, credential or access change | Info-token computed values, phone/tablet snapshot |
| `src/app/(authenticated)/admin/tenants/page.tsx:30-34` | `docs/design/old-lms-pages.md:5-6`: single responsive canvas and visible recovery link | Invalid-query branch now `min-w-0` and consistently underlined secondary recovery link; query validation unchanged | Phone/tablet and focus/hover comparison |

These were remote source reads and writes, **not** local script execution, CI, automated JSX parsing, CSS computed-style collection, or browser screenshot verification. The original Work queue remains unticked, including these files, because the STRICT TICK RULE requires those additional proofs. All six source replacements were fetched again and compared against the intended complete text; relevant revised line numbers above are from those re-reads.

### Next exact file
- [ ] `src/app/(authenticated)/admin/placements/applications/page.tsx` (thin wrapper using `AdminScopedReadPage`; verify shared component ownership and skip unrelated shared changes). Continue through `admin/placements/calendar/page.tsx`, then Projects admin/college queue. Codemods `chat10-admin-eyebrows.cjs` and `chat10-project-helper-eyebrows.cjs` are committed for the orchestrator to run and review locally; they have **not** been executed in this lane.

### Continuation: nested drive applications and schedule (source re-read)
| Owned source | Legacy source / desired behaviour | Implemented | Strict verification still needed |
| --- | --- | --- | --- |
| `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx` | `docs/design/old-lms-pages.md:5-6`: page title and recovery actions remain inside one canvas in every state | Invalid-query result now has `PageHeader`, `ErrorState`, scoped Clear filters link, and `min-w-0` | Browser error-state screenshot and full scoped grep |
| `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx` | Same page-head/error requirement | Invalid-query result now has `PageHeader`, `ErrorState` and scoped Clear filters link; the existing validated filters and applicant workflow are unchanged | Browser error-state screenshot and scoped grep |
| `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx` | `docs/design/ui-clone-checklist.md` A7 and I: link underline/focus visibility | Existing Open drive controls link now has underline and focus-visible outline | Keyboard/hover computed values |
| `src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx` | `docs/design/old-lms-pages.md:5`: one responsive canvas, no horizontal page spill | Added `min-w-0` to the top-level drive workspace container | Phone/tablet view and overflow measurement |
| `src/app/(authenticated)/admin/placements/drives/page.tsx` | `docs/design/ui-clone-checklist.md` A7: link affordance | Clear filters recovery now consistently underlined and semibold | Browser hover/focus state |

Portal navigation cross-check: `src/components/projects/project-admin-nav.tsx` intentionally suppresses its own tabs for the two owned base paths. This is not a missing-nav change: `src/app/(authenticated)/admin/layout.tsx` and `src/app/(authenticated)/college/layout.tsx` both mount the route-aware legacy group Tabs components, so this lane deliberately did not create duplicate tab strips.

This continuation has eleven separately committed, remote re-read TSX files plus the initial audit update. No code, app, test, codemod, screenshot, or CI was executed. Work queue checkboxes remain open under STRICT TICK RULE. Next inspect `src/app/(authenticated)/admin/placements/calendar/page.tsx` and Projects admin/college helpers, with special attention to duplicated tabs and fallback state.


## Replacement continuation — verified remote source sweep (2026-10-20 IST)

- Fast-forward of `chatgpt/chat-10-b` from `697396c27f7b552850a61ba9dcc527b5ea971fd0` to `36460671b6456b21e3bc67e0944c15053dce4d9c`: branch was 983 behind and 0 ahead of `main`. No historical scoped changes were discarded.
- 11 `[chat-10]` source commits created directly on this feature branch; GitHub commits write to the branch immediately. The 10 distinct files below were read before the edit and re-read from the branch afterward. Repeated status widgets use the shared UI components; no shared component or legacy-skin files were touched.
- The value source is `docs/design/old-lms-pages.md` and referenced legacy SCSS; shared controls own the exact geometry. Unverified below means **not ticked**: repository grep, simulated browser, computed CSS values, 375px/768px snapshots, accessibility interactions and runtime TypeScript/JSX checks remain for the orchestrator.

| File and current source line | Matched legacy pattern / evidence | Scoped change | Missing STRICT TICK proof |
| --- | --- | --- | --- |
| `src/app/(authenticated)/admin/placements/calendar/page.tsx:25` | `old-lms-shell-spec.md:21-23` one responsive canvas | Source re-read confirms requested symbol/pattern | Missing computed width and 375px/768px proof |
| `src/app/(authenticated)/admin/placements/page.tsx:19,38` | `old-lms-shell-spec.md:21-23` continuous canvas | Source re-read confirms requested symbol/pattern | Missing phone/tablet overflow proof |
| `src/app/(authenticated)/college/projects/page.tsx:130` | `old-lms-pages.md:10` slim notice; `src/components/ui/banner.tsx:11-17` tokens | Source re-read confirms requested symbol/pattern | Missing banner state snapshots and scoped grep |
| `src/components/projects/admin-readiness-workspace-picker.tsx:28` | `old-lms-pages.md:10` status pills; `src/components/ui/status-badge.tsx:15` shared tokens | Source re-read confirms requested symbol/pattern | Missing picker keyboard/mobile/surface proof |
| `src/components/projects/project-admin-collection-controls.tsx:220` | `ui-clone-checklist.md:18-22` disabled/focus state requirements | Source re-read confirms requested symbol/pattern | Missing scripted DOM keyboard and pagination boundary proof |
| `src/components/projects/college-project-student-roster-dialog.tsx:99` | `ui-clone-checklist.md:70` checkbox state; shared checkbox is source owner | Source re-read confirms requested symbol/pattern | Missing checked/indeterminate/disabled browser proof |
| `src/components/projects/project-admin-at-risk-page.tsx:82` | `old-lms-pages.md:7` compact action-count chips; `src/components/ui/filter-chip.tsx` shared chip | Source re-read confirms requested symbol/pattern | Missing full chip-state and responsive proof |
| `src/components/projects/project-admin-readiness-page.tsx:139` | `old-lms-pages.md:10` table status pills | Source re-read confirms requested symbol/pattern | Missing full statuses and keyboard/phone proof |
| `src/components/projects/project-admin-submissions-page.tsx:153` | `old-lms-pages.md:10` status pills in tables | Source re-read confirms requested symbol/pattern | Missing complete unsubmitted table scan |
| `src/app/(authenticated)/admin/placements/drives/page.tsx:61` | `old-lms-pages.md:10` compact status pills in table rows | Source re-read confirms requested symbol/pattern | Missing statuses and full row rendering proof |

### Source-level spot-checks, not global grep counts
```text
src/app/(authenticated)/admin/placements/calendar/page.tsx:25 contains min-w-0 space-y-6
src/app/(authenticated)/admin/placements/page.tsx:19,38 contains min-w-0 space-y-6
src/app/(authenticated)/college/projects/page.tsx:130 contains <Banner tone="warning">Template names
src/components/projects/admin-readiness-workspace-picker.tsx:28 contains <StatusBadge tone={item.status
src/components/projects/project-admin-collection-controls.tsx:220 contains tabIndex={page <= 1
src/components/projects/college-project-student-roster-dialog.tsx:99 contains <Checkbox className="size-4"
src/components/projects/project-admin-at-risk-page.tsx:82 contains At-risk quick filters
src/components/projects/project-admin-readiness-page.tsx:139 contains cell:release=><StatusBadge
src/components/projects/project-admin-submissions-page.tsx:153 contains cell:row=><StatusBadge
src/app/(authenticated)/admin/placements/drives/page.tsx:61 contains <StatusBadge tone={row.job.status
```
The ten matches above are **only known changed occurrences** and are not claimed to be exhaustive raw-control, custom-pill or custom-card counts. No commands from `Scans required before checking anything` were run. Source-side string substitutions and remote re-reads are not executable tests. Keep all work-queue checkboxes unmarked until an actual full-file verification and orchestrator screenshots.

### Exact continuation
- [ ] `src/components/projects/project-admin-workspace-list.tsx`: review card-vs-list layout, responsive overflow, interactive archive control, status geometry and item-level empty states against legacy source, then continue through the remaining admin and college Projects helpers. Audit `src/components/projects/project-admin-submissions-page.tsx` for any remaining card-in-card metric summaries.


## Replacement continuation — tenant fallback and Project details (2026-10-20 IST)

Seven further distinct owner files changed and re-read. These replace hand-rolled scope/empty warnings with shared UX states, make project-card titles keyboard-actionable, remove a duplicated in-body settings link (the PageHeader action remains), and restore the missing `PageBackLink` import for Super Admin Students. **No queue item ticked.**

| Edited file:line re-read from branch | Source-matched pattern | Missing before STRICT TICK |
| --- | --- | --- |
| `src/app/(authenticated)/college/projects/create/page.tsx:15` | `old-lms-pages.md:5-10` one canvas and shared error recovery | Full scoped greps, browser/computed-state proof, phone/tablet and JSX execution verification |
| `src/app/(authenticated)/admin/verification/page.tsx:37` | `old-lms-pages.md:5-10` section-level empty-state treatment | Full scoped greps, browser/computed-state proof, phone/tablet and JSX execution verification |
| `src/app/(authenticated)/admin/students/page.tsx:4` | `ui-clone-checklist.md:24` JSX/no-regression source correctness | Full scoped greps, browser/computed-state proof, phone/tablet and JSX execution verification |
| `src/app/(authenticated)/admin/tenants/create/page.tsx:45,51` | `old-lms-pages.md:10` slim warning strips for unavailable scoped actions | Full scoped greps, browser/computed-state proof, phone/tablet and JSX execution verification |
| `src/app/(authenticated)/admin/settings/page.tsx:88` | `old-lms-pages.md:6` primary links in PageHeader action row, not repeated in body | Full scoped greps, browser/computed-state proof, phone/tablet and JSX execution verification |
| `src/components/projects/project-admin-workspace-list.tsx:120` | `old-lms-pages.md:10` clickable list item, focus-visible state | Full scoped greps, browser/computed-state proof, phone/tablet and JSX execution verification |
| `src/app/(authenticated)/college/projects/workspaces/new/page.tsx:20` | `old-lms-pages.md:10` banner with inline recovery action | Full scoped greps, browser/computed-state proof, phone/tablet and JSX execution verification |

### Codemod: feedback strips across repeated Projects editors
- `scripts/codemods/chat10-project-feedback-banners.cjs` committed for **10 owned client components**. Recognizes only direct `error`/`message`/`notice`/`success` inline `role=alert/status` feedback whose content is the matching variable, and maps them to shared `Banner tone=error/success`. It preserves conditions, message text and the existing dialog/actions. The file list is fixed; scripts do not touch other lanes, `src/components/ui/*` or the global skin.
- **Not run:** dry run `node scripts/codemods/chat10-project-feedback-banners.cjs`, then apply only after review with `node scripts/codemods/chat10-project-feedback-banners.cjs --write`. The orchestrator must inspect rewritten JSX and run TypeScript, source greps and mobile/desktop parity before ticking the 10 components. A changed file is not considered done until those checks pass.
- The prior eyebrow codemods similarly remain unexecuted. No app, test, CI, CSS computed value or screenshot was executed in this lane.

### Next exact file (after this commit)
- [ ] `src/app/(authenticated)/admin/tenants/setup/page.tsx` — check remaining custom no-college status, numbered setup pills and 375px/768px grid behaviour. Then continue `src/app/(authenticated)/admin/tenants/page.tsx` and other unticked Projects template views.


### Additional source-backed changes: tenant setup and template version pagination
| File and re-read lines | Legacy visual/behaviour property | vNext source proof | Remaining before tick |
| --- | --- | --- | --- |
| `src/app/(authenticated)/admin/tenants/setup/page.tsx:8,107,112,137,144-146` | `docs/design/old-lms-pages.md:10` slim role-aware warning/info strip; one continuous canvas; shared empty and error states | Scoped permission fallbacks and persisted readiness use `Banner`; no-college empty uses `EmptyState`. Tabs and two-column responsive structure retained | Exact computed warning/success/error colors and 375px/768px layout + full greps |
| `src/components/projects/super-admin-template-subview-page.tsx:12,681-686` | `docs/design/old-lms-pages.md:9` shared styled pagination and focus targets; shared `src/components/ui/pagination.tsx:49-91` supports bounds, disabled and mobile behaviour | Replaced hand-built Previous/Next nav in version history with shared `Pagination`, preserving `templateVersionHistoryHref(templateId,page)`; added 25/page copy | TypeScript, full JSX/behavior scan and old-vNext mobile/tablet screenshot |

**No strict queue checkboxes were ticked**: only remote source reads and edits, no executable checks. Codemods remain dry-run files for the orchestrator, and no app/test/CI was run.

### Next source file
- [ ] `src/app/(authenticated)/admin/tenants/page.tsx` — audit tenant object-card vs list/table geometry and responsive header action row, then `src/components/projects/super-admin-template-college-bulk.tsx`.


## Replacement continuation: Super Admin tenant/template and college Projects (2026-10-20)

**Branch sync:** `chatgpt/chat-10-b` was 1,167 commits behind `main` and **0 ahead** (all former chat-10 commits were already merged), so it fast-forwarded by lease to `9880c6d5a1922d6ecefeb75331fde405e8b8e96c` before any new writes. No prior chat-10 changes were lost.

### Source-matched value/state inventory — 13 distinct files

| Changed file:source lines | Legacy reference and shared vNext rule | Outstanding strict proof |
| --- | --- | --- |
| `src/app/(authenticated)/admin/tenants/page.tsx:86,101-112` | `docs/design/old-lms-pages.md:5,9-10` one canvas, native-bordered table, lifecycle pills; `src/components/ui/data-table.tsx:95-110` shared cell rules | Scoped table source; table `sm` breakpoint 640 vs legacy shell mobile <=767 remains unverified |
| `src/components/projects/super-admin-template-college-bulk.tsx:65,72,82` | `docs/design/old-lms-pages.md:10` compact lifecycle pills, slim warnings; `src/components/ui/status-badge.tsx:17`, `banner.tsx:18-21` | Browser checked, disabled, success, partial-failure and empty-state behavior |
| `src/app/(authenticated)/college/projects/templates/page.tsx:31-35,59,97-105` | `docs/design/old-lms-pages.md:5-10` page header, list toolbar, table, empty/error states | Browser load-failure, search empty and table responsive comparison |
| `src/components/projects/super-admin-template-archive-control.tsx:14` | `docs/design/old-lms-pages.md:10` archived lifecycle chip; shared `status-badge.tsx:17` | Confirmation, pending and error variants after codemod |
| `src/components/projects/super-admin-template-rollback-control.tsx:40` | `docs/design/old-lms-pages.md:10` slim warning notice; shared `banner.tsx:18-21` | Error/success feedback states and dialog keyboard behavior |
| `src/app/(authenticated)/admin/projects/templates/page.tsx:77-112` | `docs/design/old-lms-pages.md:9-10` direct canvas table, row separators, status pills; `data-table.tsx:95-110` | Computed responsive table and all action confirmations |
| `src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx:102,120,128` | `docs/design/old-lms-pages.md:5-10` scope warning, unavailable version and empty history through shared states | Scope/version state screenshots and tab keyboard behavior |
| `src/components/projects/project-template-view.tsx:136` | `docs/design/old-lms-pages.md:7,10` compact summary count pills; `badge.tsx:16-17` | Phone and tablet template rows and count chip |
| `src/components/projects/project-admin-collection-controls.tsx:216-218` | `docs/design/old-lms-pages.md:9` shared pagination, `src/components/ui/pagination.tsx:54-84` | Page bounds, keyboard, overflow; former bespoke pager removed |
| `src/components/projects/project-admin-missing-college.tsx:7-10` | `docs/design/old-lms-pages.md:5-10` one canvas, no-college feedback; `empty-state.tsx:6-9` | Phone/tablet empty-state and recovery focus |
| `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:33,40-42` | `docs/design/old-lms-pages.md:6` one heading row with right actions; `page-header.tsx:28-49` | 375px/768px back-link and heading action wrap |
| `src/app/(authenticated)/admin/placements/student-lookup/page.tsx:46,52-56` | `docs/design/old-lms-pages.md:10` table lifecycle pills, no-applications empty; `status-badge.tsx:17` | Visible applications/offer lifecycle and data-table phone mode |
| `src/components/projects/project-admin-submissions-page.tsx:167-182` | `docs/design/old-lms-pages.md:11-13` single light-bordered summary strip with counts, not nested tiles | 0/1/4 KPI variants and 375px/768px/1024px strip wrap |

This is a **source-level** value table. It does not certify each property or state as a computed pixel match. Source comparison shows: page titles are specified as 20px at phone and 30px from `md` (`page-header.tsx:28-34`); the old page anatomy specifies ~30px desktop (`old-lms-pages.md:5-6`). Table source uses 13px and 11px/12px cell vertical padding with the shared canvas-border token (`data-table.tsx:97-110`); the legacy page anatomy requires hairline row separators (`old-lms-pages.md:10`). StatusBadge uses 22px minimum height, 12px bold text, 6px radius (`status-badge.tsx:17`); Badge uses a compact no-min-width pill (`badge.tsx:16-17`); Banner uses a slim 10px vertically padded strip (`banner.tsx:18-21`). Exact token resolution and rendered color comparison **not done**.

### Scoped remote source-regex scans (not executed shell greps)

For each of the 13 fetched files above, the latest pushed branch's complete source was scanned for `/<(button|select|textarea)(?=[\\s>])/`, `/<input\\b(?![^>]*type="hidden")/`, `/role="tab(?:list)?"/`, `/(bg|text|border)-\\[#[a-f0-9]+\\]/i`, and `/fixed inset-0|role="dialog"/`: **0 occurrences in every file**. Only 2 files retain `<article>` blocks: `project-template-view.tsx` (a row list within a section) and `project-admin-submissions-page.tsx` (individual review rows); these are *not nested status cards*. This is limited to the 13 exact fetched files and must not be presented as a repository-wide grep.

### Static responsive rule comparison (NOT browser proof)

| Element | Legacy expectation | Current source rule | Result |
| --- | --- | --- | --- |
| PageHeader | Old shell phone break at `old-lms-shell.css:73` (767px); single head row desktop `old-lms-pages.md:6` | `page-header.tsx:28-49` mobile column, `md` flex-row at 768px | Source breakpoint aligned; runtime wrapping unverified |
| Pagination | Mobile 44px touch target and tablet/desktop 36px | `pagination.tsx:54,56-84` min-h-11 then md:min-h-9; overflow wraps | Source expected; click/keyboard unverified |
| Slim feedback | Mobile copy and actions wrap; one canvas | `banner.tsx:18-21` max-w-full, flex-wrap, break-words, action can wrap | Source expected; computed tokens unverified |
| DataTable | Legacy mobile boundary 767px `old-lms-shell.css:73` | `data-table.tsx:95-110` switches card rows to table at `sm` (640px) | **Open shared-component mismatch for chat-17**, do not tick pages using it |
| KPI strip | Stacked mobile, four metrics across large workspace | `project-admin-submissions-page.tsx:167-182` 1 column until 992px; then 4-column, hairline dividers | Source responsive layout; screen comparison still required |

### Completion gate

No Work queue item checked: no compiler, CI, local app, screenshots, or actual phone/tablet render available under the lane's no-run restriction. When the orchestrator executes the already committed codemods, it must re-read the transformed files and run the full scoped greps, TS/JSX parse, and side-by-side screenshots. The 13 source-edited files above are **not certified complete** under the STRICT TICK RULE. Shared DataTable's 640/767 mismatch cannot be patched by chat-10 because `src/components/ui/*` belongs to chat-17.

### Next exact file
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx` — inspect wrapper and shared admin section rendering, then remaining `/admin/projects*` and `/college/projects*` routes. Do not alter shared ProjectWorkspace (owned outside this lane).


### Further scoped corrections and direct source re-reads

| File and source lines | Legacy source / vNext source facts | Strict proof still needed |
| --- | --- | --- |
| `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx:42-46,60-97` | Legacy: one hairline-bordered table with lifecycle pills (`old-lms-pages.md:10`); vNext `DataTable` (`data-table.tsx:95-110`) plus status badges | Computed 640/767 breakpoint mismatch and filter/action responsive screenshot |
| `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:45,57` | Legacy: slim information banner and true empty state (`old-lms-pages.md:10`); vNext `Banner tone=info`, `EmptyState` | Focus/scroll and 375/768px comparison; compare snapshots |
| `src/app/(authenticated)/admin/placements/student-lookup/page.tsx:22-40,59-64` | Legacy: search, status pills, table and recoverable error (`old-lms-pages.md:6,10`); vNext `ErrorState`, `StatusBadge`, `DataTable` | Keyboard/partial-error, service error and mobile rows |
| `src/components/projects/project-admin-reassign-mentor-page.tsx:93` | Legacy: small warning status pill (`old-lms-pages.md:10`); vNext shared `StatusBadge tone=warning` | Source-only; workload row rendering and tablet columns |
| `src/components/projects/college-project-student-roster-dialog.tsx:106` | Legacy: shared loading state (`ui-clone-checklist.md:F4`); vNext `LoadingState` skeleton (`loading-state.tsx:4-6`) | Load/error transition and dialog 375px focus/scroll |

All five complete remote file contents were re-read from the pushed branch and scanned with the same scoped control/hex/overlay patterns listed above; raw `button/select/textarea`, raw `role=tab`, visible utility hexes and custom fixed overlays are **zero** in these five. These source scans do **not** replace an actual repository-wide grep or a live responsive comparison. `DataTable` still switches at `sm=640px`, whereas the old shell's mobile threshold is 767px; shared owner must reconcile. No strict checkbox ticked.

**Next source:** `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx` (thin shared-subview wrapper; document absence of hand-rolled controls), then remaining last-third placement detail routes. At least one complete project template directory and tenant directory source conversion now exists, but pixel-level verification is outstanding.
