# Work packet: edit src/app/(authenticated)/mentor/projects/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u028-mentor-projects-list.md

## G2-7-028-026  [P1] GAP  facet F04  effort S
- Legacy: ProjectsContent.jsx:397-419 nextAction hidden when archived
- vNext now: mentor/projects/page.tsx:278 actionLine nextAction or Open workspace regardless of archived
- Fix: Suppress stale nextAction/action links on archived workspaces

## G2-7-028-063  [P1] GAP  facet F12  effort S
- Legacy: ProjectsContent.jsx:397-419 archived suppressed action nextAction
- vNext now: mentor/projects/page.tsx:278 may show stale action on archived
- Fix: Disable misleading unfinished-action line for archived

## G2-7-028-040  [P2] GAP  facet F07  effort S
- Legacy: mentor/projects/index.js:19-26 failed feature check Could not verify Projects access with Retry
- vNext now: mentor/projects/page.tsx:49-56 MentorProjectsUnavailable loadFailed, different title/text
- Fix: Restore feature error wording and Retry access check primary button

## G2-7-028-041  [P2] GAP  facet F07  effort M
- Legacy: ProjectsContent.jsx:205-209 invalid records array throws The projects page did not return a valid records array.
- vNext now: mentor/projects/page.tsx:74-81 service throws to route boundary, no validation error with this copy
- Fix: Display scoped data-format error with retry and safe user copy

## G2-7-028-042  [P2] GAP  facet F07  effort M
- Legacy: ProjectsContent.jsx:245-255 Projects could not be loaded / Check your connection, then try again. Your project data has not been changed.
- vNext now: mentor/projects/page.tsx:63-68 only filter ErrorState; DB read failure lacks local banner
- Fix: Create list-level retry with exact fallback and reassuring detail

## G2-7-028-043  [P2] GAP  facet F07  effort M
- Legacy: ProjectsContent.jsx:249-252 Couldn't refresh projects / Showing the last projects loaded for this view.
- vNext now: mentor/projects/page.tsx:74-81 server-only fetching with no last-good view
- Fix: Preserve cached current-scope view on failed refresh

## G2-7-028-045  [P2] GAP  facet F08  effort M
- Legacy: ProjectsContent.jsx:244 Refreshing projects… status
- vNext now: mentor/projects/page.tsx:74-81 server route no RefreshStatus visible
- Fix: Show inline refresh indicator during filter changes

## G2-7-028-046  [P2] GAP  facet F08  effort M
- Legacy: ProjectsContent.jsx:305-311 three shape-matched ProjectCardSkeleton when loading
- vNext now: mentor/projects/page.tsx:222-315 no list-specific card skeleton, global loader
- Fix: Render three card skeletons in legacy shape

## G2-7-028-048  [P2] GAP  facet F08  effort M
- Legacy: ProjectsContent.jsx:245-255 inline error/warning with Retry
- vNext now: mentor/projects/page.tsx:63-68 filter error, no explicit load error banner
- Fix: Restore retry action that preserves filters
