# Chat-12 /tpo first-third UX rollout handoff

**Baseline:** UX-PLAYBOOK v1.0 signed off 2026-10-18. **Branch:** `chatgpt/chat-12-b`. **Scope:** first 42 routes of 126, by the exact route order in `docs/orchestrator/ui-ux/pages-tpo.md`, ending in `/tpo/placements/jobs/[jobId]/applicants-pipeline`.

## Source coverage and counts

- 42/42 routes reviewed; 42 per-route notes under `docs/audit/ux/tpo-*.md`.
- 33 route files changed in the initial phone/contrast/landmark rollout. Seven routes are canonical redirects; two already delegate their rendered UX to existing shared workspaces and were left unchanged.
- 42 `UX-tpo-*-01.test.ts` route source tests created. Eleven targeted second/third tests added for shared PageHeader, Input/Select/Button, DataTable and StatTile contracts; **53 new tests total**.
- Six detail/form pages additionally use the shared `PageHeader` (three also use the shared form controls); actor audit and no-show report use shared `DataTable` with **mandatory explicit legacy empty copy**; Find and actor audit use shared form controls; no-show KPIs use shared `StatTile`.
- Legacy wording and routes, tenant authorization and backend services were not changed. `src/components/ui/` shared primitives were reused unchanged; no forked component added.
- Batch pushes after route 10, 20, 30, 40 and 42, followed by the focused shared-component commits and latest-main merge.

## Validation outstanding

The lane brief explicitly says the builder cannot execute TypeScript, Vitest or browser tests; the source tests and source contracts were reviewed but **must not be described as executed**. Route checkboxes in `pages-tpo.md` remain unchecked because they may be ticked **only after tests pass**. The orchestrator must run strict typecheck, lint, the 53 route tests and existing suites, then 320/360/390 mobile and WebView keyboard/AT acceptance, before signing the individual pages off.

## Exact assigned route order

01. /tpo
02. /tpo/announcements
03. /tpo/audit
04. /tpo/audit/actors
05. /tpo/batches
06. /tpo/batches/[batchId]
07. /tpo/batches/[batchId]/classes
08. /tpo/batches/[batchId]/history
09. /tpo/batches/[batchId]/invitation-prep
10. /tpo/batches/[batchId]/nudge-prep
11. /tpo/batches/[batchId]/registrations
12. /tpo/batches/[batchId]/registrations/[membershipId]/history
13. /tpo/batches/[batchId]/reminder-prep
14. /tpo/batches/[batchId]/rules
15. /tpo/batches/[batchId]/students
16. /tpo/calendar
17. /tpo/calendar/export
18. /tpo/calendar/interviews
19. /tpo/calendar/rounds
20. /tpo/companies
21. /tpo/companies/[companyId]
22. /tpo/companies/[companyId]/contact-log
23. /tpo/companies/[companyId]/feedback
24. /tpo/companies/[companyId]/manage
25. /tpo/companies/[companyId]/people
26. /tpo/companies/archived
27. /tpo/drive-day
28. /tpo/drive-day/[roundId]
29. /tpo/drive-day/[roundId]/no-shows
30. /tpo/find
31. /tpo/follow-ups
32. /tpo/home
33. /tpo/messages
34. /tpo/messages/[threadId]
35. /tpo/messages/notifications
36. /tpo/more
37. /tpo/notifications
38. /tpo/placements
39. /tpo/placements/jobs/[jobId]
40. /tpo/placements/jobs/[jobId]/about
41. /tpo/placements/jobs/[jobId]/applicants
42. /tpo/placements/jobs/[jobId]/applicants-pipeline
