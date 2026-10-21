# Work packet: edit src/components/courses/college-content-authoring-control.tsx (part 2 of 2)

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-043  [P3] GAP  facet F08  effort S
- Legacy: Old Resource toasts `Resource files uploaded`, `Resource created`, `Resource updated`, `Resource deleted` (`AdminResources.js:240-243,286-304`).
- vNext now: New generic inline `Content created.`/`Content updated.` (`college-content-authoring-control.tsx:111-113`).
- Fix: Use old Resource messages, including file progress.
