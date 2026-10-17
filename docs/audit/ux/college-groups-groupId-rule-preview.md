# UI/UX excellence — /college/groups/[groupId]/rule-preview

Initial concern: narrow-screen page content, small interaction targets or long list/table reading.

Implemented: 44px keyboard/tap targets; constrain narrow-screen content width. Code: `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx`.

No text, business state, filters, backend routes, mutation semantics, or tenant scope changes. Existing empty and recovery behaviors unchanged; browser acceptance at 320px, focus order, reduced motion and screen readers is still pending.

Regression contract: `tests/unit/chat4-college-ux-round6.test.ts` named `UX-college-groups-groupId-rule-preview-01`. Tests written, not run; do not check off until green.
