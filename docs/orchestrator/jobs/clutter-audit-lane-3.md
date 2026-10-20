# Job: write the alignment and clutter audit script (lane chat-3)

Create `scripts/audit/clutter-audit.ts` (TypeScript, Playwright, same login approach as `scripts/audit/pixel-audit.ts`: read it first and copy its cookie and OTP login handling, its role accounts and its route discovery). It visits every authenticated page route for each role at 1280, 768 and 375 widths and writes `docs/audit/ux/clutter-report.json` plus `docs/audit/ux/clutter-report.md` (ranked table, worst pages first).

Per page measure and report:
- Alignment: left edges of the page head, each card/section and the table or form; list pages where sibling sections start at different x; gutters and gaps between sibling cards that differ by more than 2px; controls in the same row with different heights; header action buttons that wrap or overflow.
- Clutter: counts of buttons, links, inputs, cards, tables, filters; interactive elements inside the first 800px; card-inside-card nesting depth; number of distinct font sizes and font weights; amount of visible text; empty sections.
- A clutter score (document the formula in the report header) and a list of the top 5 concrete problems per page.

Make it runnable with `npx tsx scripts/audit/clutter-audit.ts <role|all>` (env BASE_URL, CHROME_PATH). It must be valid TypeScript with no new packages (playwright is already installed). Commit the script and a short `docs/audit/ux/clutter-audit-readme.md` explaining usage. Push to chatgpt/chat-3-b with [chat-3].
