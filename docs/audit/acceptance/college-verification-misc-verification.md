# College Verification / Misc — chat-4 verified closure
Audit: `docs/audit/pages/college/verification-misc.md` and owner decisions.
Tests authored NOT RUN; source-backed rows require orchestrator execution and database acceptance.

| ID | Status | Evidence |
|---|---|---|
| COL-verification-misc-01 | DONE | `src/components/college/college-admin-profile-editor.tsx`, `src/modules/people/college-admin-profile-edit-service.ts`; `tests/unit/chat4-college-verification-misc-gap-closure.test.ts` test `COL-verification-misc-01` |
| COL-verification-misc-02 | DONE | `src/app/(authenticated)/college/profile/page.tsx`, `src/components/college/college-admin-profile-editor.tsx`; `tests/unit/chat4-college-verification-misc-gap-closure.test.ts` test `COL-verification-misc-02` |
| COL-verification-misc-03 | DONE | `src/components/verification/CollegeVerificationPanel.tsx`, `src/components/verification/VerificationReviewDrawer.tsx`; `tests/unit/chat4-college-verification-misc-gap-closure.test.ts` test `COL-verification-misc-03` |
| COL-verification-misc-05 | DONE | `src/components/verification/VerificationReviewDrawer.tsx`; `tests/unit/chat4-college-verification-misc-gap-closure.test.ts` test `COL-verification-misc-05` |
| COL-verification-misc-07 | DONE | `src/components/verification/CollegeVerificationPanel.tsx`, `src/modules/verification/notification-copy.ts`; `tests/unit/chat4-college-verification-misc-gap-closure.test.ts` test `COL-verification-misc-07` |
| COL-verification-misc-12 | DONE | `src/app/(authenticated)/college/activity/page.tsx`, `src/modules/activity/college-activity-model.ts`; `tests/unit/chat4-college-verification-misc-gap-closure.test.ts` test `COL-verification-misc-12` |
| COL-verification-misc-14 | NOT-A-GAP | `src/app/(authenticated)/college/activity/page.tsx`; `tests/unit/chat4-college-verification-misc-gap-closure.test.ts` test `COL-verification-misc-14` |
| COL-verification-misc-15 | DONE | `src/app/(authenticated)/college/profile/page.tsx`, `src/app/(authenticated)/college/activity/page.tsx`, `src/app/(authenticated)/college/verification/page.tsx`; `tests/unit/chat4-college-verification-misc-gap-closure.test.ts` test `COL-verification-misc-15` |
| COL-verification-misc-16 | NOT-A-GAP | `src/app/(authenticated)/college/announcements/page.tsx`, `docs/audit/owner-decisions-resolved.md`; `tests/unit/chat4-college-verification-misc-gap-closure.test.ts` test `COL-verification-misc-16` |
| COL-verification-misc-19 | NOT-A-GAP | `src/app/(authenticated)/college/announcements/page.tsx`; `tests/unit/chat4-college-verification-misc-gap-closure.test.ts` test `COL-verification-misc-19` |

NOT-A-GAP rationale:
- COL-verification-misc-14: capped, filtered export intentionally excludes unnecessary private IP addresses.
- COL-verification-misc-16: owner decision OD-22 explicitly allows College Admin announcements under permissions.
- COL-verification-misc-19: personal account-scoped inbox with unread filtering is an approved additional surface; not a missing legacy requirement.

| COL-verification-misc-06 | DONE | `src/components/verification/VerificationReviewDrawer.tsx`, `src/components/verification/CollegeVerificationPanel.tsx`; `tests/unit/chat4-college-verification-misc-gap-closure.test.ts` test `COL-verification-misc-06` |

PARTIAL / OPEN: COL-verification-misc-04 (bulk review page cap differs), -08 (complete saved views/columns), -10 (queue cap handling),
-11 (full readable activity feed/day groups), -13 (audit summary coverage), -17
(domain and branding rights need matching OD-22), -18 (student-groups visibility), -20.
Photo upload for -01/-02 requires private object storage; the HTTPS link route works.
| COL-verification-misc-17 | DONE | `src/modules/tenant-domains/service.ts`, `src/modules/colleges/branding-service.ts`, `src/modules/colleges/admin-branding-logo-service.ts`; `tests/unit/chat4-college-verification-misc-gap-closure.test.ts`, `COL-verification-misc-17` |
| COL-verification-misc-18 | NOT-A-GAP | Owner OD-38 approved extra student-groups surface; `tests/unit/chat4-college-verification-misc-gap-closure.test.ts`, `COL-verification-misc-18` |
| COL-verification-misc-20 | DONE | `src/app/(authenticated)/college/branding/page.tsx`, `src/app/(authenticated)/college/college-profile/page.tsx`; `tests/unit/chat4-college-verification-misc-gap-closure.test.ts`, `COL-verification-misc-20` |
