# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/admin-attendance-policy-controller.md

21 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-attendance-policy-controller.md

## G2-2-010-001  [P2] GAP  facet F01  effort S
- Legacy: LC:22-24 GET /api/v1/admin/attendance/policy, college-only safe read
- vNext now: NP:128-131 Attendance policy tab, separate settings page and NR:16-39 PUT only
- Fix: Expose scoped read-only GET equivalent for clients or document changed route.

## G2-2-010-002  [P2] GAP  facet F01  effort S
- Legacy: LA:477-486 policy card at top of Attendance
- vNext now: NP:128-131 policy moved to separate tab; /college/attendance/settings
- Fix: Restore two-field top-card summary while retaining optional settings route.

## G2-2-010-003  [P2] GAP  facet F02  effort S
- Legacy: LA:477-486 one small AntD Card with two PolicySettingFields
- vNext now: NW:88-214 full-page policy form with header, warnings, buttons
- Fix: Match card-level grouped field layout and read-only treatment for College Admin.

## G2-2-010-006  [P2] GAP  facet F03  effort S
- Legacy: LF:165-196 Super Admin has Custom/Default badge, Save/Reset per field
- vNext now: NU:44-71 SuperAdmin single Save both fields, no per-field tags/reset
- Fix: Implement per-field setting provenance tags and independent reset semantics.

## G2-2-010-007  [P2] GAP  facet F04  effort S
- Legacy: LC:46-52 GET returns settings map keys `attendance.correctionWindowHours`, `attendance.eligibilityThresholdPercent`
- vNext now: NS:52-56 returns college + typed policy object with camelCase keys and maxCorrectionHours
- Fix: Keep API contract adapter for existing clients; map settings keys/values exactly.

## G2-2-010-009  [P2] GAP  facet F04  effort S
- Legacy: LF:144-150 read-only label, effective value + unit, Loading policy…, error
- vNext now: NW:95-167 form values, no readonly/loading placeholder per field
- Fix: Restore read-only effective values and independent error/loading state.

## G2-2-010-011  [P2] GAP  facet F06  effort S
- Legacy: LC:38-46 only collegeId positive Integer, no body
- vNext now: NV:12-23 UUID collegeId + strict numeric body for vNext PUT
- Fix: Document REST shape and numeric-ID conversion; reject unauthorized tenant IDs.

## G2-2-010-013  [P2] GAP  facet F06  effort S
- Legacy: LF:173-181 Super Admin Numeric step1 correction1..168, threshold1..100
- vNext now: NV:18-22 allows correction up to8760 and NS:13-18 runtime checks deployed max
- Fix: Cap UI/backend consistently per deployment/legacy ceiling or approve expansion.

## G2-2-010-021  [P2] GAP  facet F09  effort S
- Legacy: LC:38-53 no confirm modal on GET; LF:86-103 Super Admin save direct
- vNext now: NW:215-219 confirm modal for Reset only; NU:66-71 confirm on Save
- Fix: Document added Super Admin save confirmation; restore legacy flow if pixel parity requires.

## G2-2-010-023  [P2] GAP  facet F10  effort S
- Legacy: LF:92-93 Super Admin uses `putCollegeSettings` one setting key
- vNext now: NS:101-130 upserts both columns together
- Fix: Preserve independent field updates and avoid lost concurrent second-field values.

## G2-2-010-028  [P2] GAP  facet F12  effort S
- Legacy: LC:46-50 setting scope=COLLEGE; inherited defaults 24/75 from AppSettingsService
- vNext now: NS:27-55 reads `attendance_policies` row then defaults, no global org layer
- Fix: Document three-tier setting precedence and preserve inherited policy if migration requires it.

## G2-2-010-031  [P2] GAP  facet F13  effort S
- Legacy: LF:147-151 individual loading/error/reload even if other policy works
- vNext now: NP:54 SSR options single call, NW:88-214 no per-field loading retry
- Fix: Provide per-field degraded display and retry.

## G2-2-010-035  [P2] GAP  facet F16  effort S
- Legacy: LA:477-486 compact policy card fits console width
- vNext now: NW:90-214 responsive 1 to 2 columns full-page editor
- Fix: Compare card layout at 375/768/1280, match compact legacy hierarchy.

## G2-2-010-042  [P2] GAP  facet F20  effort S
- Legacy: LC:48-50 inherited default via AppSettingsService
- vNext now: NS:52-56 24/75 when row absent, no inheritance
- Fix: Verify org/global overrides; avoid hardcoded fallback where inheritance mattered.

## G2-2-010-043  [P2] GAP  facet F21  effort S
- Legacy: LC:30-35 AppSettingsService reads key-value tenant config
- vNext now: NS:36-55 Drizzle attendancePolicies, separate table; no external provider
- Fix: Map source of truth to schema and existing tenant settings on deployment.

## G2-2-010-045  [P2] GAP  facet F22  effort S
- Legacy: LC:46-50 app_setting scope/key override, no controller-owned SQL schema
- vNext now: NB:17-60 attendancePolicies per-college row w two fields
- Fix: Migrate prior overrides with source order and deleted/reset semantics.

## G2-2-010-005  [P3] GAP  facet F03  effort S
- Legacy: LF:138-150 tooltip info icon/help and reload per field
- vNext now: NW:132-167 help inline, no individual reload icon
- Fix: Restore tooltips and per-field refresh status.

## G2-2-010-029  [P3] GAP  facet F12  effort S
- Legacy: LF:165-168 tags Default vs Custom for college
- vNext now: NW:95-104 says stored for college, no status indicator
- Fix: Expose inherited vs explicitly overridden provenance.

## G2-2-010-036  [P3] GAP  facet F17  effort S
- Legacy: LF:139-151 Info tooltip aria and reload aria label
- vNext now: NW:110-166 labeled number inputs/aria required; no matching reload
- Fix: Restore per-field reload aria and read-only semantics.

## G2-2-010-038  [P3] GAP  facet F18  effort S
- Legacy: LA:478 'Late marking allowed for', 483 'Minimum attendance'
- vNext now: NW:113 'Eligibility threshold (%)', 144 'Correction window (hours)'
- Fix: Use exact legacy field labels and order.

## G2-2-010-039  [P3] GAP  facet F18  effort S
- Legacy: LF:145 Read-only tag, LF:148 Loading policy…
- vNext now: NW:95-100 'College attendance policy' intro only
- Fix: Restore 'Read-only' badge where writes forbidden.
