# Work packet: edit src/app/(authenticated)/learn/my-placements/applications/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-applications.md

## G2-12-006-006  [P1] GAP  facet F03  effort M
- Legacy: Cards show 44px company logo, jobType, pay, applied date, compact rounds, chip and chevron `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:124-141`
- vNext now: Mapped item excludes logo/pay/jobType; journey component uses plain status `src/app/(authenticated)/learn/my-placements/applications/page.tsx:37-61`
- Fix: Provide missing fields and header icon/layout

## G2-12-006-010  [P1] GAP  facet F04  effort S
- Legacy: Cards show company logo, role, company, job type, pay and applied date `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:126-134`
- vNext now: Server props only title/company/channel/submittedAt and lifecycle `src/app/(authenticated)/learn/my-placements/applications/page.tsx:37-61`
- Fix: Add consent-safe company logo/pay/type

## G2-12-006-011  [P1] GAP  facet F04  effort S
- Legacy: Staff opt-out timestamp day and time `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:121-121,144-146`
- vNext now: Has staffOptOutUntil but Drawer never displays countdown `src/app/(authenticated)/learn/my-placements/applications/page.tsx:46-48`
- Fix: Expose opt-out deadline and direct action

## G2-12-006-068  [P1] GAP  facet F22  effort S
- Legacy: Legacy application data with withdraw enum SELF/REQUEST `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:48-49,82-86`
- vNext now: New normalized row no withdraw enum, UUID and field channel `src/app/(authenticated)/learn/my-placements/applications/page.tsx:37-61`
- Fix: Expose effective permission mode

## G2-12-006-069  [P1] GAP  facet F22  effort S
- Legacy: Logo/pay/jobType/offer/cancelReason fields present `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:126-155`
- vNext now: Mapped item lacks those fields `src/app/(authenticated)/learn/my-placements/applications/page.tsx:37-61`
- Fix: Extend safe projection
