# Work packet (wave 2): edit src/components/placements/placement-drive-workspace.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md, docs/audit/gap2/lane-11/tpo-drives-jobid.md

## G2-10-012-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:27-29,101-112 — Selected college from SuperAdminScopeContext; breadcrumb DriveSubNav 'Drives' with tabs Overview, Applications, Schedule, Settings.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:15-31; src/components/placements/placement-drive-workspace.tsx:269-280 — Persisted admin selected college; no matching four-tab DriveSubNav or breadcrumb; PageHeader + Actions.
- Fix: Render breadcrumb and all four precise tabs with active Overview.

## G2-10-012-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:23-60 — ReturnTo passed to tab links, safe jobsRoot breadcrumb click.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31; src/components/placements/placement-drive-workspace.tsx:278-280 — Applications URL hardcoded and no returnTo preservation.
- Fix: Propagate validated returnTo through Overview/Applications/Schedule/Settings and back to Drives.

## G2-10-012-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:109-114,139-181 — Tab strip followed by grouped Needs attention warning banner, then drive hero card and Pipeline card.
- vNext now: src/components/placements/placement-drive-workspace.tsx:269-410; src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31 — PageHeader/status strip and pipeline appear before many form/action sections; no drive-specific needs-attention banner.
- Fix: Match legacy screen hierarchy and one canvas: tabs, attention, hero, pipeline.

## G2-10-012-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:181-223 — Hero is a distinct Ant Card with 3px left status-colored border and 56px company avatar.
- vNext now: src/components/placements/placement-drive-workspace.tsx:269-280,395-409 — Company/title text in PageHeader; plain horizontal status section, no 3px left card/accent/avatar.
- Fix: Recreate exactly bordered hero/left accent and 56px avatar without independent card sprawl.

## G2-10-012-009  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:189-204; docs/legacy-source/frontend/src/components/Placements/PlacementsCompanyAvatar.jsx:21-50 — 56px HTTPS-contained logo; hash-colored initials fallback when missing/broken; label Status and Job type.
- vNext now: src/components/placements/placement-drive-workspace.tsx:269-280,395-408 — Header name/status chips, no 56px company logo or fallback tile.
- Fix: Use the avatar color/hash and neutral logo frame dimensions.

## G2-10-012-010  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:183-185,194-202 — Hero left border green #52c41a for active, gray #8c8c8c for draft/closed; status pills green/orange/default.
- vNext now: src/components/placements/placement-drive-workspace.tsx:395-408; src/modules/placements/tpo-drive-header-model.ts:8-11 — Generic status badge by PUBLISHED/DRAFT/else without legacy accent border.
- Fix: Replicate exact thin border/status Tag palette for draft/open/open-expired/closed.

## G2-10-012-011  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:207-213 — EditOutlined secondary 'Edit drive' and TeamOutlined primary 'View applications'.
- vNext now: src/components/placements/placement-drive-workspace.tsx:278-280,279-389 — 'Applications' text link plus 'Actions' dropdown; extra Export applicants CTA.
- Fix: Match exact CTA words, order, icons and visible placement.

## G2-10-012-015  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:195-204 — Fact label 'Status' + descriptive Draft/Open/Open · Expired/Closed; 'Job type' displays normalized jobType.
- vNext now: src/components/placements/placement-drive-workspace.tsx:395-408; src/modules/placements/tpo-drive-header-model.ts:8-35 — Status Published rather than Open; job type under employmentType text; additional category/work mode/mode/pay/deadline.
- Fix: Provide legacy Status/Job type labelled Facts with exact labels.

## G2-10-012-016  [P2] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:215-221 — Description from job.jobDescription ellipsis 3 rows and Show more expansion.
- vNext now: src/components/placements/placement-drive-workspace.tsx:410-441,610-616 — Job description passed to draft edit form and optional supplemental employer info; no 3-line hero summary.
- Fix: Render description under hero divider with three-line Show more.

## G2-10-012-023  [P2] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:159-168 — Attention candidate link points to Applications?status=<APPLIED\|INTERVIEW\|OFFERED>.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:29-30; src/components/placements/placement-drive-workspace.tsx:278-280 — Header Applications link has no status filter.
- Fix: Make alert rows actionable using app-stage status deep link.

## G2-10-012-024  [P2] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:218-220 — Job description Show more is a targeted inline expansion.
- vNext now: src/components/placements/placement-drive-workspace.tsx:410-450 — No preview/expand; narrative content in supplementary sections and edit form.
- Fix: Restore accessible inline three-line expandable description.

## G2-10-012-037  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:217-220 — Description 'Show more' expansion in Typography.Paragraph, not a drawer.
- vNext now: src/components/placements/placement-drive-workspace.tsx:579-671 — Draft editing is large inline form; no read-only expansion.
- Fix: Keep read-only expandable description independent of edit drawer.

