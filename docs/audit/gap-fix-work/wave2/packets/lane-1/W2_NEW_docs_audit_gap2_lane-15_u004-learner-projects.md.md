# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-15/u004-learner-projects.md

17 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-15/u004-learner-projects.md

## G2-15-004-002  [P2] GAP  facet F01  effort M
- Legacy: ProjectsShell uses PageShell with ariaLabel `Projects workspace` and hidden directory tabs (ProjectsContent.jsx:237-243; ProjectsShell.jsx:42-55)
- vNext now: PageHeader under bare div, no Projects workspace region in page (learn/projects/page.tsx:142-155)
- Fix: Restore module canvas and Projects workspace accessible region

## G2-15-004-003  [P2] GAP  facet F01  effort S
- Legacy: Blocked link appends `?tab=board&lane=Blocked` (ProjectsContent.jsx:329-345)
- vNext now: Blocked link appends `?tab=board&taskStatus=BLOCKED` (learn/projects/page.tsx:180-193)
- Fix: Provide backward-compatible legacy lane query redirect

## G2-15-004-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy card order: status/title/course+mentor, progress meter, next action (ProjectsContent.jsx:340-420)
- vNext now: Status/title, extra summary/mentor/member/progress cards, phase/due, action, Updated footer (project-list.tsx:83-184)
- Fix: Restore exact content order and proportional spacing; subordinate extra data

## G2-15-004-007  [P2] GAP  facet F03  effort M
- Legacy: ACTIVE teal Tag `#2db7c4` and identical Progress stroke colour (ProjectsContent.jsx:12-19,355-357,385-392)
- vNext now: StatusBadge uses success green for ACTIVE; no teal bar (project-list.tsx:29-40,98-114,130-155)
- Fix: Match legacy teal status and horizontal progress bar

## G2-15-004-008  [P2] GAP  facet F03  effort S
- Legacy: Archived primary tag neutral; blocked primary tag volcano; archive takes priority (ProjectsContent.jsx:316-357)
- vNext now: Archived status plus possible neutral readOnlyBadge and blocked warning attention badges (project-list.tsx:98-114)
- Fix: Enforce one legacy primary status pill and exclusive tag priority

## G2-15-004-010  [P2] GAP  facet F03  effort M
- Legacy: Progress label displays phase and nextDue above full-width bar (ProjectsContent.jsx:373-394)
- vNext now: Phase embedded in metadata and due after metrics, progress only KPI text (project-list.tsx:118-161)
- Fix: Restore phase/due row and full-width completion meter

## G2-15-004-011  [P2] GAP  facet F03  effort S
- Legacy: Status/attention tags appear before title and course/mentor with bullet separator (ProjectsContent.jsx:355-369)
- vNext now: Top right StatusBadge after title, metadata includes phase and due (project-list.tsx:83-124)
- Fix: Match status-to-title reading order, tight typography and separator

## G2-15-004-012  [P2] GAP  facet F03  effort S
- Legacy: CTA bold nextAction and separate `Open workspace` link cue (ProjectsContent.jsx:396-418)
- vNext now: One `actionLine →` plus Updated footer and arrow (project-list.tsx:167-184)
- Fix: Split bold action line from click cue

## G2-15-004-026  [P2] GAP  facet F05  effort M
- Legacy: Server paginates with page=0 default then stable current page local sort (ProjectsContent.jsx:154-165,205-217)
- vNext now: Loads all then sorts whole set; page=1 default; clamp to last (learn/projects/page.tsx:41-44,100-140)
- Fix: Preserve bookmarked page0 and define consistent global sorting vs paging

## G2-15-004-030  [P2] GAP  facet F06  effort S
- Legacy: Select status/attention widths170px/210px, allowClear and placeholders (ProjectsContent.jsx:269-296)
- vNext now: Fluid Select widgets with blank option, mobile vertical layout (project-participant-list-controls.tsx:86-138)
- Fix: Match select sizing/clear focus and placeholders

## G2-15-004-037  [P2] GAP  facet F09  effort M
- Legacy: Filters always visible in legacy card, no modal/drawer (ProjectsContent.jsx:258-304)
- vNext now: Mobile Disclosure hides filters behind `Search & filters` (learner-project-mobile-filters.tsx:22-31)
- Fix: Expose primary search/status even on 375px or approve mobile exception

## G2-15-004-046  [P2] GAP  facet F12  effort M
- Legacy: Legacy blocker tag and `lane=Blocked` route use free-text blocker (ProjectsContent.jsx:329-358,408-410)
- vNext now: VNext blocked tasks OR blocker text triggers status and `taskStatus=BLOCKED` (learn/projects/page.tsx:157-193)
- Fix: Preserve blocker text in card and route alias; distinguish task blocked vs project blocked

## G2-15-004-054  [P2] GAP  facet F16  effort M
- Legacy: Legacy solid card shape with inline progress bar (ProjectsContent.jsx:340-420)
- vNext now: VNext divided-y rows, no progress bar (project-list.tsx:75-82,130-155)
- Fix: Restore card border/radius/spacing and bar proportions

## G2-15-004-066  [P2] GAP  facet F22  effort S
- Legacy: Legacy numbered Team series comparison only same prefix and suffix (projectListOrdering.js:1-18)
- vNext now: VNext Team N regex compares unrelated series and falls back updatedAt desc (learner-project-sort-model.ts:5-35)
- Fix: Use same-series comparator and deterministic order

## G2-15-004-009  [P3] GAP  facet F03  effort S
- Legacy: Chevron RightOutlined at upper-right (ProjectsContent.jsx:340-371)
- vNext now: Arrow `→` at bottom right in footer (project-list.tsx:170-184)
- Fix: Use legacy chevron placement/icon

## G2-15-004-015  [P3] GAP  facet F04  effort S
- Legacy: Missing course or mentor displays literal `Project`/`Mentor` (ProjectsContent.jsx:363-368)
- vNext now: Unassigned mentor says `Mentor not assigned` and extra KPI (project-list.tsx:118-125,130-155)
- Fix: Keep exact fallback wording and only claim unassigned if verified

## G2-15-004-027  [P3] GAP  facet F05  effort S
- Legacy: Page size 25 with 10/25/50 selector; only show paginator if total>size (ProjectsContent.jsx:425-444)
- vNext now: Same options but always show range summary; only Prev/Next if pages>1 (project-participant-list-controls.tsx:186-204,267-312)
- Fix: Match conditional paginator and exact range copy
