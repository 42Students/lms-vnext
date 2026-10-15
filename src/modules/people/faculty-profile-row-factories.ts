import type { FacultyProfileDocument } from "./faculty-profile-document";

export function newFacultyLanguage(): FacultyProfileDocument["languages"][number] {
  return {id:crypto.randomUUID(),language:"",proficiency:""};
}
