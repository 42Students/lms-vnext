# /recruiter/drives/[jobId] — UX source review

- **Scope:** `src/app/(authenticated)/recruiter/drives/[jobId]/page.tsx`. **Contract:** Retained explicit re-export of the canonical authenticated HR page `hr/placements/jobs/[jobId]/page.tsx`.
- **Before:** Legacy entrypoint risks duplicated pages, copy drift and inconsistent shared state handling if a second UI is created.
- **After:** Kept the canonical HR implementation and original destination; no second data fetch, duplicated form, or invented copy. UI states/mobile layout are inherited from the canonical page and require joint HR-lane verification.
- **State/access:** Route remains an authenticated same-tab entrypoint; no new authority or mutations introduced.
- **Test:** `tests/unit/UX-recruiter-drives-jobId-01.test.ts` (source contract, authored; **not executed here**).
- **Evidence remaining:** browser at 320/360/390px, keyboard/SR, typecheck and unit execution by orchestrator. Do not mark accepted before those pass.

- **Route-level loading and retry:** The alias retains the shared GracefulPageLoading and GracefulErrorBoundary wrappers, both now asserted alongside the canonical PageHeader. No duplicated HR authorization or UI copy; phone/browser acceptance remains unexecuted.
