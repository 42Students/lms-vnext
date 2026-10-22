# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-006-045 [P1] MISSING facet F14
- Files: (none, new feature)
- Legacy: LS:105-149 enforces tenant key org/college assignments, 50MiB limit, file metadata
- Expected fix: Design vNext tenant-scoped private-file grants and verify size/MIME/virus attestation.

## G2-2-009-022 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LC:221-227 absent repository returns 503 'Attendance data is temporarily unavailable'
- Expected fix: Add error state refusing correction when fresh marker record cannot be loaded.

## G2-2-011-052 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LC:97-203 direct one-shot creation, all days default, max200
- Expected fix: Record workflow restrictions as major parity gap; restore valid semester recurrence.

## G2-2-014-012 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LC:86-97 allows any combination active, enabled, allowedForDisplay, at least one required
- Expected fix: Provide three independent nullable status controls and combination validation.

## G2-2-016-117 [P1] GAP facet F10
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: GET needs-attention includes stale applications, unscheduled interviews, missing offer letters, closing soon `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:975-990`
- Expected fix: Implement real missing-offer-letter evidence and counts rather than false negative

## G2-2-017-002 [P1] MISSING facet F01
- Files: src/app/(authenticated)/admin/course-progress/page.tsx
- Legacy: Single action for learner and course `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:68-74`
- Expected fix: Expose scoped admin retake action on student detail

## G2-2-019-070 [P1] MISSING facet F23
- Files: src/modules/announcements/visibility-model.ts
- Legacy: AdminNotificationDeliveryController.java:135-139 uses CANCELLED status plus future timestamp to suppress recipient visibility
- Expected fix: Add explicit cancelled state in notification lifecycle.

## G2-2-030-010 [P1] GAP facet F04
- Files: src/modules/placements/tpo-configuration-read-service.ts
- Legacy: ChoicesController.java:39-81 top-level object includes genders,jobTypes,outcomes,outcomeLabels,driveModes,registrationChoices,educationTypes,gradingTypes,codingPlatforms,recruiterLeadSources,branches,passingYears.
- Expected fix: Document 12 keys and compose typed catalog response or compatibility map; avoid requiring individual consumer discovery.

## G2-2-034-002 [P1] GAP facet F01
- Files: src/lib/report-client-error.ts
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:111-145 global window error/unhandledrejection/console.error capture
- Expected fix: Restore coverage for unhandled rejections, console errors and resource-load failures with bounded safe capture.

## G2-2-034-025 [P1] GAP facet F10
- Files: src/lib/report-client-error.ts
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:115-125 captures resource errors in capture phase
- Expected fix: Re-add resource/script/img/css failure capture with sanitized route only.

## G2-2-034-026 [P1] GAP facet F10
- Files: src/lib/report-client-error.ts
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:127-134 unhandledrejection listener, skips intentional route abort
- Expected fix: Add rejection reporting with route-abort suppression.

## G2-2-034-027 [P1] GAP facet F10
- Files: src/lib/report-client-error.ts
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:136-145 wraps console.error without suppressing output
- Expected fix: Decide safe opt-in capture to preserve observable JS diagnostics without PII.

## G2-2-034-037 [P1] GAP facet F13
- Files: src/lib/report-client-error.ts
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:111-145 captures API/auth failures mid-action
- Expected fix: Instrument shared apiFetch errors with loop guard and privacy sanitizer.

## G2-2-034-059 [P1] GAP facet F21
- Files: src/lib/report-client-error.ts
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:90-103 hooks API/http video/file upload sources
- Expected fix: Wire browser instrumentation for API failures, auth mid-action, video/upload errors.

## G2-15-030-074 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: L:264-320 combined four-part CSV
- Expected fix: Restore combined report or explicitly approve replacement.

## G2-2-001-041 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: LF:194-221 legacy password door on missing manager hint, refresh token then clear session
- Expected fix: Implement approved equivalent or document removal with owner authorization; verify denied-state UX.

## G2-20-004-039 [P1] GAP facet F10
- Files: src/components/marketing/marketing-layout.tsx, src/app/request-demo/page.tsx
- Legacy: Demo CTA goes to /request-demo where DEMO_MAILTO pre-fills subject and detailed body; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:279-283`, `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`, `docs/legacy-source/frontend/src/pages/request-demo.js:68-82`
- Expected fix: Reinstate prefilled demo email body fields Name, Organization, Role, Phone, problem statement or replace with validated dedicated lead form.

## G2-20-005-028 [P1] MISSING facet F04
- Files: src/components/marketing/marketing-layout.tsx, src/app/home/page.tsx
- Legacy: MarketingLayout emits Organization + WebSite schema and dedicated OpenGraph/Twitter tags, canonical /; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:12-49,59-106`
- Expected fix: Add shared structured Organization/WebSite and complete canonical, OG, Twitter and robots metadata.

## G2-20-007-017 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Data storage text explicitly MySQL; Cloudflare R2 for files; `docs/legacy-source/frontend/src/pages/privacy-policy.js:109-118`
- Expected fix: Resolve legal data-store wording to actual vNext architecture (PostgreSQL) and preserve owner-approved policy content, not obsolete MySQL.

## G2-20-031-075 [P1] MISSING facet F17
- Files: src/components/marketing/marketing-layout.tsx
- Legacy: Legacy marketing skip-to-content link targets #main-content and becomes visible on focus (`docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:108-113`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:32-45`)
- Expected fix: Add keyboard skip link and focusable main content target

## G2-3-011-009 [P1] MISSING facet F04
- Files: src/modules/placements/tpo-configuration-read-service.ts, src/components/tpo/tpo-job-types-editor.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:75-86`, `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:110-132`
- Expected fix: Legacy counts nondeleted drives per job type and displays 0; vNext does not query/show Drives count. Add scoped grouped usage query and table column.

## G2-3-011-024 [P1] GAP facet F09
- Files: src/components/tpo/tpo-custom-job-type-placed.tsx
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:55-99`
- Expected fix: Legacy confirm Change what counts as placed? enumerates every affected custom type, number of drives and placed %/reports impact; vNext generic confirmation says only future connected consumers might change. Add real impact preview.

## G2-3-011-025 [P1] GAP facet F09
- Files: src/components/tpo/tpo-custom-job-type-rename.tsx
- Legacy: `docs/legacy-source/frontend/src/components/tpo/settings/JobTypesTab.jsx:60-98`
- Expected fix: Legacy confirm Rename on drives too? enumerates from/to and N drives changed; vNext says Existing drives are not rewritten by this change. Restore propagation and truthful confirmation.

## G2-3-011-031 [P1] GAP facet F11
- Files: src/modules/placements/tpo-configuration-read-service.ts, src/app/(authenticated)/tpo/settings/job-types/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ChoicesController.java:32-45`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:55-73`
- Expected fix: Legacy shared choices produces built-ins for no-college caller, college-visible list for college; vNext read function requires TPO manager so drive actors cannot query same authoritative choice list. Provide scoped consumer read.

## G2-11-016-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/tpo/messages/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/messages.js:19-23`
- Expected fix: Legacy /tpo/messages?tab=team shows Team within Messages; vNext /tpo/messages recruiter only, team moved to /tpo/team. Preserve deep-link redirects and tab semantics.
