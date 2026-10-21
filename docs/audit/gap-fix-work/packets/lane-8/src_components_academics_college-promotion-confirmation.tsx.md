# Work packet: edit src/components/academics/college-promotion-confirmation.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-batch-promotion.md, docs/audit/gap2/lane-9/superadmin-batch-promotion-component.md, docs/audit/gap2/lane-9/superadmin-batch-promotion.md

## G2-9-002-029  [P1] MISSING  facet F06  effort M
- Legacy: Dirty cancel prompts Discard promotion changes? (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:260-280`)
- vNext now: Dialog onOpenChange setOpen directly (`src/components/academics/college-promotion-confirmation.tsx:68-80`)
- Fix: Require dirty-form discard confirmation.

## G2-9-002-040  [P1] MISSING  facet F09  effort M
- Legacy: Dirty-change confirmation Discard changes/Keep reviewing (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:262-278`)
- vNext now: No nested confirmation (`src/components/academics/college-promotion-confirmation.tsx:67-81`)
- Fix: Add nested modal and pending lock.

## G2-9-028-034  [P1] GAP  facet F09  effort M
- Legacy: Modal shows student count, class count, deactivated assignments, term/year impact and max `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:472-500`
- vNext now: Confirmation only shows version/year text and learner count `src/components/academics/college-promotion-confirmation.tsx:68-76`
- Fix: Restore full impact list and class/faculty counts

## G2-9-022-034  [P1] GAP  facet F09  effort M
- Legacy: Modal shows student count, class count, deactivated assignments, term/year impact and max `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:472-500`
- vNext now: Confirmation only shows version/year text and learner count `src/components/academics/college-promotion-confirmation.tsx:68-76`
- Fix: Restore full impact list and class/faculty counts

## G2-9-002-035  [P2] GAP  facet F08  effort M
- Legacy: Success toast Batch promoted to Semester N. (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:246-252`)
- vNext now: Batch promoted successfully or faculty setup incomplete (`src/components/academics/college-promotion-confirmation.tsx:47-62`)
- Fix: Include exact destination semester in message.

## G2-9-002-037  [P2] MISSING  facet F08  effort M
- Legacy: Graduation error Could not mark ... Retry closable (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:152-172`)
- vNext now: Generic error for promotion action only (`src/components/academics/college-promotion-confirmation.tsx:28-65`)
- Fix: Add closeable graduation-specific failure and retry.

## G2-9-028-029  [P2] GAP  facet F07  effort S
- Legacy: Closeable Batch was not promoted Alert `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:516-526`
- vNext now: Inline generic Alert with academicSetupErrorMessage `src/components/academics/college-promotion-confirmation.tsx:56-59,75-77`
- Fix: Restore title and dismissal

## G2-9-028-030  [P2] GAP  facet F08  effort S
- Legacy: Batch promoted to Semester N success toast `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:243-252`
- vNext now: Batch promoted successfully or faculty-setup incomplete message `src/components/academics/college-promotion-confirmation.tsx:50-55`
- Fix: Name target Semester N in success

## G2-9-022-029  [P2] GAP  facet F07  effort S
- Legacy: Closeable Batch was not promoted Alert `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:516-526`
- vNext now: Inline generic Alert with academicSetupErrorMessage `src/components/academics/college-promotion-confirmation.tsx:56-59,75-77`
- Fix: Restore title and dismissal

## G2-9-022-030  [P2] GAP  facet F08  effort S
- Legacy: Batch promoted to Semester N success toast `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:243-252`
- vNext now: Batch promoted successfully or faculty-setup incomplete message `src/components/academics/college-promotion-confirmation.tsx:50-55`
- Fix: Name target Semester N in success
