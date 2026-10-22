# Notice for lane 4 (read and apply FIRST)

BUILD IS GREEN and eslint has 0 errors. The only lint blocker left is the UX anti-drift guard. TOP PRIORITY: docs/orchestrator/queues/clone/lane-4-ci6.md (about 7 small fixes), then lane-4-ci4.md, then lane-4-ci5.md (unit/integration failures). Never silence errors or add guard waivers (no any, @ts-ignore, @ts-expect-error, eslint-disable, .skip, baseline entries). Push only to chatgpt/chat-4-b. No CI waiting.
