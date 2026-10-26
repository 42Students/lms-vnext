/** An instructor may teach two offerings/Sections with the same course
 * code. A label is never an authorization/scope key: use the delivery ID.
 */
export type FacultySectionFilterRow={
 deliveryId:string;courseCode:string;sectionName:string;
};
export function facultyAssessmentSectionOptions(rows:readonly FacultySectionFilterRow[]){
 return [...new Map(rows.map(row=>[row.deliveryId,{
  deliveryId:row.deliveryId,
  label:row.courseCode+" · "+row.sectionName,
 }] as const)).values()].sort((a,b)=>a.label.localeCompare(b.label)||a.deliveryId.localeCompare(b.deliveryId));
}
export function facultyAssessmentRowsForSection<T extends FacultySectionFilterRow>(
 rows:readonly T[],selectedDeliveryId:string,
):T[]{
 return selectedDeliveryId==="all"?[...rows]:rows.filter(row=>row.deliveryId===selectedDeliveryId);
}
