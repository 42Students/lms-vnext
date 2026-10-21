# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u014-college-admin-workspace-sprints.md (part 1 of 2)

40 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u014-college-admin-workspace-sprints.md

## G2-7-014-001  [P2] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:20-28,143-149 route `/college-admin/projects/workspaces/:slug/sprints`, Projects active menu
- vNext now: V/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx:1-16 redirects `/college/projects/:id/sprints`
- Fix: Preserve slug aliases and query context for bookmarks

## G2-7-014-002  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:145-149 exact subtitle `Plan sprint outcomes, release alignment and delivery cadence for this workspace.`
- vNext now: V/components/projects/project-workspace.tsx:178-193 PageHeader subtitle project.summary and Resources/Execution heading
- Fix: Restore exact tab-specific subtitle

## G2-7-014-003  [P2] GAP  facet F01  effort M
- Legacy: LFE/components/admin/AdminWorkspaceShell.jsx:11-27 full workspace breadcrumbs, contextual Back and tab nav
- vNext now: V/components/projects/project-workspace.tsx:320-335 no breadcrumb when sectionBaseHref supplied
- Fix: Render breadcrumb and selected tab in same order

## G2-7-014-005  [P2] MISSING  facet F02  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:45-52 summary counters before editor
- vNext now: V/components/projects/project-workspace.tsx:833-876 per-release status/rollup but no four-counter summary
- Fix: Recreate Total sprints, Active, Completed, Releases available strip

## G2-7-014-006  [P2] GAP  facet F02  effort M
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:54-79 release status Alert before form
- vNext now: V/components/projects/project-workspace.tsx:816-826 empty no-sprints notice; no release-fetch loading/retry info alert
- Fix: Restore independent release state messaging and retry

## G2-7-014-008  [P2] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:25-30 metrics Total sprints, Active, Completed, Releases available
- vNext now: V/components/projects/project-workspace.tsx:833-877 calculates per-release completion and roadmap but lacks full strip
- Fix: Restore four exact metric labels and totals

## G2-7-014-009  [P2] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:36-42 Delivery cadence heading, descriptive line, scan rows hint
- vNext now: V/components/projects/project-workspace.tsx:804-811 `Execution` heading and short description
- Fix: Match all intro text from WorkspaceSprintsEditor

## G2-7-014-011  [P2] GAP  facet F03  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:115-139 collapsed row heading, move up/down and remove icons
- vNext now: V/components/projects/project-workspace.tsx:906-997 expanded release/sprint cards with Edit/Delete/Start/Complete
- Fix: Provide equivalent row move/remove affordances

## G2-7-014-012  [P2] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:7-10,25-30 ACTIVE and COMPLETED counted via `sprintState` uppercasing with PLANNED fallback
- vNext now: V/components/projects/project-workspace.tsx:866-869,941-944 counts status COMPLETED; sprint data in projectSprints.status
- Fix: Validate sprintState/status mapping for parity, preserve count on legacy imports

## G2-7-014-013  [P2] MISSING  facet F04  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:25-30 releases available = releases option count
- vNext now: V/components/projects/project-workspace.tsx:851-900 releases shown as cards, no available release count
- Fix: Compute all options count even if sprint list empty

## G2-7-014-017  [P2] GAP  facet F05  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:96-119 list of sprints in workspace order, <=12 rows expanded
- vNext now: V/components/projects/project-workspace.tsx:851-918 groups by release then sequence; sprint cards not flat
- Fix: Preserve legacy ordering or map deterministic group-sort with stable IDs

## G2-7-014-018  [P2] MISSING  facet F05  effort S
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:98-103 >12 search field and `Showing n of m items`
- vNext now: V/components/projects/project-workspace.tsx:851-1000 release/sprint cards no search
- Fix: Add resource-like targeted sprint search for large workspaces

## G2-7-014-020  [P2] GAP  facet F05  effort M
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:87-95 dynamic release Select backed by releaseOptions
- vNext now: V/components/projects/mentor-sprint-write.tsx:90-98 release Select only unshipped, tied to selected card
- Fix: Match release candidate count and disabled/shipped rules

