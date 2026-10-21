# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/organization.md

6 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/organization.md

## G2-6-018-020  [P1] GAP  facet F06  effort M
- Legacy: Legacy edit Cancel warns of unsaved edits (Organizations.js:129-146,208-216).
- vNext now: vNext Cancel closes Rename dialog directly (organization-actions.tsx:113-129).
- Fix: Add dirty-form confirmation Discard changes to this organization? with matching copy and Escape/close guard.

## G2-6-018-032  [P1] MISSING  facet F09  effort M
- Legacy: Legacy dirty edit cancel opens second discard changes confirm (Organizations.js:129-146).
- vNext now: New Dialog onOpenChange closes if !pending without dirty check (organization-actions.tsx:113-116).
- Fix: Add unsaved-change confirmation for cancel, X and Escape.

## G2-6-018-041  [P1] GAP  facet F12  effort M
- Legacy: Legacy blocks delete while any nondeleted college linked (OrganizationServiceImpl.java:76-85).
- vNext now: vNext blocks archive only if college.status ACTIVE (organizations/service.ts:253-257).
- Fix: Compare legacy isDeleted vs vNext college ARCHIVED mapping; don't archive parent while any owned college still requires active organization.

## G2-6-018-027  [P2] GAP  facet F08  effort S
- Legacy: Legacy edit toast Updated organization “X”. (Organizations.js:100-109).
- vNext now: vNext title Organization renamed (organization-actions.tsx:59-64).
- Fix: Use exact dynamic legacy success string and status treatment.

## G2-6-018-028  [P2] GAP  facet F08  effort S
- Legacy: Legacy delete toast Deleted organization “X”. (Organizations.js:113-125).
- vNext now: vNext toast Organization archived (organization-actions.tsx:93-97).
- Fix: Align action vocabulary Delete vs Archive or explicitly mark product semantics change and preserve accurate text.

## G2-6-018-029  [P2] GAP  facet F08  effort S
- Legacy: Legacy readOnly action warning Clear scope to manage organizations. (Organizations.js:66-68,86-87,113-115).
- vNext now: vNext guard via permissions; no equivalent toast in action component (organization-actions.tsx:32-34,70-71).
- Fix: Show clear scope reason for disabled action, not silent unavailability.
