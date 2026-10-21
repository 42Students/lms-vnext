# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u015-college-admin-workspace-summary.md (part 1 of 2)

40 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u015-college-admin-workspace-summary.md

## G2-7-015-001  [P2] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:86-95,469-474 legacy workspace Summary route and Projects menu
- vNext now: V/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx:1-16 redirects to /college/projects/:id/summary
- Fix: Preserve route/bookmark, from and reason context

## G2-7-015-002  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:471-475 exact subtitle `Health, setup and operating details for this workspace.`
- vNext now: V/components/projects/project-workspace.tsx:178-193 uses project summary subtitle
- Fix: Restore exact Summary subtitle

## G2-7-015-003  [P2] GAP  facet F01  effort M
- Legacy: LFE/components/admin/AdminWorkspaceShell.jsx:11-27 workspace breadcrumbs and contextual Back
- vNext now: V/components/projects/project-workspace.tsx:320-335 omits breadcrumbs on sectionBaseHref
- Fix: Restore breadcrumb and tab order

## G2-7-015-008  [P2] GAP  facet F02  effort M
- Legacy: LFE/components/admin/projects/WorkspaceSummarySnapshot.jsx:73-112 one Card containing left health and right quick facts
- vNext now: V/components/projects/project-workspace.tsx:364-416 border-top Metric strip separate; no snapshot Card
- Fix: Restore one-card layout, no nested cards

## G2-7-015-009  [P2] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSummarySnapshot.jsx:77-88 Workspace health eyebrow, status/template/phase Tag row
- vNext now: V/components/projects/project-workspace.tsx:195-199 status badge in header, no snapshot template tag/phase
- Fix: Render health eyebrow and all tags

## G2-7-015-010  [P2] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSummarySnapshot.jsx:90-99 summary fallback and Overall progress bar
- vNext now: V/components/projects/project-workspace.tsx:362-416 no progress bar or empty summary in admin Summary metric section
- Fix: Add fallback paragraph, combined completion bar

## G2-7-015-011  [P2] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSummarySnapshot.jsx:101-109 four quick facts Team, Tasks, Sprints, Target
- vNext now: V/components/projects/project-workspace.tsx:367-408 metrics Tasks, Sprints, Releases, Final submission
- Fix: Restore Team and Target facts and exact four labels

## G2-7-015-013  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:564-568 at-risk and filtered-view banners use icon Alert
- vNext now: V/components/projects/project-workspace.tsx:334-340 riskReason generic single banner
- Fix: Show risk severity, multiple reasons and mismatch sentence

## G2-7-015-015  [P2] MISSING  facet F04  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSummarySnapshot.jsx:54-64 templateName title or slug, optional vVersion and fallback `No template attached`
- vNext now: V/components/projects/project-workspace.tsx:178-416 no template tag
- Fix: Restore template origin/version and link

## G2-7-015-016  [P2] MISSING  facet F04  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSummarySnapshot.jsx:66-70 target = endDate, dueDate, dueLabel then Not set, human date
- vNext now: V/components/projects/project-workspace.tsx:362-416 no Target quick fact
- Fix: Restore priority and date formatting

## G2-7-015-017  [P2] GAP  facet F04  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSummarySnapshot.jsx:67-69 Team members with singular/plural, Tasks/Sprints done with explicit zero empty labels
- vNext now: V/components/projects/project-workspace.tsx:367-408 only tasks/sprints/release/submission metrics
- Fix: Render count grammar and zero copy

## G2-7-015-018  [P2] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:262-281 load and prefill course from item.course, classId and dates as dayjs
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:23-29 fields courseLabel and sectionId UUID
- Fix: Map legacy course/class identity with explicit cross-tenant class compatibility

## G2-7-015-019  [P2] GAP  facet F05  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:541-569 snapshot fact order; no table, search, paging in Summary
- vNext now: V/components/projects/project-workspace.tsx:364-416 metric strip no paging/table
- Fix: Match fact order; table sorting/paging N/A

## G2-7-015-020  [P2] GAP  facet F05  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:572-734 form field order fixed by 4 sections
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:70-107 mixed grid then textareas
- Fix: Restore fixed section sequence instead of generic grid

## G2-7-015-021  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:575-580 title required `Title is required`, maxlength160, showCount, placeholder Campus Event Coordination
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:72-73 title maxLength200, no placeholder/character count
- Fix: Set 160, character counter, legacy placeholder and error

## G2-7-015-022  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:580-582 summary textarea 3 rows placeholder `Short live workspace summary`
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:98-102 summary min-height96, no placeholder
- Fix: Restore exact rows and placeholder

## G2-7-015-025  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:623-636 Phase max80 Due label max80 Course label max160 with examples
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:80-81 Phase max120 Due label max160 Course label max160 no examples
- Fix: Restore phase/due max80 and placeholders

## G2-7-015-026  [P2] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:639-654 class searchable clearable Select, tooltip, placeholder `No class`
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:81-86 native Select current class fallback and no tooltip
- Fix: Restore searchable picker and exact detach helper

## G2-7-015-027  [P2] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:660-676 start/end AntD DatePickers, end >= start field validator
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:87-90 native date inputs and message `End date must be after start date.`
- Fix: Align date picker UI and exact inclusive validation wording

