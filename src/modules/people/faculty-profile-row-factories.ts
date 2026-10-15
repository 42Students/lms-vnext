import type { FacultyProfileDocument } from "./faculty-profile-document";

export function newFacultyLanguage(): FacultyProfileDocument["languages"][number] {
  return {id:crypto.randomUUID(),language:"",proficiency:""};
}

export function newFacultyEducation(): FacultyProfileDocument["education"][number] {
  return {
    id:crypto.randomUUID(),educationType:"",program:"",specialization:"",
    institutionName:"",startYear:"",endYear:"",isCurrentlyPursuing:false,
    gradingType:"",grade:"",maxGrade:"",isRecentEducation:false,
    qualifyingExam:"",examRank:"",examDetails:{},degree:"",field:"",
    score:"",description:"",certificateDocumentId:null,
  };
}
