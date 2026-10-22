# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-20-010-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-20-012-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-3-001-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-3-019-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-3-019-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-4-004-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-4-013-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-4-026-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-4-026-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-4-026-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)

## Results

- G2-20-010-055: OK — vNext src/modules/placements/recruiter-message-email-dispatch-service.ts:25-50 sends unread-message digests only once the mail template/provider is configured (recruiterDigestReadiness + template/secret checks, otherwise inert with operator alert), the same "send after configured mail template is active, no separate toggle" contract as docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:77-79 (mail.isConfigured("recruiter-message")); the opt-in dependency is documented in the function comment at :22-24.
- G2-20-012-024: OK — vNext src/modules/placements/learner-job-service.ts:319-380 returns every targeted drive and carries eligibility as a separate `eligibility` status (never filtering low-score jobs out), and src/modules/placements/eligibility-service.ts:1117-1120 states gender/degree/specialization/scores are not visibility conditions; matches docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:49-56.
- G2-3-001-038: OK — vNext src/app/(authenticated)/college/quizzes/page.tsx:46-54 renders ErrorState "Quizzes could not be loaded" with CurrentPageRetry when the list read rejects (authoring-options failure is separate, :60-68); matches docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:582-593.
- G2-3-019-012: OK — vNext src/components/placements/learner-jobs-browse.tsx:124-132,210 (Saved tab count uses all saved ids, retained historic/expired bookmarks via savedHistory from src/app/(authenticated)/learn/my-placements/jobs/page.tsx:140, Expired section :377-390) matches docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:542-543,675-678.
- G2-3-019-044: OK — vNext learner-jobs-browse.tsx:317-321,374-390 keeps bookmarked closed/expired drives listed in the Saved tab ("Their bookmarks remain until you remove them") matching JobsListContent.jsx:519-543.
- G2-4-004-068: OK — vNext src/app/(authenticated)/college/assignments/page.tsx:54-56 renders ErrorState "Assignments could not be loaded" with CurrentPageRetry (separate options-failure banner :72-73); matches docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-287,421-425 (server-rendered, so no stale-response token needed).
- G2-4-013-001: OK — vNext src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:27-65 resolves the deep link and, when one assignment is delivered to several taught Sections, shows an explicit Section chooser (:44-63); matches docs/legacy-source/frontend/src/pages/teacher/report/assignment/[contentId].js:1-7 and AssignmentReportContent.jsx:29-36.
- G2-4-026-016: OK — vNext src/modules/placements/public-page/read-service.ts:52-86 counts ACCEPTED or released ISSUED (legacy RELEASED) offers from the last 12 months (since :55, filter :82-85); matches PlacementsPageService.java:91-99.
- G2-4-026-017: OK — vNext public-page/read-service.ts:61-63,112 "placed" = distinct learners with ACCEPTED offers (placementBasis ACCEPTED_OFFERS, 12-month window disclosed via offerWindowMonths) matching PlacementsPageService.java:93-97.
- G2-4-026-018: OK — vNext public-page/read-service.ts:64-65 counts distinct canonical companyId (placementCompanyRelationships) over ACCEPTED offers only; matches PlacementsPageService.java:93-99.
