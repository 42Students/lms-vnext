# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-4/cross-third-party-integrations.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-4/cross-third-party-integrations.md

## G2-4-033-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy video file picker and playback specified by controller-backed source `docs/architecture/file-and-video-storage.md:9-20`
- vNext now: Private object life cycle READY and signed playback documented `docs/architecture/file-and-video-storage.md:24-42`
- Fix: Compare faculty video authoring and learner player end-to-end live, including progress/seek.

## G2-4-033-033  [P2] GAP  facet F12  effort M
- Legacy: Legacy 10MiB thumbnails and course-images 5MiB `docs/architecture/file-and-video-storage.md:16`
- vNext now: New optional video thumbnail 5MiB JPEG/PNG/WebP `docs/architecture/file-and-video-storage.md:16`
- Fix: Compare per-folder size/type limits and present precise validation.

## G2-4-033-045  [P2] GAP  facet F19  effort M
- Legacy: Legacy video 5GiB path has presign+single PUT `docs/architecture/file-and-video-storage.md:9-15`
- vNext now: New video single PUT max 4900MiB `docs/architecture/file-and-video-storage.md:62`
- Fix: Test 100MB/1GB/4.9GB uploads, timeouts and CORS against actual R2.
