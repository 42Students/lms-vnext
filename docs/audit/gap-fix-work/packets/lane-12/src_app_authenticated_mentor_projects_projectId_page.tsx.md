# Work packet: edit src/app/(authenticated)/mentor/projects/[projectId]/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u027-mentor-project-detail.md

## G2-7-027-004  [P1] GAP  facet F01  effort M
- Legacy: PDC:838-871 delivery query maps Overview and opens final submission modal once
- vNext now: mentor/projects/[projectId]/page.tsx:40-43 delivery is a separate section, no modal on entry
- Fix: Open final submission review once on delivery deeplink, respect closing

## G2-7-027-056  [P1] GAP  facet F12  effort M
- Legacy: PDC:822-871 ?tab=delivery maps overview and opens modal once
- vNext now: mentor/projects/[projectId]/page.tsx:40-43 separate delivery
- Fix: Preserve legacy deep-link review initiation

## G2-7-027-086  [P1] GAP  facet F20  effort M
- Legacy: PDC:861-871 one-time delivery modal open ref
- vNext now: mentor/projects/[projectId]/page.tsx:40-43 no ref latch
- Fix: Preserve once-only open and dismiss state
