export function buildTpoRecruiterInviteMessage(input:{
 recruiterName:string;companyName:string|null;inviteUrl:string;expiresAt:string;personalNote:string;
}):string{
 const url=new URL(input.inviteUrl);
 if(url.protocol!=="https:"&&url.protocol!=="http:")throw Error("INVALID_INVITE_URL");
 if(input.personalNote.length>500)throw Error("INVITE_NOTE_TOO_LONG");
 const date=new Date(input.expiresAt);
 if(!Number.isFinite(date.getTime()))throw Error("INVALID_INVITE_EXPIRY");
 const expires=new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(date);
 const company=input.companyName?.trim()?" at "+input.companyName.trim():"";
 const salutation=input.recruiterName.trim()||"Recruiter";
 const note=input.personalNote.trim()?"\n\n"+input.personalNote.trim():"";
 return "Hello "+salutation+",\n\nYou are invited to collaborate with the Placement Cell"+
  company+".\nOpen your invitation: "+url.toString()+
  "\nThis invitation is valid for seven days, until "+expires+" IST."+
  note+"\n\nRegards,\nPlacement Cell";
}
