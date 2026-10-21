# Work packet (wave 2): edit src/components/hr/hr-drive-draft-form.tsx (part 2 of 2)

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l12-u025-recruiter-plan-drive-controller.md, docs/audit/gap2/lane-11/recruiter-drives-new.md

## G2-12-025-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy college overview powers branch hints/counts, may be unavailable with warning. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:140-153`
- vNext now: vNext branchSuggestions preloaded, no count shown in header. `src/app/(authenticated)/hr/drives/new/page.tsx:83-84`, `src/components/hr/hr-drive-draft-form.tsx:41-63`
- Fix: Show data-confidence warning and approximate audience preview.

## G2-12-025-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy draft autosave indicator and Start over option; default ON_CAMPUS and Full-time. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:18-22`
- vNext now: vNext restored draft notice, default jobType/workMode enum differs. `src/components/hr/hr-drive-draft-form.tsx:64-83,88-150`
- Fix: Match default mode/label and draft notice.

## G2-12-025-015  [P2] GAP  facet F06  effort M
- Legacy: Legacy initial driveMode ON_CAMPUS, jobType Full-time. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:22-29`
- vNext now: vNext choices ONSITE/HYBRID/REMOTE/NO_PREFERENCE and FULL_TIME etc. `src/components/hr/hr-drive-draft-form.tsx:77-83`
- Fix: Match labels/default mapping and avoid inadvertent mode change.

## G2-12-025-024  [P2] GAP  facet F09  effort M
- Legacy: Legacy Discard draft and leave modal, title `Leave without these changes?`. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:201-241`
- vNext now: vNext custom pendingLeave dialog, exact copy differs. `src/components/hr/hr-drive-draft-form.tsx:98-123`
- Fix: Use legacy title/content and button order.

## G2-12-025-038  [P2] GAP  facet F14  effort M
- Legacy: Legacy includes JdUpload for job-description upload. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:11-12`
- vNext now: vNext HR form text/url fields, no JdUpload import in inspected editor. `src/components/hr/hr-drive-draft-form.tsx:1-7`
- Fix: Restore validated JD attachment or approved removal.

## G2-12-025-042  [P2] GAP  facet F17  effort M
- Legacy: Legacy form scroll-to-first-invalid field. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:250-255`
- vNext now: vNext Zod result summary without evident scrollIntoView. `src/components/hr/hr-drive-draft-form.tsx:64-76`
- Fix: Focus invalid field and announce with role alert.

## G2-12-025-045  [P2] GAP  facet F18  effort M
- Legacy: Legacy `On campus`,`Full-time`,`Request a drive`. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:22-29`
- vNext now: vNext title Request a drive match, modes On-site/Full-time. `src/app/(authenticated)/hr/drives/new/page.tsx:99-101`, `src/components/hr/hr-drive-draft-form.tsx:77-83`
- Fix: Align campus vs onsite term.

## G2-11-004-024  [P3] GAP  facet F04  effort S
- Legacy: Fixed (optional) `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:375`
- vNext now: Fixed (optional, LPA) `src/components/hr/hr-drive-draft-form.tsx:337`
- Fix: Exact label

## G2-11-004-025  [P3] GAP  facet F04  effort S
- Legacy: Variable (optional) `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:381`
- vNext now: Variable (optional, LPA) `src/components/hr/hr-drive-draft-form.tsx:342`
- Fix: Exact label
