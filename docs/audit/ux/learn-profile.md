# UX review — /learn/profile

- Source: `src/app/(authenticated)/learn/profile/page.tsx`.
- Audited / improved: Contrast-safe foreground for teal links/labels; 44px minimum click/tap height; 320px content min-width containment.
- Loading, empty, error and stale: Preserved route `loading.tsx`/`error.tsx`, truthful server data and existing actionable state copy. Legacy wording was not replaced.
- Mobile/keyboard: Semantic single content region and focus/touch dimensions audited; contrast updated to signed-off semantic token where needed.
- Security: No write or tenant scope changes; existing server validation continues to govern.
- Test: `tests/unit/ux-learn-chat7-batch-04.test.ts`, `UX-learn-learn-profile-01`.
- Pending: orchestrator unit/typecheck and 320px/native WebView/AT evidence.
