/** Requires an explicit second action before any irreversible reviewer mutation. */
export function verificationDecisionConfirmation(action:"VERIFY"|"SEND_BACK",section:"EDUCATION"|"IDENTITY",reason:string) {
 const kind=section==="EDUCATION"?"education":"identity";
 return action==="VERIFY"
  ?{heading:"Confirm verification",message:"Approve this "+kind+" submission? The learner will be notified.",button:"Confirm verification"}
  :{heading:"Confirm send back",message:"Return this "+kind+" submission for correction? The reason will be saved and shown to the learner: "+reason.trim(),button:"Confirm send back"};
}
