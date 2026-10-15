/** A reused task dialog must not inherit navigation state from the previous task. */
export function createLearnerBoardTaskDialogNavigationGuard(){
 let navigating=false;
 return {reset:()=>{navigating=false;},startNavigation:()=>{navigating=true;},shouldReturn:()=>!navigating};
}
