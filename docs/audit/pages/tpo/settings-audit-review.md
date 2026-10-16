# Round R review: TPO / Settings and Audit log (slug `settings-audit`)

Reviewer: Claude Sonnet 5.5, 2026-10-16. Round A file: `docs/audit/pages/tpo/settings-audit.md` (opened only after my own audit). Judged against current `origin/main` (fd8e17ae4), which includes chat-9 fixes `305dac958` (TPO-settings-audit-10), `9955cbe75` and `9d7cebeca` (-90, -91) and chat-2 `7cf99ceab` (-55 public link card).

Own audit sources: legacy `_hr-tpo-fe` (`pages/tpo/settings.js`, `pages/tpo/audit.js`, `components/tpo/settings/*`, `components/tpo/ui/domain.js`) and `42LMS-BACKEND/lms` (`TpoSettingsController`, `TpoSettingsService`, `TpoSettingsHubService`, `TpoRecruiterAccessController`, `CollegePublicLinkService`, `TpoAuditService`, `TpoTeamAccessFilter`, `JobTypeService`, `PlacementOutcomeService`, `AcademicMarksService.saveRule`, `TpoWorkspaceController` /audit), all at lms-dev-2026; vNext `src/app/(authenticated)/tpo/settings/*`, `tpo/audit/*`, `src/components/{tpo,placements}/*`, `src/modules/placements/*`, `src/app/api/placements/tpo/*`.

## 1. Summary

Round A gaps 59: CONFIRMED 54, WRONG 1, SEVERITY-CHANGE 4. MISSED 4. Discrepancy rate = (4 MISSED + 1 WRONG + 4 SEVERITY-CHANGE) / (59 + 4) = 9 / 63 = 14.3%.

Round A is thorough and accurate; its main weakness is that it predates three chat-9/chat-2 fixes (two of which it listed as open) and it under-called the effect of the missing `placement_tpo_college_settings` row.

## 2. Round A gap verdicts

