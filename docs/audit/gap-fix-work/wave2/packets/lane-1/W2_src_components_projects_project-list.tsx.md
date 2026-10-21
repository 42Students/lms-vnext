# Work packet (wave 2): edit src/components/projects/project-list.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u004-learner-projects.md, docs/audit/gap2/lane-7/u028-mentor-projects-list.md

## G2-15-004-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy one `learn-projects-detail__card` with compact inline filters, then card grid and centered pagination (ProjectsContent.jsx:258-305,425-444)
- vNext now: Desktop grid filter with bottom border, mobile collapsed filters, divided list and inline paginator (learn/projects/page.tsx:146-155,195-209; project-list.tsx:75-82)
- Fix: Clone legacy filter card, card-list and paginator alignment

## G2-15-004-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy next due says `No due date`, `Overdue · DATE`, `Due soon · DATE`, `Due DATE` (ProjectsContent.jsx:330-337)
- vNext now: Nearest incomplete task due with `Overdue`, `Due soon`, `Due date` variants, different concatenation (learner-project-due-service.ts:30-45; project-list.tsx:158-161)
- Fix: Reconcile due source and exact concatenated date text

## G2-15-004-018  [P2] GAP  facet F04  effort M
- Legacy: Legacy readiness tasks 0 => numeric manually reported progress; task fraction when >0 (ProjectsContent.jsx:378-393)
- vNext now: VNext shows `Not tracked` if missing, percent in KPI grid (learn/projects/page.tsx:173-179; project-list.tsx:145-154)
- Fix: Prove data-source precedence and reproduce fallback percentage

## G2-15-004-058  [P2] GAP  facet F18  effort M
- Legacy: Task completion caption + N/M tasks + manual estimate, or `Open blocked work` with actual blocker text (ProjectsContent.jsx:378-418)
- vNext now: Metric grid and generic `Open blocked work` omit blocker headline (learn/projects/page.tsx:173-183; project-list.tsx:130-169)
- Fix: Render legacy labels/actual blocker text and CTA separately

## G2-7-028-008  [P2] GAP  facet F02  effort M
- Legacy: ProjectsContent.jsx:305-424 grid of individual learn-projects-card buttons
- vNext now: project-list.tsx:75-83 vertically divided list rows on /mentor/projects
- Fix: Restore cards with border/radius/padding and grid behavior

## G2-7-028-015  [P2] GAP  facet F03  effort S
- Legacy: ProjectsContent.jsx:356-362 colored status/Needs review/Stalled tags
- vNext now: project-list.tsx:98-114 StatusBadge each attention tone warning, including Stalled
- Fix: Map Stalled red, Needs review gold, Blocked volcano, Archived gray

## G2-7-028-016  [P2] GAP  facet F03  effort M
- Legacy: ProjectsContent.jsx:363-370 project title and course • mentor and RightOutlined arrow
- vNext now: project-list.tsx:83-124 eyebrow Primary mentor, title and no mentorName passed from page
- Fix: Render course+mentor metadata and right chevron instead of upper eyebrow

## G2-7-028-017  [P2] GAP  facet F03  effort M
- Legacy: ProjectsContent.jsx:373-393 task Progress bar teal and phase/due metadata
- vNext now: project-list.tsx:118-161 metadata and Progress text only, no teal bar
- Fix: Restore progress bar and phase/due position

## G2-7-028-018  [P2] GAP  facet F03  effort S
- Legacy: ProjectsContent.jsx:396-419 Review submission/Open review, Open blocked work or Open workspace action line
- vNext now: project-list.tsx:162-169 blocked line/actionLine one phrase with arrow
- Fix: Render bold action plus secondary link separately as legacy

## G2-7-028-019  [P2] GAP  facet F04  effort M
- Legacy: ProjectsContent.jsx:365-368 fallback course Project, mentor Mentor
- vNext now: project-list.tsx:118-124 shows Project title if course missing; no mentorName from route
- Fix: Pass mentor name and exact fallback

## G2-7-028-020  [P2] GAP  facet F04  effort M
- Legacy: ProjectsContent.jsx:330-337 nextDue -> No due date / Overdue / Due soon / Due
- vNext now: mentor/projects/page.tsx:277-278 dueLabel/endDate passed, project-list.tsx:118-124 not dueState
- Fix: Use projectDueState and full visible legacy due condition

## G2-7-028-021  [P2] GAP  facet F04  effort S
- Legacy: ProjectsContent.jsx:375 phase fallback In progress
- vNext now: mentor/projects/page.tsx:275-278 phase; project-list.tsx:118-124 only rendered when present
- Fix: Render In progress fallback in phase line

## G2-7-028-022  [P2] GAP  facet F04  effort M
- Legacy: ProjectsContent.jsx:384-390 task completed/total number and fallback Manual estimate
- vNext now: mentor-project-work-model.ts:17-24 derives percent from tasks and says recorded tasks; project-list.tsx:130-153
- Fix: Match x/y tasks and manual progress fallback if no task data

## G2-7-028-025  [P2] GAP  facet F04  effort S
- Legacy: ProjectsContent.jsx:357 blocked status overrides ACTIVE, archived takes precedence
- vNext now: project-list.tsx:98-114 status ACTIVE and separate Blocked warning; page.tsx:285 adds Blocked
- Fix: Show primary Blocked status when blocker set, but Archived first

## G2-7-028-073  [P2] GAP  facet F16  effort M
- Legacy: ProjectsContent.jsx:305-424 grid/card learn-projects-card with chevron
- vNext now: project-list.tsx:75-81 vertical full-width dividers
- Fix: Restore responsive cards rather than list rows

## G2-7-028-081  [P2] GAP  facet F18  effort S
- Legacy: ProjectsContent.jsx:357-368 fallback status Active, project/mentor placeholder
- vNext now: project-list.tsx:99-124 normalized status and hidden mentor line when missing
- Fix: Match capitalization and fallback labels

## G2-7-028-082  [P2] GAP  facet F18  effort S
- Legacy: ProjectsContent.jsx:402-418 Open review/Open submission/Open blocked work/Open workspace
- vNext now: project-list.tsx:162-169 actionLine with arrow, not paired text
- Fix: Restore direct action wording and paired emphasis
