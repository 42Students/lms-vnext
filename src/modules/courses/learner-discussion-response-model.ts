/** Preserve the authorized discussion service response including pins that
 * fall outside the currently paginated message window. */
export function learnerDiscussionListResponse<T extends {
 accessMode:unknown; canPost:boolean; messages:unknown; highlightedPinned:unknown; nextCursor:unknown;
}>(result:T){
 return {
  accessMode:result.accessMode,canPost:result.canPost,messages:result.messages,
  highlightedPinned:result.highlightedPinned,nextCursor:result.nextCursor,
 };
}