## G2-7-015-031  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:122-131 warning shown if transition to ACTIVE with no mentor
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:103 generic `Activating requires a Mentor`
- Fix: Show contextual warning only for ACTIVATE transition without mentor

## G2-7-015-032  [P2] MISSING  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:716-732 Overview tab link in helper paragraph
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:67-111 no Overview guidance
- Fix: Restore cross-tab helper/link

## G2-7-015-043  [P2] MISSING  facet F09  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:199-216 Escape inside Select closes dropdown first, modal second
- vNext now: V/components/projects/project-workspace.tsx:178-210 lacks template dialog
- Fix: Implement nested Escape behavior

## G2-7-015-049  [P2] GAP  facet F11  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:422-433 missing college warning with workspace shell
- vNext now: V/components/projects/admin-project-section-page.tsx:38-42 access denial before component
- Fix: Restore missing-college UI without bypassing tenant guard

## G2-7-015-051  [P2] GAP  facet F11  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:475-500 Archive disabled when already archived, Delete remains available
- vNext now: V/components/projects/project-archive-control.tsx:81-105 shows Restore for archived and summary editor hidden when readOnly
- Fix: Document restore vs soft-delete role policy

## G2-7-015-053  [P2] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:333-341 classId=0 detach, validates college
- vNext now: V/modules/projects/college-project-summary-service.ts:42-52 sectionId UUID validated college + active academic structure
- Fix: Map old classId to current sectionId, including detach

## G2-7-015-056  [P2] GAP  facet F12  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:680-710 sprint length <=12 and estimation POINTS/HOURS
- vNext now: V/modules/projects/college-project-summary-model.ts:17-18 <=104, TASKS extra
- Fix: Align hard limits after owner review

## G2-7-015-057  [P2] GAP  facet F13  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:90-99 loading true until first GET, eight-row Skeleton
- vNext now: V/app/(authenticated)/college/projects/[projectId]/[section]/loading.tsx:1-10 generic GracefulPageLoading directory
- Fix: Restore eight-row Summary skeleton

## G2-7-015-058  [P2] GAP  facet F13  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:537-542 error Alert with Retry; final `Workspace not found`
- vNext now: V/components/projects/admin-project-section-page.tsx:38-47 throws before render
- Fix: Add recoverable load error and distinct 404

## G2-7-015-059  [P2] MISSING  facet F13  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSummarySnapshot.jsx:90-92 no summary fallback
- vNext now: V/components/projects/project-workspace.tsx:362-416 no admin fallback paragraph
- Fix: Restore `No workspace summary has been added yet.`

## G2-7-015-060  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:424-434 missing college warning
- vNext now: V/components/projects/admin-project-section-page.tsx:38-42 no-college denies
- Fix: Show warning in shell

## G2-7-015-064  [P2] GAP  facet F16  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:584-717 grid md12 and md8 with responsive AntD Card
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:70-102 md two columns and textareas full width
- Fix: Restore 3-column phase/due/course row and logical group spacing

## G2-7-015-065  [P2] GAP  facet F16  effort M
- Legacy: LFE/components/admin/projects/WorkspaceSummarySnapshot.jsx:73-112 responsive primary/metric snapshot grid
- vNext now: V/components/projects/project-workspace.tsx:364-416 2 mobile/4 xl metrics, missing health region
- Fix: Restore snapshot layout at 375/768/1280

## G2-7-015-066  [P2] MISSING  facet F17  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:515-531 labelled template modal and warning, Search Select keyboard Escape guard
- vNext now: V/components/projects/project-workspace.tsx:178-210 no template modal
- Fix: Add accessible dialog focus and Escape handling

## G2-7-015-067  [P2] GAP  facet F17  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:591-605 status/Progress helper texts under accessible Form.Item
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:73-80 labels but no contextual helpers
- Fix: Add aria-describedby for progress/archived restrictions

## G2-7-015-069  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:471-475 exact subtitle Health, setup and operating details for this workspace.
- vNext now: V/components/projects/project-workspace.tsx:178-193 summary subtitle dynamic
- Fix: Restore exact subtitle

## G2-7-015-070  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSummarySnapshot.jsx:77-109 Workspace health, Overall progress, Team/Tasks/Sprints/Target
- vNext now: V/components/projects/project-workspace.tsx:364-416 Tasks/Sprints/Releases/Final submission
- Fix: Restore metric names/empty strings

## G2-7-015-071  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:572-580 Workspace settings/Basic info
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:68-70 Edit workspace summary
- Fix: Restore Card title and section labels

## G2-7-015-073  [P2] GAP  facet F19  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:245-281 direct GET plus independent template/class choices fetch
- vNext now: V/components/projects/admin-project-section-page.tsx:38-47 aggregate 8 reads, class list fetch only when form opened
- Fix: Load core facts without unrelated reads and lazy-load dropdowns

## G2-7-015-074  [P2] MISSING  facet F19  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:171-187 remote template search request sequence avoids stale results
- vNext now: V/components/projects/project-workspace.tsx:178-210 no search/attach UI
- Fix: Implement stale-search suppression

## G2-7-015-075  [P2] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:316-358 touched-field-only with detailsToken protects stale edits
- vNext now: V/modules/projects/college-project-summary-service.ts:27-34 compares whole row and title/summary/status/updatedAt token
- Fix: Offer actionable optimistic conflict and dirty form rehydrate
