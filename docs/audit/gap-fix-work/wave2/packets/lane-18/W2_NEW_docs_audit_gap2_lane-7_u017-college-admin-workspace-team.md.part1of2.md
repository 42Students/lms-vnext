# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u017-college-admin-workspace-team.md (part 1 of 2)

40 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u017-college-admin-workspace-team.md

## G2-7-017-001  [P2] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:62-66,295-315 workspace Team route, Projects menu and AdminWorkspaceShell
- vNext now: V/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx:1-16 redirects to /college/projects/:id/team
- Fix: Preserve slug bookmark/context query and active tab

## G2-7-017-002  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:298-305 subtitle Manage mentor ownership, student membership and workload across this workspace.
- vNext now: V/components/projects/project-workspace.tsx:178-193 project.summary rendered instead of tab subtitle
- Fix: Restore exact Team page subtitle

## G2-7-017-003  [P2] GAP  facet F01  effort M
- Legacy: LFE/components/admin/AdminWorkspaceShell.jsx:10-28 contextual Back, breadcrumb and tabs
- vNext now: V/components/projects/project-workspace.tsx:320-335 no breadcrumb with sectionBaseHref
- Fix: Restore workspace breadcrumb and From navigation

## G2-7-017-004  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:348-355 link Use the bulk Reassign Mentor page
- vNext now: V/components/projects/project-workspace.tsx:695-700 Reassign mentor link and a separate modal button
- Fix: Retain descriptive bulk link in modal, avoid duplicate header controls

## G2-7-017-008  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:302-315 header buttons Reassign mentor… and Manage students… with icons, disabled if archived
- vNext now: V/components/projects/project-workspace.tsx:693-707 Reassign mentor (link + dialog button), Manage students and Add teammate
- Fix: Match header action count/icon/ellipsis and archived disabled states

## G2-7-017-009  [P2] MISSING  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:56-62 eyebrow Team at a glance, headline Ownership and workload in one view and explanatory paragraph
- vNext now: V/components/projects/project-workspace.tsx:685-691 Project people heading, admin no help paragraph
- Fix: Restore copy and visual hierarchy

## G2-7-017-010  [P2] MISSING  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:35-49 metric labels Primary mentor, Students, Supporting faculty, Task coverage
- vNext now: V/components/projects/project-workspace.tsx:682-800 only member count on mentor mode and member cards
- Fix: Add all four metrics

## G2-7-017-011  [P2] MISSING  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:95-100 Team roster (N) heading and Search, filter and compare task activity helper
- vNext now: V/components/projects/project-workspace.tsx:732-799 no roster header/helper
- Fix: Restore roster title and helper

## G2-7-017-013  [P2] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:17-22 counts LEARNER vs FACULTY via userType
- vNext now: V/db/schema/projects.ts:652-655 normalized LEARNER/MENTOR role and CO_MENTOR roleKind
- Fix: Map userType faculty to mentor/co-mentor for metric aggregation

## G2-7-017-015  [P2] GAP  facet F04  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:33-48 supporting faculty = faculty count minus primary mentor, no students => No students yet
- vNext now: V/components/projects/project-workspace.tsx:757-783 lists roles only, no supporting faculty metric
- Fix: Calculate supporting count and no-students fallback

## G2-7-017-017  [P2] GAP  facet F04  effort S
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:79-86 member name fallbacks name/fullName/displayName/userName/mobile then em dash
- vNext now: V/components/projects/project-workspace.tsx:764-771 displayName or Unnamed member
- Fix: Match fallback/empty placeholders without exposing private contact

## G2-7-017-018  [P2] GAP  facet F04  effort S
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:121-129 last update formatTimestamp supports UTC-naive and Jackson array
- vNext now: V/components/projects/project-workspace.tsx:757-799 no per-member last task update
- Fix: Restore IST timestamp and em dash if absent

## G2-7-017-022  [P2] GAP  facet F05  effort M
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:90-102 table horizontally scrolls max-content on mobile
- vNext now: V/components/projects/project-workspace.tsx:732-799 responsive 2/3-column cards
- Fix: Restore table responsiveness or equivalent density

