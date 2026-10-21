# Work packet: edit src/components/projects/project-mentor-reassignment.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-projects-workspaces-reassign-mentor.md, docs/audit/gap2/lane-7/u021-college-admin-mentor-reassignment.md

## G2-6-028-061  [P1] GAP  facet F19  effort M
- Legacy: Legacy faculty options use last-response-wins sequence token for async search (reassign-mentor.js:54-75).
- vNext now: vNext SSR prefetches first 100 mentors; client filters only those visible (project-admin-reassign-mentor-page.tsx:49-54,104-110; project-mentor-reassignment.tsx:78-90).
- Fix: Add server-backed typeahead/search pagination so eligible mentors beyond first100 selectable.

## G2-7-021-021  [P1] GAP  facet F04  effort M
- Legacy: reassign-mentor.js:269-284 result includes per-item failure messages and workspace names
- vNext now: project-mentor-reassignment.tsx:354-365 generic failure text despite response code
- Fix: Map safe failure code to actionable reason and project title

## G2-7-021-028  [P1] GAP  facet F05  effort M
- Legacy: reassign-mentor.js:336-339 row selection supports select all of current view
- vNext now: project-mentor-reassignment.tsx:191-207 Select all N matching capped at1000
- Fix: Explain cap, retain selection semantics for more than 1000 matched workspaces

## G2-7-021-033  [P1] GAP  facet F06  effort M
- Legacy: reassign-mentor.js:225-235 skip counted only if mentor ID AND normalized roleLabel equal
- vNext now: project-mentor-reassignment.tsx:70-75 skip counted by mentorMembershipId only
- Fix: Use role-label-aware skip calculation so role-change operation is not hidden

## G2-7-021-039  [P1] GAP  facet F07  effort M
- Legacy: reassign-mentor.js:281-285 per-item failure descriptions include workspace and original error
- vNext now: project-mentor-reassignment.tsx:355-365 generic could not reassign message
- Fix: Display safe structured per-item failure code and retry guidance

## G2-7-021-047  [P1] GAP  facet F10  effort L
- Legacy: AdminService.js:447-448 POST /api/v1/admin/projects/reassign-mentor/bulk payload collegeId, projectIds, mentorId, roleLabel
- vNext now: project-mentor-reassignment.tsx:128-146 POST /api/projects/reassign-mentor with mentorMembershipId chunks of100
- Fix: Document payload ID mapping and response aggregation/partial failures

## G2-7-021-057  [P1] GAP  facet F12  effort M
- Legacy: reassign-mentor.js:217-235 already-assigned no-op matches normalized role label
- vNext now: project-mentor-reassignment.tsx:70-75 checks mentor alone
- Fix: Correct front-end no-op test and preview counts for role-label change

## G2-7-021-068  [P1] GAP  facet F15  effort M
- Legacy: reassign-mentor.js:218-224 no-op prevents re-notifying unchanged mentor+role
- vNext now: project-mentor-reassignment.tsx:70-75 skip on mentor ID only
- Fix: Preserve notifications on role-label changes; no notification on exact no-op

## G2-7-021-085  [P1] GAP  facet F20  effort M
- Legacy: reassign-mentor.js:225-235 case-insensitive roleLabel and default Project Mentor for no-op
- vNext now: project-mentor-reassignment.tsx:52-53 default roleLabel, :70-75 mentor-only comparison
- Fix: Compare normalized role label and mentor ID together

## G2-7-021-038  [P2] GAP  facet F07  effort S
- Legacy: reassign-mentor.js:291-295 Reassignment failed / Failed to reassign mentor
- vNext now: project-mentor-reassignment.tsx:173-178 Mentor reassignment failed with longer text
- Fix: Use legacy fallback and show sanitized backend reason

## G2-7-021-041  [P2] GAP  facet F08  effort S
- Legacy: reassign-mentor.js:280-284 error modal title N reassignment(s) failed
- vNext now: project-mentor-reassignment.tsx:376-385 Some workspaces were not reassigned
- Fix: Show count-specific title and failure details

## G2-7-021-042  [P2] GAP  facet F08  effort S
- Legacy: reassign-mentor.js:498-508 closable inline result summary with skipped/failure count
- vNext now: project-mentor-reassignment.tsx:344-369 Last result section, no close
- Fix: Match alert summary counts and close action
