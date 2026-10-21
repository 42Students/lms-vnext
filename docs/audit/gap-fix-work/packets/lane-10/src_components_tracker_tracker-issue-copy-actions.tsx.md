# Work packet: edit src/components/tracker/tracker-issue-copy-actions.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u003-tracker-issue-detail.md

## G2-16-003-045  [P1] GAP  facet F11  effort M
- Legacy: `trackerMarkdown.js:15-53`: full markdown includes issue fields, source metadata, engineer notes, fix commits.
- vNext now: `tracker-issue-copy-actions.tsx:13-15`: markdown copies ID, Page, description only.
- Fix: Use validated issueToMarkdown-equivalent serialization and omit empty fields exactly.

## G2-16-003-032  [P3] GAP  facet F08  effort S
- Legacy: `[issueId].js:94-96`: successful link copy toast `Link to <ID> copied`; failure `Could not copy the link — copy it from the address bar instead.`.
- vNext now: `tracker-issue-copy-actions.tsx:7-16`: generic InlineNotice `Copied to clipboard.` or `Could not copy automatically. Select the text and copy it manually.`.
- Fix: Restore ID-specific toast and exact failure copy.

## G2-16-003-033  [P3] GAP  facet F08  effort S
- Legacy: `[issueId].js:109-112`: markdown copy success `<ID> copied as markdown`; failure `Could not copy to the clipboard in this browser.`.
- vNext now: `tracker-issue-copy-actions.tsx:7-16`: same generic notice as link copy.
- Fix: Split link/markdown toasts and use exact copy.
