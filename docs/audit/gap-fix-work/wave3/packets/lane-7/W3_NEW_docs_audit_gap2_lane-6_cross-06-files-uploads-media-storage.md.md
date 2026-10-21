# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-6/cross-06-files-uploads-media-storage.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/cross-06-files-uploads-media-storage.md

## G2-6-032-023  [P2] MISSING  facet F06  effort L
- Legacy: Legacy import-from-link allowed Google Drive files and approved video hosts with SSRF controls (FileUploadController.java:189-190,739-909).
- vNext now: vNext video URL import intentionally not carried over; local grant/PUT documented (file-and-video-storage.md:15).
- Fix: Record removed paste-link flow; restore only with explicit policy and SSRF-protected fetch.

## G2-6-032-035  [P2] MISSING  facet F10  effort L
- Legacy: Legacy URL video import and validate-video-url POST fetch on server (FileUploadController.java:830-909).
- vNext now: vNext URL import not carried over (file-and-video-storage.md:15).
- Fix: Document missing action on faculty video screen, do not recreate unrestricted fetch.
