import "server-only";

import type {RequestContext} from "@/modules/identity/context";
import {getAcademicsWorkspace} from "@/modules/academics/workspace";
import {listCollegeFacultyPicker} from "./college-faculty-picker-service";
import {listCourses} from "./course-service";
import {listCollegeCourseSetupRelations} from "./college-course-setup-relations-service";

/** Setup still needs academic pickers, but no longer generates an individual
 * database read for every Cohort, Offering and Section Delivery. */
export async function getAdminCourseWorkspace(
 context:RequestContext,collegeId:string,includeArchivedOfferings=false,
){
 const [academics,courses,facultyChoices,relations]=await Promise.all([
  getAcademicsWorkspace(context,collegeId),
  listCourses(context,collegeId),
  listCollegeFacultyPicker(context,collegeId),
  listCollegeCourseSetupRelations(context,collegeId,includeArchivedOfferings),
 ]);
 const {offerings,deliveries,teachingAssignments}=relations;
 return {
  collegeId,
  departments:academics.departments,
  periods:academics.periods,
  programs:academics.programs,
  cohorts:academics.cohorts,
  sections:academics.sections,
  faculty:facultyChoices.faculty,
  facultyTruncated:facultyChoices.truncated,
  courses,offerings,deliveries,teachingAssignments,
  summary:{
   courses:courses.length,
   offerings:offerings.filter(offering=>offering.status==="ACTIVE").length,
   deliveries:deliveries.length,
   teachingAssignments:teachingAssignments.length,
  },
 };
}
