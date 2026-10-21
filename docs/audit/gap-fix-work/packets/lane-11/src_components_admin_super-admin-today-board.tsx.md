# Work packet: edit src/components/admin/super-admin-today-board.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-dashboard.md, docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-10-005-017  [P1] GAP  facet F03  effort L
- Legacy: Today card rows show named affected students/courses with and N more when total exceeds items `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:51-63` `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-240`
- vNext now: New Today cards only numeric counters and for missing data status Not yet measurable `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Include authorized item previews, compact rows and overflow counts in each attention card

## G2-10-005-025  [P1] GAP  facet F05  effort L
- Legacy: Old Today cards order Attendance not taken, Under threshold, Waiting to be graded, Courses with no teacher, Setup gaps, Quizzes closing this week `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-240`
- vNext now: New arrays same six positions but positions two three five are hardcoded null `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Populate all six legacy attention categories and preserve order

## G2-10-005-031  [P1] MISSING  facet F08  effort M
- Legacy: Old Today fetch failure uses Couldn't load today's overview with Retry `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:102-109`
- vNext now: New Today receives null on service catch and displays unavailable cards, no Retry `src/app/(authenticated)/dashboard/page.tsx:104-106` `src/components/admin/super-admin-today-board.tsx:4-24`
- Fix: Render old explicit error and Retry rather than hiding backend failure as unknown values

## G2-9-035-017  [P1] GAP  facet F03  effort L
- Legacy: Today card rows show named affected students/courses with and N more when total exceeds items `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:51-63` `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-240`
- vNext now: New Today cards only numeric counters and for missing data status Not yet measurable `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Include authorized item previews, compact rows and overflow counts in each attention card

## G2-9-035-025  [P1] GAP  facet F05  effort L
- Legacy: Old Today cards order Attendance not taken, Under threshold, Waiting to be graded, Courses with no teacher, Setup gaps, Quizzes closing this week `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-240`
- vNext now: New arrays same six positions but positions two three five are hardcoded null `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Populate all six legacy attention categories and preserve order

## G2-9-035-031  [P1] MISSING  facet F08  effort M
- Legacy: Old Today fetch failure uses Couldn't load today's overview with Retry `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:102-109`
- vNext now: New Today receives null on service catch and displays unavailable cards, no Retry `src/app/(authenticated)/dashboard/page.tsx:104-106` `src/components/admin/super-admin-today-board.tsx:4-24`
- Fix: Render old explicit error and Retry rather than hiding backend failure as unknown values

## G2-9-035-089  [P1] GAP  facet F04  effort M
- Legacy: Old Today opening trio '<classes> scheduled today / <held> held so far / <marked> with attendance taken' `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:137-147`
- vNext now: New 'Classes scheduled / Ended by schedule / Attendance taken' `src/components/admin/super-admin-today-board.tsx:8-13`
- Fix: Restore three exact labels and distinguish class-held evidence from scheduled end.

## G2-9-035-098  [P1] GAP  facet F07  effort M
- Legacy: Old Today on incomplete response displays card failed placeholder rather than fake 0 `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:113-124,37-44`
- vNext now: New null counts all rendered 'Not yet measurable from registered evidence' `src/components/admin/super-admin-today-board.tsx:15-20`
- Fix: Differentiate missing evidence, failed fetch, unsupported metric and actual zero.

## G2-9-035-100  [P2] MISSING  facet F08  effort S
- Legacy: Old Today shows explicit 'Refresh failed. Showing the last overview loaded for this college.' `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:131-135`
- vNext now: New Today no manual fetch or stale-state banner `src/components/admin/super-admin-today-board.tsx:8-25`
- Fix: Show original Today refresh failure/status banner.
