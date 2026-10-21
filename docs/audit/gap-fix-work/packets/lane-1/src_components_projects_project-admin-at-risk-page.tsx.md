# Work packet: edit src/components/projects/project-admin-at-risk-page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u001-college-admin-projects-at-risk.md, docs/audit/gap2/lane-7/u029-superadmin-at-risk.md

## G2-7-001-039  [P1] GAP  facet F11  effort M
- Legacy: LBE/controller/AdminProjectController.java:314-330: 400 bad college, 401 unauthenticated, 403 forbidden.
- vNext now: V/modules/projects/admin-insights-service.ts:485-495; components/projects/project-admin-at-risk-page.tsx:55-67: catch-all unavailable page.
- Fix: Show access denied/session expired distinctly from DB errors.

## G2-7-029-020  [P1] GAP  facet F04  effort M
- Legacy: superadmin/projects/at-risk/index.js:253-259 riskSeverity from projectRiskReasons count
- vNext now: project-admin-at-risk-page.tsx:142-145 risk reason count/blocker -> Risk or Watch
- Fix: Match legacy Watch/At risk/High risk cutoffs and badge color; verify exact helper thresholds

## G2-7-029-058  [P1] GAP  facet F12  effort M
- Legacy: superadmin/projects/at-risk/index.js:253-259 severity via riskSeverity 1/2/3 signal counts
- vNext now: project-admin-at-risk-page.tsx:142-145 1 vs multiple reasons Risk/Watch (no three-tier severity)
- Fix: Restore three-level severity formula and ordering for risk signal combinations

## G2-7-029-036  [P2] GAP  facet F07  effort S
- Legacy: superadmin/projects/at-risk/index.js:342-344 Report could not be loaded banner with sanitized error text
- vNext now: project-admin-at-risk-page.tsx:64-66 At-risk workspaces unavailable and generic description
- Fix: Use exact Report could not be loaded and safe cause

## G2-7-029-037  [P2] GAP  facet F07  effort S
- Legacy: superadmin/projects/at-risk/index.js:128-135 load failure clears list and shows Failed to load project workspaces.
- vNext now: project-admin-at-risk-page.tsx:55-68 catches failure and full ErrorState
- Fix: Match failure fallback and in-page banner

## G2-7-029-041  [P2] GAP  facet F08  effort S
- Legacy: superadmin/projects/at-risk/index.js:453-456 No at-risk workspaces match this filter vs No at-risk projects detected for this college
- vNext now: project-admin-at-risk-page.tsx:106-108 single No at-risk projects / No at-risk project workspaces match these filters.
- Fix: Differentiate fully empty college from filtered empty with old exact wording
