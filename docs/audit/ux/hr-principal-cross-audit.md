# HR recruiter principal ownership — chat-19 second pass

Routes audited: `/hr/placements`, `/hr/placements/jobs/[jobId]`, `/hr/company/reports`, `/hr/drives/[jobId]/messages`, `/hr/drives/[jobId]/rounds/editor`, `/hr/drives/[jobId]/rounds/editor/remove/[roundId]`, `/hr/drives/[jobId]/interview-slots`.

These seven server pages previously checked an active recruiter profile but not its `userId` equality with the signed-in `user.id` before calling the page's reader. The additional guard redirects a mismatched active profile before any employer, candidate, conversation or job query. The page wording, navigation, layout, touch sizes, filters and no-access/empty UI remain unchanged. Central service permission checks still apply.

Behavioral page-level regressions exercise mismatched and disabled actors, valid authorized empty views, invalid filters and absence of downstream reads in `tests/unit/HR-BREAK-chat19-home-portfolio-proposals.test.ts`, `HR-BREAK-chat19-legacy-job-aliases.test.ts`, `HR-BREAK-chat19-company-reports-principal.test.ts` and `HR-BREAK-chat19-drive-pages.test.ts`. Cloud CI, accessible screen-reader and responsive browser verification remain pending; tests were not run locally.

## Additional entrypoints reviewed

`/hr/activity`, `/hr/conversations`, `/hr/conversations/[threadId]`, `/hr/notifications` and `/hr/drives/recorded-outside` now independently check principal ownership before any scoped query or grant-choice rendering. Existing page-level suites were expanded and a direct recorded-outside page test was added. This closes the missing recruiter principal gates found during chat-19's review of the 22 HR page entrypoints, not a claim that UI/accessibility or CI is otherwise complete.
