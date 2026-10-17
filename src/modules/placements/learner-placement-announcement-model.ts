export type LearnerPlacementNoticeSource = {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  updatedAt?: Date;
  version?: number;
  isPinned: boolean;
  senderType?: string;
  receiverType?: string;
};

/** Only recognize persisted producer/audience enums, never infer a TPO-only notice. */
export function learnerNoticeSourceLabel(value:string):string|null{
 switch(value){
  case "TPO":return "Placement cell";
  case "COLLEGE_ADMIN":return "College administration";
  case "SUPER_ADMIN":return "Platform administration";
  case "FACULTY":return "Faculty";
  default:return null;
 }
}
export function learnerNoticeAudienceLabel(value:string):string|null{
 switch(value){
  case "COLLEGE":return "College";
  case "DEPARTMENT":return "Department";
  case "PROGRAM":return "Program";
  case "CLASS":return "Class";
  case "LEARNER":return "You";
  default:return null;
 }
}
export function learnerPlacementNoticeFeed(rows: readonly LearnerPlacementNoticeSource[]) {
  return rows.filter(row=>Number.isFinite(row.createdAt.getTime())).map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.version !== undefined && row.version > 1 && row.updatedAt &&
      Number.isFinite(row.updatedAt.getTime()) && row.updatedAt > row.createdAt
      ? row.updatedAt.toISOString() : null,
    isPinned: row.isPinned,
    ...(row.senderType ? { senderLabel:learnerNoticeSourceLabel(row.senderType) } : {}),
    ...(row.receiverType ? { audienceLabel:learnerNoticeAudienceLabel(row.receiverType) } : {}),
  }));
}
