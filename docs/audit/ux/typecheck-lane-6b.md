# Typecheck fixes — lane chat-6b

- [x] `src/components/admin/super-admin-company-identities.tsx:46:83` — TS17001: removed the second identical `aria-label` from the Add button; retained the first label and unchanged button behavior.
- [x] `src/components/placements/tpo-trust-toggle.tsx:39:13` — TS2451 `receipt`: retained the first typed `unknown` JSON response read and its guarded validation.
- [x] `src/components/placements/tpo-trust-toggle.tsx:40:13` — TS2451 `saved`: retained the first `Record<string, unknown> | null` object guard, with no type suppression.
- [x] `src/components/placements/tpo-trust-toggle.tsx:45:13` — TS2451 `receipt`: removed the second JSON read and repeated validation block, so the response body is consumed only once.
- [x] `src/components/placements/tpo-trust-toggle.tsx:46:13` — TS2451 `saved`: removed the second declaration and identical conditional; retained the original mismatch/error handling, trust confirmation, success state, and refresh.

Static verification: one Add button `aria-label`, one `receipt`, one `saved`, one receipt validation; no behavior, imports, JSX structure, package declarations, or type assertions changed beyond eliminating the duplicate block.
