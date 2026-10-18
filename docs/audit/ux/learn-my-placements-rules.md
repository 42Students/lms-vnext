# UX review — /learn/my-placements/rules

- Source: `src/app/(authenticated)/learn/my-placements/rules/page.tsx`.
- Audited / improved: Contrast-safe foreground for teal links/labels; 320px content min-width containment.
- Loading, empty, error and stale: Preserved route `loading.tsx`/`error.tsx`, truthful server data and existing actionable state copy. Legacy wording was not replaced.
- Mobile/keyboard: Semantic single content region and focus/touch dimensions audited; contrast updated to signed-off semantic token where needed.
- Security: No write or tenant scope changes; existing server validation continues to govern.
- Test: `tests/unit/ux-learn-chat7-batch-04.test.ts`, `UX-learn-learn-my-placements-rules-01`.
- Pending: orchestrator unit/typecheck and 320px/native WebView/AT evidence.
