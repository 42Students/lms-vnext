# Chat-3 graceful operation — touched-page evidence

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md`, checklist `docs/audit/graceful/CHECKLIST.md`. Tests are **written but not run**, `tests/unit/chat-3-graceful-pages.test.ts`. This evidence applies to chat-3 touched pages: TPO Drives, Public Recruiter Invite, College Courses & Content, College Attendance, College People, Super Admin Tenant Create and Sign-in Settings, and Learner Profile & Learning. It does not declare all LMS routes covered.

| GR ID | Page-scope status | Evidence (file and named test) |
| --- | --- | --- |
| GR-04 | PARTIAL | Shared `apiFetch` on course create/edit/display, teaching assignments, attendance correction, organization/college create and sign-in policies, college people student/faculty import and student registration, learner profile/contact/sections, recruiter invite and drive creation; other pathways remain. Test `GR-04 course, college, attendance, profile and recruiter actions use guarded network and JSON parsing` |
| GR-19 | DONE | Offering `loading.tsx`, college attendance `loading.tsx`, learner profile `loading.tsx`, test `GR-19 course detail, college attendance and learner profile show loading skeletons` |
| GR-20 | DONE | Each route's `error.tsx` renders human-readable failure with Retry, test `GR-20 page-level errors offer Retry rather than a raw framework failure` |
| GR-30 | PARTIAL | Ref-lock guarded writes on high-risk TPO drive creation, course flows, attendance, college/organization creation, learner profile changes. Test `GR-30 attendance correction uses the shared ref-locked guarded action`. Wider page mutation coverage pending. |
| GR-31 | PARTIAL | Shared `useGuardedAction` now wraps attendance correction, tenant creation, course creation/edit/display, learner profile writes and drive creation; recruiter invite uses a busy lock. Other mutating paths in those pages still require adoption. Test `GR-31 mutating attendance correction and learner contact save guard duplicate actions`, plus GR-30. |
| GR-32 | PARTIAL | Correction 409 message preserves drawer; learner contacts stale notice. Global rebase/re-apply action still requires helper. Test `GR-32 concurrent attendance correction shows recovery text without discarding learner selection` |
| GR-33 | PARTIAL | Publishing a drive validates future application deadline, recorded pay or stipend, and HTTPS employer URL before writes; full field-to-schema parity remains. Test `GR-33 TPO-drives-42 preflight refuses missing deadline and pay before first write`. |
| GR-35 | DONE | Attendance correction in named drawer without `window.confirm`; course archive uses ConfirmDialog. Test `GR-35 attendance correction uses named drawer instead of disruptive browser confirm` |
| GR-60 | PARTIAL | Tenant organization and college create forms persist/restored per-form drafts and guard unsaved leave, clear only after create; course/drive and remaining long-form drafts require further adoption. Test `GR-60 SA-tenants-modules-09 organization and college forms retain drafts on failed writes`. |
| GR-71 | DONE | Courses catalogue has filtered-empty notice; attendance distinguishes no delivery/roster/sessions. Loading and route failure handled separately. Test `GR-71 course catalogue and attendance lists explain empty vs filtered empty` |
| GR-73 | PARTIAL | URL filters persist through attendance navigation, invalid query gets recoverable notice. Test `GR-73 invalid attendance filters recover without losing valid selection in navigation` |
| GR-90 | DONE | Attendance mutation and course error boundary use role=alert and messages, test `GR-90 no raw error code in corrected attendance alert and course load error summary` |
| GR-91 | DONE | Retry buttons are native keyboard focusable, test `GR-91 Retry is keyboard-accessible in all three role error screens` |

Open per-page items: complete apiFetch/guarded-action/draft adoption in other subflows; card-level partial failures, restored draft conflict re-application and per-field error accessibility. Shared chat-14 helpers are now on main and are reused where this evidence claims. **No browser acceptance has been executed; accessibility/contrast remains unverified.**

| GR-04 | DONE (TPO deadline form) | `src/components/placements/tpo-drive-deadline-form.tsx` now uses `apiFetch`; named test `GR-04 TPO-drives-15 deadline mutation handles non-JSON and 5xx responses` in `tests/unit/tpo-drives-chat-3-round4.test.ts`. No suite executed. |
| GR-30 | DONE (TPO deadline form) | Guarded action lock; named test `GR-30 TPO-drives-15 deadline mutation uses guarded pending lock`. |
| GR-35 | DONE (TPO deadline form) | Replace browser confirm with accessible `ConfirmDialog`; named test `GR-35 TPO-drives-15 deadline consequences use accessible ConfirmDialog`. |
