/** MEN-projects-meetings-42/43: proposed comment-kind taxonomy.
 * Storage column is NOT registered yet; keep the mutation API on plain NOTE
 * until docs/proposed-migrations/chat-11-men-projects-meetings-43-comment-kinds.sql
 * has been registered by the orchestrator. Never infer kinds from message text.
 */
export const PROJECT_TASK_COMMENT_KINDS = ["NOTE","PROGRESS_UPDATE","FLAG_FOR_MENTOR"] as const;
export type ProjectTaskCommentKind = typeof PROJECT_TASK_COMMENT_KINDS[number];
export const PROJECT_TASK_COMMENT_KIND_LABELS: Record<ProjectTaskCommentKind,string> = {
  NOTE:"Note", PROGRESS_UPDATE:"Progress update", FLAG_FOR_MENTOR:"Flag for mentor",
};
export function projectTaskCommentKindLabel(kind:ProjectTaskCommentKind):string {
  return PROJECT_TASK_COMMENT_KIND_LABELS[kind];
}
