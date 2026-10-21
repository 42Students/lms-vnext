# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/department.md

8 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/department.md

## G2-6-020-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy /fetchPaged has page and size query default 0/20 (DepartmentController.java:225-246).
- vNext now: vNext department directory pages client-side default10 (department-directory.tsx:59-65).
- Fix: Document list endpoint translation; provide paginated server API where consumers require it.

## G2-6-020-006  [P2] GAP  facet F03  effort S
- Legacy: Legacy shows Department Name input and Create Department with plus icon (docs/audit/pages/college/academic-setup.md:1-17).
- vNext now: vNext Create Department text-only button (department-create-form.tsx:65-76).
- Fix: Restore Plus icon and legacy button size/colors.

## G2-6-020-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy Contents blue status chips and tooltip for programs, courses, faculty (docs/audit/pages/college/academic-setup.md:1-17).
- vNext now: vNext dotted plain text 3 counts, one title tooltip (department-directory.tsx:30-43).
- Fix: Render 3 independently styled pills and original tooltip, including counts 0 and unknown.

## G2-6-020-008  [P2] GAP  facet F03  effort S
- Legacy: Legacy Export CSV and Refresh are visible in header (docs/audit/pages/college/academic-setup.md:1-17).
- vNext now: vNext CSV under View options disclosure; no refresh in directory markup (department-directory.tsx:72-101).
- Fix: Show Export CSV and Refresh in toolbar without extra click.

## G2-6-020-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy BaseModel has isDeleted false, timestamps (BaseModel.java:28-37).
- vNext now: vNext archivedAt nullable + timestamps (departments.ts:19-22).
- Fix: Map deleted=true to archivedAt and timestamps consistently in APIs/exports.

## G2-6-020-033  [P2] GAP  facet F09  effort M
- Legacy: Legacy Delete Department popconfirm includes dependency explanation (docs/audit/pages/college/academic-setup.md:1-17).
- vNext now: vNext More→Archive action then ConfirmDialog, disabled if usage unknown or >0 (department-actions.tsx:145-169).
- Fix: Match direct Delete trigger and popconfirm placement/copy; retain safe dependency disable.

## G2-6-020-035  [P2] GAP  facet F10  effort M
- Legacy: Legacy soft deletes isDeleted=true after dependency guards (DepartmentServiceImpl.java:69-84).
- vNext now: vNext sets archivedAt with timestamp after counts guard (departments/service.ts:345-388).
- Fix: Define archived/deleted equivalence and hard/soft delete behavior.

## G2-6-020-049  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact delete linked warnings and success Delete terminology (DepartmentServiceImpl.java:69-84; DepartmentController.java:207-212).
- vNext now: vNext tooltip Move or remove..., menu Archive, toast Department archived (department-actions.tsx:160-168,132-139).
- Fix: Clone exact legacy warnings without obscuring intentional archive semantics.
