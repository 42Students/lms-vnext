# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-14/l18-u029-semester-management.md

7 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-14/l18-u029-semester-management.md

## G2-18-029-003  [P2] GAP  facet F03  effort S
- Legacy: Blue Sem N Tag; green Active and red Inactive Tags (legacy:337-363)
- vNext now: Plain Sem N text and neutral inactive StatusBadge (page:139-143)
- Fix: Restore blue Semester pill and red Inactive badge, matching spacing

## G2-18-029-009  [P2] GAP  facet F09  effort M
- Legacy: Edit Modal Save Changes/Cancel, dirty discard warning, Popconfirm Delete Yes/No (legacy:303-324,378-390,548-562)
- vNext now: Dialog altered discard copy; separate ConfirmDialog Confirm delete (create-control:174-222)
- Fix: Match exact discard sentence and anchored Yes/No desktop Popconfirm

## G2-18-029-011  [P2] GAP  facet F11  effort S
- Legacy: No college warning Select a College to manage Semesters and header hint (legacy:398-406)
- vNext now: EmptyState Select a college to continue (page:44-50)
- Fix: Restore yellow alert and literal header Organization/College selector hint

## G2-18-029-018  [P2] GAP  facet F18  effort S
- Legacy: Exact create/update/delete toasts and field labels; discard sentence Your unsaved semester edits will be lost. (legacy:187-189,317-323)
- vNext now: SEMESTER_COPY matches most, but discard says Unsaved semester name and status changes will be lost (create-control:219)
- Fix: Restore exact discard copy and AntD punctuation

## G2-18-029-019  [P2] GAP  facet F19  effort M
- Legacy: Client fetch all semesters, 10-row table range start-end of total (legacy:91-96,539)
- vNext now: Server paged SQL count, separate total and Pagination (page:135-151)
- Fix: Keep scalable SQL but render legacy compact table total/range footer

## G2-18-029-020  [P2] GAP  facet F20  effort S
- Legacy: One global in-flight delete ref; normalized snapshot avoids dirty false positives (legacy:12-20,278-300)
- vNext now: Row-local pending and raw name comparison (create-control:124-130,149-165)
- Fix: Add table-level delete mutex; trim name before dirty check

## G2-18-029-021  [P2] GAP  facet F21  effort S
- Legacy: After create succeeded but refresh failed, distinct warning and retry (legacy:190-198)
- vNext now: router.refresh with no separate failure state (create-control:62-68)
- Fix: Never resubmit successful mutation, show refresh-only retry
