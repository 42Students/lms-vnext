# Work packet: edit src/modules/projects/mentor-attention.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u026-mentor-notifications.md, docs/audit/gap2/lane-7/u028-mentor-projects-list.md

## G2-7-026-022  [P1] GAP  facet F04  effort M
- Legacy: notifications.js:341-345 sortKey priority and timestamp order
- vNext now: mentor-attention.ts:80 sorts by occurredAt desc independent of kind; mentor/notifications/page.tsx:129-185 separate sections
- Fix: Preserve legacy announcement-review-request-stalled-upcoming priority ordering

## G2-7-026-052  [P1] GAP  facet F12  effort L
- Legacy: notifications.js:27-34 reviewStatus submitted OR under review, reject stale reopen if submittedAt <= reviewedAt
- vNext now: mentor-attention.ts:35-43 only submission.status SUBMITTED with submittedAt
- Fix: Compare reviewedAt and submission version so reopen is not a fresh review and under review is retained

## G2-7-026-080  [P1] GAP  facet F20  effort M
- Legacy: notifications.js:21-34 stale review reopened should not notify mentor if submission precedes review
- vNext now: mentor-attention.ts:35-43 only current SUBMITTED state and no reviewedAt compare
- Fix: Add version/review timestamp test for reopened deliveries

## G2-7-028-023  [P1] GAP  facet F04  effort M
- Legacy: ProjectsContent.jsx:317-324 Needs review based on submittedAt > reviewedAt
- vNext now: mentor-attention.ts:35-43 only SUBMITTED status and timestamp; page.tsx:98-103 labels Needs review
- Fix: Prevent self-reopen false review flag and include under-review fresh submissions

## G2-7-028-024  [P1] GAP  facet F04  effort M
- Legacy: ProjectsContent.jsx:64-90 Stalled suppressed when blocked text and no activity signal
- vNext now: mentor-attention.ts:45-57 last projectUpdatedAt fallback and PLANNED/ACTIVE
- Fix: Exclude blocker and verify recorded lastActivityAt fallback before stalled badge

## G2-7-028-059  [P1] GAP  facet F12  effort L
- Legacy: ProjectsContent.jsx:55-61 reviewStatus submitted or under review only if new submittedAt>reviewedAt
- vNext now: mentor-attention.ts:35-43 SUBMITTED with submittedAt, no compare reviewedAt
- Fix: Implement version/timestamp-based reviewed detection

## G2-7-028-060  [P1] GAP  facet F12  effort M
- Legacy: ProjectsContent.jsx:64-90 stalled after7d, exclude blocker, completed, archived and missing timestamp
- vNext now: mentor-attention.ts:45-58 uses lastActivity or projectUpdatedAt, PLANNED/ACTIVE
- Fix: Align blocker suppression and no-data behavior

## G2-7-028-071  [P1] GAP  facet F15  effort M
- Legacy: ProjectsContent.jsx:55-61 false needs-review on own reopen explicitly suppressed
- vNext now: mentor-attention.ts:35-43 lacks review timestamp comparison
- Fix: Avoid misleading Needs review signal to mentor and duplicate reminder

## G2-7-028-094  [P1] GAP  facet F22  effort L
- Legacy: ProjectsContent.jsx:55-61 resolvedDelivery reviewStatus/submittedAt/reviewedAt nested
- vNext now: mentor-attention.ts:35-43 project submission status and timestamp only
- Fix: Map review history fields, event versions and CAS status for list badge
