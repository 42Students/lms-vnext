/** Escaped literal staff search: do not match private learner email or identity fields. */
export function verificationLearnerNamePattern(q:string){
 return "%"+q.replace(/[\\%_]/g,"\\$&")+"%";
}
