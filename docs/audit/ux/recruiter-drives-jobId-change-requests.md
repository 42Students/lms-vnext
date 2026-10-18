# /recruiter/drives/[jobId]/change-requests — UX source review

- **Scope:** `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/page.tsx`. **Contract:** Recruiter drive change requests, COMPANY-only read, shared PageHeader and return action.
- **Before:** Return action was a separate 40px link after the page heading, with weak keyboard emphasis.
- **After:** PageHeader owns the unchanged “Back to drive” action, now 44px minimum and focus-visible; existing pending/error and same-party data checks remain.
- **State/access:** Service denies missing/foreign jobs; non-COMPANY party gets 404; not-ready notice is explicit; composer keeps its existing validation and busy state.
- **Test:** `tests/unit/UX-recruiter-drives-jobId-change-requests-01.test.ts` (source contract, authored; **not executed here**).
- **Evidence remaining:** browser at 320/360/390px, keyboard/SR, typecheck and unit execution by orchestrator. Do not mark accepted before those pass.
