# UX-G184 · Authenticated route errors, loading and not-found states

**Scoped status:** DONE on 2026-11-08 for the 13 registered route-state source files. This is not a global authenticated-tenant, release or security certificate.

## Scope and UX outcomes
- 13 actual route-state components under `admin`, `college-admin`, `hr`, `teach` and `teacher`: alert/retry/error, accessible loading, and role-specific not-found recovery.
- Retry buttons remain visible and functional, and recovery links return to the appropriate role home without exposing injected private exception or digest data.
- Loading states announce busy status and delayed admin loading offers a recovery control; desktop/mobile screenshots establish nonoverflow layouts.

## Executed acceptance
- **Successful exact-SHA workflow:** [run 42462246710](https://github.com/42Students/lms-vnext/actions/runs/42462246710) on [commit `8b59040638b6e7230336ba261adf3d93921e2b60`](https://github.com/42Students/lms-vnext/commit/8b59040638b6e7230336ba261adf3d93921e2b60). The job passed scoped ESLint, full TypeScript, **14/14 shared unit regressions**, and **27/27 Chromium tests** with **0 skipped/flaky/failed**.
- Browser tests rendered the **real registered role-state components** in an isolated development-only preview, 13 states each at **1280×800 desktop** and **390×844 mobile**, plus one delayed loading retry scenario.
- [Screenshot and trace artifact 13610284011](https://github.com/42Students/lms-vnext/actions/runs/42462246710/artifacts/13610284011).
- Source drift check against main after acceptance found **none of the 13 registered route-state component paths modified**.

## Additional test hardening
- Commit [`8d721b144ab359684f643a19e517175e24f9ed02`](https://github.com/42Students/lms-vnext/commit/8d721b144ab359684f643a19e517175e24f9ed02) added a defensive **404 negative test** for unrecognized roles, unrecognized states and unsupported college-admin loading previews, plus static guard assertions, raising the expected browser count to 28.
- [New exact-SHA workflow run 42465803268](https://github.com/42Students/lms-vnext/actions/runs/42465803268) was **queued, not executed**, when this record was written. **Do not call that new run green or use it as passed evidence**. The independently verified original 27-case source acceptance above is the basis of this scoped group closure. If the added test later detects a regression, reopen and fix it.
- Dev-only preview neither authenticates real users nor reads tenant data; this proof is not a replacement for production identity/tenant release acceptance.
