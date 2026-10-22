# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-023-032 [P1] MISSING facet F06
- Files: src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:46-50,145-151 — Radio tiles Sign-in methods (email-phone etc) and Save.
- Expected fix: Render source radio tile picker inline

## G2-17-030-058 [P1] GAP facet F23
- Files: src/app/(authenticated)/admin/placements/page.tsx, src/app/(authenticated)/admin/placements/drives/page.tsx
- Legacy: Legacy inline duplicate, deadline, retention and lookup actions embedded in one landing; DrivesLanding.js:565-698
- Expected fix: Restore first-class actions in landing while keeping routable backup workflows.

## G2-11-002-050 [P1] GAP facet F09
- Files: src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- Legacy: Modal Choose round for these decisions `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:278`
- Expected fix: Prompt when multiple open rounds

## G2-11-005-026 [P1] GAP facet F04
- Files: src/components/tpo/tpo-notice-read-progress.tsx
- Legacy: Read line includes read/recipient percentage and count `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:90`
- Expected fix: Display read count immediately in each sent card

## G2-11-005-031 [P1] GAP facet F05
- Files: src/components/tpo/tpo-notice-read-progress.tsx
- Legacy: Who hasn't read only while SENT and readCount below recipientCount `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:94`
- Expected fix: Use lifecycle and read totals to gate

## G2-11-005-032 [P1] GAP facet F05
- Files: src/components/tpo/tpo-notice-read-progress.tsx
- Legacy: Remind option conditional likewise `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:95`
- Expected fix: Block invalid lifecycle reminders

## G2-11-005-075 [P1] GAP facet F10
- Files: src/components/tpo/tpo-notice-read-progress.tsx
- Legacy: GET unread-by learner list /:id/unread `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:218`
- Expected fix: Restore detailed unread learner DTO

## G2-11-005-094 [P1] GAP facet F13
- Files: src/components/tpo/tpo-notice-read-progress.tsx
- Legacy: Drawer when 500 rows note Showing the first 500. `docs/legacy-source/frontend/src/pages/tpo/announcements.js:122`
- Expected fix: Enforce/label 500-record limit

## G2-11-005-132 [P1] GAP facet F22
- Files: src/components/tpo/tpo-notice-read-progress.tsx
- Legacy: Legacy per-announcement unread rows have learnerId/roll/branch `docs/legacy-source/frontend/src/pages/tpo/announcements.js:31`
- Expected fix: Preserve scoped identity in read receipt model

## G2-11-005-138 [P1] GAP facet F23
- Files: src/components/tpo/tpo-notice-read-progress.tsx
- Legacy: Legacy Who hasn't read full learner details in Drawer `docs/legacy-source/frontend/src/pages/tpo/announcements.js:120`
- Expected fix: Clone drawer/details/empty/load

## G2-11-007-015 [P1] GAP facet F03
- Files: src/components/tpo/tpo-company-memory-workspace.tsx
- Legacy: Legacy company link card visible only if `companyId`, with Trust switch, domain editor, link status. `docs/legacy-source/frontend/src/pages/tpo/companies.js:155`
- Expected fix: Embed existing TpoPublicJoinLinkCard and trust control at legacy location or provide exact in-page parity.

## G2-11-007-017 [P1] GAP facet F03
- Files: src/components/tpo/tpo-company-memory-workspace.tsx
- Legacy: Legacy Team card is always in right column, one company conversation. `docs/legacy-source/frontend/src/pages/tpo/companies.js:174`
- Expected fix: Match legacy name-keyed Team availability or supply migration-safe name-to-company bridge.

## G2-11-007-070 [P1] GAP facet F12
- Files: src/components/tpo/tpo-company-memory-workspace.tsx
- Legacy: Legacy distinct placed by year groups by creation year and `Facts.placedByJob`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:412`
- Expected fix: Define exact KPI data rule on page and align output, not just words.

## G2-11-007-074 [P1] GAP facet F13
- Files: src/components/tpo/tpo-company-memory-workspace.tsx
- Legacy: Legacy counts failures produce warning alert and stale cells; failure in load company shows PanelError. `docs/legacy-source/frontend/src/pages/tpo/companies.js:111`
- Expected fix: Restore optional warning and granular retry actions.

## G2-11-007-108 [P1] GAP facet F23
- Files: src/components/tpo/tpo-company-memory-workspace.tsx
- Legacy: Legacy name page has CompanyLinkCard in same detail when companyId exists. `docs/legacy-source/frontend/src/pages/tpo/companies.js:155`
- Expected fix: Restore in-place link/trust for canonical case, safe missing ID state for orphan.

## G2-11-009-032 [P1] GAP facet F07
- Files: src/app/(authenticated)/tpo/drive-day/page.tsx
- Legacy: Failed GET displays API message/error then Could not load today's drive-day assignments. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:29`
- Expected fix: Catch and display fallback with retry.

## G2-11-012-104 [P1] GAP facet F23
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: Legacy stale load warning and Retry missing data. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:421`
- Expected fix: Add retriable independent data failures.

## G2-12-001-016 [P1] GAP facet F06 Forms
- Files: src/app/request-demo/page.tsx
- Legacy: Mail draft includes Name, Organization, Role, Phone, What you're looking to solve `docs/legacy-source/frontend/src/components/marketing/data.js:11-18`
- Expected fix: Prefill exact field labels in encoded body

## G2-12-001-020 [P1] GAP facet F10 Actions/side-effects
- Files: src/app/request-demo/page.tsx
- Legacy: Primary CTA mailto subject `Request a Demo — 42 LMS` and encoded body `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`
- Expected fix: Set subject/body using encodeURIComponent

## G2-12-001-044 [P1] MISSING facet F23 Extras/intentional drops
- Files: src/app/request-demo/page.tsx
- Legacy: Canonical, robots, OG and Twitter metadata in MarketingLayout `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:64-106`
- Expected fix: Restore canonical, robots and social metadata through Next Metadata

## G2-12-002-004 [P1] GAP facet F02
- Files: src/app/(authenticated)/admin/semester-courses/page.tsx
- Legacy: Header then lg=10/14 two-panel mapping workspace `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:327-335,379-409`
- Expected fix: Open editor by default and clone two-column card layout

## G2-17-23-061 [P1] GAP facet F12 One accepted offer
- Files: (none, new feature)
- Legacy: JS:1197–1218 checks any other HIRED and locks learner on accept before working
- Expected fix: Confirm internship/LOI policy exception and cross-college accepted offers; show clear conflict rather than generic error

## G2-17-028-047 [P1] MISSING facet F23 Dropped content
- Files: (none, new feature)
- Legacy: LO:30-42 overall progress and proof coverage; LO:76-105 dedicated override-active/empty banner
- Expected fix: Restore distinct missing legacy regions; record expected zero-count and override-off screenshots

## G2-18-026-018 [P1] GAP facet F07 Duration conflict
- Files: (none, new feature)
- Legacy: NPS:113-139 emits named batch/semester and maximum allowed number when shrinking
- Expected fix: Return structured blocking batch/semester(s), then render readable legacy-style actionable details before save

## G2-19-029-019 [P1] GAP facet F04 Blocked headline
- Files: (none, new feature)
- Legacy: LG:229-234 `Not ready — login will not work` strictly for missing domain login requirements
- Expected fix: Never say `login will not work` when only an academic/placement record is missing; label `Login blocked` only on domain gate
