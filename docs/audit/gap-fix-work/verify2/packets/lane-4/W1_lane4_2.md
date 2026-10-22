# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-017-054 [P1] GAP facet F12
- Files: src/components/placements/super-admin-needs-attention.tsx, src/components/placements/placement-operations-overview.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:251-257,211-214 — Needs attention count is sum of affected category records.
- Expected fix: Align precise count definition.

## G2-10-017-088 [P1] GAP facet F23
- Files: src/components/placements/super-admin-needs-attention.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19-27 — Missing letters category includes HIRED; total counts sum item counts.
- Expected fix: Fix filter and count semantics.

## G2-10-013-010 [P1] MISSING facet F03
- Files: src/components/placements/college-interview-appointments.tsx, src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:536-564 — Conflict WarningOutlined red tag accompanies time if collision identified.
- Expected fix: Project collision types and red badges for conflicting schedule.

## G2-10-013-030 [P1] GAP facet F07
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx, src/components/placements/college-interview-appointments.tsx
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-184 — GET failures show 'Unable to load interviews. Please try again.' and recover with Refresh.
- Expected fix: Catch candidate/round read failures per panel with explicit Refresh.

## G2-10-013-078 [P1] GAP facet F22
- Files: src/components/placements/college-interview-appointments.tsx, src/modules/placements/college-drive-interviews-service.ts
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:406-649; docs/legacy-source/frontend/src/api/Services/interviewService.js:20-49 — Legacy interview record individual ID, learner, jobApplication, organization, interviewType, status, scheduledDate.
- Expected fix: Create field-level migration/read mapping and document statuses/timezone.

## G2-10-015-055 [P1] MISSING facet F13
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1529-1542 — Refresh failure keeps prior rows and offers Retry.
- Expected fix: Add last-known-good state and retry.

## G2-10-023-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/tenants/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/tenants.js:6-18 — Tenant Setup opens global /superadmin/tenants with two tabs on same page.
- Expected fix: Open legacy two-tab setup at landing route; directory secondary

## G2-10-024-091 [P1] GAP facet F19
- Files: (none, new feature)
- Legacy: src/components/verification/SuperAdminVerificationPanel.tsx:73-79 — Review one by one limited20 page requests.
- Expected fix: Offer pagination-aware sequence or state visible 20 cap

## G2-17-030-015 [P1] GAP facet F04
- Files: src/components/placements/super-admin-needs-attention.tsx
- Legacy: Needs attention four counts per category and sample per item with learnerName, jobTitle and detail; DrivesLanding.js:19-28,410-452
- Expected fix: Resolve candidate-specific attention items or explicit safe application detail, not only per-job counts.

## G2-17-030-016 [P1] GAP facet F04
- Files: src/components/placements/super-admin-needs-attention.tsx
- Legacy: MissingOfferLetters deep-links unfiltered ALL to include HIRED, OFFERED; DrivesLanding.js:19-27
- Expected fix: Change route target to ALL and document HIRED missing-letter inclusion; avoid false exclusions.

## G2-17-030-018 [P1] GAP facet F05
- Files: src/components/placements/super-admin-needs-attention.tsx
- Legacy: Needs attention first3 items/category, expandable top capped set with `+N more` and Showing top X of N; DrivesLanding.js:414-453
- Expected fix: Use backend category total and capped samples rather than row array length; disclose truncated sampling.

## G2-17-030-036 [P1] GAP facet F10
- Files: src/components/placements/super-admin-needs-attention.tsx
- Legacy: Legacy Needs attention item click route `jobs/{id}/applications?status=APPLIED\|INTERVIEW\|ALL`, with returnTo; DrivesLanding.js:227-231,421-432
- Expected fix: Map stage query to exact filtered statuses, carry returnTo for contextual Back link.

## G2-17-030-051 [P1] GAP facet F18
- Files: src/components/placements/super-admin-needs-attention.tsx
- Legacy: Exact attention label `Offered, no offer letter attached` and no-status filter ALL; DrivesLanding.js:19-28
- Expected fix: Change deep-link tab to ALL to include hired cases.

## G2-18-023-029 [P1] GAP facet F12
- Files: src/modules/placements/eligibility-service.ts
- Legacy: Legacy eligibility missing marks = `Not provided` and eligible absent verified-only requirement; EligibilityService.java:25-31
- Expected fix: Align default missing academic evidence semantic per policy and label `Not provided` rather than silently treating missing as failure.

## G2-18-023-045 [P1] GAP facet F22
- Files: src/modules/placements/eligibility-service.ts, src/modules/placements/learner-placement-rules-service.ts
- Legacy: Legacy eligibility has JSON job criteria, learner academic record, override, batch rules and student calendar events; EligibilityService.java:52-115; LearnerEligibilityController.java:102-155
- Expected fix: Write column-by-column crosswalk including effective batch policy and student talk/exam block tables.

## G2-11-001-017 [P1] GAP facet F04
- Files: src/modules/placements/public-page/read-service.ts
- Legacy: Placed counts DISTINCT learners with ACCEPTED offer. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:93`
- Expected fix: Align public calculation to accepted-only or record product decision.

## G2-11-001-018 [P1] GAP facet F04
- Files: src/modules/placements/public-page/read-service.ts
- Legacy: Companies count employers with ACCEPTED offer. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:94`
- Expected fix: Restrict to accepted offers with company-name fallback.

## G2-11-001-019 [P1] GAP facet F04
- Files: src/modules/placements/public-page/read-service.ts
- Legacy: Offers filter RELEASED/ACCEPTED and createdAt within 12mo. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:92`
- Expected fix: Map ledger/status/time semantics exactly.

## G2-11-001-020 [P1] GAP facet F04
- Files: src/modules/placements/public-page/read-service.ts
- Legacy: Students are eligible learners via PlacementEligibilityService. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:89`
- Expected fix: Use legacy eligible denominator for public student metric.

## G2-11-001-025 [P1] GAP facet F06
- Files: src/components/placements/public-recruit-from-us.tsx
- Legacy: Name required before Send me a code. `docs/legacy-source/frontend/src/pages/placements/index.js:47`
- Expected fix: Show/validate name before sending.

## G2-11-001-026 [P1] GAP facet F06
- Files: src/components/placements/public-recruit-from-us.tsx
- Legacy: Company optional, autocomplete organization. `docs/legacy-source/frontend/src/pages/placements/index.js:95`
- Expected fix: Make company optional, autocomplete organization.

## G2-11-001-032 [P1] GAP facet F06
- Files: src/components/placements/public-recruit-from-us.tsx
- Legacy: Client saves via savingRef to prevent concurrent submit. `docs/legacy-source/frontend/src/pages/placements/index.js:33`
- Expected fix: Use `useRef` in-flight lock.

## G2-11-001-035 [P1] GAP facet F07
- Files: src/components/placements/public-recruit-from-us.tsx
- Legacy: Whitespace name error `Enter your name`. `docs/legacy-source/frontend/src/pages/placements/index.js:94`
- Expected fix: Trim-check and field message.

## G2-11-001-037 [P1] GAP facet F07
- Files: src/components/placements/public-recruit-from-us.tsx
- Legacy: Maps WRONG_CODE/EXPIRED/LOCKED and email errors to field with server message. `docs/legacy-source/frontend/src/pages/placements/index.js:5`
- Expected fix: Send safe message/code and attach field errors.

## G2-11-001-045 [P1] GAP facet F10
- Files: src/components/placements/public-recruit-from-us.tsx
- Legacy: POST recruit body has phone and note. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicPlacementsPageController.java:41`
- Expected fix: Explicitly map payload fields.
