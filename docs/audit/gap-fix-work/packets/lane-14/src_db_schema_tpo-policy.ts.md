# Work packet: edit src/db/schema/tpo-policy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/tpo-settings-controller.md

## G2-6-022-045  [P1] GAP  facet F12  effort M
- Legacy: Legacy held-offer 1–5/uplift0–200/response12–168 enforced in service (TpoSettingsService.java:36-38).
- vNext now: vNext Zod matches limits, but DB lower-bound minResponse >=1 and no upper caps (tpo-policy-validation.ts:19-21; tpo-policy.ts:52-55).
- Fix: Add exact DB constraints for all four bounds so raw writers cannot bypass validation.