## G2-10-012-061  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:187-213 — Hero flex-wrap header: logo/name and actions side by side with 12px gap.
- vNext now: src/components/placements/placement-drive-workspace.tsx:269-280 — Header actions stack on mobile and layout uses responsive Tailwind container.
- Fix: Match 56px avatar, 12px gap, buttons sizes and wrap breakpoints.

## G2-10-012-065  [P2] MISSING  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:215-220 — Typography.Paragraph ellipsis expandable via Show more click.
- vNext now: src/components/placements/placement-drive-workspace.tsx:410-445 — No Show more toggle for drive description.
- Fix: Add button with aria-expanded and accessible text preview.

## G2-10-012-066  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:207-213 — Visible text CTA names both actions.
- vNext now: src/components/placements/placement-drive-workspace.tsx:278-280,279-389 — Menu 'Actions' conceals some commands, Applicants link visible.
- Fix: Keep exact visible descriptive labels and accessible icon/button names.

## G2-10-012-067  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:195-204 — Labels are 'Status', 'Job type', values 'Draft', 'Open', 'Open · Expired', 'Closed'.
- vNext now: src/components/placements/placement-drive-workspace.tsx:395-408; src/modules/placements/tpo-drive-header-model.ts:8-17 — Generic status Published and unlabeled application mode/work mode/pay strip.
- Fix: Use original status label/capitalization and Facts labels.

## G2-10-012-068  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:207-213 — Buttons exactly 'Edit drive' and 'View applications'.
- vNext now: src/components/placements/placement-drive-workspace.tsx:278-280,279-389 — Link 'Applications' and menu 'Actions'; no 'Edit drive'.
- Fix: Restore exact two labels and icons.

## G2-10-012-078  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:181-223 — CompanyAvatar relies on job.companyName/companyLogo stored/displayed on legacy Job.
- vNext now: src/components/placements/placement-drive-workspace.tsx:269-280; src/modules/placements/job-service.ts:73-83 — Normalized placement company relationships; header uses resolved company name, no logo.
- Fix: Join/store trusted company logo and render no-fetch initials fallback.

## G2-10-012-082  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:34-41,50-52 — companyName/logo and jobDescription embedded on legacy Job columns.
- vNext now: src/components/placements/placement-drive-workspace.tsx:269-280,410-421 — Company name resolved via relationship; long description not shown as 3-line summary.
- Fix: Expose companyLogo and description in Overview DTO/renderer, with legacy max lengths.

## G2-11-010-008  [P2] GAP  facet F02  effort M
- Legacy: First attention becomes one colored Next step card with up to three Also waiting links. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:393`
- vNext now: Next step is border-bottom text section, CTA plus grid of next actions. `src/components/placements/placement-drive-workspace.tsx:450`
- Fix: Clone Next step card hierarchy and also-waiting inline links.

## G2-11-010-009  [P2] GAP  facet F02  effort L
- Legacy: Tab pane unmounts when inactive (destroyInactiveTabPane). `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:459`
- vNext now: Round/offer/request sections appear simultaneously in long workspace. `src/components/placements/placement-drive-workspace.tsx:483`
- Fix: Use focused tab content, defer inactive expensive panes.

## G2-11-010-011  [P2] GAP  facet F02  effort M
- Legacy: The stepper was deliberately replaced by one Next step card, funnel belongs Applicants. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:390`
- vNext now: Journey KPI/funnel displayed on workspace root. `src/components/placements/placement-drive-workspace.tsx:471`
- Fix: Move journey strip to Applicants tab and keep one next-action card.

## G2-11-010-012  [P2] GAP  facet F03  effort M
- Legacy: Status labels include Needs your review, Sent back, Draft, Published, Closed, Cancelled, Declined. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:371`
- vNext now: Uses headerFacts.status from vNext job states and generic badge. `src/components/placements/placement-drive-workspace.tsx:397`
- Fix: Port exact legacy lifecycle text mapping including REQUEST,SENT_BACK,REJECTED.

## G2-11-010-013  [P2] GAP  facet F03  effort S
- Legacy: Mode label On campus/Pool/Off campus. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:374`
- vNext now: Displays application mode/work mode/employment/category instead. `src/components/placements/placement-drive-workspace.tsx:399`
- Fix: Display drive-mode label in original meta row.

## G2-11-010-015  [P2] GAP  facet F03  effort S
- Legacy: Header subtitle shows Deadline D MMM, h:mm A. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:377`
- vNext now: Status details show Applications close plus formatted headerFacts deadline. `src/components/placements/placement-drive-workspace.tsx:406`
- Fix: Match compact deadline prefix/date format in head.

## G2-11-010-017  [P2] GAP  facet F03  effort M
- Legacy: More opens AntD dropdown; Edit, Export applicants, Share, Close/Delete/Cancel conditional. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:385`
- vNext now: vNext has nested Actions > More submenu and separate action links. `src/components/placements/placement-drive-workspace.tsx:313`
- Fix: Flatten/clone primary More menu order and grouping.