| Round A gap ID | Verdict | Note |
| --- | --- | --- |
| TPO-settings-audit-01 | CONFIRMED | Nav (`tpo-settings-nav.tsx`) still has no `season`/`trusted` entries and extra items. |
| -02 | CONFIRMED | `settings/layout.tsx` still says "New settings remain read-only until their proposed migrations are registered." |
| -03 | CONFIRMED | |
| -04 | CONFIRMED | `/tpo/settings` still `redirect("/tpo/settings/rules")`. |
| -05 | CONFIRMED | Legacy: info Alert for non-admins (`settings.js:129-171`) and 403 by `TpoTeamAccessFilter`. vNext silently redirects to `/dashboard` for non-TPO (rules, season, branding, recruiters pages), so there is also no explanatory message. UNCONFIRMED part stays (see section 6). |
| -06 | CONFIRMED | |
| -07 | CONFIRMED | |
| -10 | WRONG (closed since) | `305dac958` added `tpo-rule-limits.ts`; `TpoCollegeRulesControl` blocks outside 1-5 / 0-200 / 12-168 and the API schemas share the limits. Residual only: one combined client message instead of legacy's three server messages. |
| -11 | CONFIRMED | "Selected" option still in `tpo-college-rules-control.tsx`. |
| -12 | CONFIRMED | Evidence tightened: `setCollegeCgpaConversionRule` already exists (`src/modules/profile-verification/settings-service.ts:32`, recompute + `CGPA_RULE_CHANGED` event) but has zero callers; no TPO route, no UI. Only a route and UI card are needed. Keep S2. |
| -13 | CONFIRMED | |
| -14 | CONFIRMED | `tpo-policy-service.ts` has no activity event; both `placement-rules` and `company-visibility` PUT routes still unaudited. Legacy logged none either, so vNext hardening only. |
| -20 | CONFIRMED | |
| -21 | CONFIRMED | |
| -22 | CONFIRMED | |
| -23 | CONFIRMED | Grep: `placementTpoJobTypes` is read only by the settings read/write services. |
| -24 | CONFIRMED | |
| -25 | CONFIRMED | See also MISSED R02 (raw codes in error text). |
| -30 | CONFIRMED | |
| -31 | CONFIRMED | |
| -32 | CONFIRMED | |
| -33 | CONFIRMED | |
| -40 | CONFIRMED | |
| -41 | CONFIRMED | `placementTpoPrepReadiness` has no consumer outside the config services. |
| -42 | CONFIRMED | |
| -43 | CONFIRMED | |
| -44 | CONFIRMED | `placement_tpo_blocked_dates` has no consumer in scheduling/calendar code. Legacy `GET /tpo/calendar/blocked-check` is the counterpart. |
| -45 | CONFIRMED | |
| -50 | CONFIRMED | `recruiterDriveNeedsApproval` appears only in `db/schema/tpo-collaboration.ts`. |
| -51 | CONFIRMED | |
| -52 | CONFIRMED | `recruiterGrantValidUntil` throws for months < 1, so "No end date" cannot be used even though the DB check allows 0. |
| -53 | SEVERITY-CHANGE (S2 to S1, conditional) | The same missing-row condition also blocks the public-link join (`join-service.ts:102` returns NOT_CONFIGURED) and the invite OTP accept (`recruiter-invite-otp-accept-service.ts:88` returns DENIED), not just manual grants. See MISSED R01. S1 if the dev/prod DB has no rows. |
| -54 | CONFIRMED | |
| -55 | SEVERITY-CHANGE (S1 to S2) | Round A said "no TPO UI and nothing creates `placement_public_join_links`". Since `7cf99ceab`, `/tpo/settings/public-link` renders `TpoPublicJoinLinkCard` (make / replace link, copy once) and the nav links to it. Still missing: on/off switch, "post without approval" switch, opens/joins counts ("pending database registration" text), re-showing the link later (vNext shows it once by design, hash-only; legacy rebuilds it by HMAC), invitation inclusion. |
| -56 | CONFIRMED | |
| -57 | CONFIRMED | `tpo-recruiter-access-service.ts` has no validUntil/expired handling. |
| -58 | CONFIRMED | |
| -59 | CONFIRMED | |
| -60 | CONFIRMED | |
| -70 | CONFIRMED | |
| -71 | CONFIRMED | |
| -72 | CONFIRMED | `PUT /api/placements/tpo/company-visibility` exists, no component calls it. |
| -73 | CONFIRMED | |
| -74 | CONFIRMED | |
| -75 | CONFIRMED | |
| -76 | CONFIRMED | |
| -80 | CONFIRMED | |
| -81 | CONFIRMED | |
| -82 | CONFIRMED | |
| -90 | SEVERITY-CHANGE (S2 to S3) | `9955cbe75` + `tpoAuditActorLabel`: `/tpo/audit` now has an Actor column with names. Residual: `/tpo/audit/actors` rows and its CSV still print the raw `actorId` UUID (`actors/page.tsx` row cell), and the actor filter there needs a UUID. |
| -91 | SEVERITY-CHANGE (S2 to S3) | `9d7cebeca`: `PLACEMENTS_COLLEGE_RULES_UPDATED` and `PLACEMENTS_SEASON_DETAILS_UPDATED` now show values; every other activity event falls back to the stored `summary` (not the constant). Residual: the Context title is still the constant "Placement activity" except for job/season subjects, and settings events other than rules/season carry no values (e.g. blocked date, trust, grant). |
| -92 | CONFIRMED | |
| -93 | CONFIRMED | |
| -94 | CONFIRMED | `formatTpoAuditEventType` heuristic unchanged. |
| -95 | CONFIRMED | |
| -96 | CONFIRMED | |
| -97 | CONFIRMED | |
| -98 | CONFIRMED | |
| -99 | CONFIRMED | |

## 3. MISSED gaps

| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
| --- | --- | --- | --- | --- | --- |
| TPO-settings-audit-R01 | The absent `placement_tpo_college_settings` row (nothing in app code inserts it) breaks more than manual grants: public-link join returns NOT_CONFIGURED and invite OTP acceptance returns DENIED, so no recruiter can enter through any path except a pre-seeded college. Legacy simply falls back to defaults (6 months, approval on) when no row exists. Fix: treat a missing row as the defaults (as legacy `defaults()`), and/or create the row on first Settings visit or college setup. UNCONFIRMED whether dev has the rows | STATE | S1 (conditional) | BE/service/tpo/TpoSettingsHubService.java:34-44,99-104 (defaults, no row required) | public-join/join-service.ts:97-102; recruiter-invite-otp-accept-service.ts:82-88; tpo-recruiter-grant-write-service.ts:34-41; no insert anywhere except tests |
| TPO-settings-audit-R02 | Settings editors show raw error codes to the TPO: the job-type and blocked-date routes return `{error:"TPO_JOB_TYPE_EXISTS"}` etc. and the editors print `data.error` unchanged (also `TPO_SETTINGS_PENDING`, `TPO_SETTINGS_NOT_FOUND`). Legacy messages are sentences ("\"X\" is already a job type", "Keep at least one job type switched on") | VALIDATION | S3 | JobTypeService.java:140-158; JobTypesTab.jsx:37-46 | job-types/route.ts:10-13; tpo-job-types-editor.tsx:20; tpo-blocked-dates-editor.tsx:17 |
| TPO-settings-audit-R03 | "Public placements" can never be switched on: `canEnable` needs `populationCount >= 5`, no code path writes `population_count` (the POST route even rejects a `populationCount` field), so the only control on the page is permanently disabled unless a DB job fills it. Legacy enables freely and suppresses each number that rests on fewer than 5 students/offers. UNCONFIRMED whether a back-office job populates the count | STATE | S2 | PlacementsPageSettings.jsx:5-8,43-52 ("A number built on fewer than 5 ... never shows") | public-page/page.tsx:133-153; public-page/publication-policy.ts:10-16; api/placements/tpo/public-placement/route.ts:18 |
| TPO-settings-audit-R04 | No saved views on the audit log: legacy lets the TPO save, pin (max 5), rename, delete and reuse named filter sets for scope AUDIT (`/tpo/views`), including last-used tracking | MISSING-ACTION | S4 | audit.js:1-174 (TpoDataTable saved views); TpoSettingsHubService.java:SAVED_VIEW_SCOPES, updateView (MAX_PINNED_VIEWS=5) | audit/page.tsx (filters only via URL form) |

## 4. WRONG and SEVERITY-CHANGE details

- **-10 WRONG.** Fixed on main in `305dac958` (2026-10-16 after Round A). `tpo-rule-limits.ts` defines the 1-5 / 0-200 / 12-168 bounds; `tpo-policy-validation.ts` and `tpo-season-write-model.ts` import them, `tpo-college-rules-control.tsx:30-35` blocks out-of-range values with "Held offers: 1-5; uplift: 0-200%; response hours: 12-168." Unit test `tests/unit/tpo-rule-limits.test.ts`.
- **-53 S2 to S1 (conditional).** Because the same row gates the public join and OTP acceptance, an empty table makes the whole recruiter-onboarding path fail, not one TPO action. Confirm on dev first (section 6, item 1).
- **-55 S1 to S2.** Link creation now exists (`tpo/settings/public-link/page.tsx`, `7cf99ceab`). The remaining S2 work is the switches, counts and post-direct control; the post-direct switch also needs the approval policy (-50) to mean anything.
- **-90 S2 to S3.** Main log now shows actor names. Actors page UUID display remains.
- **-91 S2 to S3.** Rules and season events carry values; others fall back to the stored summary.

## 5. Intentional differences or FALSE-gap checks that hold

- Round A -14 note and the vNext optimistic-version checks (rules, job types, blocked dates, prep) are improvements; legacy has no stale-write protection.
- vNext shows the public link only once (hash stored): a security improvement over legacy's rebuildable link; the "copy any time" part of -55 should be a decision, not a defect.
- vNext audit page paginates all matching rows with IST date filters, so legacy's 500 / 5000 caps and `X-Total-Count` truncation message are not needed.
- Legacy has no personal-notification editor in the dev UI (Round A -80), so vNext read-only is parity, not a regression.

## 6. UNCONFIRMED and how to confirm (batch for the live dev check)

1. Does dev have a `placement_tpo_college_settings` row for the test college (NSRIT)? `select college_id, recruiter_access_months from placement_tpo_college_settings`. If empty, try an invite accept and a public-link join (R01, -53).
2. Can a faculty "TPO admin" (non-TPO role) open `/tpo/settings/*` and write? Log in as that account (-05). Also confirm what a non-TPO member sees (redirect to `/dashboard`).
3. Is `placement_public_stats_settings.population_count` populated by any job on dev? Open `/tpo/settings/public-page`; is the button enabled (R03)?
4. Create a duplicate job type and a duplicate blocked date; read the red error text (R02).
5. Change placement rules via UI, then open `/tpo/audit?kind=ACTIVITY`: does the row show held offers/uplift/hours and an actor name (-90, -91)? Repeat for a blocked-date add and a recruiter revoke to see how much detail they carry.
6. `/tpo/audit/actors` after any change: confirm the Actor cell shows a UUID (-90 residual).
7. Mobile (375px): settings nav pill wrap and the audit table horizontal scroll (-07, -97); not checked by code reading.
