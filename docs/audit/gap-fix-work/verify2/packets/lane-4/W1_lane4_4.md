# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-020-002 [P1] GAP facet F01
- Files: src/modules/placements/super-admin-company-identities-service.ts, src/modules/placements/tpo-company-domain-service.ts
- Legacy: Legacy domain created by recruiter/TPO/superadmin flows via shared resolver `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:16-25`
- Expected fix: Route TPO/recruiter domain mutations through same child domain aggregate.

## G2-12-020-018 [P1] GAP facet F06
- Files: src/modules/placements/super-admin-company-identities-service.ts, src/modules/placements/company-curation-domain-model.ts
- Legacy: Old rejects personal, disposable, academic and IP inputs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:90-102`
- Expected fix: Apply full legacy category blocklists and IP checks before persisted company domain.

## G2-12-020-034 [P1] GAP facet F11
- Files: src/modules/placements/super-admin-company-identities-service.ts, src/modules/placements/tpo-company-domain-service.ts
- Legacy: Old checkDomain central shared across recruiters,TPO,Settings,superadmin `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:16-25`
- Expected fix: Use one domain policy service to avoid inconsistent validation.

## G2-12-020-035 [P1] GAP facet F12
- Files: src/modules/placements/super-admin-company-identities-service.ts, src/db/schema/placement-company-identities.ts
- Legacy: Legacy verifiedBy42 false until manual verification `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- Expected fix: Keep domain unverified until explicit attestation, do not confer recruiter claim rights prematurely.

## G2-12-020-055 [P1] GAP facet F23
- Files: src/modules/placements/super-admin-company-identities-service.ts, src/modules/placements/tpo-trusted-domain-validation.ts
- Legacy: Old domain accepts website/email/registrable normalized input via one CompanyDomainService `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:16-25,77-103`
- Expected fix: Adopt shared registry validation with exact error mapping.

## G2-12-006-004 [P1] GAP facet F02
- Files: src/components/placements/learner-applications-browse.tsx
- Legacy: Each article expands inline for selection process/offers/actions `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:123-174`
- Expected fix: Restore inline accordion details for visual parity

## G2-12-006-007 [P1] GAP facet F03
- Files: src/components/placements/learner-applications-browse.tsx
- Legacy: Contextual staff opt-out, cancelled reason, company rejection banners `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:145-154`
- Expected fix: Recreate each conditionally visible banner

## G2-12-006-010 [P1] GAP facet F04
- Files: src/app/(authenticated)/learn/my-placements/applications/page.tsx
- Legacy: Cards show company logo, role, company, job type, pay and applied date `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:126-134`
- Expected fix: Add consent-safe company logo/pay/type

## G2-12-006-020 [P1] GAP facet F06
- Files: src/components/placements/learner-applications-browse.tsx
- Legacy: Request textarea rows3 max900 `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:186-188`
- Expected fix: Align textarea and schema/legacy

## G2-12-006-021 [P1] GAP facet F06
- Files: src/components/placements/learner-applications-browse.tsx
- Legacy: Withdraw button shown if server `a.withdraw` SELF/REQUEST `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:165-170`
- Expected fix: Expose server-derived withdrawal grant

## G2-12-006-022 [P1] GAP facet F07
- Files: src/components/placements/learner-applications-browse.tsx
- Legacy: Request submit disabled below3 characters, self action allowed blank reason `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:178-180`
- Expected fix: Unify runtime and DOM validation with each mode

## G2-12-006-028 [P1] GAP facet F09
- Files: src/components/placements/learner-applications-browse.tsx
- Legacy: Inline collapse triggered via role=button/aria-expanded `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:123-143`
- Expected fix: Restore expandable cards

## G2-12-006-038 [P1] GAP facet F12
- Files: src/components/placements/learner-applications-browse.tsx
- Legacy: Staff-applied can opt out before optOutUntil `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:121-121,145-147`
- Expected fix: Honor opt-out deadline visibly and in action

## G2-12-006-040 [P1] GAP facet F12
- Files: src/components/placements/learner-applications-browse.tsx
- Legacy: Backend supplied `withdraw` permission SELF/REQUEST `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:165-170`
- Expected fix: Avoid heuristic permission derivation

## G2-12-005-011 [P1] MISSING facet F03
- Files: src/components/placements/learner-general-requests.tsx
- Legacy: Upload.Dragger icon + attached filename and progress text `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:239-264`
- Expected fix: Implement signed upload and attachment affordance

