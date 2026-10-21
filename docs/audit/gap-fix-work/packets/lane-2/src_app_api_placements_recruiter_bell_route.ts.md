# Work packet: edit src/app/api/placements/recruiter/bell/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-10-025-037  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:88-93 — Mark-all-read returns {ok:true}.
- vNext now: src/app/api/placements/recruiter/bell/route.ts:13-19 — Returns service data object; verify contains acknowledgement.
- Fix: Maintain simple boolean acknowledgement shape
