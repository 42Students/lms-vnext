# Chat-19 independently recorded defects (2026-10-18)

All fixes were authored on `chatgpt/chat-19-b` after synchronizing with `main` at `a172b146ede1992a428dbe3e74a6d87dd3a12985`. Every listed finding has a source-level regression test, but no Vitest, TypeScript, PostgreSQL or real-browser run is claimed. Severity describes the state *before* each fix. Other teams should verify merged results, 320/360/390px interactions and conflict handling before release.

| Finding ID | Before-fix severity | Evidence / affected source | Defect | Fix | Commit (prefix) | Test |
|---|---|---|---|---|---|---|
| COL-XA-07 | MAJOR | `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx` | Raw 700px batch roster hid fields and move controls on 320px | DataTable cards with action priority, empty copy | `0c621386` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-08 | BLOCKER | `src/app/(authenticated)/college/projects/page.tsx` | Malformed URL filters could throw Zod and 500 project listing | Bounded safeParse, friendly clear-filters state | `389e6da4` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-09 | MAJOR | `src/app/(authenticated)/college/projects/page.tsx` | Optional template-label outage hid core workspace list | Fail-soft template lookup; indexed mapping; retained projects | `d89771f5` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-10 | MAJOR | `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx` | Malformed batch UUID raised raw validation error | Return notFound before DB query | `0be98786` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-11 | MAJOR | `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx` | Large fixed-width bulk allocation table unusable on phone, no scroll edge cue | Mobile DataTable, labelled checkboxes, vertical ScrollCue | `85e005c9` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-12 | MAJOR | `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx` | Malformed slot/offering UUID raised raw parse errors during listing/submission | safeParse, 404 or friendly choice prompt | `85e005c9` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-13 | MAJOR | `src/app/(authenticated)/college/faculty-assignment/page.tsx` | Horizontal roster concealed faculty end/reassign actions | Responsive DataTable, all actions present, 44px pagination | `1b3d03e7` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-14 | MAJOR | `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx` | Wide teaching-history table required sideways scrolling on phone | Mobile teaching assignment cards with history fields | `f4033441` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-15 | MAJOR | `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx` | Wide member roster concealed Move/Remove confirm controls on phone | Responsive DataTable preserves confirmations; faculty remove 44px | `c2d18afa` | `tests/unit/chat19-college-cross-audit.test.ts` |
| COL-XA-16 | MAJOR | `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx` | Invalid URLs and malformed membership input could crash mutation route | 404 invalid URLs; catch invalid membership for recoverable warning | `c2d18afa` | `tests/unit/chat19-college-cross-audit.test.ts` |
| HR-XA-01 | MAJOR | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` | Two fixed-width tables concealed selection and offer details on phone | Responsive DataTables preserving selection and offer fields | `86d4e58a` | `tests/unit/chat19-hr-page-contracts.test.ts` |
| HR-XA-02 | MAJOR | `src/app/(authenticated)/hr/drives, hr/placements/jobs/[jobId]/page.tsx` | Infinite skeleton loading lacked slow-network recovery | Bounded shared GracefulPageLoading with reload recovery | `8f859ed4` | `tests/unit/chat19-hr-page-contracts.test.ts` |
| HR-XA-03 | MAJOR | `src/app/(authenticated)/hr/drives/page.tsx` | Retry button had undersized touch target | Shared accessible Button | `f150fa86` | `tests/unit/chat19-hr-page-contracts.test.ts` |
| HR-XA-04 | MAJOR | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` | Back to Drives from error boundary used low-contrast link without focus cue | Deep teal and keyboard outline | `56742618` | `tests/unit/chat19-hr-page-contracts.test.ts` |

| HR-XA-05 | MAJOR | `src/app/(authenticated)/hr/conversations/page.tsx`, `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx`, `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` | Hidden scrollbars gave long message/change-request histories no more-content affordance | Focusable named ScrollCue with truthful edge fades | `1eaae5e9` | `tests/unit/chat19-hr-page-contracts.test.ts` |
| HR-XA-06 | MAJOR | `src/app/(authenticated)/hr/calendar/page.tsx` | Calendar day event overflow was invisible without scroll affordance | Named ScrollCue preserves max-height and more-content fade | `3de439aa` | `tests/unit/chat19-hr-page-contracts.test.ts` |

## Projects HR/Recruiter adversarial checks

- **PROJ-HR-01:** learner project links are disclosed only if both the active college visibility setting and company relationship grant explicitly permit them; pure projection tests also deny project data if policy denies.
- **PROJ-HR-02:** invalid URL schemes, credentials, loopback/private addresses and oversized links are never shown as portfolio destinations.
- **PROJ-HR-03:** only active, shortlisted applications from the recruiter's company and college scope can be disclosed; inactive users, removed members and withdrawn applications are rejected by the pure policy.
- **PROJ-HR-04:** an arbitrary or now-unshared applicant deep link is not resolved by the applicant drawer; the page also rejects unavailable authorized applicant IDs.
- **PROJ-HR-05:** malformed learner profile JSON fails closed; eligible project previews are capped at ten items.

These checks are implemented in `tests/unit/chat19-projects-recruiter-role-journey.test.ts` (commit `4c609669`). They do **not** certify HTTP/session expiry, parallel submissions, DB rollback, signed-URL behavior, or browser navigation. HR role has no direct Projects mutation exposed by the scoped pages reviewed; read-only applicant project previews are the relevant role journey.

## Follow-up verification and unclosed risk

- Re-run all tests and TypeScript checking on the branch, including the pre-existing HR tests; this GitHub-only session cannot execute the repository or PostgreSQL test harness.
- Perform keyboard/focus, TalkBack/VoiceOver and real-device 320/360/390px acceptance for all altered DataTable/ScrollCue surfaces.
- HR messaging and multi-tab write races belong to the HR service integration coverage owned by chat-15/16, and require a DB-backed adversarial run; static route tests do not establish those guarantees.
- More work may be necessary in deeply nested `/college` components: page entry-point scanning is not a full end-to-end UX certification.
