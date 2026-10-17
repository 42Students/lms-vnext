# Learner / Profile and miscellaneous — chat-6 acceptance

Audit: `docs/audit/pages/learner/profile-misc.md`. The owner decision `docs/audit/owner-decisions-resolved.md` permits links only while private object storage is not provisioned. Tests were **not run**.

| ID | Status | Evidence / unblock condition |
|---|---|---|
| LEARNER-profile-misc-01 | BLOCKED | Legacy resume upload/replace/remove and Drive import need a provisioned private bucket, malware scanning, scoped signed learner upload receipts and a default application attachment. Text fields cannot substitute for uploaded resumes; see queue blocker. |
| LEARNER-profile-misc-03 | BLOCKED | Aadhaar, PAN, and education marksheet PDF/JPG/PNG need private object storage, malware scanning, verified receipts and protected access checks before upload controls or verification can be accepted; see queue blocker. |
| LEARNER-profile-misc-04 | BLOCKED | Video introduction recording and upload require safe camera/file capture, private video storage, scanner and verified delivery receipts; see queue blocker. |

No upload is claimed complete or safe without those dependencies. These blocked IDs intentionally have no passing tests pretending private storage exists; when provisioned the orchestrator should require named upload/integration tests for each ID.

| LEARNER-profile-misc-23 | DONE | `src/app/(authenticated)/learn/notifications/page.tsx`, `src/components/activity/learner-notifications-inbox.tsx`; `tests/unit/chat6-learner-notification-copy-round2.test.ts` → `LEARNER-profile-misc-23 removes extraneous history header counts and pinned duplication while retaining feed` |

## Source verification batch (orchestrator still runs integration/browser acceptance)

| ID | Status | Evidence and test |
|---|---|---|
| LEARNER-profile-misc-07 | DONE (source verified; browser/DB pending) | `src/components/profile/learner-profile-workspace.tsx`; `tests/unit/chat6-learner-profile-round2-verified.test.ts` → `LEARNER-profile-misc-07 restores exact legacy section headings` |
| LEARNER-profile-misc-09 | DONE (source verified; browser/DB pending) | `src/components/profile/learner-profile-workspace.tsx`; `tests/unit/chat6-learner-profile-round2-verified.test.ts` → `LEARNER-profile-misc-09 shows profile completion ring and completed remaining pills` |
| LEARNER-profile-misc-10 | DONE (source verified; browser/DB pending) | `src/components/profile/learner-profile-workspace.tsx`; `tests/unit/chat6-learner-profile-round2-verified.test.ts` → `LEARNER-profile-misc-10 guards unsaved profile edits before discarding` |
| LEARNER-profile-misc-11 | DONE (source verified; browser/DB pending) | `src/components/profile/learner-profile-workspace.tsx`; `tests/unit/chat6-learner-profile-round2-verified.test.ts` → `LEARNER-profile-misc-11 refreshes saved profile on returning to visible tab` |
| LEARNER-profile-misc-12 | DONE (source verified; browser/DB pending) | `src/app/(authenticated)/learn/profile/page.tsx`, `src/components/profile/learner-profile-workspace.tsx`; `tests/unit/chat6-learner-profile-round2-verified.test.ts` → `LEARNER-profile-misc-12 supports deep links to profile sections` |
| LEARNER-profile-misc-13 | DONE (source verified; browser/DB pending) | `src/components/profile/learner-profile-workspace.tsx`, `src/components/profile/learner-skill-catalog-input.tsx`; `tests/unit/chat6-learner-profile-round2-verified.test.ts` → `LEARNER-profile-misc-13 provides skill catalogue searching instead of free text only` |
| LEARNER-profile-misc-14 | DONE (source verified; browser/DB pending) | `src/app/(authenticated)/learn/profile/page.tsx`; `tests/unit/chat6-learner-profile-round2-verified.test.ts` → `LEARNER-profile-misc-14 shows verification badge at top of profile` |
| LEARNER-profile-misc-21 | DONE (source verified; browser/DB pending) | `src/components/activity/learner-notifications-inbox.tsx`, `src/components/activity/notification-list.tsx`; `tests/unit/chat6-learner-profile-round2-verified.test.ts` → `LEARNER-profile-misc-21 displays audience context for learner notifications` |
| LEARNER-profile-misc-22 | DONE (source verified; browser/DB pending) | `src/app/(authenticated)/learn/notifications/page.tsx`, `src/modules/announcements/service.ts`; `tests/unit/chat6-learner-profile-round2-verified.test.ts` → `LEARNER-profile-misc-22 merges college department program and class announcements safely` |
| LEARNER-profile-misc-26 | DONE (source verified; browser/DB pending) | `src/components/attendance/learner-attendance-workspace.tsx`; `tests/unit/chat6-learner-profile-round2-verified.test.ts` → `LEARNER-profile-misc-26 shows total attendance and accurate marked-session explanation` |

| LEARNER-profile-misc-24 | DONE (source authored; browser pending) | `src/components/academics/learner-class-schedule.tsx`; `tests/unit/chat6-learner-calendar-round3.test.ts` → `LEARNER-profile-misc-24 restores the today next and all courses schedule labels` |
| LEARNER-profile-misc-25 | DONE (source verified; browser failure injection pending) | `src/app/(authenticated)/learn/calendar/error.tsx`; `tests/unit/chat6-learner-calendar-round3.test.ts` → `LEARNER-profile-misc-25 renders the legacy partial calendar failure with Retry` |

| LEARNER-profile-misc-02 | BLOCKED | Profile-photo binary upload and import-from-link cannot be represented by initials or a remote unsanitized URL. Safe replacement requires private object storage, malware/format scanning, verified upload receipts and per-user authorization; approved link-only storage policy does not authorize exposing arbitrary photo bytes. |

| LEARNER-profile-misc-08 | NOT-A-GAP | OD-38 preserves the intentional academic identity/verification separation, career-coverage checklist and privacy explanation; these additions prevent a learner mistaking an optional profile score for verified identity. `src/app/(authenticated)/learn/profile/page.tsx`, `src/components/profile/learner-profile-workspace.tsx`; `tests/unit/chat6-learner-safe-profile-enhancements.test.ts` → `LEARNER-profile-misc-08 NOT-A-GAP preserves explicit profile/identity verification separation and approved helpful sections`. |
