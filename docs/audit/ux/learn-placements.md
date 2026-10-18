# UX review — /learn/placements

- Source: `src/app/(authenticated)/learn/placements/page.tsx`.
- Audited / improved: Preserved server-side redirect.
- Loading, empty, error and stale: Preserved route `loading.tsx`/`error.tsx`, truthful server data and existing actionable state copy. Legacy wording was not replaced.
- Mobile/keyboard: Semantic single content region and focus/touch dimensions audited; contrast updated to signed-off semantic token where needed.
- Security: No write or tenant scope changes; existing server validation continues to govern.
- Test: `tests/unit/ux-learn-chat7-batch-04.test.ts`, `UX-learn-learn-placements-01`.
- Pending: orchestrator unit/typecheck and 320px/native WebView/AT evidence.
