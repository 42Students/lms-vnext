# Work packet: NEW / MISSING items from docs/audit/gap2/lane-4/cross-third-party-integrations.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-4/cross-third-party-integrations.md

## G2-4-033-032  [P1] GAP  facet F12  effort M
- Legacy: Legacy upload video max 5GiB and accepts mp4/webm/mov/m4v `docs/architecture/file-and-video-storage.md:15`
- vNext now: New single PUT max 4900MiB without multipart `docs/architecture/file-and-video-storage.md:62`
- Fix: Either add multipart or show exact reduced limit preselection; never promise 5GiB.
