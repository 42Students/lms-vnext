# Screen #08: Course Discussions — actionable prototype/code audit

**Original reference:** `Course › Discussions.png` in user-uploaded `42LMS pages prototype-png-faculty.zip`; route `/teacher/courses/:deliveryId/discussions`.
**Audit phase:** RECHECK; **rendered visual parity not signed off**.
**Earlier test evidence, not current-code guarantee:** https://github.com/42Students/lms-vnext/actions/runs/40295982638.

## vNext source inspected

- [`src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/app/(authenticated)/teacher/courses/%5BdeliveryId%5D/discussions/page.tsx)
- [`src/components/courses/learner-course-discussion.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/courses/learner-course-discussion.tsx)
- [`tests/e2e/faculty-discussions-prototype.spec.ts`](https://github.com/42Students/lms-vnext/blob/main/tests/e2e/faculty-discussions-prototype.spec.ts)

## Page-specific adversarial checklist

CODE = present in source, still requires verification. All checkboxes start open.

- [ ] **F08-01 · P1 · CODE:** Single card, pinned-first messages, compact Faculty composer.
- [ ] **F08-02 · P0 · CODE:** Actual Pin/Unpin/Delete with version checks and confirmation.
- [ ] **F08-03 · P0 · VERIFY:** Posts, moderation, read scope restricted to selected delivery.
- [ ] **F08-04 · P1 · DECISION:** “3 new” screenshot vs recent-24h post count: no unread cursor evidence.
- [ ] **F08-05 · P1 · VERIFY:** Older pinned message not dropped or duplicated by pagination.
- [ ] **F08-06 · P1 · VERIFY:** Composer Enter/send, failed-send retained draft, focus restoration.
- [ ] **F08-07 · P1 · VERIFY:** Delete tombstone not reappearing from concurrent load / polling.
- [ ] **F08-08 · P2 · DECISION:** Preserve useful replies despite simpler screenshot action list.
- [ ] **F08-09 · P2 · VISUAL:** Amber pinned row, action alignment and compact avatar styles.

## Mandatory evidence gates

- [ ] Original screenshot compared with rendered 1440×1000 page; record every gap.
- [ ] Responsive 390×844, keyboard, focus, Escape, labels and no horizontal document overflow.
- [ ] Negative cross-delivery / college access and privacy for this page.
- [ ] Empty, loading, error, archived, optional source unavailable and stale-data cases.
- [ ] Successful mutation + denied/stale/unknown response recovery where applicable.
- [ ] Unit + browser acceptance pass on a commit **including the latest page source**.
- [ ] Explicit final visual sign-off or documented permission/product deviations.

After every resolved row: append exact fix commit, matching post-change CI run and screenshot evidence, then update [the single closure ledger](00-closure-ledger.md).
