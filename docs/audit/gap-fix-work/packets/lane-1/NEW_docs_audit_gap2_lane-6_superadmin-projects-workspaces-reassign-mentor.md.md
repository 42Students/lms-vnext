# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/superadmin-projects-workspaces-reassign-mentor.md

10 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-projects-workspaces-reassign-mentor.md

## G2-6-028-013  [P1] GAP  facet F04  effort M
- Legacy: Workload groups projectMentorMember userId or Unassigned, counts and at-risk derived from fetched active projects (reassign-mentor.js:120-155).
- vNext now: DB count and atRisk per mentor membership using non-ARCHIVED non-COMPLETED workspaces (mentor-reassignment-workload-service.ts:72-95).
- Fix: Align active/completed inclusion and at-risk evaluator; define count denominator consistently.

## G2-6-028-044  [P1] GAP  facet F12  effort M
- Legacy: Legacy excludes archived status from project set, but workload includes completed non-archived projects (reassign-mentor.js:99-103,132-146).
- vNext now: vNext workload excludes ARCHIVED AND COMPLETED; workspace picker excludes ARCHIVED only (mentor-reassignment-workload-service.ts:88-92,104-107).
- Fix: Ensure workload and selectable-project denominators align; declare completed-state action policy.

## G2-6-028-045  [P1] GAP  facet F12  effort M
- Legacy: Legacy no-op compares mentor user ID AND roleLabel case-insensitively after blank-default to Project Mentor (reassign-mentor.js:208-226).
- vNext now: vNext UI skips any project with matching membership even if roleLabel differs (project-mentor-reassignment.tsx:70-74).
- Fix: Fetch current role label in matchingWorkspaces and only skip when membership AND normalized role label match.

## G2-6-028-026  [P2] GAP  facet F07  effort S
- Legacy: Legacy missing college displays No college selected / Pick a college in the header to reassign its mentors. (reassign-mentor.js:334-352).
- vNext now: vNext Select a college scope / Choose a college before reassigning project mentors. (admin/projects/reassign-mentor/page.tsx:24-37).
- Fix: Clone exact missing scope alert and retain group navigation.

## G2-6-028-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy faculty GET failure says Mentor options could not be loaded, Retry mentors (reassign-mentor.js:430).
- vNext now: vNext any of three reads rejects to full-page Mentor reassignment unavailable, retry page link (project-admin-reassign-mentor-page.tsx:51-65).
- Fix: Keep partial page visible; add separate mentor directory Retry mentors boundary.

## G2-6-028-028  [P2] GAP  facet F07  effort M
- Legacy: Legacy project load failure Workspaces could not be loaded with Retry button, retains sections (reassign-mentor.js:370-372).
- vNext now: vNext full-page Mentor reassignment unavailable with retry link (project-admin-reassign-mentor-page.tsx:56-65).
- Fix: Recreate inline workspaces error alert + retry without hiding all form sections.

## G2-6-028-029  [P2] GAP  facet F07  effort S
- Legacy: Legacy API returns BAD_REQUEST / FORBIDDEN / INTERNAL_SERVER_ERROR with exact Failed to reassign mentor message (AdminProjectController.java:475-496).
- vNext now: vNext route calls apiErrorResponse, typed error mapping (projects/reassign-mentor/route.ts:9-29).
- Fix: Map HTTP code and surface legacy exact failure copy in page error dialog.

## G2-6-028-032  [P2] GAP  facet F08  effort S
- Legacy: Legacy result alert Reassigned {N} to {mentor}, skipped {N}, {N} failed, closable (reassign-mentor.js:494-503).
- vNext now: vNext Last result section shows generic N reassigned/skipped/failed, not mentorName; no closable alert (project-mentor-reassignment.tsx:344-370).
- Fix: Match result alert title/name/counts and dismiss control.

## G2-6-028-030  [P3] GAP  facet F08  effort S
- Legacy: Legacy toast Reassigned {N} workspace(s) to {mentor}. and zero-change info toast (reassign-mentor.js:261-273).
- vNext now: vNext matches primary title but adds description and new generic failed/zero feedback (project-mentor-reassignment.tsx:148-168).
- Fix: Align toast duration, description absence, icon/placement and exact zero-change feedback.

## G2-6-028-031  [P3] GAP  facet F08  effort S
- Legacy: Legacy batch API status OK message Mentor reassignment processed (AdminProjectController.java:475-489).
- vNext now: vNext raw JSON result, no success envelope or message (projects/reassign-mentor/route.ts:20-26).
- Fix: Document API response shape and ensure user-visible feedback derives from per-row results.
