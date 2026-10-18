# UX rollout — /hr/profile

- **Route:** `src/app/(authenticated)/hr/profile/page.tsx`
- **Test:** `UX-hr-profile-01` in `tests/ux-hr-rollout-03.test.mjs`.
- **Review:** The page already delegates name/title/phone editing to shared RecruiterProfileDetailsEditor and grant access to RecruiterProfileAccess; its PageHeader, role access and existing messages remain the canonical legacy UI. Avoid duplicating those form controls or changing existing mutations/permissions. No source rewrite necessary.
- **States:** Source preserves editable/uneditable profile, membership and employer access details; shared child components own pending/validation. Runtime and AT checks delegated to orchestrator.
- **Validation:** Static source test authored, not executed in this GitHub-only lane.
