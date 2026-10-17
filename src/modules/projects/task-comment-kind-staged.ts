/** MEN-projects-meetings-42/43: persisted comment-kind taxonomy.
 * Registered by migration 0130_project_task_comment_kinds.sql.
 * Never infer kinds from message text; use the persisted discriminant.
 */
export const PROJECT_TASK_COMMENT_KINDS = ["NOTE","PROGRESS_UPDATE","FLAG_FOR_MENTOR"] as const;
export type ProjectTaskCommentKind = typeof PROJECT_TASK_COMMENT_KINDS[number];
export const PROJECT_TASK_COMMENT_KIND_LABELS: Record<ProjectTaskCommentKind,string> = {
  NOTE:"Note", PROGRESS_UPDATE:"Progress update", FLAG_FOR_MENTOR:"Flag for mentor",
};
export function projectTaskCommentKindLabel(kind:ProjectTaskCommentKind):string {
  return PROJECT_TASK_COMMENT_KIND_LABELS[kind];
}
