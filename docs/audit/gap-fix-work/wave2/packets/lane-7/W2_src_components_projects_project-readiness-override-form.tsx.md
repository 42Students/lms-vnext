# Work packet (wave 2): edit src/components/projects/project-readiness-override-form.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u032-superadmin-readiness.md

## G2-7-032-014  [P2] GAP  facet F03  effort M
- Legacy: readiness/index.js:657-674 Override state segmented Radio.Button choices
- vNext now: project-readiness-override-form.tsx:79-96 native Select including CLEAR always
- Fix: Match segmented three-option state with Clear only when override active

## G2-7-032-027  [P2] GAP  facet F06  effort S
- Legacy: readiness/index.js:671-672 Clear only shown for active override
- vNext now: project-readiness-override-form.tsx:93-95 Clear always shown
- Fix: Hide Clear on never-overridden workspace

## G2-7-032-028  [P2] GAP  facet F06  effort S
- Legacy: readiness/index.js:660-667 switching direction wipes old note unless same or clear
- vNext now: project-readiness-override-form.tsx:86-90 wipes note on every state change
- Fix: Preserve note for same state and Clear; wipe on opposite direction only

## G2-7-032-029  [P2] GAP  facet F06  effort S
- Legacy: readiness/index.js:685-697 Note required except clear, max2000, three rows, showCount
- vNext now: project-readiness-override-form.tsx:98-114 max2000 three rows required but no count
- Fix: Restore live character counter and exact helper copy

## G2-7-032-030  [P2] GAP  facet F06  effort S
- Legacy: readiness/index.js:643-654 warning on submission that override has no effect
- vNext now: project-readiness-override-form.tsx:74-78 short warning without full resubmit steps
- Fix: Restore full guidance and mentor/admin follow-up route

## G2-7-032-031  [P2] GAP  facet F06  effort M
- Legacy: readiness/index.js:638-721 form lives under selected workspace in same page
- vNext now: project-readiness-override-form.tsx:69-134 only on detail route
- Fix: Place or link same workflow with matching dirty context

## G2-7-032-040  [P2] GAP  facet F09  effort S
- Legacy: readiness/index.js:703-717 Popconfirm title Apply this readiness override? and immediate-submit impact
- vNext now: project-readiness-override-form.tsx:121-133 full ConfirmDialog uses same copy.applyConfirm but different description
- Fix: Match popconfirm placement and impact warning wording

## G2-7-032-041  [P2] GAP  facet F09  effort M
- Legacy: readiness/index.js:656-701 segmented radio and conditional Note within Manual override Card
- vNext now: project-readiness-override-form.tsx:69-119 plain select with conditional textarea
- Fix: Restore labeled radio group and tooltip text

## G2-7-032-049  [P2] GAP  facet F12  effort S
- Legacy: readiness/index.js:638-654 warning when submission makes override ineffective
- vNext now: project-readiness-override-form.tsx:74-78 short warning
- Fix: Match complete explanatory warning

## G2-7-032-064  [P2] GAP  facet F17  effort M
- Legacy: readiness/index.js:657-674 AntD Radio.Group keyboard selectable state
- vNext now: project-readiness-override-form.tsx:79-96 native Select
- Fix: Restore segmented radio keyboard focus behavior

## G2-7-032-072  [P2] GAP  facet F19  effort M
- Legacy: readiness/index.js:284-301 response DTO reused to update one selected row instead of refetching entire college
- vNext now: project-readiness-override-form.tsx:57-59 router.refresh re-fetches server page
- Fix: Optimize post-save refresh to selected workspace
