/** COL-courses-content-04: duplicate only catalog metadata, never offerings or learners. */
export function collegeCourseDuplicatePrefill<T extends {id:string;name:string;code:string;description:string|null;departmentId:string}>(
 courses:readonly T[],requestedId:string|undefined,
){
 if(!requestedId)return null;
 const source=courses.find(course=>course.id===requestedId);
 if(!source)return null;
 const existing=new Set(courses.filter(course=>course.departmentId===source.departmentId)
  .map(course=>course.code.toLocaleLowerCase("en-IN")));
 const stem=source.code.slice(0,55);
 let next=stem+"-COPY",attempt=2;
 while(existing.has(next.toLocaleLowerCase("en-IN"))&&attempt<=99){
  next=stem.slice(0,55-String(attempt).length)+"-COPY"+attempt;attempt++;
 }
 const existingNames=new Set(courses.filter(course=>course.departmentId===source.departmentId)
  .map(course=>course.name.trim().toLocaleLowerCase("en-IN")));
 const nameStem=source.name.trim().slice(0,248);
 let duplicateName=nameStem+" (Copy)",nameAttempt=2;
 while(existingNames.has(duplicateName.toLocaleLowerCase("en-IN"))&&nameAttempt<=99){
  const suffix=" (Copy "+nameAttempt+")";
  duplicateName=source.name.trim().slice(0,255-suffix.length)+suffix;
  nameAttempt++;
 }
 return {id:source.id,name:duplicateName,code:next,
  description:source.description??"",departmentId:source.departmentId};
}
