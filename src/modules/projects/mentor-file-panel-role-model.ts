/** A Mentor shell does not imply write access: co-mentors, observers and
 * completed or archived projects must use server-derived read-only mode.
 */
export function canManageProjectFilePanel(input:{
 mode:"LEARNER"|"MENTOR"|"ADMIN";status:string;
 readOnly:boolean;hasMembership:boolean;
}):boolean{
 return input.mode!=="LEARNER"&&
   !input.readOnly&&input.hasMembership&&
   input.status!=="ARCHIVED"&&input.status!=="COMPLETED";
}
export function canUploadProjectFilePanel(input:{
 mode:"LEARNER"|"MENTOR"|"ADMIN";status:string;
 readOnly:boolean;hasMembership:boolean;
}):boolean{
 return input.hasMembership&&!input.readOnly&&
   (canManageProjectFilePanel(input)||
      input.mode==="LEARNER"&&input.status==="ACTIVE");
}