## G2-7-017-023  [P2] MISSING  facet F05  effort S
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:110-129 faculty assigned count shown dash, unassigned learner orange None, progress triple separated dots
- vNext now: V/components/projects/project-workspace.tsx:757-799 no counters or orange None badge
- Fix: Restore row-level counts and empty treatment

## G2-7-017-024  [P2] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:325-354 Reassign mentor modal searchable faculty Select required, roleLabel optional
- vNext now: V/components/projects/college-project-mentor-dialog.tsx:69-90 separate Search input+button and Select plus roleLabel max120
- Fix: Match search-select input, field labels and selected option preservation

## G2-7-017-026  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:329-350 modal Assign and roleLabel placeholder Project Mentor
- vNext now: V/components/projects/college-project-mentor-dialog.tsx:88-99 roleLabel same default and Confirm reassignment
- Fix: Match exact call to action and field placeholder

## G2-7-017-028  [P2] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:399-445 multi-select Students required, maxCount500, remote name search, role label Project Contributor
- vNext now: V/components/projects/college-project-student-roster-dialog.tsx:89-110 checkboxes with search limit20, roleLabel 120 without placeholder
- Fix: Restore search and role label placeholder, make large selections reachable

## G2-7-017-040  [P2] GAP  facet F09  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:83-119 exclusive mentor/student modals, Escape collapses open Select first
- vNext now: V/components/projects/project-workspace.tsx:693-707 separate independent CollegeProjectMentorDialog and CollegeProjectStudentRosterDialog
- Fix: Prevent stacked dialog activation; verify Escape/focus priority

## G2-7-017-042  [P2] GAP  facet F09  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:319-352 Reassign mentor warning embedded and link to bulk page
- vNext now: V/components/projects/college-project-mentor-dialog.tsx:69-99 distinct dialog, no bulk link
- Fix: Add bulk link and exact consequence summary

## G2-7-017-043  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:186-208 faculty/learner options concurrent GET by college, search route
- vNext now: V/components/projects/college-project-mentor-dialog.tsx:32-42 member-candidates role=MENTOR limit20 and roster-dialog.tsx:37-60 learner candidates limit20
- Fix: Match candidate selection on large colleges and server-side search behavior

## G2-7-017-044  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:234-250 assignProjectMentor POST project+mentorId+collegeId+roleLabel
- vNext now: V/components/projects/college-project-mentor-dialog.tsx:44-52 POST /api/projects/reassign-mentor collegeId, projectIds, mentorMembershipId, roleLabel
- Fix: Map legacy mentor identity and payload semantics, including response statuses

## G2-7-017-048  [P2] GAP  facet F11  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:288-294 missing-college warning within shell, disabled/archive controls
- vNext now: V/components/projects/admin-project-section-page.tsx:38-42 authorization before shell; ProjectWorkspace:260-261 readOnly flag
- Fix: Preserve no-college warning and archive state UI

## G2-7-017-054  [P2] GAP  facet F12  effort M
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:23-49 coverage formula distinct assigned learners/total students
- vNext now: V/components/projects/project-workspace.tsx:757-799 no coverage metric, normalized task assigneeMemberId
- Fix: Rebuild metric on active learner membership IDs

## G2-7-017-055  [P2] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:135-185 request sequence guard prevents stale faculty/learner search results
- vNext now: V/components/projects/college-project-mentor-dialog.tsx:32-42 searching bool, no request sequence; earlier queries can race after search changes
- Fix: Abort/stamp remote candidate searches and retain selected option text

## G2-7-017-056  [P2] GAP  facet F13  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:454-481 six-row Skeleton/error Retry/not-found
- vNext now: V/app/(authenticated)/college/projects/[projectId]/[section]/loading.tsx:1-10 generic directory load
- Fix: Restore Team loading/error/not-found states

## G2-7-017-057  [P2] MISSING  facet F13  effort S
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:87 No members yet, 103 No members match these filters
- vNext now: V/components/projects/project-workspace.tsx:757-799 empty members renders empty grid
- Fix: Show distinct no-members and no-filter-matches states

