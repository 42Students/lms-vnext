export type LearnerSemesterOption={id:string;name:string;startDate:string};
export type LearnerProgramSemester={termNumber:number;name:string};
function semesterNumber(name:string):number|null{
 const result=/(?:semester|sem|term)\s*[-:#]?\s*(\d{1,2})\b/i.exec(name);
 return result?Number(result[1]):null;
}
/** A curriculum semester may exist before any delivery. Never map a future
 * term to a different existing delivery merely because it is the Nth row. */
export function learnerSemesterOptions(
 deliveries:readonly LearnerSemesterOption[],
 curriculum:readonly LearnerProgramSemester[],
):LearnerSemesterOption[]{
 const used=new Set<string>();
 const options: LearnerSemesterOption[]=[];
 for(const term of curriculum){
  const exact=deliveries.find(row=>!used.has(row.id)&&row.name.trim().toLowerCase()===term.name.trim().toLowerCase());
  const numberMatch=deliveries.find(row=>!used.has(row.id)&&semesterNumber(row.name)===term.termNumber);
  const found=exact??numberMatch;
  if(found){used.add(found.id);options.push(found);}
  else options.push({id:"program-term:"+term.termNumber,name:term.name,startDate:""});
 }
 for(const delivery of deliveries){
  if(!used.has(delivery.id)){used.add(delivery.id);options.push(delivery);}
 }
 return options;
}
