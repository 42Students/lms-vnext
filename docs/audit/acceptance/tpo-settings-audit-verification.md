# TPO settings — builder chat-9 verified source evidence (round 3)

These findings record **source assertions only**; tests have not been run by this lane. `OPEN` means the remaining legacy behavior is not yet implemented or integrated, even when a narrower source assertion exists. The orchestrator must run tests and integration checks.

| ID | Status | Evidence (path, test and exact gap-named case) |
|---|---|---|
| TPO-settings-audit-53 | DONE | `src/modules/placements/tpo-recruiter-grant-write-service.ts`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-53 verifies existing implementation in src/modules/placements/tpo-recruiter-grant-write-service.ts` |
| TPO-settings-audit-20 | DONE | `src/components/tpo/tpo-builtin-job-types-editor.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-20 verifies existing implementation in src/components/tpo/tpo-builtin-job-types-editor.tsx` |
| TPO-settings-audit-21 | DONE | `src/components/tpo/tpo-job-types-editor.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-21 verifies existing implementation in src/components/tpo/tpo-job-types-editor.tsx` |
| TPO-settings-audit-22 | OPEN | `src/modules/placements/tpo-job-type-write-service.ts`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-22 verifies partial implementation in src/modules/placements/tpo-job-type-write-service.ts` |
| TPO-settings-audit-30 | DONE | `src/modules/placements/tpo-after-college-model.ts`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-30 verifies existing implementation in src/modules/placements/tpo-after-college-model.ts` |
| TPO-settings-audit-31 | OPEN | `src/modules/placements/tpo-outcome-label-settings-service.ts`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-31 verifies partial implementation in src/modules/placements/tpo-outcome-label-settings-service.ts` |
| TPO-settings-audit-32 | DONE | `src/app/(authenticated)/tpo/settings/after-college/page.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-32 verifies existing implementation in src/app/(authenticated)/tpo/settings/after-college/page.tsx` |
| TPO-settings-audit-43 | DONE | `src/components/tpo/tpo-blocked-dates-editor.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-43 verifies existing implementation in src/components/tpo/tpo-blocked-dates-editor.tsx` |
| TPO-settings-audit-44 | OPEN | `src/modules/placements/tpo-round-calendar-service.ts`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-44 verifies partial implementation in src/modules/placements/tpo-round-calendar-service.ts` |
| TPO-settings-audit-52 | OPEN | `src/components/tpo/tpo-communication-settings-editors.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-52 verifies partial implementation in src/components/tpo/tpo-communication-settings-editors.tsx` |
| TPO-settings-audit-54 | OPEN | `src/components/tpo/tpo-trusted-domain-editor.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-54 verifies partial implementation in src/components/tpo/tpo-trusted-domain-editor.tsx` |
| TPO-settings-audit-56 | OPEN | `src/components/placements/tpo-recruiter-grant-controls.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-56 verifies existing implementation in src/components/placements/tpo-recruiter-grant-controls.tsx` |
| TPO-settings-audit-57 | OPEN | `src/app/(authenticated)/tpo/settings/recruiters/page.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-57 verifies partial implementation in src/app/(authenticated)/tpo/settings/recruiters/page.tsx` |
| TPO-settings-audit-70 | OPEN | `src/components/tpo/tpo-communication-settings-editors.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-70 verifies existing implementation in src/components/tpo/tpo-communication-settings-editors.tsx` |
| TPO-settings-audit-72 | DONE | `src/components/tpo/tpo-company-visibility-editor.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-72 verifies existing implementation in src/components/tpo/tpo-company-visibility-editor.tsx` |
| TPO-settings-audit-74 | OPEN | `src/app/(authenticated)/tpo/settings/public-page/page.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-74 verifies partial implementation in src/app/(authenticated)/tpo/settings/public-page/page.tsx` |
| TPO-settings-audit-76 | OPEN | `src/components/tpo/tpo-communication-settings-editors.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-76 verifies partial implementation in src/components/tpo/tpo-communication-settings-editors.tsx` |
| TPO-settings-audit-92 | DONE | `src/app/(authenticated)/tpo/audit/page.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-92 verifies existing implementation in src/app/(authenticated)/tpo/audit/page.tsx` |
| TPO-settings-audit-93 | OPEN | `src/app/(authenticated)/tpo/audit/page.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-93 verifies partial implementation in src/app/(authenticated)/tpo/audit/page.tsx` |
| TPO-settings-audit-04 | DONE | `src/components/tpo/tpo-legacy-settings-redirect.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-04 verifies existing implementation in src/components/tpo/tpo-legacy-settings-redirect.tsx` |
| TPO-settings-audit-14 | DONE | `src/modules/placements/tpo-policy-service.ts`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-14 verifies existing implementation in src/modules/placements/tpo-policy-service.ts` |
| TPO-settings-audit-24 | DONE | `src/modules/placements/tpo-configuration-model.ts`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-24 verifies existing implementation in src/modules/placements/tpo-configuration-model.ts` |
| TPO-settings-audit-25 | OPEN | `src/components/tpo/tpo-job-types-editor.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-25 verifies partial implementation in src/components/tpo/tpo-job-types-editor.tsx` |
| TPO-settings-audit-45 | DONE | `src/components/tpo/tpo-blocked-dates-editor.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-45 verifies existing implementation in src/components/tpo/tpo-blocked-dates-editor.tsx` |
| TPO-settings-audit-58 | OPEN | `src/app/(authenticated)/tpo/settings/recruiters/page.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-58 verifies partial implementation in src/app/(authenticated)/tpo/settings/recruiters/page.tsx` |
| TPO-settings-audit-59 | OPEN | `src/components/placements/tpo-recruiter-grant-controls.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-59 verifies partial implementation in src/components/placements/tpo-recruiter-grant-controls.tsx` |
| TPO-settings-audit-71 | OPEN | `src/app/(authenticated)/tpo/settings/notices/page.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-71 verifies partial implementation in src/app/(authenticated)/tpo/settings/notices/page.tsx` |
| TPO-settings-audit-82 | DONE | `src/components/placements/tpo-settings-nav.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-82 verifies existing implementation in src/components/placements/tpo-settings-nav.tsx` |
| TPO-settings-audit-97 | OPEN | `src/components/tpo/tpo-audit-grid.tsx`; `tests/unit/chat9-tpo-settings-source-closure.test.ts` — `TPO-settings-audit-97 verifies partial implementation in src/components/tpo/tpo-audit-grid.tsx` |

## Round 3: shared friendly request adoption

| Gap | Status | Evidence |
|---|---|---|
| TPO-settings-audit-21 | Authored | `tests/unit/chat9-tpo-settings-friendly-saves.test.ts` — `TPO-settings-audit-21 preserves the edited job type after a failed network write`; shared `apiFetch` and `InlineNotice` adopted |
| TPO-settings-audit-31 | Authored | `tests/unit/chat9-tpo-settings-friendly-saves.test.ts` — `TPO-settings-audit-31 applies friendly save errors and retains outcome label edits`; shared `apiFetch` and `InlineNotice` adopted |
| TPO-settings-audit-43 | Authored | `tests/unit/chat9-tpo-settings-friendly-saves.test.ts` — `TPO-settings-audit-43 keeps blocked-date form input on a failed save`; shared `apiFetch` and `InlineNotice` adopted |
| TPO-settings-audit-72 | Authored | `tests/unit/chat9-tpo-settings-friendly-saves.test.ts` — `TPO-settings-audit-72 turns permission or conflict errors into safe notices without clearing switches`; shared `apiFetch` and `InlineNotice` adopted |

Round 3 scope corrections: TPO-settings-audit-56 extension supports timed grants, but not legacy “No end date”. TPO-settings-audit-70 supports the monthly optional-SMS cap, but lacks authoritative “N used this month” consumption. These gaps stay OPEN until complete.

## Round 4 — source edits and tests (orchestrator to run)
| TPO-settings-audit-13 | DONE | Settings view and `tests/unit/chat9-tpo-settings-legacy-graceful.test.ts` — `TPO-settings-audit-13 hides internal storage labels from college-rule explanations` |
| TPO-settings-audit-42 | DONE | Settings view and `tests/unit/chat9-tpo-settings-legacy-graceful.test.ts` — `TPO-settings-audit-42 makes readiness courses searchable while retaining selected values` |
| TPO-settings-audit-73 | DONE | Settings view and `tests/unit/chat9-tpo-settings-legacy-graceful.test.ts` — `TPO-settings-audit-73 restores the sharing rules explanation and percentage labels` |
| TPO-settings-audit-75 | DONE | Settings view and `tests/unit/chat9-tpo-settings-legacy-graceful.test.ts` — `TPO-settings-audit-75 acknowledges public-page on and off states` |
| TPO-settings-audit-94 | DONE | Settings view and `tests/unit/chat9-tpo-settings-legacy-graceful.test.ts` — `TPO-settings-audit-94 uses old activity names rather than raw internal action codes` |
| TPO-settings-audit-96 | DONE | Settings view and `tests/unit/chat9-tpo-settings-legacy-graceful.test.ts` — `TPO-settings-audit-96 keeps the TPO audit heading customer-facing` |
| TPO-settings-audit-03 | DONE | Settings view and `tests/unit/chat9-tpo-settings-legacy-graceful.test.ts` — `TPO-settings-audit-03 uses the original placement settings section names` |
| TPO-settings-audit-06 | DONE | Settings view and `tests/unit/chat9-tpo-settings-legacy-graceful.test.ts` — `TPO-settings-audit-06 protects edited readiness choices against accidental navigation` |