## G2-11-010-023  [P2] GAP  facet F04  effort S
- Legacy: Legacy CTC range rendered raw in compact header. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:376`
- vNext now: vNext displays Pay: projected CTC summary. `src/components/placements/placement-drive-workspace.tsx:405`
- Fix: Match old CTC copy/format in header.

## G2-11-010-024  [P2] GAP  facet F04  effort M
- Legacy: Completed rounds, staged results, released offers calculated from loaded arrays. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:158`
- vNext now: vNext derives round staged/applied from driveDay participants and offer candidates. `src/components/placements/placement-drive-workspace.tsx:488`
- Fix: Match KPI definitions, particularly released/accepted only.

## G2-11-010-026  [P2] GAP  facet F04  effort M
- Legacy: Legacy applies Math.round percentage applicants/(applicants+notApplied). `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:153`
- vNext now: vNext Journey derives stage numbers from persisted journey service. `src/components/placements/placement-drive-workspace.tsx:471`
- Fix: Check application rate and denominator parity; expose exact rate in Applicants.

## G2-11-010-027  [P2] GAP  facet F04  effort M
- Legacy: Legacy meta includes recruiter driveMode, CTC, deadline and recordedOutside. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:371`
- vNext now: New shows applicationMode/workMode/employment/category and separate employer info. `src/components/placements/placement-drive-workspace.tsx:395`
- Fix: Reorder and map exact original header facts before new fields.

## G2-11-010-032  [P2] GAP  facet F05  effort M
- Legacy: Drive-day tab only on-campus or unspecified mode rounds. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:361`
- vNext now: vNext Rounds section iterates all round modes. `src/components/placements/placement-drive-workspace.tsx:488`
- Fix: Restrict Drive day tab listing to legacy modes while preserving round management.

## G2-11-010-034  [P2] GAP  facet F06  effort M
- Legacy: Cancel reasons fixed four choices; required by reasonIsValid. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:42`
- vNext now: Cancel drive navigates to separate cancel-preview page. `src/components/placements/placement-drive-workspace.tsx:301`
- Fix: Match reason choices and disabled submit in cancel preview.

## G2-11-010-053  [P2] GAP  facet F09  effort M
- Legacy: Run it again? confirm: copy details, no dates/applicants/offers, no messages. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:319`
- vNext now: TpoDriveCloneAction appears only for CLOSED/CANCELLED. `src/components/placements/placement-drive-workspace.tsx:324`
- Fix: Include REJECTED request clone and confirm original copy text.

## G2-11-010-055  [P2] GAP  facet F10  effort L
- Legacy: Legacy loads 7 resources parallel: job, applicants, notApplied, rounds, offers, summary, activity. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:94`
- vNext now: vNext parallel loads driveDay,evaluation,screening,job,eligibility,offerCandidates,roles,requests plus optionals. `src/components/placements/placement-drive-workspace.tsx:67`
- Fix: Map missing activity/notApplied and avoid new waterfall for first render.

## G2-11-010-058  [P2] GAP  facet F10  effort M
- Legacy: Drive refresh on initial load and focus. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:114`
- vNext now: vNext manual refresh control; focus refresh not evidenced. `src/components/placements/placement-drive-workspace.tsx:387`
- Fix: Add revalidate-on-focus behavior respecting data freshness.

## G2-11-010-062  [P2] GAP  facet F11  effort S
- Legacy: Frozen closed/cancelled/rejected replaces Edit with Run it again. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:349`
- vNext now: New clone only CLOSED/CANCELLED, excludes REJECTED. `src/components/placements/placement-drive-workspace.tsx:324`
- Fix: Add rejected clone branch when supported.

## G2-11-010-063  [P2] GAP  facet F11  effort M
- Legacy: Share with company menu available regardless of draft lifecycle. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:354`
- vNext now: New share-preview only if status not DRAFT. `src/components/placements/placement-drive-workspace.tsx:319`
- Fix: Check intended restriction and enable equivalent draft share preview if authorized.

## G2-11-010-073  [P2] MISSING  facet F13  effort S
- Legacy: Sent-back/request note appears info alert Note: {sentBackNote}. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:457`
- vNext now: No sent-back note displayed in header panel. `src/components/placements/placement-drive-workspace.tsx:395`
- Fix: Expose request returned-note info banner.

## G2-11-010-076  [P2] GAP  facet F14  effort M
- Legacy: ShareModal handles per-drive company sharing. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:16`
- vNext now: New share-preview route replaces modal. `src/components/placements/placement-drive-workspace.tsx:319`
- Fix: Preserve modal workflow/summary or accept route split with same fields.

## G2-11-010-077  [P2] GAP  facet F14  effort M
- Legacy: StudentPanel opens applicant detail overlay with prev/next navigation. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:552`
- vNext now: New Applicants pipeline separate route, no corresponding overlay in workspace. `src/components/placements/placement-drive-workspace.tsx:290`
- Fix: Restore applicant detail drawer navigation in applicants tab.
