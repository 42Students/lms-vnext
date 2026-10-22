# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-001-040 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: LC:100-107 actor() super-admin only, impersonation actor label; noStore for all endpoints
- Expected fix: Document/approve stricter acting-scope restriction and actor identity; keep no-store on all sensitive responses.

## G2-20-004-025 [P1] GAP facet F04
- Files: src/app/enterprises/page.tsx
- Legacy: Page description exact 144-character-ish DESC string and jsonLd.org graph; `docs/legacy-source/frontend/src/pages/enterprises.js:5-6,8-30`
- Expected fix: Write enterprise canonical/OG/Twitter/structured data metadata using current non-AI claims but preserve metadata fields/schema; verify with SEO snapshot.

## G2-20-004-026 [P1] MISSING facet F04
- Files: src/app/enterprises/page.tsx
- Legacy: MarketingLayout canonical href `https://42lms.com/enterprises`; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:59-73`
- Expected fix: Add alternates.canonical for /enterprises, respecting canonical host.

## G2-20-004-029 [P1] MISSING facet F04
- Files: src/app/enterprises/page.tsx, src/components/marketing/marketing-layout.tsx
- Legacy: Site-wide Organization and WebSite JSON-LD plus page WebPage/BreadcrumbList graph; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:12-49,96-105`, `docs/legacy-source/frontend/src/pages/enterprises.js:8-30`
- Expected fix: Render safe JSON-LD via script with Organization/WebSite and WebPage/BreadcrumbList, updated business semantics.

## G2-20-012-002 [P1] GAP facet F01
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy GET visible only org/target/active/deadline by specification `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:48-70`
- Expected fix: Audit whether learners without module grant lose formerly visible opportunities

## G2-20-012-011 [P1] GAP facet F05
- Files: src/modules/placements/application-service.ts
- Legacy: Global getAllActiveJobs deprecated due cross-org data leakage `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:24-38`
- Expected fix: Verify every caller scopes job to active college before returning record or applying

## G2-20-012-015 [P1] GAP facet F07
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy class docs explicitly say no eligibility hard check before apply `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:11-20,73-93`
- Expected fix: Clarify product rule whether academic evidence/percentage may block apply, test targeted-but-low-score candidate

## G2-20-012-026 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Offer accept OFFERED→HIRED, decline OFFERED→REJECTED `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:152-158`
- Expected fix: Expose combined status across offer and placement application history, not only SUBMITTED

## G2-20-012-040 [P1] GAP facet F23
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy philosophical hard targeting only, no hard eligibility before apply `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:11-20`
- Expected fix: Owner clarify deliberate rule evolution and expose why user can't apply

## G2-20-010-002 [P1] MISSING facet F01
- Files: src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Tenant-specific deep link /recruiter/messages or /recruiter/drives/{jobId} `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:110-116`
- Expected fix: Add verified tenant-domain deep link and proper job context to template

## G2-20-010-004 [OK — name/subject/count/excerpts/earlier count/CTA merged] GAP facet F02
- Files: src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Email layout includes greeting, subject, count, newest messages, earlier count and link `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:106-136`
- Expected fix: Restore complete original email information hierarchy and verify rendered template

## G2-20-010-027 [P1] MISSING facet F10
- Files: src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Deep link uses verified college domain via mail.collegeLink `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:110-116`
- Expected fix: Build safe per-college URL to job/general conversation and send in merge

## G2-20-010-040 [OK — dedicated template key, merge variables and verified Reply-To configured] GAP facet F15
- Files: src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Dedicated recruiter-message Zepto template, merge includes count/subject/more/link `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:106-122`
- Expected fix: Provision full variable set and verify template render, subject and reply-to

## G2-3-007-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/teacher/report/quiz/[quizId].js:1-6`; `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:20-27`
- Expected fix: Legacy direct link numeric quizId works alone; vNext requires UUID quizId plus optional deliveryId. Resolve or deliberately deprecate old numeric bookmarks with explicit redirect/not found.

## G2-3-013-018 [P1] GAP facet F08
- Files: src/modules/placements/application-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:37-52`
- Expected fix: Legacy catches history save failure and does not fail main status mutation; vNext inserts history inside placement application transaction, so audit failure can rollback primary action. Decide policy and show clean retry response.

## G2-3-013-022 [P1] GAP facet F10
- Files: src/modules/placements/application-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:87-96`, `132-140`, `180-189`
- Expected fix: Legacy status recorder covers TPO system moves, bulk moves and undo transitions, not only learner application lifecycle; vNext main history writes submission/reapplication/withdrawal only. Merge adjacent stage and screening histories to provide complete audit.

## G2-3-015-022 [P1] GAP facet F10
- Files: src/modules/placements/job-service.ts, src/modules/placements/learner-job-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:29-39`
- Expected fix: Legacy apply locks job row immediately before application write, serializes with soft delete; vNext job write paths lock on publish/close but learner read list not proof application apply always locks. Verify apply transaction row locking and enforce.

## G2-3-015-042 [P1] GAP facet F20
- Files: src/modules/placements/job-service.ts, src/modules/placements/tpo-delete-draft-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:29-39`, `148-171`
- Expected fix: Legacy pessimistic row lock + version increment closes apply/delete race; vNext has for-update locks and timestamp tokens but different lifecycle archive semantics. Prove no application after archive with one atomic transaction.

## G2-13-019-031 [P1] GAP facet F15
- Files: src/modules/placements/job-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:54-56`
- Expected fix: Legacy recordedOutside jobs never notify students; vNext generic published drive triggers eligible-student notices unless separately excluded.

## G2-3-023-007 [P1] GAP facet F04
- Files: src/components/placements/placement-job-create-form.tsx, src/modules/placements/job-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/DriveForm.java:14-57`
- Expected fix: Legacy flat DriveForm/recruiter/category/deadline fields need explicit conversion to normalized company, role and eligibility records.

## G2-3-023-022 [P1] GAP facet F10
- Files: src/modules/placements/job-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveService.java:595-700`
- Expected fix: Legacy close/cancel ends in-play applications, cancels interviews, settles requests and notifies; VNext job stop paths require joined cascade parity review.

## G2-3-023-032 [P1] GAP facet F15
- Files: src/modules/placements/job-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveService.java:631-700`
- Expected fix: Compare notifications to every affected learner and recruiter on cancel/close including offer status and interview cancellation.

## G2-3-023-046 [P1] GAP facet F22
- Files: src/modules/placements/job-service.ts, src/modules/placements/tpo-drive-lifecycle-list-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:64-110`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/DriveForm.java:14-57`
- Expected fix: Integer Job/DriveForm, lastSaver, nullable tenant pointers vs UUID company+season+role options require explicit historical mapping.

## G2-3-023-047 [P1] GAP facet F22
- Files: src/modules/placements/job-service.ts, src/modules/placements/tpo-drive-request-decision-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveService.java:595-714`
- Expected fix: Legacy lifecycle fanout across application status, interview, offer and outbox vs VNext split ledgers needs transaction mapping.

## G2-3-022-014 [P1] MISSING facet F07
- Files: src/app/api/placements/tpo/team/threads/route.ts, src/modules/placements/tpo-team-asks-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:174-178`
- Expected fix: Legacy `ADD_PEOPLE` 409 names the people missing from a private conversation, with explicit add-and-retry UX; vNext does not expose that conflict shape in cited routes. Add safe action-needed 409 with existing membership IDs, not a silent send failure.
