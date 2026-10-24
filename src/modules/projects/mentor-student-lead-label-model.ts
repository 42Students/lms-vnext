/** A lead marker is display-only and only from an explicit persisted
 * learner role label. A primary Mentor, task assignee or first roster row is
 * never inferred to be the student lead. This is NOT a leadership grant.
 */
export function recordedMentorStudentLead(input:{
  role:string;roleLabel:string|null|undefined;
}):boolean{
  if(input.role!=="LEARNER")return false;
  const label=input.roleLabel?.trim().toLocaleLowerCase("en")??"";
  return ["lead","team lead","student lead","team leader"].includes(label);
}
