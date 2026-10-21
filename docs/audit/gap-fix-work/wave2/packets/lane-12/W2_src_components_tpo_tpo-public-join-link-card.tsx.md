# Work packet (wave 2): edit src/components/tpo/tpo-public-join-link-card.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-companies.md, docs/audit/gap2/lane-16/u022-tpo-public-link.md

## G2-11-007-039  [P2] GAP  facet F06  effort S
- Legacy: Legacy domain input placeholder `techmahindra.com`, required nonblank trim; Enter submits domain. `docs/legacy-source/frontend/src/components/tpo/company/CompanyLinkCard.jsx:71`
- vNext now: vNext placeholder `company.com`, button Add domain, input no keydown Enter handler. `src/components/tpo/tpo-public-join-link-card.tsx:144`
- Fix: Restore placeholder and Enter-to-add behavior.

## G2-11-007-052  [P2] GAP  facet F09  effort M
- Legacy: Legacy `New link` Popconfirm title `Make a new link?`, description `The old link stops working.`, ok `Make a new link`. `docs/legacy-source/frontend/src/components/tpo/company/CompanyLinkCard.jsx:89`
- vNext now: vNext ConfirmDialog opens on replace and uses PUBLIC_JOIN_LINK_COPY schema. `src/components/tpo/tpo-public-join-link-card.tsx:194`
- Fix: Align dialog exact strings/buttons/focus and confirmation path.

## G2-11-007-058  [P2] GAP  facet F10  effort L
- Legacy: Legacy CompanyLinkCard invokes GET company engagement, POST domain, POST new link, PUT trust. `docs/legacy-source/frontend/src/components/tpo/company/CompanyLinkCard.jsx:3`
- vNext now: vNext public-join-links POST, domain POST, link enabled POST; trust handled by separate lifecycle PATCH/service. `src/components/tpo/tpo-public-join-link-card.tsx:20`
- Fix: Preserve user-visible results; trace status and audit parity for each endpoint.

## G2-11-007-091  [P2] GAP  facet F18  effort M
- Legacy: Legacy domain placeholder `techmahindra.com`, `New link`, `Make a link`, `Trusted company`. `docs/legacy-source/frontend/src/components/tpo/company/CompanyLinkCard.jsx:71`
- vNext now: vNext domain placeholder `company.com`, join switch `Link is on/off`. `src/components/tpo/tpo-public-join-link-card.tsx:144`
- Fix: Port exact wording; keep link-enabled concept separate.

## G2-11-007-104  [P2] GAP  facet F22  effort L
- Legacy: Legacy company link fields joinTokenHash, joins, opens, trusted, createdAt on college_company with unique college/company. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:104`
- vNext now: vNext split placementCompanyRelationships and public join link records, link enabled status and CAS identity. `src/components/tpo/tpo-public-join-link-card.tsx:154`
- Fix: Map every old join/trust field and defaults, check migrations and unique indexes.

## G2-16-022-018  [P2] GAP  facet F10  effort S
- Legacy: TpoPublicLinkController.java:39-51 GET,POST new,PUT save.
- vNext now: tpo-public-join-link-card.tsx:38-46 POST create,109-112 POST enable, GET status.
- Fix: Adapt old API contract if clients retained.
