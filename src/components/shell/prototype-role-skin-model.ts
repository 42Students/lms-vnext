/** A portal pathname is presentation context, never permission.
 * Never activate a role skin without that currently selected role.
 * College Admin's Placement cell shortcut must not masquerade as TPO.
 */
export function prototypeRoleSkinForPath(input:{
 pathname:string|null;mentorEnabled:boolean;tpoEnabled:boolean;
 recruiterEnabled:boolean;
}):"mentor"|"tpo"|"recruiter"|null{
 const pathname=input.pathname??"/";
 if(input.mentorEnabled&&(pathname==="/mentor"||pathname.startsWith("/mentor/")))
   return "mentor";
 if(input.tpoEnabled&&(pathname==="/tpo"||pathname.startsWith("/tpo/")))
   return "tpo";
 if(input.recruiterEnabled&&(
    pathname==="/hr"||pathname.startsWith("/hr/")||
    pathname==="/recruiter"||pathname.startsWith("/recruiter/")))
   return "recruiter";
 return null;
}
