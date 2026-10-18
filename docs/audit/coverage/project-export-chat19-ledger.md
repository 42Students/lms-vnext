# Project workspace export breaker coverage — chat-19

2026-10-18 · branch `chatgpt/chat-19-b`. Owner scope: unowned IIT Dharwad Projects user-visible exports. This is source + authored test evidence, not a cloud CI or database certificate.

| Gap ID | Export / entry point | Behavioral test | Valid, malformed, boundary and adverse state coverage |
|---|---|---|---|
| PROJ-BREAK-EXPORT-01 | `src/modules/projects/admin-workspace-page-export-model.ts` — `projectWorkspaceCsvCell` | `tests/unit/PROJ-BREAK-chat19-project-workspace-csv.test.ts` | Unicode BOM/format/paragraph/newline prefixes, CSV quote doubling, negative number preserved as numeric, string formula negative neutralized |
| PROJ-BREAK-EXPORT-01 | same — `projectWorkspacePageCsv` | same test | Only the supplied authorized visible page included, header matches export, status label generated, time shown at IST midnight boundary, zero visible workspaces yields headings only |
| PROJ-BREAK-EXPORT-02 | `src/components/projects/project-admin-workspace-page-export.tsx` — `ProjectAdminWorkspacePageExport` | `tests/unit/PROJ-BREAK-chat19-project-workspace-export-ui.test.tsx` | Actual SSR disabled zero rows vs allowed visible rows, 44px button, no platform-wide export link |

## Security boundary and remaining integration verification

The owning college page constructs `items` only from `listProjectAdminSnapshots(context, collegeId, query)`, which independently checks `projects.manage` and filters persisted projects by `collegeId`. `getProjectAdminCollegeId(context)` forbids unscoped SA fallback. The export component performs **no additional query** and cannot retrieve projects absent from those authorized props. A request to export all workspaces should **not** silently increase the data scope.

Explicitly outstanding: PostgreSQL persisted-role revocation races; all-college vs active-college denial at the service boundary; browser download/blob/CSP behavior; cross-spreadsheet real import; 320/360/390px visual checks. Other lanes own the Projects overall ledger; this lane's independent tests are supplementary and are not counted as full service/export integration.
