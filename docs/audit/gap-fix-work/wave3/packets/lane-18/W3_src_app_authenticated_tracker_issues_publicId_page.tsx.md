# Work packet (wave 3): edit src/app/(authenticated)/tracker/issues/[publicId]/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u003-tracker-issue-detail.md

## G2-16-003-018  [P1] MISSING  facet F05  effort L
- Legacy: `[issueId].js:202-223`: screenshot gallery shows all with image previews and filenames; Ant PreviewGroup lightbox.
- vNext now: `issues/[publicId]/page.tsx:171-197`: filename/MIME/size/time only; no actual image previews or click-to-enlarge.
- Fix: Serve private signed thumbnail/view URL to authorized reader and enable accessible preview lightbox.

## G2-16-003-054  [P1] MISSING  facet F14  effort L
- Legacy: `[issueId].js:198-230`: Image.PreviewGroup with enlarged screenshots and external evidence link.
- vNext now: `issues/[publicId]/page.tsx:171-187,119-125`: attachment metadata only; HTTPS-only clickable evidence.
- Fix: Implement authenticated on-demand image URLs and gallery, preserving private storage.

## G2-16-003-082  [P1] MISSING  facet F23  effort L
- Legacy: `[issueId].js:129-250`: standalone public readable issue detail.
- vNext now: `issues/[publicId]/page.tsx:45-50`: admin-only route; reporter alternate has reduced view.
- Fix: Provide complete read-only reporter detail for permitted owner with evidence/safe context.

## G2-16-003-083  [P1] MISSING  facet F23  effort L
- Legacy: `[issueId].js:203-224`: screenshot preview present.
- vNext now: `issues/[publicId]/page.tsx:171-187`: security-driven omission of preview; no signed viewer route.
- Fix: Add signed authorized image preview flow.
