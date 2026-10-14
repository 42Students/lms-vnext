export type LearnerDiscussionKeyState={
key:string;shiftKey:boolean;isComposing:boolean;coarsePointer:boolean;
};
/** Touch keyboards need Enter for paragraphs; only desktop Enter sends. */
export function shouldSendLearnerDiscussionOnEnter(input:LearnerDiscussionKeyState){
return input.key==="Enter"&&!input.shiftKey&&!input.isComposing&&!input.coarsePointer;
}
export function learnerDiscussionMobileJumpVisible(atBottom:boolean,unseenCount:number,total:number){
return total>0&&!atBottom&&unseenCount===0;
}
