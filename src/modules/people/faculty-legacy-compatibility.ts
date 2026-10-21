/** Complete route/method crosswalk for 44 legacy FacultyProfileController
 * handlers. The old numeric facultyId is NEVER treated as a membership UUID;
 * authenticated self operations use current context, admin operations use a
 * server-resolved authorized target membership and may not use self routes. */
export type FacultyLegacyMethod="GET"|"PUT"|"POST"|"DELETE";
export type FacultyLegacyCompatibility={
 route:string;method:FacultyLegacyMethod;section:string;
 destination:string;write:"READ"|"CAS_PATCH"|"CAS_APPEND"|"CAS_ENTRY"|"PROTECTED";
};
const sectionNames={
 about:"about", "personal-details":"personalDetails",contact:"contact",
 address:"address",social:"socialProfiles",languages:"languages",
 education:"education",certifications:"certifications",experiences:"experiences",
 skills:"skills",publications:"publications",awards:"awards",metadata:"metadata",
} as const;
const repeated=new Set<string>([
 "languages","education","certifications","experiences","skills","publications","awards",
]);
const paths:FacultyLegacyCompatibility[]=[];
for(const [slug,section] of Object.entries(sectionNames)){
 const base="/{facultyId}/"+slug;
 paths.push({route:base,method:"GET",section,destination:"/api/people/faculty-self-document?section="+section,
  write:"READ"});
 paths.push({route:base,method:repeated.has(slug)?"POST":"PUT",section,
  destination:"/api/people/faculty-self-document",write:repeated.has(slug)?"CAS_APPEND":"CAS_PATCH"});
 if(repeated.has(slug)){
  paths.push({route:base+"/{index}",method:"PUT",section,
   destination:"/api/people/faculty-self-document",write:"CAS_ENTRY"});
  paths.push({route:base+"/{index}",method:"DELETE",section,
   destination:"/api/people/faculty-self-document",write:"CAS_ENTRY"});
 }
}
for(const section of ["header","identity"]){
 for(const method of ["GET","PUT"] as const){
  paths.push({route:"/{facultyId}/"+section,method,section,
   destination:method==="GET"?"/api/people/faculty-self-document":
     section==="header"?"/api/people/faculty-avatar":"/api/people/private-identity",
   write:method==="GET"?"READ":"PROTECTED"});
 }
}
export const FACULTY_LEGACY_PROFILE_COMPATIBILITY=
 Object.freeze(paths) as readonly FacultyLegacyCompatibility[];
/** Numeric row indexes are deliberately NOT accepted as write locators.
 * First resolve a stable entry UUID from the current document/version,
 * then submit a strict CAS_PATCH or CAS_ENTRY update. */
export function resolveFacultyLegacyRoute(method:FacultyLegacyMethod,route:string){
 return FACULTY_LEGACY_PROFILE_COMPATIBILITY.find(row=>
  row.method===method&&row.route===route)??null;
}
