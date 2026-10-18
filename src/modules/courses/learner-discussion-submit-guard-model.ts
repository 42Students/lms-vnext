import {learnerDiscussionDraftValid} from "./learner-discussion-message-limit-model";
/** A single click, keyboard Enter or duplicate event may only begin one
 * active discussion POST. Persisted auth remains enforced in the route. */
export function learnerDiscussionMayPost(draft:string,canPost:boolean,locked:boolean):boolean{
 return canPost && !locked && learnerDiscussionDraftValid(draft);
}
