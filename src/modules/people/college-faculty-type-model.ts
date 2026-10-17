/** Legacy College Admin Faculty Type labels; persisted as employmentType for parity. */
export const LEGACY_FACULTY_TYPES=[
 "Professor","Associate Professor","Assistant Professor","Lecturer",
 "Head of Department","Coordinator","Mentor","Permanent",
 "Visiting","Guest","Contract","Adjunct",
] as const;
export type LegacyFacultyType=typeof LEGACY_FACULTY_TYPES[number];
export function facultyTypeLabel(raw:string|null|undefined){
 if(!raw)return "Not specified";
 const known=LEGACY_FACULTY_TYPES.find(v=>v.toLowerCase()===raw.trim().toLowerCase());
 return known??raw;
}
