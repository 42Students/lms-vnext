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
 // Academic scope and course authorization are critical: never conceal them.
 const [academics,courses]=await Promise.all([
  getAcademicsWorkspace(context,collegeId),
  listCourses(context,collegeId),
 ]);
 // A transient picker/statistics failure must not take down the course list.
 const [facultyResult,relationsResult]=await Promise.allSettled([
  listCollegeFacultyPicker(context,collegeId),
  listCollegeCourseSetupRelations(context,collegeId,includeArchivedOfferings),
 ]);
 const facultyChoices=facultyResult.status==="fulfilled"?facultyResult.value:null;
 const relations=relationsResult.status==="fulfilled"?relationsResult.value:null;
 const offerings=relations?.offerings??[];
 const deliveries=relations?.deliveries??[];
 const teachingAssignments=relations?.teachingAssignments??[];
 const loadWarnings=[
  ...(facultyResult.status==="rejected"?["Faculty directory unavailable"]:[]),
  ...(relationsResult.status==="rejected"?["Course relationship details unavailable"]:[]),
 ];
 return {
  collegeId,
  departments:academics.departments,
  periods:academics.periods,
  programs:academics.programs,
  cohorts:academics.cohorts,
  sections:academics.sections,
  faculty:facultyChoices?.faculty??[],
  facultyTruncated:facultyChoices?.truncated??false,
  loadWarnings,
  courses,offerings,deliveries,teachingAssignments,
  summary:{
   courses:courses.length,
   offerings:offerings.filter(offering=>offering.status==="ACTIVE").length,
   deliveries:deliveries.length,
   teachingAssignments:teachingAssignments.length,
  },
 };
}
