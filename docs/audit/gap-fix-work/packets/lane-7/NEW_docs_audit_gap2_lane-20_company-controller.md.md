# Work packet: NEW / MISSING items from docs/audit/gap2/lane-20/company-controller.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/company-controller.md

## G2-20-027-008  [P2] GAP  facet F07  effort S
- Legacy: Exact Company name is required docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:138-140
- vNext now: New typed validation/route errors [N:26-32,R:36-45]
- Fix: Map field error

## G2-20-027-010  [P3] GAP  facet F08  effort S
- Legacy: Old Company created/updated/restored messages docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CompanyController.java:162-219
- vNext now: New JSON return no message string [R:36-43,X:9-16]
- Fix: Map toast wording
