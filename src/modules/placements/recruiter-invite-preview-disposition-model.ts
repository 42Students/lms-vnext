/** REC-calendar-messages-profile-40: a network/server fault is not an expired invitation. */
export function recruiterInvitePreviewDisposition(status:number,hasInvite:boolean):
 "ready"|"invalid"|"load_error" {
 if(status===404||status===410)return "invalid";
 if(status>=200 && status<300 && hasInvite)return "ready";
 return "load_error";
}
