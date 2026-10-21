# Work packet: edit src/app/(authenticated)/college/course-progress/error.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-course-progress-controller.md, docs/audit/gap2/lane-8/college-course-progress.md

## G2-2-015-024  [P2] GAP  facet F07  effort S
- Legacy: legacy metadata failure says Some course-progress filters could not be loaded. Retry before selecting a class. (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:87-90,297-305`)
- vNext now: new error.tsx says Course progress unavailable; no filter-specific distinction (`src/app/(authenticated)/college/course-progress/error.tsx:6-13`)
- Fix: Differentiate metadata failure from report failure, preserve Retry

## G2-2-015-025  [P2] GAP  facet F07  effort M
- Legacy: on refresh error, keep last successful same-scope rows and warning (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:136-159,317-326`)
- vNext now: server page navigates/reloads report; error boundary cannot show stale same-scope report (`src/app/(authenticated)/college/course-progress/error.tsx:6-13`)
- Fix: Retain safe previous data with warning on same-scope refresh only

## G2-8-008-024  [P2] GAP  facet F07  effort S
- Legacy: legacy metadata failure says Some course-progress filters could not be loaded. Retry before selecting a class. (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:87-90,297-305`)
- vNext now: new error.tsx says Course progress unavailable; no filter-specific distinction (`src/app/(authenticated)/college/course-progress/error.tsx:6-13`)
- Fix: Differentiate metadata failure from report failure, preserve Retry

## G2-8-008-025  [P2] GAP  facet F07  effort M
- Legacy: on refresh error, keep last successful same-scope rows and warning (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:136-159,317-326`)
- vNext now: server page navigates/reloads report; error boundary cannot show stale same-scope report (`src/app/(authenticated)/college/course-progress/error.tsx:6-13`)
- Fix: Retain safe previous data with warning on same-scope refresh only
