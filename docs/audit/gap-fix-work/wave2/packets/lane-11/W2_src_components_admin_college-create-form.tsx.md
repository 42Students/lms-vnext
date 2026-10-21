# Work packet (wave 2): edit src/components/admin/college-create-form.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md, docs/audit/gap2/lane-16/u020-college.md, docs/audit/gap2/lane-3/college-controller.md, docs/audit/gap2/lane-9/superadmin-colleges.md

## G2-10-023-028  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:457-543 — College creation form Organization/Name/Unique ID, optional collapsed Address.
- vNext now: src/components/admin/college-create-form.tsx:92-179 — Same basic fields and Disclosure, different layout.
- Fix: Restore Ant Card and exact optional address labels

## G2-10-023-100  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:87-115 — College entity legacy integer org/college ids, uniqueId and address fields.
- vNext now: src/components/admin/college-create-form.tsx:50-90; src/modules/colleges/admin-tenant-lifecycle-service.ts:31-42 — UUID college/org and code with active/archived lifecycle.
- Fix: Map ID/code and address fields in parity DTO

## G2-16-020-004  [P2] GAP  facet F03  effort S
- Legacy: College.java:18-21 logo and unique ID.
- vNext now: college-create-form.tsx:119-154 name and code; logo configured later.
- Fix: Preserve college logo setup affordance and exact unique ID label.

## G2-16-020-005  [P2] MISSING  facet F03  effort S
- Legacy: College.java:36-39 collegeChairId and collegeViceChairId.
- vNext now: college-create-form.tsx:91-193 has no chair selectors.
- Fix: Expose optional assignments on college setup edit.

## G2-16-020-012  [P2] GAP  facet F06  effort S
- Legacy: College.java:20-21 uniqueId unconstrained Java string.
- vNext now: college-create-form.tsx:143-153 lowercase 3–63 hyphen pattern.
- Fix: Document code normalization and old IDs with spaces/symbols.

## G2-16-020-031  [P2] MISSING  facet F18  effort S
- Legacy: College.java:36-39 collegeChairId/viceChairId optional.
- vNext now: college-create-form.tsx:155-168 only address fields.
- Fix: Restore optional chair labels in editable academic settings.

## G2-3-028-011  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:343-357`
- vNext now: `src/components/admin/college-create-form.tsx:30-48`
- Fix: Legacy bulk CSV unsaved-draft modal vs vNext independently persisted create form and import UX; align confirmation.

## G2-3-028-013  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:464-470`
- vNext now: `src/components/admin/college-create-form.tsx:103-117`
- Fix: Legacy organization selector placeholder Select organization + fetch-failure disabled; vNext preselects first option.

## G2-3-028-030  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:473-479`
- vNext now: `src/components/admin/college-create-form.tsx:119-135`
- Fix: Legacy inline required-name error Please enter college name vs vNext College name is required; exact field state differs.

## G2-3-028-031  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:459-470`
- vNext now: `src/components/admin/college-create-form.tsx:98-117`
- Fix: Legacy Organization required error Please select organization; vNext silently starts with first selected org.

## G2-3-028-067  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:459-497`
- vNext now: `src/components/admin/college-create-form.tsx:98-154`
- Fix: Legacy Ant Form.Item required validation inline + HelpHint; vNext alert-level API errors and native labels.

## G2-9-032-003  [P2] GAP  facet F01  effort S
- Legacy: Legacy selected org defaults by defaultOrgId, otherwise Select organization `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:23-52`
- vNext now: New preselects first organization even without preference `src/components/admin/college-create-form.tsx:29-35,104-116`
- Fix: Use blank Select organization initial unless fixed org

## G2-9-032-008  [P2] GAP  facet F03  effort S
- Legacy: Create College primary PlusOutlined button `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:542-546`
- vNext now: Create College without plus icon; pending Creating… `src/components/admin/college-create-form.tsx:171-183`
- Fix: Restore plus icon and same busy treatment

## G2-9-032-022  [P2] GAP  facet F06  effort M
- Legacy: Organization, College Name, Unique ID/Code always visible, with Code HelpHint `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:459-499`
- vNext now: Same main fields but help rendered permanent paragraph, horizontal grid `src/components/admin/college-create-form.tsx:97-154,169-170`
- Fix: Restore vertical labels and hover HelpHint content

## G2-9-032-024  [P2] GAP  facet F06  effort S
- Legacy: Code helper describes short permanent switcher/menu code, separate web address `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:481-498`
- vNext now: New help says immutable integrations code, omits switcher/web-domain distinction `src/components/admin/college-create-form.tsx:169-170`
- Fix: Restore old full HelpHint wording

## G2-9-032-044  [P2] GAP  facet F10  effort M
- Legacy: POST /api/v1/college/create body org_id,name,unique_id,address,city,state,country,pin `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:8-15,87-119`
- vNext now: POST /api/colleges organizationId,name,code,addresses; response HTTP201 `src/components/admin/college-create-form.tsx:54-60` `src/app/api/colleges/route.ts:25-58`
- Fix: Document API/field crosswalk

## G2-16-020-030  [P3] GAP  facet F18  effort S
- Legacy: College.java:20 uniqueId,35 pinCode.
- vNext now: college-create-form.tsx:140 `Unique ID / Code`,161 `Pin Code`.
- Fix: Match old labels where owner requests literal copy.

## G2-3-028-014  [P3] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:478-497`
- vNext now: `src/components/admin/college-create-form.tsx:119-153`
- Fix: Restore example placeholders e.g., Engineering College and e.g., nsrit or eng-college.
