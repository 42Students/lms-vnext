# Project workspace export breaker coverage — chat-19

2026-10-18 · branch `chatgpt/chat-19-b`. Owner scope: unowned IIT Dharwad Projects user-visible exports. This is source + authored test evidence, not a cloud CI or database certificate.

| Gap ID | Export / entry point | Behavioral test | Valid, malformed, boundary and adverse state coverage |
|---|---|---|---|
| PROJ-BREAK-EXPORT-01 | `src/modules/projects/admin-workspace-page-export-model.ts` — `projectWorkspaceCsvCell` | `tests/unit/PROJ-BREAK-chat19-project-workspace-csv.test.ts` | Unicode BOM/format/paragraph/newline prefixes, CSV quote doubling, negative number preserved as numeric, string formula negative neutralized |
| PROJ-BREAK-EXPORT-01 | same — `projectWorkspacePageCsv` | same test | Only the supplied authorized visible page included, header matches export, status label generated, time shown at IST midnight boundary, zero visible workspaces yields headings only |
| PROJ-BREAK-EXPORT-02 | `src/components/projects/project-admin-workspace-page-export.tsx` — `ProjectAdminWorkspacePageExport` | `tests/unit/PROJ-BREAK-chat19-project-workspace-export-ui.test.tsx` | Actual SSR disabled zero rows vs allowed visible rows, 44px button, no platform-wide export link |

## Security boundary and remaining integration verification

The owning college page constructs `items` only from `listProjectAdminSnapshots(context, collegeId, query)`, which independently checks `projects.manage` and filters persisted projects by `collegeId`. `getProjectAdminCollegeId(context)` forbids unscoped SA fallback. The export component performs **no additional query** and cannot retrieve projects absent from those authorized props. A request to export all workspaces should **not** silently increase the data scope.

Explicitly outstanding: PostgreSQL persisted-role revocation races; all-college vs active-college denial at the service boundary; browser download/blob/CSP behavior; cross-spreadsheet real import; 320/360/390px visual checks. Other lanes own the Projects overall ledger; this lane's independent tests are supplementary and are not counted as full service/export integration.

## IIT Dharwad Projects state-machine and authorization breaker additions

| Gap ID | Export / state | Behavioral evidence | Cases and result |
|---|---|---|---|
| PROJ-BREAK-TEAM-PREVIEW-01 | `previewClassTeams`, `movePreviewMember`, `teamSplitInputSchema` in `class-team-split-model.ts` | `tests/unit/PROJ-BREAK-chat19-team-preview-integrity.test.ts` | Deterministic roster split, same-team no-op, invalid target and membership, immutable valid move, deny leaving empty team (source defect fixed) |
| PROJ-BREAK-TEAM-PREVIEW-01 | `verifyClassTeamPreview`, `classTeamPreviewSchema` in `class-team-preview-validation.ts` | Same test | Missing learner, duplicate membership, unknown ID, hidden payload keys, Unicode-NFKC duplicate names, empty groups, wrong roster |
| PROJ-BREAK-TEAM-PREVIEW-01 | `previewVersion`, `assertPreviewVersion`, `previewVersionSchema` | Same test | Stale preview version denied, malformed signature denied, valid version allowed |
| PROJ-BREAK-COLLEGE-LOCK-01 | `mayRecordCollegeAdminDeliveryLock` in `admin-submission-lock-policy.ts` | `tests/unit/PROJ-BREAK-chat19-admin-delivery-lock-role.test.ts` | Exact active College Admin membership; cross-college/org, suspended, disabled, TPO/learner, recruiter, SA acting-tenant denied |

| PROJ-BREAK-ROSTER-SNAPSHOT-01 | `classRosterSnapshotSchema`, `assertRosterStillCurrent` in `class-team-roster-snapshot.ts`; `classRosterRevision` in `class-team-roster-service.ts` | `tests/unit/PROJ-BREAK-chat19-roster-snapshot-staleness.test.ts` | Same college/class valid snapshot, changed member/roll/version, wrong tenant, duplicated membership, forged role and empty roster; deterministic revision |

PostgreSQL concurrent team creation, persisted membership revocation and live browser planner drag-and-drop remain separate integration gates.

## Additional unowned IIT Dharwad Projects pure-model breaker coverage

| Gap | Export / source | Direct test | Cases |
|---|---|---|---|
| PROJ-BREAK-MENTOR-MEETING-01 | `maySaveMentorMeetingStatus`, `mentorScheduleStatusFromMeeting` in `mentor-meeting-status-model.ts`; `mentorMeetingDisplayStatus` in `mentor-meeting-display-status.ts` | `tests/unit/PROJ-BREAK-chat19-mentor-meeting-state.test.ts` | Allowed/forbidden state-transition matrix, exact end instant, persisted versus derived MISSED, terminal completed/cancelled states |
| PROJ-BREAK-BRIEF-01 | `workspaceBriefSchema`, `updateWorkspaceBriefSchema`, `parseWorkspaceBrief` in `workspace-brief-model.ts` | `tests/unit/PROJ-BREAK-chat19-workspace-brief-and-comment-kinds.test.ts` | Strict property limits, malformed CAS tokens, timezone-aware token, independent empty fallback per request/tenant |
| PROJ-BREAK-BRIEF-01 | `PROJECT_TASK_COMMENT_KINDS`, `PROJECT_TASK_COMMENT_KIND_LABELS`, `projectTaskCommentKindLabel` in `task-comment-kind-staged.ts` | Same test | Persisted taxonomy, exact label mapping, unknown comment kinds excluded |

These plug direct behavioral test gaps in the previous generated weak-areas snapshot. They are not substitutes for real database mutations, authorization, concurrency, browser or user acceptance.
