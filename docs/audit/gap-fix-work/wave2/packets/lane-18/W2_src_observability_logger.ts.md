# Work packet (wave 2): edit src/observability/logger.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/base-controller.md

## G2-2-028-007  [P2] GAP  facet F04  effort M
- Legacy: BaseController.java:13-15 accepts message:String,object:Object and converts to JsonNode via ObjectMapper.valueToTree.
- vNext now: src/observability/logger.ts:32-45 uses event string and fields Record<string,unknown>, with timestamp/severity/requestId.
- Fix: Publish structured-field mapping for any migrated logRequest caller; never assume stringification fidelity.

## G2-2-028-008  [P2] GAP  facet F04  effort M
- Legacy: BaseController.java:14 logs the transformed arbitrary object with passed format string.
- vNext now: src/observability/logger.ts:65-79 JSON.stringify outputs severity/event/timestamp/fields.
- Fix: Avoid direct object value logging if sensitive; document field sanitizer and type/format differences.

## G2-2-028-019  [P2] GAP  facet F10  effort M
- Legacy: BaseController.java:13-15 sole method `void logRequest(String,Object)` side effect INFO log.
- vNext now: src/observability/logger.ts:100-103 exports logInfo and `writeStructuredLog` at :60-80.
- Fix: Establish new logInfo call site if any migrated controller actually invoked legacy helper.

## G2-2-028-043  [P2] GAP  facet F22  effort M
- Legacy: BaseController.java:11 injected ObjectMapper serialization rules may differ from JSON.stringify.
- vNext now: src/observability/logger.ts:65-72 uses JSON.stringify directly.
- Fix: Normalize timestamp/enum/null and sensitive field serializations for migrated structured logs.

## G2-2-028-006  [P3] GAP  facet F03  effort S
- Legacy: BaseController.java:10-15 contains `objectMapper` and `logRequest`, not an interactive control.
- vNext now: src/observability/logger.ts:100-103 exposes `logInfo` method for server call sites.
- Fix: Review callers for intentional logging equivalence; no client control belongs here.

## G2-2-028-021  [P3] GAP  facet F10  effort S
- Legacy: BaseController.java:14 uses Lombok `@Slf4j` logger.
- vNext now: src/observability/logger.ts:74-80 sends warnings/errors stderr and info stdout.
- Fix: Check collector severity/channel filters when preserving admin incident dashboards.

## G2-2-028-035  [P3] GAP  facet F18  effort S
- Legacy: BaseController.java:14 logs `message` as printf pattern alongside ObjectMapper result.
- vNext now: src/observability/logger.ts:38-45 labels log field `event`, not full printf template.
- Fix: Document stable old->new event name mapping for log search continuity.

## G2-2-028-040  [P3] GAP  facet F21  effort M
- Legacy: BaseController.java:3-6 imports Jackson, Lombok, Spring Autowired.
- vNext now: src/observability/logger.ts:1-2 imports log-alert reporter/request ID and uses Node process streams at :60-80.
- Fix: Map external logging collector and incident pipeline, not Java-specific library ports.
