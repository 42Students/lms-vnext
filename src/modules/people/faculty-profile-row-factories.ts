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

export function newFacultyCertification():FacultyProfileDocument["certifications"][number]{
 return {id:crypto.randomUUID(),authority:"",name:"",certificationDate:"",
  validityDate:"",certificateLink:"",certificateDocumentId:null,description:""};
}

export function newFacultyExperience():FacultyProfileDocument["experiences"][number]{
 return {id:crypto.randomUUID(),organization:"",designation:"",description:"",
  from:"",to:"",experienceType:"",location:"",
  experienceCertificateDocumentId:null,offerLetterDocumentId:null,
  isPaid:false,salary:""};
}

export function newFacultyPublication():FacultyProfileDocument["publications"][number]{
 return {id:crypto.randomUUID(),title:"",journal:"",year:"",doi:"",link:"",authors:"",description:""};
}

export function newFacultyAward():FacultyProfileDocument["awards"][number]{
 return {id:crypto.randomUUID(),title:"",year:"",description:"",awardedBy:""};
}
