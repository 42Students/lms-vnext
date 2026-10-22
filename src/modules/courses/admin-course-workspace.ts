import "server-only";

import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {CoursesServiceError} from "./errors";
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
 const [academicsResult,coursesResult]=await Promise.allSettled([
  getAcademicsWorkspace(context,collegeId),
  listCourses(context,collegeId),
 ]);
 // Course authorization and college scope remain mandatory: a failed course
 // directory can never become a fabricated empty authorized list.
 if(coursesResult.status==="rejected")throw coursesResult.reason;
 if(academicsResult.status==="rejected"&&
    (academicsResult.reason instanceof AuthorizationError||
     academicsResult.reason instanceof CoursesServiceError))
   throw academicsResult.reason;
 const academics=academicsResult.status==="fulfilled"?academicsResult.value:null;
 const courses=coursesResult.value;
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
  ...(academics===null?["Academic structure unavailable; course creation is disabled until retry"]:[]),
  ...(facultyResult.status==="rejected"?["Faculty directory unavailable"]:[]),
  ...(relationsResult.status==="rejected"?["Course relationship details unavailable"]:[]),
 ];
 return {
  collegeId,
  academicStructureAvailable:academics!==null,
  departments:academics?.departments??[],
  periods:academics?.periods??[],
  programs:academics?.programs??[],
  cohorts:academics?.cohorts??[],
  sections:academics?.sections??[],
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