## G2-7-017-059  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:184-208 failure to load selection options shows Failed to load mentor/learner options
- vNext now: V/components/projects/college-project-mentor-dialog.tsx:39-42 error Could not load mentors; roster-dialog.tsx:49-60 specific learner failures
- Fix: Restore consistent aggregate option error or retain two explicit failures

## G2-7-017-063  [P2] GAP  facet F16  effort M
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:53-100 responsive Card+metric grid and roster table
- vNext now: V/components/projects/project-workspace.tsx:732-799 1/2/3-col member cards
- Fix: Match legacy desktop density and phone horizontal table scroll

## G2-7-017-064  [P2] GAP  facet F16  effort M
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:97-103 roster Table scroll max-content on narrow screens
- vNext now: V/components/projects/project-workspace.tsx:732-799 cards, no wide-table scroll
- Fix: Restore scrollable table for mobile and tablet

## G2-7-017-065  [P2] GAP  facet F16  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:359-453 searchable Select multi-chip UX
- vNext now: V/components/projects/college-project-student-roster-dialog.tsx:97-105 scrollable checkbox list max-height64
- Fix: Test 500-person selection ergonomics and keyboard/touch

## G2-7-017-066  [P2] MISSING  facet F17  effort S
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:90-95 search aria-label and type filter aria-label
- vNext now: V/components/projects/project-workspace.tsx:732-799 no roster input/filters
- Fix: Add labelled accessible search/type filter

## G2-7-017-067  [P2] GAP  facet F17  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:100-119 select Escape handling protects dialog draft state
- vNext now: V/components/projects/college-project-student-roster-dialog.tsx:84-123 Dialog/ConfirmDialog no explicit nested Escape prioritization
- Fix: Ensure first Escape closes popup not whole form, focus returns to trigger

## G2-7-017-068  [P2] GAP  facet F17  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:399-431 AntD multiple Select label Students and exact validation errors
- vNext now: V/components/projects/college-project-student-roster-dialog.tsx:97-106 fieldset/checkbox and global error
- Fix: Associate errors with fieldset and focus invalid selection

## G2-7-017-069  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:300-315 Reassign mentor… Manage students… exact ellipsis
- vNext now: V/components/projects/project-workspace.tsx:693-707 Reassign mentor, Manage students, Add teammate
- Fix: Align action names and counts

## G2-7-017-070  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:56-62 Team at a glance, Ownership and workload in one view, roster help
- vNext now: V/components/projects/project-workspace.tsx:685-691 Project people
- Fix: Restore heading and explanatory copy

## G2-7-017-071  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:78-100 No primary mentor assigned, Team roster (N), Search filter and compare task activity
- vNext now: V/components/projects/project-workspace.tsx:711-799 admin has no warning/roster heading
- Fix: Restore exact strings

## G2-7-017-072  [P2] MISSING  facet F18  effort S
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:90-95 Search member name or ID, All members, Learners, Faculty
- vNext now: V/components/projects/project-workspace.tsx:732-799 no search/filter UI
- Fix: Restore placeholders and option labels

## G2-7-017-074  [P2] GAP  facet F19  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:186-208 loads every faculty and learner candidate once, then server search queries
- vNext now: V/components/projects/college-project-student-roster-dialog.tsx:40-43 fetch first 20, find more by query
- Fix: Ensure candidate search covers all students not just first 20

## G2-7-017-075  [P2] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:132-185 selected candidate labels merged across search and sequence stamps drop stale responses
- vNext now: V/components/projects/college-project-student-roster-dialog.tsx:46-59 merges candidate by membershipId but no request sequence stamp
- Fix: Use latest-request wins for mentor and learner searches

## G2-7-017-078  [P2] GAP  facet F21  effort M
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:149-166 team group reconciliation invokes backend sync
- vNext now: V/components/projects/project-workspace.tsx:725-730 read-only group notice, no reconciliation action
- Fix: Restore server reconciliation workflow with audit and retry
