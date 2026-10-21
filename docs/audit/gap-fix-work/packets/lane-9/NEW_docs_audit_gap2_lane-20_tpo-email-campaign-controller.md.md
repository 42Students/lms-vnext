# Work packet: NEW / MISSING items from docs/audit/gap2/lane-20/tpo-email-campaign-controller.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/tpo-email-campaign-controller.md

## G2-20-022-012  [P2] GAP  facet F08  effort S
- Legacy: POST returns sent/skipped/failed immediately `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:112-120`
- vNext now: Draft201 then later send endpoint [D:86-87,R:9-19]
- Fix: Separate drafted vs sent toasts
