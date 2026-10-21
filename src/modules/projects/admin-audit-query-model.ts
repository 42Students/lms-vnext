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

const legacyProjectAuditActions:Readonly<Record<string,string>> = {
 PROJECT_CREATE:ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_CREATED,
 PROJECT_ARCHIVE:ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_ARCHIVED,
 PROJECT_DELETE:ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_DELETED,
 PROJECT_RESTORE:ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_RESTORED,
 PROJECT_READINESS_OVERRIDE:ACTIVITY_EVENT_TYPES.PROJECTS_READINESS_OVERRIDDEN,
 PROJECT_ASSIGN_MENTOR:ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_REASSIGNED,
 PROJECT_TEMPLATE_CREATE:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_CREATED,
 PROJECT_TEMPLATE_UPDATE:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_REVISED,
 PROJECT_TEMPLATE_ARCHIVE:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_ARCHIVED,
 PROJECT_TEMPLATE_PUBLISH:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_PUBLISHED,
 PROJECT_TEMPLATE_UNPUBLISH:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_UNPUBLISHED,
 PROJECT_TEMPLATE_DUPLICATE:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_DUPLICATED,
 PROJECT_TEMPLATE_ROLLBACK:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_ROLLED_BACK,
 PROJECT_TEMPLATE_COLLEGE_ASSIGN:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_COLLEGE_ASSIGNED,
 PROJECT_TEMPLATE_COLLEGE_UNASSIGN:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_COLLEGE_REVOKED,
 PROJECT_RESOURCE_SYNC:ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_UPDATED,
 PROJECT_DELIVERY_ADMIN_REVIEW:ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_REVIEWED,
};

/** Read old link-only range/entity/page keys without ever accepting arbitrary
 * query operators. A page offset cannot be applied to a cursor stream without
 * fetching each intervening page, so callers must surface its legacyPage hint.
 */
export function projectLegacyAuditLink(params:ProjectAdminAuditSearchParams,now:Date) {
 const range=params.range;
 const entityId=params.entityId;
 const page=params.page;
 const validRange=typeof range==="string"&&["today","7d","30d","all"].includes(range);
 const validEntity=typeof entityId==="string"&&entityId.trim().length>0&&entityId.length<=500;
 const validPage=typeof page==="string"&&/^(0|[1-9]\d{0,4})$/.test(page);
 const translated:ProjectAdminAuditSearchParams={...params};
 delete translated.range;
 delete translated.entityId;
 delete translated.page;
 if(validEntity&&!translated.subjectId)translated.subjectId=entityId.trim();
 if(validRange&&range!=="all"&&Number.isFinite(now.getTime())){
  const start=new Date(now);
  start.setUTCHours(0,0,0,0);
  if(range!=="today")start.setUTCDate(start.getUTCDate()-(range==="7d"?7:30));
  if(!translated.from)translated.from=start.toISOString().slice(0,10);
 }
 const legacyPage=validPage?Number(page):0;
 return {params:translated,legacyPage,
  needsCursorReplay:legacyPage>0,
  invalidLegacyLink:(range!==undefined&&!validRange)||
   (entityId!==undefined&&!validEntity)||(page!==undefined&&!validPage)};
}

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
  const canonicalAction=action ? legacyProjectAuditActions[action]??action : undefined;
  const eventType = canonicalAction && eventTypes.has(canonicalAction)
    ? canonicalAction : undefined;
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
