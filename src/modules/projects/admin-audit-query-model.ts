import { ACTIVITY_EVENT_TYPES, ACTIVITY_IMPORTANCE } from "@/modules/activity/taxonomy";

export type ProjectAdminAuditSearchParams = Record<
  string,
  string | string[] | undefined
>;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isoCursorPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const eventTypes = new Set<string>(
  Object.values(ACTIVITY_EVENT_TYPES).filter((value) => value.startsWith("projects.")),
);
const importanceValues = new Set<string>(ACTIVITY_IMPORTANCE);

function validCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const instant = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(instant.getTime()) &&
    instant.toISOString().slice(0, 10) === value;
}

function validCursor(value: string): boolean {
  if (!isoCursorPattern.test(value)) return false;
  const instant = new Date(value);
  return !Number.isNaN(instant.getTime()) && instant.toISOString() === value;
}

/** Accept only values the activity service can safely parse.
 * A manually edited audit link is not allowed to throw a server-side Zod error. */
export function parseProjectAdminAuditQuery(params: ProjectAdminAuditSearchParams) {
  // Unknown URL keys are never applied to the activity query. Surface an
  // explicit recovery warning instead of silently pretending they were used.
  let ignoredInvalidFilters = Object.keys(params).some(key=>![
    "action","status","eventType","importance","subjectType","subjectId",
    "from","to","beforeOccurredAt","beforeId",
  ].includes(key));
  const read = (key: string): string | undefined => {
    const raw = params[key];
    // Duplicated URL values are ambiguous. Never select the attacker-chosen
    // first value, even if the rest contain valid filter or cursor tokens.
    if(Array.isArray(raw)){
      ignoredInvalidFilters=true;
      return undefined;
    }
    const value=raw?.trim();
    return value || undefined;
  };
  const allow = (key: string, predicate: (value: string) => boolean) => {
    const value = read(key);
    if (value && !predicate(value)) {
      ignoredInvalidFilters = true;
      return undefined;
    }
    return value;
  };

  const actionAliases=[read("action"),read("status"),read("eventType")]
    .filter((value):value is string=>Boolean(value));
  // All three query keys are legacy aliases for ONE filter, not independent
  // selectors. Conflicting values must never quietly prefer the first.
  const ambiguousAction=new Set(actionAliases).size>1;
  if(ambiguousAction)ignoredInvalidFilters=true;
  const action=ambiguousAction?undefined:actionAliases[0];
  const eventType = action && eventTypes.has(action)
    ? action : undefined;
  if (action && !eventType) ignoredInvalidFilters = true;

  const importanceValue = allow("importance", (value) => importanceValues.has(value));
  const importance = importanceValue as (typeof ACTIVITY_IMPORTANCE)[number] | undefined;
  const subjectType = allow("subjectType", (value) => value.length <= 80);
  const subjectId = allow("subjectId", (value) => value.length <= 500);
  const from = allow("from", validCalendarDate);
  let to = allow("to", validCalendarDate);
  if (from && to && from > to) {
    ignoredInvalidFilters = true;
    to = undefined;
  }

  const cursorTime = read("beforeOccurredAt");
  const cursorId = read("beforeId");
  const cursorValid = Boolean(
    cursorTime && cursorId &&
    validCursor(cursorTime) && uuidPattern.test(cursorId),
  );
  if ((cursorTime || cursorId) && !cursorValid) ignoredInvalidFilters = true;

  return {
    eventType,
    importance,
    subjectType,
    subjectId,
    from,
    to,
    beforeOccurredAt: cursorValid ? cursorTime : undefined,
    beforeId: cursorValid ? cursorId : undefined,
    ignoredInvalidFilters,
  };
}
