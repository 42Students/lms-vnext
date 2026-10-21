# Work packet: edit src/components/activity/activity-center.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-audit.md, docs/audit/gap2/lane-7/u002-college-admin-projects-audit.md, docs/audit/gap2/lane-7/u030-superadmin-project-audit.md, docs/audit/gap2/lane-9/superadmin-audit-logs.md, docs/audit/gap2/lane-9/superadmin-audit-hub.md

## G2-10-003-013  [P1] GAP  facet F04  effort M
- Legacy: Old sentence derives action from typed VERBS table with special sentence cases `docs/legacy-source/frontend/src/components/admin/activity/activityText.js:4-60`
- vNext now: New sentence derives last token of eventType and lower-case subjectType without special cases `src/components/activity/activity-center.tsx:36-55`
- Fix: Port legacy verb/thing and exceptional sentence rules to new event taxonomy

## G2-10-003-040  [P1] GAP  facet F12  effort M
- Legacy: Old technical event parser handles ENTITY_VERB_BULK naming `docs/legacy-source/frontend/src/components/admin/activity/activityText.js:4-61`
- vNext now: New type parser splits dot eventType and uses last word as verb `src/components/activity/activity-center.tsx:36-55`
- Fix: Add explicit event-code to canonical sentence mapping and action tone test vectors

## G2-7-002-009  [P1] GAP  facet F02  effort L
- Legacy: LFE/pages/college-admin/projects/audit/index.js:586-611: table under card, day-divider rows and page controls.
- vNext now: V/components/projects/project-admin-audit-page.tsx:328-339 and components/activity/activity-center.tsx:114-208: article stream and load-more.
- Fix: Restore log table and day separators with expandable structured rows.

## G2-7-030-016  [P1] GAP  facet F04  effort L
- Legacy: audit/index.js:327-343 projectAuditActionLabel humanizes legacy eventKey
- vNext now: activity-center.tsx:36-54 humanizes projects.* taxonomy into sentence
- Fix: Create explicit action-key translation, including template and release events

## G2-7-030-019  [P1] GAP  facet F04  effort M
- Legacy: audit/index.js:432-466 payloadJson expanded into structured key/value rows
- vNext now: activity-center.tsx:170-197 grouped metadata rather than per-row legacy payload expansion
- Fix: Expose full event metadata safely with type-aware nested rendering

## G2-7-030-077  [P1] GAP  facet F22  effort L
- Legacy: audit/index.js:19-74 legacy actionKey/entityId/actorUserType/payloadJson/createdAt
- vNext now: activity-center.tsx:7-33 eventType, subjectType/Id/label, metadata, importance, occurredAt and actor
- Fix: Write explicit AdminAuditLog -> ActivityEvents migration mapping and nullable/global tenant handling

## G2-9-027-005  [P1] GAP  facet F02  effort L
- Legacy: Below filter Card is standalone 8-column Ant Table `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:300-334`
- vNext now: New grouped activity article cards, not a raw table `src/components/activity/activity-center.tsx:113-195`
- Fix: Render original forensic 8-column dense table mode.

## G2-9-027-015  [P1] GAP  facet F04  effort M
- Legacy: Actor displays resolved name with tooltip raw type/id; IP, User Agent visible `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:221-236`
- vNext now: Actor name/email in summary; lacks raw type, IP and User Agent `src/components/activity/activity-center.tsx:45-54,180-189`
- Fix: Decide privacy-safe exposure and keep actor identifier/details.

## G2-7-030-034  [P2] GAP  facet F07  effort S
- Legacy: audit/index.js:629-633 3 conditional no-results strings by entity/action/range
- vNext now: activity-center.tsx:105-110 one No meaningful activity matches these filters.
- Fix: Restore no entity/no action/no range distinction

## G2-9-026-030  [P2] GAP  facet F08  effort S
- Legacy: Nothing important happened in this period. vs No activity in this period. `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:208-209`
- vNext now: No meaningful activity matches these filters. with technical noise explanation `src/components/activity/activity-center.tsx:105-110`
- Fix: Use legacy category-aware empty wording.

## G2-9-027-031  [P2] GAP  facet F08  effort S
- Legacy: No activity recorded yet vs Audit logs could not be loaded `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:320-320`
- vNext now: No meaningful activity matches these filters. `src/components/activity/activity-center.tsx:105-110`
- Fix: Restore raw table empty/error copy.
