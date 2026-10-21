# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u018-college-admin-deleted-workspaces.md (part 2 of 2)

8 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u018-college-admin-deleted-workspaces.md

## G2-7-018-068  [P1] GAP  facet F22  effort L
- Legacy: LBE/controller/AdminProjectController.java:340-355 deleted page endpoint returns PageDTO; restoreProject Java service separate from archive
- vNext now: V/modules/projects/instance-restore-service.ts:15-79 only status ARCHIVED restore
- Fix: Separate archived lifecycle and soft-deleted restore semantics in schema/service

## G2-7-018-069  [P1] GAP  facet F23  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:19-21 separate Deleted workspaces from normal active workspace list
- vNext now: V/app/(authenticated)/college/projects/page.tsx:127-134 Archived workspaces tab, no Deleted list
- Fix: Do not silently substitute Archived workspaces for Deleted workspaces

## G2-7-018-070  [P1] GAP  facet F23  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:87-95 blocked mentorless restore with warning
- vNext now: V/modules/projects/instance-restore-service.ts:33-42 refuses mentorless restore outright
- Fix: Document intentional stronger guard if owner chooses it; provide manual recovery pathway

## G2-7-018-025  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:62-70 fetch failures show raw server message or Failed to load deleted workspaces.
- vNext now: V/app/(authenticated)/college/projects/page.tsx:71-86 Project workspaces unavailable message for active list
- Fix: Use exact deleted-list failure wording and separate retry

## G2-7-018-026  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:99-101 project-specific error modal fallback Failed to restore workspace
- vNext now: V/components/projects/project-archive-control.tsx:73-75 Restore failure toast Failed to restore workspace
- Fix: Retain fallback string and detailed project error modal or actionable 409

## G2-7-018-028  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:140-153 no-college warning Admin not assigned to a college
- vNext now: V/app/(authenticated)/college/projects/page.tsx:34-42 different No college selected state
- Fix: Match title/description in shell

## G2-7-018-030  [P2] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:64-70 failed load is persistent error Alert and retry, not toast
- vNext now: V/app/(authenticated)/college/projects/page.tsx:79-86 ErrorState for active list
- Fix: Use exact error banner and retry control

## G2-7-018-031  [P2] GAP  facet F08  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:171-183 failed fetch refuses to show reassuring empty success text
- vNext now: V/app/(authenticated)/college/projects/page.tsx:71-86 active fetch error displayed, no deleted empty branch
- Fix: Prevent false No deleted workspaces empty state after fetch failure
