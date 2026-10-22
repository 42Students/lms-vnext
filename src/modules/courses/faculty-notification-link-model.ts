/** Notification destinations are persisted data, not trusted navigation.
 * Faculty pages must never open another account surface or an external origin. */
export function facultyNotificationActionHref(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") ||
      raw.includes("\\") || /[\u0000-\u001f\u007f]/.test(raw)) {
    return null;
  }
  try {
    const parsed = new URL(raw, "https://faculty.invalid");
    if (parsed.origin !== "https://faculty.invalid" ||
        !/^\/(teacher|teach)(\/|$)/.test(parsed.pathname)) {
      return null;
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return null;
  }
}

/** A legacy course notification may omit a course name. Resolve its
 * canonical delivery UUID only from the CURRENT authorized teaching roster,
 * not the untrusted activity href or an unrestricted catalogue lookup.
 * The caller may use this projection as its activity context line. */
export function facultyNotificationCourseContext(
 href:string|null,
 authorizedCourses:readonly {deliveryId:string;courseName:string;sectionName?:string}[],
):string|null{
 const safe=facultyNotificationActionHref(href);
 if(!safe)return null;
 const parsed=new URL(safe,"https://faculty.invalid");
 const match=/^\/(?:teacher|teach)\/courses\/([0-9a-f-]{36})(?:\/|$)/i.exec(parsed.pathname);
 if(!match)return null;
 const row=authorizedCourses.find(item=>item.deliveryId===match[1]);
 if(!row||!row.courseName.trim())return null;
 return row.courseName.trim()+(row.sectionName?.trim()?" · "+row.sectionName.trim():"");
}
export type FacultyNotificationTarget="COURSE"|"INTERVIEW"|"ASSESSMENT"|"OTHER";
/** Optional mentor route grants must come from an authorized role switch,
 * never from a notification payload. */
export function facultyNotificationActionPresentation(input:{
 href:string|null;kind:FacultyNotificationTarget;
 permittedBases?:readonly ("teacher"|"teach"|"mentor")[];
}):{href:string|null;label:string;dismissLabel:"Got it"}{
 const candidate=input.href;
 const baseAllowed=input.permittedBases??["teacher","teach"];
 let href=facultyNotificationActionHref(candidate);
 if(!href&&candidate&&baseAllowed.includes("mentor")&&
    candidate.startsWith("/mentor/")&&!candidate.startsWith("//")&&
    !candidate.includes("\\")&&!/[\u0000-\u001f\u007f]/.test(candidate)){
  try{
   const url=new URL(candidate,"https://faculty.invalid");
   if(url.origin==="https://faculty.invalid"&&url.pathname.startsWith("/mentor/"))
    href=url.pathname+url.search+url.hash;
  }catch{href=null;}
 }
 return {href,label:input.kind==="COURSE"?"View Course":
  input.kind==="INTERVIEW"?"View Interview":
  input.kind==="ASSESSMENT"?"Take Assessment":"View details",dismissLabel:"Got it"};
}