## G2-7-014-021  [P2] GAP  facet F05  effort S
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:114-118 toggles collapse/expand, row heading `Sprint N` fallback
- vNext now: V/components/projects/project-workspace.tsx:915-928 sprint titled row with no collapse toggles
- Fix: Keep collapsed-row behavior for long sprint lists

## G2-7-014-022  [P2] GAP  facet F06  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:26-34 Title required, example `e.g. Kickoff & planning`, optional key, dueLabel `e.g. Week 2`
- vNext now: V/components/projects/mentor-sprint-write.tsx:94-110 title maxlength200, no key/dueLabel/legacy placeholders
- Fix: Restore exact labels, example and dueLabel field

## G2-7-014-023  [P2] GAP  facet F06  effort S
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:33-35 goal single-line text `Sprint goal (optional)`
- vNext now: V/components/projects/mentor-sprint-write.tsx:109-115 Sprint goal textarea maxlength4000
- Fix: Align type, required/default and placeholder

## G2-7-014-024  [P2] GAP  facet F06  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:82-89 releaseKey select required placeholder `Pick the release this sprint ships in`
- vNext now: V/components/projects/mentor-sprint-write.tsx:91-99 Ships in release select auto-prefilled first unshipped
- Fix: Match explicit release selection/default rules and placeholder

## G2-7-014-025  [P2] GAP  facet F06  effort S
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:65-72 description textarea acceptance criteria placeholder
- vNext now: V/components/projects/mentor-sprint-write.tsx:103-115 description separate from definitionOfDone; no matching acceptance criteria placeholder
- Fix: Map acceptance criteria/DoD and exact placeholder

## G2-7-014-026  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:90-93 untouched Save emits `No changes to save`
- vNext now: V/components/projects/mentor-sprint-write.tsx:42-82 creates new sprint only, details edit changed guard has no same info toast
- Fix: Restore untouched-save toast with no write

## G2-7-014-035  [P2] GAP  facet F09  effort M
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:81-103 inline form with no modal on add/save
- vNext now: V/components/projects/mentor-sprint-write.tsx:79-143 Create sprint dialog and discard confirmation
- Fix: Preserve in-page editor or document modal-only deviation

## G2-7-014-037  [P2] GAP  facet F09  effort M
- Legacy: LFE/components/admin/projects/useUnsavedFormGuard.js:31-61 exact confirm on route `You have unsaved changes. Leave without saving them?`
- vNext now: V/components/projects/mentor-sprint-write.tsx:130-143 confirmation title `Discard sprint changes?`
- Fix: Align dirty-navigation UX and copy

## G2-7-014-038  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:28-34 admin workspace GET populates JSON sprint array
- vNext now: V/modules/projects/workspace-view-service.ts:33-67 normalized instance/release/sprint view built via multiple service calls
- Fix: Map raw/merged template sprint fields to normalized rows

## G2-7-014-039  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:47-71 independent getProjectReleases(workspaceId,collegeId), retry key
- vNext now: V/components/projects/admin-project-section-page.tsx:38-47 loads aggregate that includes releases; no separate retry
- Fix: Separate release read failure from workspace failure

## G2-7-014-042  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:105-110 only sprints section serialized, token checked
- vNext now: V/modules/projects/mentor-sprint-write-service.ts:20-87 per-row transactional insert with project locks
- Fix: Document different stale/partial save guarantees and surface conflict UI

## G2-7-014-043  [P2] GAP  facet F11  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:25,125-140 missing-college warning inside shell
- vNext now: V/components/projects/admin-project-section-page.tsx:38-42 requireProjectManageAccess before rendering shell
- Fix: Restore recoverable missing-college warning

## G2-7-014-045  [P2] GAP  facet F11  effort M
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:81-103 college admin can edit sprint plan with release options
- vNext now: V/components/projects/project-workspace.tsx:884-997 mode ADMIN can add/edit/transition via shared mentor controls unless read-only
- Fix: Verify College Admin lifecycle authorization for every transition against legacy

