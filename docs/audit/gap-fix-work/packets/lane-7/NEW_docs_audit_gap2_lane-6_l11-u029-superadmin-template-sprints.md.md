# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/l11-u029-superadmin-template-sprints.md

6 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l11-u029-superadmin-template-sprints.md

## G2-11-029-022  [P1] MISSING  facet F09  effort M
- Legacy: UnsavedFormGuard prevents window unload and in-app navigation via confirmation (sprints.js:37-39; useUnsavedFormGuard.js:17-55).
- vNext now: Editor Cancel/reset without checking dirty and no beforeunload/route-change handler (plan-editor.tsx:136-139,277-284).
- Fix: Protect unsaved form across Back, tabs, sidebar, refresh and browser close.

## G2-11-029-025  [P1] GAP  facet F10  effort M
- Legacy: updateProjectTemplate payload only sprints plus templateScalars, tasks only if orphaned (sprints.js:82-116).
- vNext now: PATCH sends entire parsed blueprint (releases,sprints,tasks,resources) + expectedVersion (plan-editor.tsx:90-109).
- Fix: Use merge/section PATCH or guarantee version conflict and no loss of concurrent edits.

## G2-11-029-026  [P1] GAP  facet F11  effort M
- Legacy: Scope from useSuperAdminScope.selectedCollegeId (sprints.js:26-29).
- vNext now: Server can(project-template.manage), global template (super-admin-template-subview-page.tsx:209-218).
- Fix: Verify acting-college scope and permission parity to prevent tenant edits.

## G2-11-029-034  [P1] GAP  facet F17  effort M
- Legacy: useUnsavedFormGuard catches tab/back keyboard nav and beforeunload (useUnsavedFormGuard.js:17-55).
- vNext now: Editor no dirty-navigation guard (plan-editor.tsx:33-41,136-139).
- Fix: Implement accessible non-destructive confirmation on navigation.

## G2-11-029-019  [P2] GAP  facet F07  effort M
- Legacy: Legacy load failure 'Failed to load template.' and 'Template could not be loaded' (sprints.js:47-69,134-136).
- vNext now: ErrorState 'Template section unavailable' with Retry route link (super-admin-template-subview-page.tsx:113-132).
- Fix: Restore exact error title and preserve retry.

## G2-11-029-020  [P2] GAP  facet F08  effort M
- Legacy: Save success toast 'Sprints saved'; save failure project error modal 'Failed to save sprints' (sprints.js:117-123).
- vNext now: Inline Banner Sprints saved; inline error Banner with fallback Failed to save sprints (plan-editor.tsx:112-121,141,277).
- Fix: Match toast/modal presentation and exact feedback.
