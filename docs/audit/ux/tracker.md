# /tracker — UX source review

- **Surface:** `src/app/(authenticated)/tracker/page.tsx`.
- **Before:** Issue reporter root contained tight width and short 'My reports' touch target.
- **After:** Preserved legacy 'What went wrong?' heading and reporter form; widened the responsive container with min-w-0, and made 'My reports' a 44px accessible link.
- **Authority and states:** Runtime-gated form, role-aware admin navigation, and contextual prefill remain intact.
- **Test:** `tests/unit/UX-tracker-01.test.ts` (authored, **unexecuted**).
- **Still needed:** 320/360/390px device, keyboard, screen-reader and typecheck/unit evidence before acceptance; canonical role UI audits owned by the HR slice where delegated.
