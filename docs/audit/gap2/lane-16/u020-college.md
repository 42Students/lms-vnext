# U020 — College tenant entity

## Source closure

Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/College.java:1-44` + inherited BaseModel, old CollegeController/CollegeService/CollegeRepository and migration tenant/branding/role fields; optional chair/vice-chair were stored as integer faculty IDs. vNext `src/db/schema/colleges.ts:1-44`, `college-branding.ts:1-75`, `src/modules/colleges/service.ts:1-668`, `src/components/admin/college-create-form.tsx:1-193`, `src/modules/colleges/branding-service.ts`, tenant domain and identity membership schema. UI/HTTP not owned by JPA entity; live parity needs college form browsing. Basenames resolve these paths, physical lines start 1. No code/CI.

| ID | Facet | Legacy (file:line) | vNext (file:line) | Verdict | Severity | Fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-16-020-001 | F01 | College.java:10-15 persistent college tenancy. | colleges.ts:14-22 colleges with organization UUID. | MATCH | P3 | Retain college tenant identity. | S |
| G2-16-020-002 | F01 | College.java:36-41 chair/vice chair/org IDs. | colleges.ts:18-20 org FK, no chair fields. | GAP | P1 | Provide chair and vice-chair via optional scoped memberships/role assignments. | M |
| G2-16-020-003 | F02 | College.java:16-41 name, logo, unique ID, address, chair and org. | colleges.ts:21-31 same profile except chairs in separate role model. | GAP | P2 | Show all original college fields in admin detail, including optional chairs. | S |
| G2-16-020-004 | F03 | College.java:18-21 logo and unique ID. | college-create-form.tsx:119-154 name and code; logo configured later. | GAP | P2 | Preserve college logo setup affordance and exact unique ID label. | S |
| G2-16-020-005 | F03 | College.java:36-39 collegeChairId and collegeViceChairId. | college-create-form.tsx:91-193 has no chair selectors. | MISSING | P2 | Expose optional assignments on college setup edit. | S |
| G2-16-020-006 | F04 | College.java:16-21 name/logo/uniqueId. | colleges.ts:21-23 name/code/logoObjectPath. | GAP | P2 | Map uniqueId→code and logo URL→object path, retaining link/preview. | S |
| G2-16-020-007 | F04 | College.java:22-35 addressLine1/2,landmark,city,state,country,pinCode. | colleges.ts:24-30 same address except postalCode name. | MATCH | P3 | Use legacy display labels (Pin Code). | S |
| G2-16-020-008 | F04 | College.java:36-41 numeric chair,viceChair,org. | colleges.ts:17-20 UUID ID/org, no chairs. | GAP | P1 | Reconcile historic numeric actors and organization membership. | M |
| G2-16-020-009 | F05 | College.java:20-21 unique uniqueId column. | colleges.ts:36 globally unique lower(code). | EXTRA | P3 | Keep case-insensitive uniqueness. | S |
| G2-16-020-010 | F05 | College.java:10-15 no sorting directly in entity. | service.ts:69-130 active org and scoped college reads. | MATCH | P3 | Sort/list behavior belongs college directory page. | S |
| G2-16-020-011 | F06 | College.java:16-41 nullability permissive except BaseModel ID. | college-create-form.tsx:123-153 requires name and 3–63 code. | EXTRA | P3 | Keep safe required create validation, distinguish old nullable data imports. | S |
| G2-16-020-012 | F06 | College.java:20-21 uniqueId unconstrained Java string. | college-create-form.tsx:143-153 lowercase 3–63 hyphen pattern. | GAP | P2 | Document code normalization and old IDs with spaces/symbols. | S |
| G2-16-020-013 | F06 | College.java:32-35 country, pinCode nullable. | college-create-form.tsx:31-33 defaults country India, postalCode empty. | EXTRA | P3 | Keep India default; preserve nullable when editing. | S |
| G2-16-020-014 | F07 | College.java:20-21 uniqueness DB key. | college-create-form.tsx:83-86 exact duplicate UI message `uniqueId '...' is already used by another college`. | MATCH | P3 | Retain duplicate feedback. | S |
| G2-16-020-015 | F07 | College.java:16-21 nullable name/uniqueId. | colleges.ts:21-22 NOT NULL name/code. | EXTRA | P3 | Reject blank names/codes with field errors before insert. | S |
| G2-16-020-016 | F08 | College.java:1-44 entity no toasts. | college-create-form.tsx:65-86 messages for handoff failure and creation error. | EXTRA | P3 | Keep nonblocking setup guidance. | S |
| G2-16-020-017 | F09 | College.java:1-44 model has no dialog. | college-create-form.tsx:155-170 address Disclosure, not modal. | EXTRA | P3 | Match old admin layout disclosure behavior in page audit. | S |
| G2-16-020-018 | F10 | College.java:20-21 duplicate uniqueId prohibited. | service.ts:121-130 case-insensitive conflict checked. | MATCH | P3 | Retain unique ID globally and tenant scope. | S |
| G2-16-020-019 | F10 | College.java:36-41 chair/vice chair tied to faculty IDs. | service.ts:1-46 college CRUD and activity without direct chair fields. | GAP | P1 | Implement assignment/validation as separate association with audit. | M |
| G2-16-020-020 | F10 | College.java:18-19 string logo, possible URL. | colleges.ts:23 stores logoObjectPath and branding table logoUrl. | GAP | P2 | Bridge old logo storage and new signed preview, no raw uncontrolled URL. | S |
| G2-16-020-021 | F11 | College.java:40-41 orgId scopes college. | colleges.ts:18-20 org FK and service.ts:69-118 active org. | EXTRA | P3 | Keep tenant foreign key enforcement. | S |
| G2-16-020-022 | F11 | College.java:36-39 chair IDs without active staff check in model. | colleges.ts:14-43 no chair fields. | GAP | P2 | Validate active faculty membership in chair role when adding. | S |
| G2-16-020-023 | F12 | College.java:20-21 uniqueId unique but no lowercase normalization. | colleges.ts:36 lower(code) global unique. | GAP | P3 | Preserve case-folded match for historical uniqueId URLs. | S |
| G2-16-020-024 | F12 | College.java:18-19 logo field nullable. | college-branding.ts:33-35 optional branding logo. | MATCH | P3 | No logo row means LMS default. | S |
| G2-16-020-025 | F13 | College.java:1-44 no error/loading state. | college-create-form.tsx:184-190 draft restored and inline error. | EXTRA | P3 | Retain recoverable draft/error state. | S |
| G2-16-020-026 | F14 | College.java:18-19 logo stored as text; no file upload in entity. | college-branding.ts:33-35 logo URL; separate logo upload service. | GAP | P2 | Ensure signed safe branding upload/preview path. | S |
| G2-16-020-027 | F15 | College.java:1-44 no email triggers. | service.ts:10-12 activity recorder only. | MATCH | P3 | Keep CRUD without unsolicited mail. | S |
| G2-16-020-028 | F16 | College.java:1-44 backend only. | college-create-form.tsx:95,155-168 desktop columns and mobile stack. | EXTRA | P3 | Review UI breakpoint parity separately. | S |
| G2-16-020-029 | F17 | College.java:1-44 backend no keyboard. | college-create-form.tsx:97-153 labelled native select/input. | EXTRA | P3 | Maintain labelled native form, warnings accessible. | S |
| G2-16-020-030 | F18 | College.java:20 uniqueId,35 pinCode. | college-create-form.tsx:140 `Unique ID / Code`,161 `Pin Code`. | GAP | P3 | Match old labels where owner requests literal copy. | S |
| G2-16-020-031 | F18 | College.java:36-39 collegeChairId/viceChairId optional. | college-create-form.tsx:155-168 only address fields. | MISSING | P2 | Restore optional chair labels in editable academic settings. | S |
| G2-16-020-032 | F19 | College.java:20-21 unique index from @Column. | colleges.ts:36-41 unique lower(code), org/status indexes. | EXTRA | P3 | Keep efficient org/active queries. | S |
| G2-16-020-033 | F20 | College.java:20-21 two concurrent create identical code rejected at DB. | service.ts:121-130 precheck and colleges.ts:36 unique index. | MATCH | P3 | Map race to conflict message. | S |
| G2-16-020-034 | F20 | College.java:36-39 numeric chair could refer to another college. | colleges.ts:14-43 lacks assignment. | GAP | P1 | Use composite membership college scope and transaction for chair edits. | M |
| G2-16-020-035 | F21 | College.java:18 logo may be legacy storage URL. | college-branding.ts:19-22 enforce HTTPS logo URL, college logo object path. | EXTRA | P3 | Keep allowlisted storage integration. | S |
| G2-16-020-036 | F22 | College.java:15-41 MySQL college table, BaseModel numeric ID and three actor IDs. | colleges.ts:14-43 UUID PK/FK, no chair fields, status column new. | GAP | P1 | Write field mapping and role association migration incl chairs and linkable old code. | M |
| G2-16-020-037 | F22 | College.java:22-35 address text fields unspecified max. | colleges.ts:24-30 varchar limits city/state/country128, postal32. | GAP | P3 | Handle long legacy addresses safely with field-specific errors. | S |
| G2-16-020-038 | F23 | College.java:36-39 chair/viceChair are top-level columns. | colleges.ts:14-43 omitted. | MISSING | P1 | Restore optional leadership assignment contract. | M |
| G2-16-020-039 | F23 | College.java:16-41 lacks status archive lifecycle. | colleges.ts:31,38-41 status ACTIVE etc. | EXTRA | P3 | Keep archive safety, no invisible data deletion. | S |

## Unit summary

39 rows; all 23 facets. Verdict {"MATCH":8,"GAP":15,"MISSING":3,"EXTRA":13}; severity {"P3":24,"P1":6,"P2":9}. Top three: missing chair/vice-chair links, numeric→UUID ownership/organization mapping and legacy logo field vs object-path/branding split. UNKNOWN: live CollegeController responses and legacy exact form styling/selection validation; resolve before implementation.