## G2-7-014-049  [P2] GAP  facet F12  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:250-276 cap 500 with exact count error
- vNext now: V/modules/projects/mentor-sprint-write-model.ts:1-26 per-sprint schema; no 500 row batch limit
- Fix: Define max number of sprints per project and handle legacy >500

## G2-7-014-051  [P2] GAP  facet F13  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:150-171 six-row skeleton, error+Retry, not-found warning
- vNext now: V/app/(authenticated)/college/projects/[projectId]/[section]/loading.tsx:1-10 generic directory loading
- Fix: Add sprints-specific skeleton and retryable server error

## G2-7-014-052  [P2] GAP  facet F13  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:71-78 warning `No releases on this project yet` with explanation
- vNext now: V/components/projects/project-workspace.tsx:816-826 `No sprints yet` guidance but not exact no-release warning
- Fix: Restore no-releases banner

## G2-7-014-053  [P2] GAP  facet F13  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:93 `No sprints yet. Add the first sprint when a release is ready.`
- vNext now: V/components/projects/project-workspace.tsx:816-827 `No sprints yet` plus different description
- Fix: Restore exact empty sentence

## G2-7-014-059  [P2] GAP  facet F16  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:140-169 xs=24 md=12 for half fields, others full
- vNext now: V/components/projects/mentor-sprint-write.tsx:90-127 mostly full-width dialog fields
- Fix: Rebuild two-column release/key layout

## G2-7-014-060  [P2] GAP  facet F17  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:116-138 aria-expanded and labelled Move up/down/delete
- vNext now: V/components/projects/project-workspace.tsx:906-997 icon+text action controls without direct reorder
- Fix: Restore keyboard-accessible order and expanded state

## G2-7-014-061  [P2] GAP  facet F17  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:229-236,250-276 inline required labels/errors `Item N`
- vNext now: V/components/projects/mentor-sprint-write.tsx:65-76 disabled Create and aggregate error toast
- Fix: Expose per-field validation and screen reader error focus

## G2-7-014-062  [P2] GAP  facet F17  effort M
- Legacy: LFE/components/admin/projects/useUnsavedFormGuard.js:31-61 warns on keyboard browser/back and in-app tabs
- vNext now: V/components/projects/mentor-sprint-write.tsx:36-37 dialog guard, not persistent page editing
- Fix: Protect changed multirow plan across tabs

## G2-7-014-063  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:148 subtitle exact cadence text
- vNext now: V/components/projects/project-workspace.tsx:804-811 `Release and sprint execution records.`
- Fix: Restore exact page subtitle

## G2-7-014-064  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:33-42 `Sprint plan`, `Delivery cadence`, outcome-focused helper
- vNext now: V/components/projects/project-workspace.tsx:804-811 `Execution`
- Fix: Restore exact introduction text

## G2-7-014-065  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:54-79 three exact loading/error/no-releases messages
- vNext now: V/components/projects/project-workspace.tsx:816-826 different no-sprints text
- Fix: Restore exact state copy

## G2-7-014-066  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:93-100 `Add sprint`, `Save sprint plan`, `Only this workspace’s sprint plan is updated.`
- vNext now: V/components/projects/mentor-sprint-write.tsx:88-97 `Add sprint`, modal `Confirm create`
- Fix: Restore save footer/action copy

## G2-7-014-067  [P2] GAP  facet F19  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:98-103 search appears above 12, no virtualization; max500 rows
- vNext now: V/components/projects/project-workspace.tsx:851-1000 entire release/sprint hierarchy rendered no pagination
- Fix: Add bounded list/search or maintain >12 expand/filter behavior

## G2-7-014-068  [P2] GAP  facet F19  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:28-34 one workspace fetch plus separate releases call
- vNext now: V/modules/projects/workspace-view-service.ts:37-67 eight related reads even when only sprints requested
- Fix: Defer unrelated reads, benchmark 500+ sprint/task workspaces