## G2-12-005-028 [P1] MISSING facet F06
- Files: src/components/placements/learner-general-requests.tsx
- Legacy: Offer letter optional drag-and-drop file upload `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:259-264`
- Expected fix: Offer approved signed upload with generated secure proof URL

## G2-12-005-039 [P1] MISSING facet F09
- Files: src/components/placements/learner-general-requests.tsx
- Legacy: Dirty request close confirm `Discard this request?` and detailed warning `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:123-136`
- Expected fix: Add dirty discard confirmation

## G2-12-005-048 [P1] GAP facet F12
- Files: src/components/placements/learner-general-requests.tsx
- Legacy: Only 3 learner registration options; TPO-only Entrepreneurship/Exams read-only `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:10-21`
- Expected fix: Prevent learner from selecting TPO-only outcomes via change request if still restricted

## G2-12-005-057 [P1] MISSING facet F14
- Files: src/components/placements/learner-general-requests.tsx
- Legacy: Offer letter uploaded via `uploadFileViaPresign` folder off-campus-offer-letters `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:92-106,259-264`
- Expected fix: Add signed upload, file constraints, removal and attachment label

## G2-12-005-080 [P1] MISSING facet F21
- Files: src/components/placements/learner-general-requests.tsx
- Legacy: External R2 presign uploader handles evidence file `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:92-106`
- Expected fix: Use vNext approved signed storage API for off-campus evidence

## G2-12-005-089 [P1] GAP facet F23
- Files: src/components/placements/learner-general-requests.tsx
- Legacy: Legacy file-based proof attachment `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:92-106`
- Expected fix: Document intentional signed-URL-first policy and need to capture file source

## G2-13-012-001 [P1] GAP facet F01
- Files: src/modules/placements/public-join/send-code-service.ts, src/modules/placements/tpo-company-domain-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:22-34` Spring @Component called through MailDomainResolver.lookup by company-domain checks
- Expected fix: Extract shared DomainMailResolver service and call consistently from every relevant company-domain entry point

## G2-13-012-002 [P1] GAP facet F01
- Files: src/modules/placements/public-join/send-code-service.ts, src/modules/placements/tpo-company-domain-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:16-24` public recruiter/TPO/admin company-domain paths use one service; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:77-102` checkEmail/checkDomain
- Expected fix: Map every legacy checkEmail/checkDomain call site to vNext and apply equivalent requireMail policy

## G2-13-012-006 [P1] GAP facet F04
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:34-43` returns Answer (NO_MAIL, ACCEPTS_MAIL, UNKNOWN), caches {answer, at}
- Expected fix: Introduce discriminated ACCEPTS_MAIL/NO_MAIL/UNKNOWN result and call-site policy

## G2-13-012-007 [P1] GAP facet F04
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:94-102` normalizes to registrable domain before resolver.lookup
- Expected fix: Resolve canonical registrable domain for domain gate, or document domain-specific subdomain proof requirement

### Lane-5 fast verification triage (2026-10-22)

- **G2-12-020-002 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
- **G2-12-020-018 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
- **G2-12-020-034 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
- **G2-12-020-035 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
- **G2-12-020-055 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
- **G2-12-006-004 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
- **G2-12-006-007 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
- **G2-12-006-010 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
- **G2-12-006-020 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
- **G2-12-006-021 — DEFERRED**: Cross-service/security/data-flow behavior needs end-to-end verification.
- **G2-12-006-022 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
- **G2-12-006-028 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
- **G2-12-006-038 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
- **G2-12-006-040 — DEFERRED**: Cross-service/security/data-flow behavior needs end-to-end verification.
- **G2-12-005-011 — DEFERRED**: Cross-service/security/data-flow behavior needs end-to-end verification.
- **G2-12-005-028 — DEFERRED**: Cross-service/security/data-flow behavior needs end-to-end verification.
- **G2-12-005-039 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
- **G2-12-005-048 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
- **G2-12-005-057 — DEFERRED**: Cross-service/security/data-flow behavior needs end-to-end verification.
- **G2-12-005-080 — DEFERRED**: Cross-service/security/data-flow behavior needs end-to-end verification.
- **G2-12-005-089 — DEFERRED**: Cross-service/security/data-flow behavior needs end-to-end verification.
- **G2-13-012-001 — DEFERRED**: Cross-service/security/data-flow behavior needs end-to-end verification.
- **G2-13-012-002 — DEFERRED**: Cross-service/security/data-flow behavior needs end-to-end verification.
- **G2-13-012-006 — DEFERRED**: Cross-service/security/data-flow behavior needs end-to-end verification.
- **G2-13-012-007 — DEFERRED**: Present source does not establish full legacy behavior; needs focused functional verification.
