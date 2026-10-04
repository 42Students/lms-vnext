# Project status command

Use the repository checklist itself as the source of truth for LMS vNext completion statistics.

Run:

```bash
npm run status
```

For machine-readable output:

```bash
npm run status -- --json
```

The command reads `docs/planning/vnext-execution-checklist.md` and counts only product execution phases **A through AC**.

It deliberately excludes:

- the legend/example checkboxes at the top of the checklist;
- section AD, which contains instructions for future ChatGPT sessions rather than LMS implementation work.

Two completion measures are reported:

- **strict completion** = fully complete items / all execution items;
- **practical completion** = complete items + 50% credit for explicitly partial/dependency-blocked items.

The practical percentage is directional, not a release gate. Production launch remains governed by the explicit production/launch checklist and runbooks.

When a batch changes checklist state, update the checklist in the same commit. Future progress reports should prefer this command over manually recounting checkboxes or reusing percentages from older chats.
