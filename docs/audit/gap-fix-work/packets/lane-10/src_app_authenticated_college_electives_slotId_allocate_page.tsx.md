# Work packet: edit src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-electives.md

## G2-9-007-022  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:337-368` — Eligible table search roll/name/dept, class filter, persistent select, 50/page
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx:49-81` — Server search/section filter limited to 500 candidates
- Fix: Replicate bulk selection and per-pick counters across pages

## G2-9-007-030  [P1] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/AllocateModal.jsx:91-115` — Allocation Roll numbers or Whole section, multiline input, optional note max500
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx:124-158` — Selection and pasted tokens, no Whole section mode or note field
- Fix: Add whole-section and note submission contract

## G2-9-007-036  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/AllocateModal.jsx:36-45` — Warnings Pick a class; Paste at least one; positive numeric learner IDs
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx:112-127` — Invalid group query error, token truncation and UUID matching
- Fix: Validate and show per-token invalid values before submission

## G2-9-007-049  [P1] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/electives.js:20-31` — College unassigned displays warning
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx:30-46` — Child allocation redirects or 404 on missing membership/slot
- Fix: Show consistent explanatory no-scope/forbidden state

## G2-9-007-070  [P1] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/AllocateModal.jsx:34-64` — Tokenises comma/semicolon/whitespace and guards duplicate submits
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx:124-158` — Same delimiter classes but silently limits 100 tokens
- Fix: Surface explicit max100 before submit and report truncation

## G2-9-007-072  [P1] GAP  facet F21  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:57-61` — Group/class/faculty/schedule subsystem integration
- vNext now: `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx:143-155` — Group kernel integration and delivery-based faculty route
- Fix: Trace timetable/waitlist side-effects end to end
