/** Shared persisted message-length cap for all course Discussion writers. */
export const LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH=4000;
export function learnerDiscussionDraftValid(text:string):boolean{
 const value=text.trim();
 return value.length>0&&value.length<=LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH;
}
