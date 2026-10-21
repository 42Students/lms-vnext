/** Legacy nested task-items URL alias.
 * The old Spring controller used /{projectId}/tasks/items/{taskId}/comments.
 * Only vNext scoped UUIDs are accepted; historical numeric IDs require a
 * verified college+project migration crosswalk, not an insecure guess.
 * Both endpoints share the same permission-checked read/write service.
 */
export {GET,POST} from "../../../[taskId]/comments/route";
