# Lane dashboard

A zero-dependency local dashboard for a fleet of ChatGPT "lanes" that push to branches `chatgpt/chat-N-b`.

```
node tools/lane-dashboard/server.js        # then open http://localhost:8787
```

It refreshes itself every 10 s and shows: overall stats, source-commit rate, wave progress, a per-lane table (status, last
activity, commits in 30 min / 2 h, last commit, link to the lane's chat), the merge robot (conflicts retried, files reverted),
and an event log.

## Config (`config.json`)
`lanes`, `branch`, `tag` (commit tag pattern like `[chat-{n}]`), `baseTag` (restore-point tag for "since start" numbers),
`stalledMinutes`, `laneIdsFile` (markdown with lines `7: <chat id>` to build chat links), `cycleFile` / `lockFile` (merge robot log
and lock), `port`, `title`.

## Reuse for other jobs
Any workflow can add its own panels: drop a JSON file in `state/panels/<name>.json`. Panel types:

| type | fields |
|---|---|
| `stats` | `title`, `items: [{label, value, tone: good/warn/bad}]`, `note` |
| `progress` | `title`, `items: [{label, done, total}]`, `updated` |
| `table` | `title`, `columns: [{key, label, badge?, fmt?: "age", link?}]`, `rows: [{...}]` |
| `spark` | `title`, `series: [numbers]` |
| `log` | `title`, `lines: [text]` |

`state/progress.json` (same shape as a progress panel) feeds the built-in progress card, and `state/events.log` (one line per
event) feeds the event log. Change `branch`/`tag`/`lanes` in `config.json` to point it at a different set of lanes.
