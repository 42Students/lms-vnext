export type LearnerCourseSetupStatus=
 "NO_PROGRAM"|"PROGRAM_NOT_FOUND"|"NO_BATCH"|"BATCH_NOT_FOUND"|
 "NO_CLASS"|"CLASS_NOT_FOUND"|"NO_SEMESTER"|"NO_COURSES";

export const learnerCourseSetupCopy:Record<LearnerCourseSetupStatus,string>={
 NO_PROGRAM:"Your program is not configured. Please contact your administrator.",
 PROGRAM_NOT_FOUND:"Your program could not be found. Please contact your administrator.",
 NO_BATCH:"Your batch is not configured. Please contact your administrator.",
 BATCH_NOT_FOUND:"Your batch could not be found. Please contact your administrator.",
 NO_CLASS:"Your class is not configured. Please contact your administrator.",
 CLASS_NOT_FOUND:"Your class could not be found. Please contact your administrator.",
 NO_SEMESTER:"Your semester is not configured. Please contact your administrator.",
 NO_COURSES:"No courses have been assigned to your class yet. Please contact your administrator.",
};

