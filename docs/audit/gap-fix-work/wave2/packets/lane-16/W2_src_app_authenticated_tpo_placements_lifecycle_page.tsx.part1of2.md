# Work packet (wave 2): edit src/app/(authenticated)/tpo/placements/lifecycle/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-index.md, docs/audit/gap2/lane-12/l16-u031-placements-end-to-end.md

## G2-11-012-003  [P2] GAP  facet F01  effort S
- Legacy: Create drive button links /tpo/drives/new, with Plus icon. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:387`
- vNext now: Text Create drive links /tpo/placements/new; no Plus icon. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:100`
- Fix: Restore icon/position and maintain route alias.

## G2-11-012-005  [P2] GAP  facet F01  effort S
- Legacy: Exactly four lifecycle tabs Requests, Drafts, Live, Closed. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:22`
- vNext now: Five tabs Requests, Live, Drafts, Closed, All jobs; second/third reversed. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:121`
- Fix: Restore four-tab order, make All secondary.

## G2-11-012-006  [P2] GAP  facet F01  effort S
- Legacy: Changing tab shallowly changes ?tab= value. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:177`
- vNext now: New links use ?view=REQUESTS/LIVE/DRAFT/CLOSED. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:124`
- Fix: Support legacy tab query deeplinks and active state.

## G2-11-012-007  [P2] GAP  facet F02  effort S
- Legacy: ListingPageHeader with one Create drive header action. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:383`
- vNext now: PageHeader also has More action dropdown and Create drive. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:91`
- Fix: Restore original header spacing, primary visible CTA, menu secondary.

## G2-11-012-008  [P2] GAP  facet F02  effort M
- Legacy: Work links row appears above tab strip. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:406`
- vNext now: Needs doing row appears above tab strip with counts, different order. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:102`
- Fix: Clone work links order and active filter surface.

## G2-11-012-012  [P2] GAP  facet F02  effort M
- Legacy: Table filters opened in side panel Filter drives. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:439`
- vNext now: Advanced filters in inline details accordion under form. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:151`
- Fix: Clone side drawer and active chip style.

## G2-11-012-015  [P2] GAP  facet F03  effort S
- Legacy: Mode labels On campus/Pool/Off campus. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:45`
- vNext now: Shows employment type and work mode instead. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:326`
- Fix: Show legacy drive mode chip/column.

## G2-11-012-016  [P2] MISSING  facet F03  effort S
- Legacy: Pay cell derived range ₹{lo}-{hi} LPA with Regular/Dream tier. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:55`
- vNext now: Article row excludes displayed pay range/category in default fields. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:326`
- Fix: Include pay and tier in visible row.

## G2-11-012-017  [P2] GAP  facet F03  effort M
- Legacy: Where it is uses recorded/pipeline/offer/open deadline state, UNKNOWN if counts unavailable. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:68`
- vNext now: Row says rounds completed, offers active; no Where it is field. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:347`
- Fix: Add exact pipeline-stage label with fail-closed unknown state.

## G2-11-012-018  [P2] GAP  facet F03  effort M
- Legacy: Applied count right-aligned sortable, unavailable distinct from zero. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:336`
- vNext now: Applied: N shown, no sorting by clicking column. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:328`
- Fix: Restore Applied column sorting and unknown indicator.

## G2-11-012-019  [P2] GAP  facet F03  effort S
- Legacy: Deadline shows D MMM YYYY, h:mm A or No deadline/Not set. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:355`
- vNext now: Intl medium date+time en-IN, different null copy. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:349`
- Fix: Clone exact date and empty text.

## G2-11-012-022  [P2] MISSING  facet F04  effort M
- Legacy: payOf uses roleOptionsJson to derive CTC min/max or max stipend. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:49`
- vNext now: Row omits pay and category. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:326`
- Fix: Project full company pay range and monthly fallback.

## G2-11-012-027  [P2] GAP  facet F05  effort M
- Legacy: Filter Company checklist based on current drives. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:97`
- vNext now: Company single select by companyId. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:154`
- Fix: Support multi-company checkbox filter and URL state.

## G2-11-012-028  [P2] GAP  facet F05  effort M
- Legacy: Batch filter supports Every batch in placements and only targeted batches. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:99`
- vNext now: New Batch single select all batches. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:137`
- Fix: Show targeted batch choices and ALL sentinel.

## G2-11-012-029  [P2] GAP  facet F05  effort M
- Legacy: Where it is filter has five pipeline states + UNKNOWN/NOT_LIVE. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:101`
- vNext now: New journey filter has TAKING_APPLICATIONS/RUNNING_ROUNDS/OFFERS_ISSUED/COMPLETE. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:190`
- Fix: Map original pipeline states and unknown fallback.

## G2-11-012-030  [P2] GAP  facet F05  effort M
- Legacy: Applications close six choices TODAY,WEEK,LATER,PASSED,NONE,OUTSIDE. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:104`
- vNext now: Deadline state options TODAY,DUE_SOON,LATER,OVERDUE,UNSET, not OUTSIDE. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:176`
- Fix: Add Happened outside option and identical window logic.

## G2-11-012-032  [P2] GAP  facet F05  effort M
- Legacy: Job type filter based on dynamic legacy jobTypes. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:106`
- vNext now: Employment type choices differ from college job type. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:201`
- Fix: Add college Job type filter.

## G2-11-012-034  [P2] MISSING  facet F05  effort S
- Legacy: Recorded from outside yes/no toggle. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:109`
- vNext now: No direct recorded-outside filter in GET form. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:151`
- Fix: Restore yes/no checkbox filter.

## G2-11-012-035  [P2] GAP  facet F05  effort M
- Legacy: Owner checklist based on faculty IDs. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:111`
- vNext now: Created by single select users, not assigned owner. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:161`
- Fix: Differentiate drive owner from creator.

