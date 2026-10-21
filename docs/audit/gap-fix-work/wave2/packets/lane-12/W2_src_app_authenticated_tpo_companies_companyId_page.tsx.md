# Work packet (wave 2): edit src/app/(authenticated)/tpo/companies/[companyId]/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-companies.md

## G2-11-007-029  [P2] GAP  facet F04  effort L
- Legacy: Legacy Timeline reads recruiter_lead_activity, max 200, person/type/note/createdAt. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:417`
- vNext now: vNext memory timeline from latestTpoCompanyLeadActivities and separate canonical timeline capped 100, includes drive and offer. `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx:440`
- Fix: Keep recruiter-lead activity slice and 200 cap on name view; separate expanded canonical feed.

## G2-11-007-041  [P2] GAP  facet F06  effort M
- Legacy: Legacy shows trusted company AntD Switch with description `Their drive requests go live without your review.` `docs/legacy-source/frontend/src/components/tpo/company/CompanyLinkCard.jsx:98`
- vNext now: vNext canonical has standalone TpoCompanyTrustSwitch and link component `Link is on/off` Checkbox. `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx:125`
- Fix: Restore switch label/placement and ensure trust toggle not confused with enable-link toggle.

## G2-11-007-089  [P2] GAP  facet F18  effort S
- Legacy: Legacy `People`, `Drives`, `Documents`, `Team`, `Timeline`, `Students placed, by year`. `docs/legacy-source/frontend/src/pages/tpo/companies.js:134`
- vNext now: vNext name view uses same core headings; canonical UUID replaces with `Recruiter contacts`, `Placement drives`, `Company timeline`. `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx:263`
- Fix: Route users to matching headings, reserve canonical wording for new route.

## G2-11-007-093  [P2] GAP  facet F19  effort M
- Legacy: Legacy timeline query LIMIT 200; documents no specified response cap. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:417`
- vNext now: vNext canonical timeline shows most recent 100; name memory activity bounded by batch service. `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx:442`
- Fix: Retain 200-event ceiling for name page; add paginated history if needed.
