# Work packet: NEW / MISSING items from docs/audit/gap2/lane-11/l15-u022-tpo-recruiter-access-controller.md

3 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-11/l15-u022-tpo-recruiter-access-controller.md

## G2-15-022-050  [P1] MISSING  facet F23  effort M
- Legacy: Legacy indefinite extension (0), 24-month quick option, revoke reason and provenance absent/newly constrained; TpoRecruiterAccessController.java:87-105,114-135; settings.js:607,729-736
- vNext now: vNext months union 3/6/12 and no reason; write-model.ts:10-21
- Fix: Do not mark parity done until owner signs off on removal or features restored with tests.

## G2-15-022-024  [P2] GAP  facet F08  effort S
- Legacy: Extend audit detail `No end date` or `Until <localdate>`; success toast `Access extended`; TpoRecruiterAccessController.java:107-111; settings.js:733-734
- vNext now: Returns `{outcome:'extended',grantId,validUntil ISO}`; write-service.ts:149-156
- Fix: Use `Access extended` toast and concise human date after confirm; map return ISO into local UI.

## G2-15-022-025  [P2] GAP  facet F08  effort S
- Legacy: Revoke `204 No Content`, frontend `Access removed`; TpoRecruiterAccessController.java:135-136; settings.js:735-736
- vNext now: Returns outcome `revoked` JSON; write-service.ts:167-174
- Fix: Keep toast/confirmation text while accepting new JSON envelope intentionally.