## G2-11-012-036  [P2] GAP  facet F05  effort M
- Legacy: Applied count range control only when all counts verified. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:113`
- vNext now: New minApplied/maxApplied always available. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:22`
- Fix: Disable count filter when aggregate unavailable, indicate unknown.

## G2-11-012-037  [P2] GAP  facet F05  effort S
- Legacy: Offers made yes/no when countsComplete. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:108`
- vNext now: New minOffers/maxOffers numeric ranges. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:22`
- Fix: Preserve Has offers/No offers yet toggle.

## G2-11-012-038  [P2] GAP  facet F05  effort M
- Legacy: useUrlFilters writes query after side-panel interactions. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:210`
- vNext now: GET form Apply submits all fields. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:127`
- Fix: Match chip-driven instant filter update and Reset.

## G2-11-012-039  [P2] MISSING  facet F05  effort M
- Legacy: Columns auto hide same-value Mode/Owner/Job type. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:207`
- vNext now: New Card columns toggles DETAILED/COMPACT, no per-column hide. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:185`
- Fix: Add Columns picker and same-value defaults.

## G2-11-012-043  [P2] MISSING  facet F06  effort S
- Legacy: Act button disabled if audience empty. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:287`
- vNext now: Export-selected button is always present, no Act button. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:380`
- Fix: Enable only when selected/all rows count>0.

## G2-11-012-054  [P2] MISSING  facet F09  effort M
- Legacy: Extend deadline prompts New deadline in one modal. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:252`
- vNext now: Per-drive deadline route instead. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:363`
- Fix: Offer bulk date modal.

## G2-11-012-067  [P2] MISSING  facet F12  effort M
- Legacy: Bulk extension only if proposed deadline later than each existing. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:260`
- vNext now: Only per-drive service handles token; no bulk logic. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:363`
- Fix: Restore bulk skip semantics.

## G2-11-012-068  [P2] GAP  facet F13  effort M
- Legacy: Initial failure PanelError with Retry. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:417`
- vNext now: await throws global boundary. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:24`
- Fix: Show in-page retry.

## G2-11-012-070  [P2] GAP  facet F13  effort S
- Legacy: Requests empty No drive requests waiting and exact explanatory subtext. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:453`
- vNext now: No requests / No recruiter drive requests need review. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:254`
- Fix: Match exact empty copy.

## G2-11-012-071  [P2] GAP  facet F13  effort S
- Legacy: Other tab empty No {tab} drives yet, create/switch guidance. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:454`
- vNext now: No matching drives or No live drives yet, alternative text. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:305`
- Fix: Restore tab-specific empty title/subtitle.

## G2-11-012-074  [P2] GAP  facet F14  effort M
- Legacy: Export respects displayed/filter rows. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:452`
- vNext now: Selected scope max25 rows, separate ALL export. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:314`
- Fix: Document cap and allow exact visible-selection export.

## G2-11-012-077  [P2] GAP  facet F16  effort L
- Legacy: Desktop multi-column table, mobile responsive hide columns. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:438`
- vNext now: Article stack single-column all sizes. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:318`
- Fix: Clone desktop table and mobile selective columns.

## G2-11-012-080  [P2] GAP  facet F17  effort S
- Legacy: Drive row has button with company + role navigation. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:301`
- vNext now: Heading plus links in article; focusable navigation via later links. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:321`
- Fix: Ensure title itself navigates by keyboard and click.

## G2-11-012-081  [P2] GAP  facet F17  effort S
- Legacy: Work buttons use aria-pressed for active filter. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:408`
- vNext now: Links styled active but no aria-current/pressed explicitly. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:110`
- Fix: Add aria-current/pressed to selected needs-doing link.

## G2-11-012-083  [P2] GAP  facet F18  effort S
- Legacy: Work link Waiting for your review. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:120`
- vNext now: New Needs doing row has All drives but omits Waiting for your review. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:109`
- Fix: Restore review link priority.

## G2-11-012-088  [P2] MISSING  facet F18  effort S
- Legacy: PanelError uses actual error message or Could not load drives. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:419`
- vNext now: No inline load error. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:88`
- Fix: Add fallback and Retry.

## G2-11-012-091  [P2] MISSING  facet F19  effort M
- Legacy: Applied column sortable ascending client side. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:336`
- vNext now: Sort options company/deadline; applied sort not offered. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:212`
- Fix: Offer applied count sort.

## G2-11-012-095  [P2] GAP  facet F20  effort S
- Legacy: Selected work toggle same filter to empty (unselect). `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:227`
- vNext now: Link selection forces named filter, no click-to-unselect. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:110`
- Fix: Implement toggle-off shortcut behavior.

## G2-11-012-103  [P2] GAP  facet F23  effort M
- Legacy: Original filter groups Drive,Timing,Pay,People. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:93`
- vNext now: New advanced form field groups not organized by those headings. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:151`
- Fix: Restore drawer section headings and exact option wording.

## G2-11-012-105  [P2] GAP  facet F23  effort S
- Legacy: Original status tabs Requests,Drafts,Live,Closed. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:128`
- vNext now: New Requests,Live,Drafts,Closed,All jobs. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:121`
- Fix: Reorder and distinguish All jobs as extra.

## G2-16-031-007  [P2] GAP  facet F03  effort M
- Legacy: tpo/drives/index.js:93-113 filter pane has Company, Batch, Where it is, closing, Mode, Job type, Pay category, Offers made, Outside, Owner, Students applied
- vNext now: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:22-47 query supports cohort, owner, company, season, deadline, mode, pay, offers, attention and journey
- Fix: Build one-to-one filter controls/options group ordering; preserve outside/where labels and range numeric semantics
