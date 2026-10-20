# UI clone: Super Admin last third and Projects admin/college — chat-10

Branch: `chatgpt/chat-10-b`. Owner: chat-10. Last sourced from `main` commit `1fae38d2c433f5b5b0a90a22be12754ab28796e0` (2026-10-19). Scope excludes first/second third of Super Admin, learner/mentor Projects, `src/components/ui/*`, the shared PageHeader implementation, and `src/styles/legacy-skin.css`.

## Audit protocol
- Source of truth: `docs/design/legacy-styles/`, `docs/design/old-lms-shell.css`, and `docs/design/old-lms-pages.md`.
- Inventory below is a recursive Git-tree path enumeration, **not a local grep or a visual verification**. Grep counts, computed-style comparisons, and phone/tablet side-by-side proof have NOT been obtained. Leave every STRICT TICK RULE item unticked until complete.
- Preserve existing vNext page contents, security controls, scopes, filter parameters and submit handlers; do not run code, tests, or CI.

## Work queue
### Super Admin last third (57 route pages)
- [ ] `src/app/(authenticated)/admin/placements/analytics/page.tsx` — source-level UX migration and scans documented below; strict pixel/state comparison pending
- [ ] `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx` — source-level UX migration and scans documented below; strict pixel/state comparison pending
- [ ] `src/app/(authenticated)/admin/placements/applications/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/calendar/page.tsx` — source-level value, grep and responsive rules documented; rendered acceptance outstanding
- [ ] `src/app/(authenticated)/admin/placements/drives/page.tsx` — source-level value, grep and responsive rules documented; rendered acceptance outstanding
- [ ] `src/app/(authenticated)/admin/placements/hiring/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/interviews/[roundId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/interviews/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/job-settings/[jobId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/job-settings/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx` — source-level UX migration and scans documented below; strict pixel/state comparison pending
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx` — source-level value, grep and responsive rules documented; rendered acceptance outstanding
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx` — source-level value, grep and responsive rules documented; rendered acceptance outstanding
- [ ] `src/app/(authenticated)/admin/placements/joining/[offerId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/joining/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/new/page.tsx` — source-level value, grep and responsive rules documented; rendered acceptance outstanding
- [ ] `src/app/(authenticated)/admin/placements/offers/[offerId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/offers/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/placements/page.tsx` — source-level value, grep and responsive rules documented; rendered acceptance outstanding
- [ ] `src/app/(authenticated)/admin/placements/retention/page.tsx` — source-level UX migration and scans documented below; strict pixel/state comparison pending
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
- [ ] `src/app/(authenticated)/admin/projects/page.tsx` — source-level UX migration and scans documented below; strict pixel/state comparison pending
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
- [ ] `src/app/(authenticated)/admin/projects/templates/new/page.tsx` — source-level UX migration and scans documented below; strict pixel/state comparison pending
- [ ] `src/app/(authenticated)/admin/projects/templates/page.tsx` — source-level clone patch applied; strict visual and runtime proofs outstanding
- [ ] `src/app/(authenticated)/admin/projects/workspaces/new/page.tsx` — source-level UX migration and scans documented below; strict pixel/state comparison pending
- [ ] `src/app/(authenticated)/admin/recruiters/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/admin/settings/auth/page.tsx` — source-level UX migration and scans documented below; strict pixel/state comparison pending
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
- [ ] `src/app/(authenticated)/college/projects/page.tsx` — source-level value, grep and responsive rules documented; rendered acceptance outstanding
- [ ] `src/app/(authenticated)/college/projects/readiness/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/reassign-mentor/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/submissions/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx` — source-level clone patch applied; strict visual and runtime proofs outstanding
- [ ] `src/app/(authenticated)/college/projects/templates/page.tsx` — source-level clone patch applied; strict visual and runtime proofs outstanding
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/page.tsx` — value/state/responsive/hand-rolled-element audit pending
- [ ] `src/app/(authenticated)/college/projects/workspaces/new/page.tsx` — source-level value, grep and responsive rules documented; rendered acceptance outstanding
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


## Chat-10 next batch: 15 touched files — source corrections and strict proof gaps (2026-10-20)

This batch edits **15 distinct chat-10-owned Projects components**, including three saved-version confirmation flows moved off native `window.confirm`, five editor/confirmation notice conversions to shared feedback, and five admin list/picker layouts. Every changed file was fetched in full again after the commit. No shared UI components, global skin, learner or mentor components were edited. The only programmatic checks below are against fetched source strings; **no app, repository executable, TypeScript compiler, CI or screenshot was run.**

### Shared element value and state source matrix
| Legacy item and exact source | vNext inherited rule | Evidence status |
| --- | --- | --- |
| Button: legacy primary 36px height, 650 weight, 14px text, 9px radius and hover; 44px phone target (`docs/design/ui-clone-checklist.md`, D) | `src/components/ui/button.tsx:11-20,25-29`: min-height `var(--lms-control-height)`, 650 weight, primary hover tokens, `max-[767px]:min-h-11`, 14px default | Source rules line up structurally; resolved CSS variable value/hover screenshot not gathered |
| Input/Select: legacy outlined controls and 44px phone target (checklist C, old-lms-pages:5,9) | `input.tsx:21-40`, `select.tsx:24-40`: 1px canvas-border, field radius, hover and 2px focus ring, `max-[767px]:min-h-11` | Source token inheritance; computed border/radius unverified |
| Textarea: legacy labels and outlined full-width field (checklist C) | `textarea.tsx:22-43`: min-height 112px when rows unspecified, 10px vertical padding, focus ring, invalid, read-only, disabled | Token inheritance; screenshot unverified |
| Banners: slim pale strip with dot, one sentence and optional outlined action (`docs/design/old-lms-pages.md:7`) | `banner.tsx:10-21`: 6px dot, 10px vertical padding, 1px tone border, flex-wrap, error role=alert vs other role=status | Source anatomy matches; exact rendered tones and width unverified |
| Status pills: small coloured labels (`old-lms-pages.md:6`) | `status-badge.tsx:9-17`: 22px min height, 12px text, 6px radius, tone vars | Source anatomy; exact legacy pixel values not fully measured |
| Dialog/popconfirm: shared focus-managed action row (checklist F1/I) | `dialog.tsx:39-54`, `confirm-dialog.tsx:16-19`, `use-confirm-flow.tsx`: constrained viewport, cancel/confirm action buttons and pending state | No native window.confirm in affected files; focus runtime unverified |
| Page/canvas anatomy (`docs/design/old-lms-pages.md:1-10`) | Inline section border-b, shared PageHeader/Tabs, direct list rows where present | Each file below has an inventory; browser canvas/shell remains unverified |
| Mobile/tablet: old shell mobile up to 767px (`old-lms-shell.css:73`) | Shared Button/Input/Select max-[767px], projects grid `md:`/`min-[768px]`; shared `EmptyState` uses `sm:` at 640px | Source comparison, not actual 375px/768px render; empty-state breakpoint remains a shared owner gap |

### Per-file value, state, grep and responsive matrices

#### `src/components/projects/super-admin-template-archive-control.tsx` — archived status pill; confirmation of destructive archive; error
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/super-admin-template-archive-control.tsx:14,15,17,28) delegates controls to shared variants; 0 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | archived status pill; confirmation of destructive archive; error; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 1/1 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | No explicit local responsive breakpoint; relies on shared UI controls/Dialog/Banner; shared controls use `max-[767px]:min-h-11`; 0 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=1; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |


#### `src/components/projects/super-admin-template-create-form.tsx` — create form and validation; pending; cancellation and error
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/super-admin-template-create-form.tsx:40,56,67,112,114) delegates controls to shared variants; 10 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | create form and validation; pending; cancellation and error; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 1/1 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | Explicit `md:`/`min-[768px]`/`max-[767px]` source markers: 4; shared controls use `max-[767px]:min-h-11`; 10 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=1; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |


#### `src/components/projects/super-admin-template-overview-editor.tsx` — edit-mode form; reviewed confirm; saved/error
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/super-admin-template-overview-editor.tsx:18,40,56,61,63,68,75,78,82,83) delegates controls to shared variants; 0 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | edit-mode form; reviewed confirm; saved/error; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 2/2 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | Explicit `md:`/`min-[768px]`/`max-[767px]` source markers: 6; shared controls use `max-[767px]:min-h-11`; 0 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=2; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |


#### `src/components/projects/super-admin-template-plan-editor.tsx` — sprints/tasks form; reviewed confirm; success/error
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/super-admin-template-plan-editor.tsx:34,99,141,166,220,277) delegates controls to shared variants; 4 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | sprints/tasks form; reviewed confirm; success/error; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 2/2 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | Explicit `md:`/`min-[768px]`/`max-[767px]` source markers: 2; shared controls use `max-[767px]:min-h-11`; 4 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=2; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |


#### `src/components/projects/super-admin-template-resource-editor.tsx` — resource rows and controls; reviewed confirm; success/error
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/super-admin-template-resource-editor.tsx:18,33,53,67,70,73,81,97,98) delegates controls to shared variants; 1 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | resource rows and controls; reviewed confirm; success/error; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 2/2 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | Explicit `md:`/`min-[768px]`/`max-[767px]` source markers: 5; shared controls use `max-[767px]:min-h-11`; 1 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=2; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |


#### `src/components/projects/super-admin-template-rollback-control.tsx` — disabled/no-op; review confirm; success/error/warning
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/super-admin-template-rollback-control.tsx:14,19,40,42,43) delegates controls to shared variants; 0 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | disabled/no-op; review confirm; success/error/warning; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 3/3 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | No explicit local responsive breakpoint; relies on shared UI controls/Dialog/Banner; shared controls use `max-[767px]:min-h-11`; 0 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=3; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |


#### `src/components/projects/college-project-summary-editor.tsx` — compact editing; success/error; responsive touch controls
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/college-project-summary-editor.tsx:14,19,35,54,57,58) delegates controls to shared variants; 0 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | compact editing; success/error; responsive touch controls; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 2/2 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | Explicit `md:`/`min-[768px]`/`max-[767px]` source markers: 2; shared controls use `max-[767px]:min-h-11`; 0 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=2; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |


#### `src/components/projects/college-project-summary-editor-full.tsx` — expanded editing; error/validation; tablet split
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/college-project-summary-editor-full.tsx:20,43,71,109) delegates controls to shared variants; 0 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | expanded editing; error/validation; tablet split; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 1/1 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | Explicit `md:`/`min-[768px]`/`max-[767px]` source markers: 1; shared controls use `max-[767px]:min-h-11`; 0 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=1; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |


#### `src/components/projects/college-project-mentor-dialog.tsx` — search/reassign Dialog; error; busy
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/college-project-mentor-dialog.tsx:92) delegates controls to shared variants; 1 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | search/reassign Dialog; error; busy; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 1/1 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | No explicit local responsive breakpoint; relies on shared UI controls/Dialog/Banner; shared controls use `max-[767px]:min-h-11`; 1 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=1; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |


#### `src/components/projects/project-admin-submission-review.tsx` — feedback Dialog; lock ConfirmDialog; success/error
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/project-admin-submission-review.tsx:52,74) delegates controls to shared variants; 0 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | feedback Dialog; lock ConfirmDialog; success/error; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 2/2 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | No explicit local responsive breakpoint; relies on shared UI controls/Dialog/Banner; shared controls use `max-[767px]:min-h-11`; 0 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=2; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |


#### `src/components/projects/admin-readiness-workspace-picker.tsx` — searchable choice list; badge; empty, disabled pager
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/admin-readiness-workspace-picker.tsx:23,26,30,32) delegates controls to shared variants; 6 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | searchable choice list; badge; empty, disabled pager; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 0/0 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | Explicit `md:`/`min-[768px]`/`max-[767px]` source markers: 2; shared controls use `max-[767px]:min-h-11`; 6 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=0; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |


#### `src/components/projects/project-admin-at-risk-page.tsx` — single canvas row list; warning banner; filter chips
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/project-admin-at-risk-page.tsx:42,64,78,98,132,135,140,144,172) delegates controls to shared variants; 9 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | single canvas row list; warning banner; filter chips; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 2/2 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | Explicit `md:`/`min-[768px]`/`max-[767px]` source markers: 1; shared controls use `max-[767px]:min-h-11`; 9 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=2; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |


#### `src/components/projects/project-admin-readiness-page.tsx` — readiness strip; shared table; empty/error
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/project-admin-readiness-page.tsx:92,96,120,125,132,139,144,152,182,187,201) delegates controls to shared variants; 5 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | readiness strip; shared table; empty/error; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 1/1 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | Explicit `md:`/`min-[768px]`/`max-[767px]` source markers: 4; shared controls use `max-[767px]:min-h-11`; 5 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=1; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |


#### `src/components/projects/project-admin-workspace-list.tsx` — workspace objects; card/table; responsive metrics
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/project-admin-workspace-list.tsx:69,87,105,126,138,174) delegates controls to shared variants; 7 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | workspace objects; card/table; responsive metrics; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 0/0 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | Explicit `md:`/`min-[768px]`/`max-[767px]` source markers: 5; shared controls use `max-[767px]:min-h-11`; 7 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=0; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |


#### `src/components/projects/project-admin-audit-page.tsx` — filter + tabs + single summary strip; activity list
| Property / state | Legacy requirement (source) | Current vNext rule (source) | Proof outcome |
| --- | --- | --- | --- |
| Layout / canvas | One continuous white canvas; ordinary form rows should not have nested cards (`old-lms-pages.md:1,9`) | Owned TSX (src/components/projects/project-admin-audit-page.tsx:178,182,183,188,193,195,273,282,289) delegates controls to shared variants; 4 `min-w-0` / wrap / break-word markers | **Source reviewed**; exact computed padding/radius and rendered hierarchy not established |
| Visible controls, default/hover/focus/disabled | Outlined/solid controls and state transitions per `ui-clone-checklist.md:C,D,I` | Shared `Button/Input/Select/Textarea` styles and disabled states (`button.tsx:11-29`; `input.tsx:21-40`); no owned raw controls | **Source matched inherited component**, keyboard hover/focus screenshot not obtained |
| Error, empty, pending and success | Slim feedback banner, readable state text; error must be obvious (`old-lms-pages.md:7`; checklist F) | filter + tabs + single summary strip; activity list; inherited `banner.tsx:10-21`, `empty-state.tsx:6-9` and `dialog.tsx:39-54` as present; `Banner` pairs 1/1 | **Source reviewed**, all applicable transitions still need live exercise |
| Phone 375px / tablet 768px | Legacy mobile <=767px (`old-lms-shell.css:73`), 44px taps (checklist D) | Explicit `md:`/`min-[768px]`/`max-[767px]` source markers: 8; shared controls use `max-[767px]:min-h-11`; 4 fluid/wrap markers | **Static rule evidence only**; not a measured 375px/768px screenshot or overflow test |
| Full-file scoped grep & JSX tag pairing | No raw `button/select/input/textarea`, overlays, hex, tabs, native confirm (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawTextareas=0; rawInputs=0; nativeConfirm=0; customDialog=0; hardcodedHex=0; handTabs=0; matching `Banner` pairs=1; container tag pairing=balanced | **0 for all forbidden patterns in this fetched file**; not a repository-wide grep or TypeScript parse |

### Full-source scoped grep-equivalent scan protocol and summary
```text
Scope: the 15 complete .tsx sources listed above, ref chatgpt/chat-10-b.
/<button(?=[\\s>])/g; /<select(?=[\\s>])/g; /<textarea(?=[\\s>])/g;
/<input(?!\\s+type=["']hidden["'])(?=[\\s>])/g; /window\\.confirm\\s*\\(/g;
/fixed inset-0|role=["']dialog["']/g; /(?:bg|text|border)-\\[#[0-9a-fA-F]{3,8}\\]/g;
/role=["']tab(?:list)?["']/g.
Results across all 15 source files: rawButtons=0, rawSelects=0, rawTextareas=0, rawInputs=0, nativeConfirm=0, customDialog=0, hardcodedHex=0, handTabs=0.
All 15: shared Banner opening and closing count matches; div/section/article open/close element counts match.
These are in-memory source scans, not shell greps. No assertion about files outside this scoped set.
```

### Responsive and remaining acceptance blockers
- At **375px**, the shared Button/Input/Select have `max-[767px]:min-h-11` for minimum 44px targets; `Banner` wraps and `Dialog` uses width `calc(100% - 2rem)` (`dialog.tsx:44`). Fourteen inherited shared components and the local `md`/768 rules were compared as text, not rendered on a device. Some pages have no local breakpoints by design because the shared components own them.
- At **768px**, the compact college summary buttons and full editor grid now switch at `md`, not `sm`. The workspace metric grid now switches at `md` instead of 425px; the readiness count strip uses a single shared hairline grouping rather than individual boxes. Shared DataTable's 640px mobile-card threshold vs old LMS 767px shell remains a separate shared-owner discrepancy.
- Static checks did not examine browser computed text width, scroll overflow, screenshots, native/dialog focus and pending transitions. Those must be completed before any Strict Tick Rule checkbox can be checked. This appendix supplies source value, scoped grep and responsive rule comparison but **is not a claim of pixel-perfect completion**.
- **STRICT TICK STATUS: 0 of this batch's 15 checked.** They remain open until exact legacy/computed token values, 375px/768px rendering, all states, and syntactic typechecking can be verified. 

### Next exact file
`src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx` — verify the thin route-to-shared-subview contract, then remaining `/admin/projects*` pages and the additional college Projects audit queue.


## chat-10 2026-10-20 — 16 additional route pages, source-proof audit

These pages were changed directly on `chatgpt/chat-10-b` after syncing to `main`. The legacy reference is `docs/design/old-lms-pages.md:1-10` and `docs/design/legacy-styles/components___listing-page-header.scss:46-59,130-149`. The common table tabs are `components___common.scss:359-415`. Source rules: `src/components/ui/page-header.tsx:28-49`, `data-table.tsx:95-110`, `status-badge.tsx:9-17`, `banner.tsx:10-21`, `page-back-link.tsx:16-29`.

**Current shared table correction:** Unlike an earlier audit note made against an older commit, `data-table.tsx:95-110` now uses the `md` breakpoint (768px) for table/card transition, not `sm` (640px). `old-lms-shell.css:73` defines legacy mobile up to 767px. The source rules agree on that threshold; visual layout still needs measurement.

Source scan method (full fetched TSX body per page, not a local-shell `grep` or an executed test):
```text
/<button(?=[\\s>])/g, /<select(?=[\\s>])/g, /<input(?=[\\s>])/g,
/<textarea(?=[\\s>])/g, /window\\.confirm\\(/g,
/fixed inset-0|role="dialog"/g, /(?:bg|text|border)-\\[#[0-9a-fA-f]{3,8}\\]/g,
/role="tab(?:list)?"/g
```

Source-inherited value anchors:
| Property | Old LMS source / expected | New shared source / observed | Status |
| --- | --- | --- | --- |
| Desktop page title | `listing-page-header.scss:52-59`: 28px, 600, -0.02em, 1.3 line-height | `page-header.tsx:28-34`: 30px, 600, -0.02em, 1.35 line-height | **Mismatch (shared PageHeader owner)**; do not tick |
| Phone page title | `listing-page-header.scss:130-143`: 20px, vertically stacked up to 767px | `page-header.tsx:28-34`: 20px, stacked until 768px | Source-aligned; computed still unverified |
| Hairline table | `old-lms-pages.md:6`: 1px border, row separators, compact cells | `data-table.tsx:95-110`: border var canvas-border, 13px text, 11px header/12px body vertical padding | Structure aligned; colour and height still need computed values |
| Status pills | `old-lms-pages.md:6`: small coloured statuses | `status-badge.tsx:9-17`: 22px min-height, 6px radius, 12px bold text | Legacy exact values not measured, pending |
| Feedback strip | `old-lms-pages.md:7`: slim pale warning strip with info dot, 1 sentence | `banner.tsx:18-21`: 6px dot, 10px Y padding, border, flex-wrap | Source anatomy aligned; tone comparison pending |
| Page back action | `listing-page-header.scss:80-85`: action on right; phone wraps below head | `page-header.tsx:48-51` and `page-back-link.tsx:16-29`: action slot and 44px phone target | Source aligned; focus and positioning pending |

### Part A: eight pages

#### `src/app/(authenticated)/admin/placements/retention/page.tsx`
| Property | Legacy expected | vNext source verification | Remaining |
| --- | --- | --- | --- |
| Page layout and action placement | One 12px-radius, 24px padded canvas; head actions top-right (`old-lms-pages.md:1-2`, `listing-page-header.scss:80-85`) | Updated status pills for Withdrawn/Rejected; back link now inside PageHeader; fetched 39 lines, source markers 13, 14, 21, 26, 27, 31, 34, 35 | Resolved canvas token and 375px/768px screenshot |
| Interactive states | Old LMS hover/active/focus/disabled and slim status/empty/loading states (`old-lms-pages.md:4-7`) | Preserved header actions and row statuses through existing shared components and route controls | Check link focus and empty/report states; actual interaction unavailable |
| Responsive | Mobile <=767px; header stacks, 44px touch action (`old-lms-shell.css:73`, `listing-page-header.scss:130-149`) | No page-local breakpoint; inherited PageHeader/Buttons/Table carry 767/768 and 44px rules | Static CSS comparison only, no overflow/keyboard screenshot |
| Scoped grep, tag pairing | No raw controls, native confirm, custom dialog, hardcoded hex or hand tabs (`ui-clone-checklist.md:STRICT TICK RULE`) | rawButton=0; rawSelect=0; rawInput=0; rawTextarea=0; nativeConfirm=0; handDialog=0; hardHex=0; handTabs=0; Banner 1/1, div 2/2, section 0/0 | Source string scan, not TypeScript parse or global grep |


#### `src/app/(authenticated)/admin/settings/auth/page.tsx`
| Property | Legacy expected | vNext source verification | Remaining |
| --- | --- | --- | --- |
| Page layout and action placement | One 12px-radius, 24px padded canvas; head actions top-right (`old-lms-pages.md:1-2`, `listing-page-header.scss:80-85`) | Updated replace two-column tiles with hairline-separated rows; policy state pills; fetched 50 lines, source markers 17, 18, 19, 23, 24, 27, 30, 31, 34, 43 | Resolved canvas token and 375px/768px screenshot |
| Interactive states | Old LMS hover/active/focus/disabled and slim status/empty/loading states (`old-lms-pages.md:4-7`) | Preserved one-column section lists and status labels through existing shared components and route controls | Check unknown policy state strings and narrow pill wrapping; actual interaction unavailable |
| Responsive | Mobile <=767px; header stacks, 44px touch action (`old-lms-shell.css:73`, `listing-page-header.scss:130-149`) | No page-local breakpoint; inherited PageHeader/Buttons/Table carry 767/768 and 44px rules | Static CSS comparison only, no overflow/keyboard screenshot |
| Scoped grep, tag pairing | No raw controls, native confirm, custom dialog, hardcoded hex or hand tabs (`ui-clone-checklist.md:STRICT TICK RULE`) | rawButton=0; rawSelect=0; rawInput=0; rawTextarea=0; nativeConfirm=0; handDialog=0; hardHex=0; handTabs=0; Banner 1/1, div 3/3, section 1/1 | Source string scan, not TypeScript parse or global grep |


#### `src/app/(authenticated)/admin/placements/analytics/page.tsx`
| Property | Legacy expected | vNext source verification | Remaining |
| --- | --- | --- | --- |
| Page layout and action placement | One 12px-radius, 24px padded canvas; head actions top-right (`old-lms-pages.md:1-2`, `listing-page-header.scss:80-85`) | Updated one grouped summary strip, not many bordered KPI cards; fetched 141 lines, source markers 27, 28, 29, 34, 35, 37, 73, 76, 77, 80, 82, 84, 90, 92, 98, 101, 102, 109, 120, 122, 123, 127 | Resolved canvas token and 375px/768px screenshot |
| Interactive states | Old LMS hover/active/focus/disabled and slim status/empty/loading states (`old-lms-pages.md:4-7`) | Preserved one/two/five column metric strip and funnel/table through existing shared components and route controls | Check 10 metric divider geometry at 768px; actual interaction unavailable |
| Responsive | Mobile <=767px; header stacks, 44px touch action (`old-lms-shell.css:73`, `listing-page-header.scss:130-149`) | 80:className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px; 82:<form method="get" action="/admin/placements/analytics" className="grid min-w-0 grid-cols-1 gap-3 border-b border-border pb-4 md:g; 101:<dl className="grid min-w-0 grid-cols-1 divide-y divide-border border-y border-border md:grid-cols-2 md:divide-x md:divide-y-0 min; 109:<ol className="mt-4 grid gap-3 md:grid-cols-2 min-[992px]:grid-cols-3">{funnel.map(step=> | Static CSS comparison only, no overflow/keyboard screenshot |
| Scoped grep, tag pairing | No raw controls, native confirm, custom dialog, hardcoded hex or hand tabs (`ui-clone-checklist.md:STRICT TICK RULE`) | rawButton=0; rawSelect=0; rawInput=0; rawTextarea=0; nativeConfirm=0; handDialog=0; hardHex=0; handTabs=0; Banner 1/1, div 8/8, section 3/3 | Source string scan, not TypeScript parse or global grep |


#### `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx`
| Property | Legacy expected | vNext source verification | Remaining |
| --- | --- | --- | --- |
| Page layout and action placement | One 12px-radius, 24px padded canvas; head actions top-right (`old-lms-pages.md:1-2`, `listing-page-header.scss:80-85`) | Updated 768px filter split, storage-unavailable warning, application pills; fetched 128 lines, source markers 28, 29, 30, 35, 36, 37, 46, 48, 51, 96, 108, 109, 114, 116 | Resolved canvas token and 375px/768px screenshot |
| Interactive states | Old LMS hover/active/focus/disabled and slim status/empty/loading states (`old-lms-pages.md:4-7`) | Preserved seven fields, stage tabs and table statuses through existing shared components and route controls | Check 10-stage overflow and disabled migration state; actual interaction unavailable |
| Responsive | Mobile <=767px; header stacks, 44px touch action (`old-lms-shell.css:73`, `listing-page-header.scss:130-149`) | 51:<form method="get" className="grid min-w-0 gap-3 border-b border-border pb-4 md:grid-cols-2 xl:grid-cols-4"> | Static CSS comparison only, no overflow/keyboard screenshot |
| Scoped grep, tag pairing | No raw controls, native confirm, custom dialog, hardcoded hex or hand tabs (`ui-clone-checklist.md:STRICT TICK RULE`) | rawButton=0; rawSelect=0; rawInput=0; rawTextarea=0; nativeConfirm=0; handDialog=0; hardHex=0; handTabs=0; Banner 1/1, div 4/4, section 1/1 | Source string scan, not TypeScript parse or global grep |


#### `src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx`
| Property | Legacy expected | vNext source verification | Remaining |
| --- | --- | --- | --- |
| Page layout and action placement | One 12px-radius, 24px padded canvas; head actions top-right (`old-lms-pages.md:1-2`, `listing-page-header.scss:80-85`) | Updated status history pills and old LMS touch breakpoints; fetched 32 lines, source markers 15, 18, 19, 24, 28 | Resolved canvas token and 375px/768px screenshot |
| Interactive states | Old LMS hover/active/focus/disabled and slim status/empty/loading states (`old-lms-pages.md:4-7`) | Preserved related actions/hairline timeline through existing shared components and route controls | Check link focus and very long status text; actual interaction unavailable |
| Responsive | Mobile <=767px; header stacks, 44px touch action (`old-lms-shell.css:73`, `listing-page-header.scss:130-149`) | 18:<Link href={detail.related.href+"/applications"} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] ; 19:<Link href={detail.related.href+"/schedule?applicationId="+encodeURIComponent(applicationId)} className="inline-flex min-h-11 item | Static CSS comparison only, no overflow/keyboard screenshot |
| Scoped grep, tag pairing | No raw controls, native confirm, custom dialog, hardcoded hex or hand tabs (`ui-clone-checklist.md:STRICT TICK RULE`) | rawButton=0; rawSelect=0; rawInput=0; rawTextarea=0; nativeConfirm=0; handDialog=0; hardHex=0; handTabs=0; Banner 0/0, div 2/2, section 1/1 | Source string scan, not TypeScript parse or global grep |


#### `src/app/(authenticated)/admin/projects/workspaces/new/page.tsx`
| Property | Legacy expected | vNext source verification | Remaining |
| --- | --- | --- | --- |
| Page layout and action placement | One 12px-radius, 24px padded canvas; head actions top-right (`old-lms-pages.md:1-2`, `listing-page-header.scss:80-85`) | Updated recovery link in PageHeader for missing scope and setup error; fetched 46 lines, source markers 17, 18, 27, 28, 30, 39, 40, 43 | Resolved canvas token and 375px/768px screenshot |
| Interactive states | Old LMS hover/active/focus/disabled and slim status/empty/loading states (`old-lms-pages.md:4-7`) | Preserved no-college, denied, unavailable, assigned/empty templates through existing shared components and route controls | Check long retry text and creator form layout; actual interaction unavailable |
| Responsive | Mobile <=767px; header stacks, 44px touch action (`old-lms-shell.css:73`, `listing-page-header.scss:130-149`) | No page-local breakpoint; inherited PageHeader/Buttons/Table carry 767/768 and 44px rules | Static CSS comparison only, no overflow/keyboard screenshot |
| Scoped grep, tag pairing | No raw controls, native confirm, custom dialog, hardcoded hex or hand tabs (`ui-clone-checklist.md:STRICT TICK RULE`) | rawButton=0; rawSelect=0; rawInput=0; rawTextarea=0; nativeConfirm=0; handDialog=0; hardHex=0; handTabs=0; Banner 0/0, div 3/3, section 0/0 | Source string scan, not TypeScript parse or global grep |


#### `src/app/(authenticated)/admin/projects/templates/new/page.tsx`
| Property | Legacy expected | vNext source verification | Remaining |
| --- | --- | --- | --- |
| Page layout and action placement | One 12px-radius, 24px padded canvas; head actions top-right (`old-lms-pages.md:1-2`, `listing-page-header.scss:80-85`) | Updated PageHeader back action consistently in denied and create states; fetched 21 lines, source markers 9, 10, 12, 14, 15 | Resolved canvas token and 375px/768px screenshot |
| Interactive states | Old LMS hover/active/focus/disabled and slim status/empty/loading states (`old-lms-pages.md:4-7`) | Preserved denied vs normal template authoring through existing shared components and route controls | Check template form error/pending state; actual interaction unavailable |
| Responsive | Mobile <=767px; header stacks, 44px touch action (`old-lms-shell.css:73`, `listing-page-header.scss:130-149`) | No page-local breakpoint; inherited PageHeader/Buttons/Table carry 767/768 and 44px rules | Static CSS comparison only, no overflow/keyboard screenshot |
| Scoped grep, tag pairing | No raw controls, native confirm, custom dialog, hardcoded hex or hand tabs (`ui-clone-checklist.md:STRICT TICK RULE`) | rawButton=0; rawSelect=0; rawInput=0; rawTextarea=0; nativeConfirm=0; handDialog=0; hardHex=0; handTabs=0; Banner 0/0, div 2/2, section 0/0 | Source string scan, not TypeScript parse or global grep |


#### `src/app/(authenticated)/admin/projects/page.tsx`
| Property | Legacy expected | vNext source verification | Remaining |
| --- | --- | --- | --- |
| Page layout and action placement | One 12px-radius, 24px padded canvas; head actions top-right (`old-lms-pages.md:1-2`, `listing-page-header.scss:80-85`) | Updated responsive action wrap and old LMS border/hover/focus for header buttons; fetched 196 lines, source markers 39, 40, 41, 51, 52, 60, 70, 71, 73, 115, 116, 119, 130, 131, 135, 136, 137, 153, 156 | Resolved canvas token and 375px/768px screenshot |
| Interactive states | Old LMS hover/active/focus/disabled and slim status/empty/loading states (`old-lms-pages.md:4-7`) | Preserved workspace cards/table switch, export/filters, empty warnings through existing shared components and route controls | Check header action row overflow, table and cards; actual interaction unavailable |
| Responsive | Mobile <=767px; header stacks, 44px touch action (`old-lms-shell.css:73`, `listing-page-header.scss:130-149`) | 136:<Link className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text; 137:<Link className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text | Static CSS comparison only, no overflow/keyboard screenshot |
| Scoped grep, tag pairing | No raw controls, native confirm, custom dialog, hardcoded hex or hand tabs (`ui-clone-checklist.md:STRICT TICK RULE`) | rawButton=0; rawSelect=0; rawInput=0; rawTextarea=0; nativeConfirm=0; handDialog=0; hardHex=0; handTabs=0; Banner 1/1, div 6/6, section 0/0 | Source string scan, not TypeScript parse or global grep |


### Part B: eight additional pages

#### `src/app/(authenticated)/admin/placements/drives/page.tsx`
| Property | Old LMS reference / value | New vNext source evidence | Status / missing |
| --- | --- | --- | --- |
| Header / structure | One white canvas, 12px radius, 24px padding; title and right actions, no eyebrow (`old-lms-pages.md:1-2`, `listing-page-header.scss:46-59,80-85`) | right-aligned action cluster; fluid filter widths; 44px mobile controls; changed file 115 lines, element markers 23,24,25,31,32,33,41,42,43,62,76,77,79,81,83,86,109,110 | Shared title remains 30px vs SCSS 28px; exact pixel proof outstanding |
| States | Small lifecycle pills and slim notices, empty/loading/error treatment (`old-lms-pages.md:5-7`) | search, filtered data, status pills, loading/error/empty and pagination; source continues to use shared components, no custom overlays | long company names and 3 actions at 375px and focus/disabled interaction not run |
| Responsive | Legacy phone <=767px and tablet >=768px (`old-lms-shell.css:73`); mobile 20px header, 44px touch target (`listing-page-header.scss:130-149`) | 81:<Link href="/admin/placements/student-lookup" className="inline-flex min-h-11 items-center justify-center rounded-[; 83:className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-prima | Source-level rules only; actual 375px and 768px render not measured |
| Complete-file forbidden-pattern counts | No raw controls, custom overlays, hardcoded utility hex or manual tab roles (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawInputs=0; rawTextareas=0; nativeConfirm=0; customOverlay=0; hardHex=0; handTabs=0; Banner=0/0; div=6/6; section=0/0 | Remote full-source scan, not executed shell grep, TypeScript typecheck or browser state verification |


#### `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx`
| Property | Old LMS reference / value | New vNext source evidence | Status / missing |
| --- | --- | --- | --- |
| Header / structure | One white canvas, 12px radius, 24px padding; title and right actions, no eyebrow (`old-lms-pages.md:1-2`, `listing-page-header.scss:46-59,80-85`) | candidate-round StatusBadge and fluid filter controls, safe overview URL; changed file 92 lines, element markers 25,26,27,33,34,35,50,53,55,58,60,65,75,77,79 | Shared title remains 30px vs SCSS 28px; exact pixel proof outstanding |
| States | Small lifecycle pills and slim notices, empty/loading/error treatment (`old-lms-pages.md:5-7`) | pending/scheduled/completed/cancelled pills, interview slots; source continues to use shared components, no custom overlays | long round labels and status changes and focus/disabled interaction not run |
| Responsive | Legacy phone <=767px and tablet >=768px (`old-lms-shell.css:73`); mobile 20px header, 44px touch target (`listing-page-header.scss:130-149`) | Inherited PageHeader/PageBackLink and shared 44px controls without page-local breakpoint | Source-level rules only; actual 375px and 768px render not measured |
| Complete-file forbidden-pattern counts | No raw controls, custom overlays, hardcoded utility hex or manual tab roles (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawInputs=0; rawTextareas=0; nativeConfirm=0; customOverlay=0; hardHex=0; handTabs=0; Banner=0/0; div=4/4; section=1/1 | Remote full-source scan, not executed shell grep, TypeScript typecheck or browser state verification |


#### `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx`
| Property | Old LMS reference / value | New vNext source evidence | Status / missing |
| --- | --- | --- | --- |
| Header / structure | One white canvas, 12px radius, 24px padding; title and right actions, no eyebrow (`old-lms-pages.md:1-2`, `listing-page-header.scss:46-59,80-85`) | move Drive overview from body into PageHeader action; status pill; changed file 67 lines, element markers 20,22,26 | Shared title remains 30px vs SCSS 28px; exact pixel proof outstanding |
| States | Small lifecycle pills and slim notices, empty/loading/error treatment (`old-lms-pages.md:5-7`) | published/draft/archived, deadline editor and actions; source continues to use shared components, no custom overlays | many actions when narrow and focus/disabled interaction not run |
| Responsive | Legacy phone <=767px and tablet >=768px (`old-lms-shell.css:73`); mobile 20px header, 44px touch target (`listing-page-header.scss:130-149`) | Inherited PageHeader/PageBackLink and shared 44px controls without page-local breakpoint | Source-level rules only; actual 375px and 768px render not measured |
| Complete-file forbidden-pattern counts | No raw controls, custom overlays, hardcoded utility hex or manual tab roles (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawInputs=0; rawTextareas=0; nativeConfirm=0; customOverlay=0; hardHex=0; handTabs=0; Banner=0/0; div=4/4; section=2/2 | Remote full-source scan, not executed shell grep, TypeScript typecheck or browser state verification |


#### `src/app/(authenticated)/admin/placements/page.tsx`
| Property | Old LMS reference / value | New vNext source evidence | Status / missing |
| --- | --- | --- | --- |
| Header / structure | One white canvas, 12px radius, 24px padding; title and right actions, no eyebrow (`old-lms-pages.md:1-2`, `listing-page-header.scss:46-59,80-85`) | remove eyebrow from both header branches for inline-only legacy subtitle; changed file 82 lines, element markers 11,35,36,48,57,58,65 | Shared title remains 30px vs SCSS 28px; exact pixel proof outstanding |
| States | Small lifecycle pills and slim notices, empty/loading/error treatment (`old-lms-pages.md:5-7`) | scope/no-scope action row, oversights and dashboards; source continues to use shared components, no custom overlays | long directory actions on a phone and focus/disabled interaction not run |
| Responsive | Legacy phone <=767px and tablet >=768px (`old-lms-shell.css:73`); mobile 20px header, 44px touch target (`listing-page-header.scss:130-149`) | 11:"inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surfa; 65:className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-prima | Source-level rules only; actual 375px and 768px render not measured |
| Complete-file forbidden-pattern counts | No raw controls, custom overlays, hardcoded utility hex or manual tab roles (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawInputs=0; rawTextareas=0; nativeConfirm=0; customOverlay=0; hardHex=0; handTabs=0; Banner=0/0; div=2/2; section=0/0 | Remote full-source scan, not executed shell grep, TypeScript typecheck or browser state verification |


#### `src/app/(authenticated)/college/projects/page.tsx`
| Property | Old LMS reference / value | New vNext source evidence | Status / missing |
| --- | --- | --- | --- |
| Header / structure | One white canvas, 12px radius, 24px padding; title and right actions, no eyebrow (`old-lms-pages.md:1-2`, `listing-page-header.scss:46-59,80-85`) | phone buttons 44px until 767px; root min-w-0 and tabular result count; changed file 154 lines, element markers 36,37,38,46,47,48,78,79,81,103,108,112,117,118,119,121,122,130 | Shared title remains 30px vs SCSS 28px; exact pixel proof outstanding |
| States | Small lifecycle pills and slim notices, empty/loading/error treatment (`old-lms-pages.md:5-7`) | three toolbar links, card/list/archive tabs, missing templates and pagination; source continues to use shared components, no custom overlays | tabs/card overflow and action grouping at 375px and focus/disabled interaction not run |
| Responsive | Legacy phone <=767px and tablet >=768px (`old-lms-shell.css:73`); mobile 20px header, 44px touch target (`listing-page-header.scss:130-149`) | 112:className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm; 118:<Link className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-bor; 119:<Link className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-bor | Source-level rules only; actual 375px and 768px render not measured |
| Complete-file forbidden-pattern counts | No raw controls, custom overlays, hardcoded utility hex or manual tab roles (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawInputs=0; rawTextareas=0; nativeConfirm=0; customOverlay=0; hardHex=0; handTabs=0; Banner=1/1; div=5/5; section=0/0 | Remote full-source scan, not executed shell grep, TypeScript typecheck or browser state verification |


#### `src/app/(authenticated)/admin/placements/new/page.tsx`
| Property | Old LMS reference / value | New vNext source evidence | Status / missing |
| --- | --- | --- | --- |
| Header / structure | One white canvas, 12px radius, 24px padding; title and right actions, no eyebrow (`old-lms-pages.md:1-2`, `listing-page-header.scss:46-59,80-85`) | PageHeader recovery back link for missing college; changed file 31 lines, element markers 13,14,16 | Shared title remains 30px vs SCSS 28px; exact pixel proof outstanding |
| States | Small lifecycle pills and slim notices, empty/loading/error treatment (`old-lms-pages.md:5-7`) | selected-college create vs missing-college empty; source continues to use shared components, no custom overlays | narrow back action and creator component and focus/disabled interaction not run |
| Responsive | Legacy phone <=767px and tablet >=768px (`old-lms-shell.css:73`); mobile 20px header, 44px touch target (`listing-page-header.scss:130-149`) | Inherited PageHeader/PageBackLink and shared 44px controls without page-local breakpoint | Source-level rules only; actual 375px and 768px render not measured |
| Complete-file forbidden-pattern counts | No raw controls, custom overlays, hardcoded utility hex or manual tab roles (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawInputs=0; rawTextareas=0; nativeConfirm=0; customOverlay=0; hardHex=0; handTabs=0; Banner=0/0; div=1/1; section=0/0 | Remote full-source scan, not executed shell grep, TypeScript typecheck or browser state verification |


#### `src/app/(authenticated)/admin/placements/calendar/page.tsx`
| Property | Old LMS reference / value | New vNext source evidence | Status / missing |
| --- | --- | --- | --- |
| Header / structure | One white canvas, 12px radius, 24px padding; title and right actions, no eyebrow (`old-lms-pages.md:1-2`, `listing-page-header.scss:46-59,80-85`) | PageHeader recovery back link for missing scope; changed file 51 lines, element markers 26,27,32 | Shared title remains 30px vs SCSS 28px; exact pixel proof outstanding |
| States | Small lifecycle pills and slim notices, empty/loading/error treatment (`old-lms-pages.md:5-7`) | selected-college calendar and missing-scope empty; source continues to use shared components, no custom overlays | calendar's week/day grid overflow and focus/disabled interaction not run |
| Responsive | Legacy phone <=767px and tablet >=768px (`old-lms-shell.css:73`); mobile 20px header, 44px touch target (`listing-page-header.scss:130-149`) | Inherited PageHeader/PageBackLink and shared 44px controls without page-local breakpoint | Source-level rules only; actual 375px and 768px render not measured |
| Complete-file forbidden-pattern counts | No raw controls, custom overlays, hardcoded utility hex or manual tab roles (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawInputs=0; rawTextareas=0; nativeConfirm=0; customOverlay=0; hardHex=0; handTabs=0; Banner=0/0; div=1/1; section=0/0 | Remote full-source scan, not executed shell grep, TypeScript typecheck or browser state verification |


#### `src/app/(authenticated)/college/projects/workspaces/new/page.tsx`
| Property | Old LMS reference / value | New vNext source evidence | Status / missing |
| --- | --- | --- | --- |
| Header / structure | One white canvas, 12px radius, 24px padding; title and right actions, no eyebrow (`old-lms-pages.md:1-2`, `listing-page-header.scss:46-59,80-85`) | recoverable template-load ErrorState instead of blank/unhandled failure; changed file 37 lines, element markers 20,21,22,28,29,30 | Shared title remains 30px vs SCSS 28px; exact pixel proof outstanding |
| States | Small lifecycle pills and slim notices, empty/loading/error treatment (`old-lms-pages.md:5-7`) | college selection, templates-empty warning, template failure, creator; source continues to use shared components, no custom overlays | error retry and creator on 375/768px and focus/disabled interaction not run |
| Responsive | Legacy phone <=767px and tablet >=768px (`old-lms-shell.css:73`); mobile 20px header, 44px touch target (`listing-page-header.scss:130-149`) | Inherited PageHeader/PageBackLink and shared 44px controls without page-local breakpoint | Source-level rules only; actual 375px and 768px render not measured |
| Complete-file forbidden-pattern counts | No raw controls, custom overlays, hardcoded utility hex or manual tab roles (STRICT TICK RULE) | rawButtons=0; rawSelects=0; rawInputs=0; rawTextareas=0; nativeConfirm=0; customOverlay=0; hardHex=0; handTabs=0; Banner=1/1; div=2/2; section=0/0 | Remote full-source scan, not executed shell grep, TypeScript typecheck or browser state verification |


### Batch conclusion and next file
- **16 distinct route files** had source edits committed to `chatgpt/chat-10-b`, and each was re-read and regex-scanned from that branch. All eight forbidden-pattern categories scanned to zero for each file and the simple `div/section/Banner` pairing counts matched. These scans do NOT guarantee fully balanced TSX outside counted tags, exhaustive repository-wide grep, or runtime correctness.
- Current shared DataTable `md` threshold matches 767px legacy mobile split. Current shared PageHeader desktop title 30px/1.35 differs from the more precise old `listing-page-header.scss:52-59` 28px/1.3: notify chat-9 (shared owner), do not override globally here. Pixel comparison remains open.
- **Strict ticks: 0**. No live browser or computed CSS, exact 375px/768px screenshot, full hover/focus/disabled state pass, typecheck or CI was run. Treat this as a source-migration batch, not 16 certified pixel-level clones.
- **Next exact file:** `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx` (delegates to shared Projects subview), followed by `src/app/(authenticated)/admin/projects/templates/[templateId]/resources/page.tsx` and remaining unticked last-third pages.
