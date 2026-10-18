# Chat-6 scroll and motion audit — Super Admin and Projects

Owner rules: scrollbars stay invisible globally; scrolling remains operable with wheel, touch and keyboard. No one-off motion durations.

| Surface | Container | Change | Remaining proof |
|---|---|---|---|
| Super Admin Faculty Assignment — Create teaching assignment, Course(s) chooser | `src/components/admin/super-admin-faculty-assignment-create.tsx` | Bounded vertical list has a gradient end fade that signals more courses, `overscroll-contain`, keyboard focus through `tabIndex={0}`, and `role="region"` with a clear accessible name. The course selection remains capped at 10 deliveries for one class and period. | Phone viewport, keyboard tab/arrow/space and reduced-motion browser walk |
| Projects final delivery — Save, Submit, Mentor Review, Evaluate project | `src/components/projects/project-final-delivery-controls.tsx` | No new animation; synchronous locks protect repeated submissions, while the existing dialogs retain their focus/unsaved-change guard and built-in motion token styling. | Rapid double clicks, network stalls and overlay-focus e2e, review of every nested scroll surface |

Other Super Admin middle-third pages are source-inventoried in `docs/audit/coverage/chat6-admin-middle-third-ledger.md`; full browser/phone sign-off remains open and must not be inferred from source review.
