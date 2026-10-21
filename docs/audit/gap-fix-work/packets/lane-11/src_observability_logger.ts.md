# Work packet: edit src/observability/logger.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/base-controller.md

## G2-2-028-045  [P1] GAP  facet F23  effort M
- Legacy: BaseController.java:13-15 logs object payload without built-in redact/allowlist.
- vNext now: src/observability/logger.ts:32-45 accepts arbitrary fields; `logInfo` at :101-103 does not redact automatically.
- Fix: Introduce privacy-safe allowed-field wrapper for all raw request logging before calling logInfo.

## G2-2-028-017  [P3] GAP  facet F08  effort S
- Legacy: BaseController.java:14 forwards arbitrary message to log.info.
- vNext now: src/observability/logger.ts:100-103 uses logInfo(event, fields), no arbitrary printf template.
- Fix: Map old logging messages to stable events; align observability dashboards, not toast text.
