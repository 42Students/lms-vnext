# Work packet: edit src/modules/academics/lecture-hall-copy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-lecture-halls.md

## G2-9-017-045  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:141-145` — Created toast Lecture hall created successfully!; create failure Could not create the room. Try again.
- vNext now: `src/modules/academics/lecture-hall-copy.ts:22-24` — Success string exactly preserved via constant; failure generic.
- Fix: Keep toast success and correct create-specific error.
