/** Legacy academic designation / employment labels, never account authorization roles. */
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

/** Legacy FacultyType (ADMIN/TPO/FACULTY) belongs to the membership role,
 * not the employmentType column. Keep old source names visible without
 * assigning privileges based on a display value.
 */
export const LEGACY_FACULTY_ROLE_LABELS = {
 FACULTY:"Faculty",
 ADMIN:"College Admin",
 TPO:"Placement Officer",
} as const;
export type LegacyFacultyRoleType=keyof typeof LEGACY_FACULTY_ROLE_LABELS;
export function legacyFacultyRoleLabel(raw:string|null|undefined):string {
 if(!raw)return "Faculty";
 const key=raw.trim().toUpperCase();
 if(key in LEGACY_FACULTY_ROLE_LABELS)
  return LEGACY_FACULTY_ROLE_LABELS[key as LegacyFacultyRoleType];
 return facultyTypeLabel(raw);
}
