import {z} from "zod";

/** Historical numeric course IDs may point at several offerings/deliveries.
 * Resolve only inside the authenticated learner's already-authorized roster. */
const oldId=z.string().regex(/^[1-9][0-9]{0,9}$/).transform(Number);
export const learnerLegacyRouteQuery=z.strictObject({
 legacyCourseId:oldId,legacyClassId:oldId.optional(),
 legacySemesterCourseId:oldId.optional(),
});
export type LearnerLegacyRouteQuery=z.infer<typeof learnerLegacyRouteQuery>;
export type LearnerLegacyCandidate={
 deliveryId:string;
 legacyCourseId:number|null;
 legacyClassId:number|null;
 legacySemesterCourseId:number|null;
 legacyWasElective:boolean|null;
};
export function resolveLearnerLegacyCourseDelivery(
 rows:readonly LearnerLegacyCandidate[],query:LearnerLegacyRouteQuery,
):{kind:"RESOLVED";deliveryId:string}|{kind:"NOT_FOUND"|"AMBIGUOUS"}{
 const matches=rows.filter(row=>row.legacyCourseId===query.legacyCourseId&&
  (query.legacyClassId===undefined||row.legacyClassId===query.legacyClassId)&&
  (query.legacySemesterCourseId===undefined||
   row.legacySemesterCourseId===query.legacySemesterCourseId));
 const ids=[...new Set(matches.map(row=>row.deliveryId))];
 if(!ids.length)return {kind:"NOT_FOUND"};
 if(ids.length!==1)return {kind:"AMBIGUOUS"};
 return {kind:"RESOLVED",deliveryId:ids[0]!};
}
/** Legacy-to-vNext crosswalk (never cast a numeric identifier to a UUID):
 * course.id -> courses.legacyCourseId
 * class.id -> sections.legacyClassId
 * semester_course.id -> course_offerings.legacySemesterCourseId
 * elective choice -> learner's explicit authorized elective group delivery
 * route -> course_section_deliveries.id; period -> academicPeriods.id
 * old active/enabled/allowedForDisplay/locked remain independent state checks;
 * historical cards stay read-only, never newly authorized via an alias. */
