# Work packet: edit src/app/(authenticated)/hr/company/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-company.md

## G2-13-001-044  [P1] GAP  facet F10  effort M
- Legacy: Three fetchers each load only their active tab and allow Retry (`docs/legacy-source/frontend/src/pages/recruiter/company.js:35-48`)
- vNext now: Main company route always loads company+team and attributed-drive counts regardless of active company tab (`src/app/(authenticated)/hr/company/page.tsx:68-95`)
- Fix: Lazy-load team/counts only on Team tab to avoid avoidable failure/latency.

## G2-13-001-035  [P2] GAP  facet F07  effort M
- Legacy: Malformed team/report payload gets custom `data is incomplete` warning and Retry (`docs/legacy-source/frontend/src/pages/recruiter/company.js:82-85`)
- vNext now: Team service returns selected rows; no payload-shape warning; reports validate query only (`src/app/(authenticated)/hr/company/page.tsx:68-95`)
- Fix: Add explicit invalid upstream-data handling where dynamic response parity is required.

## G2-13-001-037  [P2] GAP  facet F08  effort M
- Legacy: Load failure shows warning `Could not load this` with Retry, not toast (`docs/legacy-source/frontend/src/pages/recruiter/company.js:47-48`)
- vNext now: Error is route boundary/page state, no success toast (`src/app/(authenticated)/hr/company/page.tsx:68-89`)
- Fix: Restore non-disruptive inline warning/retry for failures that are recoverable.
