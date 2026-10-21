# Work packet: edit src/app/(authenticated)/college/courses/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-courses.md

## G2-3-008-051  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:200-212`
- vNext now: `src/app/(authenticated)/college/courses/page.tsx:19-22`
- Fix: Legacy when collegeId changes resets image URLs/edit modal/selection, new server workspace must invalidate persistent client editor/duplication query on scope changes.

## G2-3-008-072  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:140-212`
- vNext now: `src/app/(authenticated)/college/courses/page.tsx:19-35`
- Fix: Legacy request-sequence resets selection, media and edit when college changes; vNext duplicate query and client drawer may persist across membership changes.

## G2-3-008-036  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:607-613`
- vNext now: `src/app/(authenticated)/college/courses/page.tsx:19-24`
- Fix: Legacy `Couldn't refresh courses` same-scope cached list and Retry; new server data error route loses previous rows.
