# Work packet (wave 3): edit src/app/(authenticated)/admin/placements/analytics/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md

## G2-10-008-021  [P1] MISSING  facet F03  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:488-498` optional Avg. time to shortlist card with hrs suffix
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:127` always reads Avg. time to shortlist: Not recorded
- Fix: Compute duration from historical stage transition timestamps when available and restore conditional metric card

## G2-10-008-026  [P1] MISSING  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2309-2340` avgTimeToShortlistMs via first SHORTLISTED status history timestamp minus applied_at
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:127` hardcoded Not recorded
- Fix: Backfill/derive first-shortlisted elapsed time and expose rounded hours
