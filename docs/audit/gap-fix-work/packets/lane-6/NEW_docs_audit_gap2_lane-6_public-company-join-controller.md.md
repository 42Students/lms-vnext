# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/public-company-join-controller.md

5 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/public-company-join-controller.md

## G2-6-026-016  [P1] GAP  facet F06  effort S
- Legacy: Legacy send-code requires only form email input (company-join/[token].js:61-72,117-123).
- vNext now: VNext sendCode validates email, name,phone,companyName form before requesting code (public-recruiter-join-form.tsx:52-59).
- Fix: Allow sending code with valid work email alone; collect/validate optional name later at join.

## G2-6-026-034  [P1] GAP  facet F12  effort M
- Legacy: Legacy work email must resolve to a company-owned domain (CompanyJoinService.java:239-253).
- vNext now: VNext matches link companyDomain to work email and checks MX (send-code-service.ts:72-91).
- Fix: Support all registered verified company domains and avoid unsafe broad suffix acceptance.

## G2-6-026-020  [P2] GAP  facet F07  effort M
- Legacy: Legacy invalid link returns 404 {error:LINK_INVALID}, all other JoinProblem as 400 with error,message (PublicCompanyJoinController.java:51-55).
- vNext now: VNext POST code/join usually returns generic 400/503 code-only; page invalid renders 200 UX (send-code/route.ts:23-35; join/route.ts:19-34; page.tsx:9-20).
- Fix: Document privacy-safe 404/generic error choice; show exact invalid-link UX without leaking token.

## G2-6-026-022  [P2] GAP  facet F07  effort S
- Legacy: Legacy FIRST_NAME_REQUIRED appears under firstName with 'Enter your name' (CompanyJoinService.java:153-154; company-join/[token].js:6-10).
- vNext now: VNext client validates name, global notice on error (public-recruiter-join-form.tsx:52-59,87-93,217).
- Fix: Attach name error below corresponding input and focus field.

## G2-6-026-025  [P3] GAP  facet F08  effort S
- Legacy: Legacy joined page reports full sentence success incl college and sign-in email (company-join/[token].js:98-105).
- vNext now: VNext joined branch renders corresponding headings and sign-in hint (public-recruiter-join-form.tsx:134-142).
- Fix: Clone exact shared sign-in subtitle for both already-joined and first-join outcomes.
