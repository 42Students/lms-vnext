# U010 — AdminAttendancePolicyController gap audit v2

## Full source map / closure
- `LC` = `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendancePolicyController.java`
- `LF` = `docs/legacy-source/frontend/src/components/admin/PolicySettingField.js`
- `LA` = `docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js`
- `NP` = `src/app/(authenticated)/college/attendance/page.tsx`
- `NS` = `src/modules/attendance/policy-service.ts`
- `NV` = `src/modules/attendance/policy-validation.ts`
- `NR` = `src/app/api/attendance/admin/policy/route.ts`
- `NW` = `src/components/attendance/college-attendance-policy-form.tsx`
- `NU` = `src/components/admin/super-admin-attendance-settings-editor.tsx`
- `NA` = `src/modules/attendance/admin-service.ts`
- `NB` = `src/db/schema/attendance.ts`

Legacy read-only controller, AppSettingsService tenant key usage through `PolicySettingField`, actual attendance page, compared with vNext policy reader/updater, API, validation, new college policy editor, Super Admin editor, attendance permission guard and Drizzle policy schema. Aliases such as LC:44-52 are the mapped file plus 1-based lines. This intentionally audits read-only permission semantics, even though vNext has added a write API. No source changes.

## 23 facets
| ID | Facet | Legacy behaviour (file:line) | vNext behaviour (file:line or NONE) | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-2-010-001 | F01 | LC:22-24 GET /api/v1/admin/attendance/policy, college-only safe read | NP:128-131 Attendance policy tab, separate settings page and NR:16-39 PUT only | GAP | P2 | Expose scoped read-only GET equivalent for clients or document changed route. | S |
| G2-2-010-002 | F01 | LA:477-486 policy card at top of Attendance | NP:128-131 policy moved to separate tab; /college/attendance/settings | GAP | P2 | Restore two-field top-card summary while retaining optional settings route. | S |
| G2-2-010-003 | F02 | LA:477-486 one small AntD Card with two PolicySettingFields | NW:88-214 full-page policy form with header, warnings, buttons | GAP | P2 | Match card-level grouped field layout and read-only treatment for College Admin. | S |
| G2-2-010-004 | F03 | LF:133-151 College Admin fields tagged Read-only and Reload icon | NW:113-169 editable numeric inputs, Save attendance policy and Reset default | GAP | P1 | Restrict College Admin to read-only as legacy or obtain explicit new write-permission decision. | S |
| G2-2-010-005 | F03 | LF:138-150 tooltip info icon/help and reload per field | NW:132-167 help inline, no individual reload icon | GAP | P3 | Restore tooltips and per-field refresh status. | S |
| G2-2-010-006 | F03 | LF:165-196 Super Admin has Custom/Default badge, Save/Reset per field | NU:44-71 SuperAdmin single Save both fields, no per-field tags/reset | GAP | P2 | Implement per-field setting provenance tags and independent reset semantics. | S |
| G2-2-010-007 | F04 | LC:46-52 GET returns settings map keys `attendance.correctionWindowHours`, `attendance.eligibilityThresholdPercent` | NS:52-56 returns college + typed policy object with camelCase keys and maxCorrectionHours | GAP | P2 | Keep API contract adapter for existing clients; map settings keys/values exactly. | S |
| G2-2-010-008 | F04 | LC:48 correctionWindowHours default 24; LC:50 threshold default 75 | NV:28-31 identical numeric defaults | MATCH | P3 | No fix. | S |
| G2-2-010-009 | F04 | LF:144-150 read-only label, effective value + unit, Loading policy…, error | NW:95-167 form values, no readonly/loading placeholder per field | GAP | P2 | Restore read-only effective values and independent error/loading state. | S |
| G2-2-010-010 | F05 | LC:38-53 no list/table/filter/sort/paging | NS:27-56 one college keyed row, no pagination | MATCH | P3 | N/A backend config, one policy per college. | S |
| G2-2-010-011 | F06 | LC:38-46 only collegeId positive Integer, no body | NV:12-23 UUID collegeId + strict numeric body for vNext PUT | GAP | P2 | Document REST shape and numeric-ID conversion; reject unauthorized tenant IDs. | S |
| G2-2-010-012 | F06 | LF:133-151 College Admin no user-editable policy input | NW:115-156 editable min1 max100 and min1 max168 | GAP | P1 | Remove College Admin save actions until explicit owner approval for expanded rights. | S |
| G2-2-010-013 | F06 | LF:173-181 Super Admin Numeric step1 correction1..168, threshold1..100 | NV:18-22 allows correction up to8760 and NS:13-18 runtime checks deployed max | GAP | P2 | Cap UI/backend consistently per deployment/legacy ceiling or approve expansion. | S |
| G2-2-010-014 | F06 | LF:50-56 stored null falls back to 24/75 and draft value tracks effective | NS:36-56 stored null defaults, NW:32-41 initial persisted policy | MATCH | P3 | Keep defaults in one canonical model. | S |
| G2-2-010-015 | F07 | LC:40-42 exact error 'collegeId must be a positive integer' 400 | NR:27-39 Zod strict UUID and apiErrorResponse | GAP | P3 | Map invalid requested college to clear user-visible field error. | S |
| G2-2-010-016 | F07 | LF:75-77 read error uses `Couldn't load ${label}` then reload | NP:54 getAdminAttendanceOptions may throw full-page; NW no independent read retry | GAP | P2 | Provide per-policy-field unavailable state with retry while keeping attendance grid usable. | S |
| G2-2-010-017 | F07 | LF:96-100 Save field error `Failed to save ${label}` | NW:66-67 whole-policy generic save failure | GAP | P3 | Restore field-specific failure copy for permitted editors. | S |
| G2-2-010-018 | F07 | NS:84-85 ATTENDANCE_POLICY_MIGRATION_PENDING on deployed constraint | LC:38-53 no write path or migration error in this controller | EXTRA | P3 | Keep safe migration/version guard. | S |
| G2-2-010-019 | F08 | LF:95 'Late marking allowed for updated' success when Super Admin saves | NW:78 'Attendance policy saved. New attendance reads...' | GAP | P3 | Match exact field-specific success and avoid claiming both fields changed when only one. | S |
| G2-2-010-020 | F08 | LF:118 `label reset to default` toast | NW:85 'Attendance policy reset to the defaults...' both fields | GAP | P3 | Provide independent reset notice and semantics. | S |
| G2-2-010-021 | F09 | LC:38-53 no confirm modal on GET; LF:86-103 Super Admin save direct | NW:215-219 confirm modal for Reset only; NU:66-71 confirm on Save | GAP | P2 | Document added Super Admin save confirmation; restore legacy flow if pixel parity requires. | S |
| G2-2-010-022 | F10 | LC:38-52 read-only GET with tenant check, no writes | NR:16-39 PUT updates both values; NS:72-156 transactional upsert | EXTRA | P1 | Do not classify added College Admin write as legacy parity; require explicit approval/permission decision. | S |
| G2-2-010-023 | F10 | LF:92-93 Super Admin uses `putCollegeSettings` one setting key | NS:101-130 upserts both columns together | GAP | P2 | Preserve independent field updates and avoid lost concurrent second-field values. | S |
| G2-2-010-024 | F10 | LF:115 `deleteCollegeSetting` resets one override to inherited defaults | NW:81-85 writes BOTH defaults explicitly rather than removing per-field override | GAP | P1 | Support per-setting inherited/global reset and source-of-value provenance. | S |
| G2-2-010-025 | F11 | LC:16-20 College Admin may read only two safe keys; prohibits general tenant config | NA:62-121 College Admin `academics.manage` and NS:72-156 allows write | GAP | P1 | Separate attendance.policy.read vs update permissions or owner-authorize new mutation. | S |
| G2-2-010-026 | F11 | LC:44-45 requirePerformAdminActionForCollege | NA:68-121 active college, membership, selected Super Admin scope | MATCH | P3 | Keep tenant isolation on read and writes. | S |
| G2-2-010-027 | F11 | LF:42-44 College Admin identified as FACULTY/admin, `isCollegeAdmin` guard in LF:86-87 disables mutation | NW:49-70 persists for any authorized College Admin | GAP | P1 | Reinstate role-based read-only state for strict legacy behavior. | S |
| G2-2-010-028 | F12 | LC:46-50 setting scope=COLLEGE; inherited defaults 24/75 from AppSettingsService | NS:27-55 reads `attendance_policies` row then defaults, no global org layer | GAP | P2 | Document three-tier setting precedence and preserve inherited policy if migration requires it. | S |
| G2-2-010-029 | F12 | LF:165-168 tags Default vs Custom for college | NW:95-104 says stored for college, no status indicator | GAP | P3 | Expose inherited vs explicitly overridden provenance. | S |
| G2-2-010-030 | F12 | LF:106-118 reset deletes override row | NS:101-121 explicit default upsert remains | GAP | P1 | Restore inheritance semantics, avoid immutable default override. | S |
| G2-2-010-031 | F13 | LF:147-151 individual loading/error/reload even if other policy works | NP:54 SSR options single call, NW:88-214 no per-field loading retry | GAP | P2 | Provide per-field degraded display and retry. | S |
| G2-2-010-032 | F13 | LC:38-53 returns valid default values even with no tenant setting | NS:23-56 DEFAULT_ATTENDANCE_POLICY if no row | MATCH | P3 | No fix. | S |
| G2-2-010-033 | F14 | LC:38-53 no CSV, file, upload or import | NS:27-156 no files, no CSV | MATCH | P3 | N/A. | S |
| G2-2-010-034 | F15 | LC:38-53 no user notification dispatch or email | NS:132-154 audit event on policy PUT, no email | EXTRA | P3 | Keep audit; ensure no unexpected email recipients. | S |
| G2-2-010-035 | F16 | LA:477-486 compact policy card fits console width | NW:90-214 responsive 1 to 2 columns full-page editor | GAP | P2 | Compare card layout at 375/768/1280, match compact legacy hierarchy. | S |
| G2-2-010-036 | F17 | LF:139-151 Info tooltip aria and reload aria label | NW:110-166 labeled number inputs/aria required; no matching reload | GAP | P3 | Restore per-field reload aria and read-only semantics. | S |
| G2-2-010-037 | F17 | LF:173-196 input controls with Save and Reset | NU:63-70 ConfirmDialog focus for Super Admin; NW:215-219 reset confirm | EXTRA | P3 | Keep accessible focus behavior for added confirmation. | S |
| G2-2-010-038 | F18 | LA:478 'Late marking allowed for', 483 'Minimum attendance' | NW:113 'Eligibility threshold (%)', 144 'Correction window (hours)' | GAP | P3 | Use exact legacy field labels and order. | S |
| G2-2-010-039 | F18 | LF:145 Read-only tag, LF:148 Loading policy… | NW:95-100 'College attendance policy' intro only | GAP | P3 | Restore 'Read-only' badge where writes forbidden. | S |
| G2-2-010-040 | F19 | LC:46-52 performs two AppSettingsService lookups per GET | NS:36-55 one SQL policy row plus constraint introspection per read | EXTRA | P3 | Cache constraint shape health/readiness if traffic requires, not values. | S |
| G2-2-010-041 | F20 | LF:92-94 independent save may have concurrent setting changes | NS:88-130 both-field upsert with no expectedUpdatedAt CAS | GAP | P1 | Add row version/CAS and independent update capability; prevent lost policy edits. | S |
| G2-2-010-042 | F20 | LC:48-50 inherited default via AppSettingsService | NS:52-56 24/75 when row absent, no inheritance | GAP | P2 | Verify org/global overrides; avoid hardcoded fallback where inheritance mattered. | S |
| G2-2-010-043 | F21 | LC:30-35 AppSettingsService reads key-value tenant config | NS:36-55 Drizzle attendancePolicies, separate table; no external provider | GAP | P2 | Map source of truth to schema and existing tenant settings on deployment. | S |
| G2-2-010-044 | F21 | LC:16-20 no scheduled job or integration triggers | NS:132-156 transactional audit only | MATCH | P3 | N/A. | S |
| G2-2-010-045 | F22 | LC:46-50 app_setting scope/key override, no controller-owned SQL schema | NB:17-60 attendancePolicies per-college row w two fields | GAP | P2 | Migrate prior overrides with source order and deleted/reset semantics. | S |
| G2-2-010-046 | F22 | LF:165-168 distinguishes default vs custom | NB:17-60 row is present or absent as a unit; no per-field override provenance | GAP | P1 | Persist null/inherited flags per individual setting or separate override rows. | S |
| G2-2-010-047 | F23 | LC:16-20 explicit read-only college-admin boundary | NR:16-39 writes allowed by College Admin | EXTRA | P1 | Treat as security/product permission expansion requiring owner sign-off; do not silently remove. | S |
| G2-2-010-048 | F23 | LF:115-118 delete single override | NW:81-85 reset writes both fixed defaults | GAP | P1 | Implement effective precedence and granular reset. | S |

## Summary
- Rows 48, verdicts GAP 35; MATCH 7; EXTRA 6, severity P2 17; P1 11; P3 20.
- **Top P1:** Legacy College Admin attendance policy endpoint and corresponding fields were explicitly **read-only**, so vNext allowing this role to PUT either policy is an authorization/product scope expansion that needs owner approval (F03/F06/F10/F11/F23).
- **Top P1:** Legacy per-key override reset DELETES custom setting, returning to inherited global/org defaults. VNext Reset writes both fixed defaults into an explicit college row, potentially losing inherited values and causing stale concurrent overwrite (F10/F12/F20/F22).
- **Top P2:** Legacy two read-only fields in one small top policy card, vNext settings full-page form and separate tab, plus copy/loader/tooltip differences (F01/F02/F03/F18).

### UNKNOWN / live checks
- Confirm AppSettingsService precedence (COLLEGE vs ORG/GLOBAL), exact migrations of app_setting values, and whether owner explicitly authorized College Admin policy edits in vNext.
- Compare 375/768/1280 view for top card vs settings tab, plus keyboard focus of Super Admin save confirmation.
