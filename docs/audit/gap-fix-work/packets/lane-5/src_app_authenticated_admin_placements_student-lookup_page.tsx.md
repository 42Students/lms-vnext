# Work packet: edit src/app/(authenticated)/admin/placements/student-lookup/page.tsx

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u002-student-placement-lookup.md

## G2-15-002-021  [P1] GAP  facet F05  effort L
- Legacy: Search is autocomplete offering up to ten learners, user selects exactly one (`StudentPlacementLookup.js:45-60,88-95,128-144`).
- vNext now: Search returns up to 15 expanded learners, all with application tables and no selection dropdown (`college-placement-student-lookup-model.ts:1-10`; `admin/placements/student-lookup/page.tsx:53-75`).
- Fix: Implement 10-result autocomplete and explicit one-student selection, defer detail queries until selection.

## G2-15-002-025  [P1] GAP  facet F05  effort M
- Legacy: List all application records returned for selected student; no per-student truncation hint (`StudentPlacementLookup.js:97-104,180-207`; `AdminJobServiceImpl.java:1889-1899`).
- vNext now: Truncates after 100 application-offer records and shows `Showing newest 100...` (`college-placement-student-lookup-service.ts:65-70`; `admin/placements/student-lookup/page.tsx:74`).
- Fix: Offer paginated load-more/full-history access for students beyond 100 records, deduplicate multi-offer rows.

## G2-15-002-029  [P1] MISSING  facet F06  effort M
- Legacy: `Job Preferences` has six fields rolePreference, specificRolePreference, workShiftPreference, preferredEmploymentCity, examSlotPreference, jobNotificationsEnabled boolean (`profileSectionSchemas.js:85-92`).
- vNext now: No editable preference fields (`admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Add six schema-validated, prefilled inputs and Save/Cancel on selected learner.

## G2-15-002-030  [P1] MISSING  facet F06  effort M
- Legacy: `Resume` editor stores resumeUrl (`profileSectionSchemas.js:93-95`; `ProfileSectionsPanel.js:205-316`).
- vNext now: No resume URL view/edit (`admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Render secure resume link/editor with storage-reference ownership validation and Save/Cancel.

## G2-15-002-032  [P1] MISSING  facet F06  effort M
- Legacy: Profile edit form values default from loaded record; booleans checked and blanks `''`, string lists joined (`ProfileSectionsPanel.js:101-126,129-145,232-240`).
- vNext now: No profile forms/default/required field rules (`admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Replicate data-to-form conversion, schema defaults, boolean bindings and cancel behaviour.

## G2-15-002-035  [P1] MISSING  facet F07  effort M
- Legacy: Profile schema form validates before update; invalid JSON shows toast `Invalid JSON` (`ProfileSectionsPanel.js:243-261`).
- vNext now: No profile edit or validation (`admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Add field-level form validation and matching JSON fallback when applicable.

## G2-15-002-038  [P1] MISSING  facet F08  effort M
- Legacy: Profile save success `${label} updated`; skills `Saved`, `Removed`, `Added` toasts (`ProfileSectionsPanel.js:264-271,362-369,374-381,400-409`).
- vNext now: No success messaging because profile actions absent (`admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Restore all per-action toasts only after confirmed server writes.

## G2-15-002-042  [P1] MISSING  facet F09  effort M
- Legacy: Resume, Job Preferences, Skills are separate Collapse panels, multiple can open; initially collapsed (`ProfileSectionsPanel.js:481-504`).
- vNext now: No disclosure/dialog/popover sections (`admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Implement three independent collapsibles collapsed by default.

## G2-15-002-043  [P1] MISSING  facet F09  effort S
- Legacy: Remove skill asks confirmation `Remove this entry?` (`ProfileSectionsPanel.js:444-448`).
- vNext now: No profile delete confirmation (`admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Add confirmation before skill removal, disabled pending state.

## G2-15-002-044  [P1] MISSING  facet F09  effort M
- Legacy: Profile edit inline shows Save/Cancel and disables cancel during save (`ProfileSectionsPanel.js:281-313,426-435`).
- vNext now: No inline edit state (`admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Implement inline edit view with pending semantics and cancel.

## G2-15-002-046  [P1] GAP  facet F10  effort L
- Legacy: Selection `GET /api/v1/admin/jobs/students/{id}/placement-summary?collegeId`, success-envelope checked (`AdminService.js:701-702`; `StudentPlacementLookup.js:88-109`).
- vNext now: All matching students' history loaded eagerly via Drizzle in single page render (`college-placement-student-lookup-service.ts:46-72`; `admin/placements/student-lookup/page.tsx:22-26`).
- Fix: Add authorized selected-learner detail service/action keyed by membership, with own pending/error path.

## G2-15-002-078  [P1] MISSING  facet F21  effort M
- Legacy: Profile Resume PUT validates owned storage reference (`LearnerProfileController.java:254-255,1223-1235`).
- vNext now: No profile integration; stored profileDocument field available (`profiles.ts:15-31`; `admin/placements/student-lookup/page.tsx:56-75`).
- Fix: Use scoped signed URL access and ownership/ref validation for resume writes.

## G2-15-002-033  [P2] GAP  facet F07  effort S
- Legacy: Search request errors prefer server error message, fallback `Search failed — try again.` (`StudentPlacementLookup.js:61-66`).
- vNext now: Failure shows `Student placement lookup unavailable` and generic explanation (`admin/placements/student-lookup/page.tsx:46-49`).
- Fix: Surface safe actionable backend message in inline autocomplete, exact fallback text.

## G2-15-002-034  [P2] GAP  facet F07  effort M
- Legacy: Summary failure `Couldn't load placement history — try again.` or server-supplied message (`StudentPlacementLookup.js:99-109`).
- vNext now: One generic student search error covers all lookup data (`admin/placements/student-lookup/page.tsx:46-49`).
- Fix: Separate candidate lookup failure from selected-learner history failure; show exact message.

## G2-15-002-036  [P2] GAP  facet F07  effort M
- Legacy: API not-found `Student not found` / `Student does not belong to the specified college`, invalid collegeId positive integer (`AdminJobServiceImpl.java:1889-1895`; `AdminJobController.java:997-1015`).
- vNext now: Name search returns empty set, missing college shows selection empty state (`college-placement-student-lookup-service.ts:21-27`; `admin/placements/student-lookup/page.tsx:50-54`).
- Fix: For direct selected ID, preserve explicit unauthorized vs not-found distinction without leaking cross-college identity.

## G2-15-002-039  [P2] GAP  facet F08  effort M
- Legacy: Refresh failure warning `Couldn't refresh placement history`; `Showing the last placement history loaded for this student.` (`StudentPlacementLookup.js:161-172`).
- vNext now: Generic full-page failure and URL Retry (no prior-history notice) (`admin/placements/student-lookup/page.tsx:46-49`).
- Fix: Preserve previously fetched selected-learner history and render amber warning + retry.
