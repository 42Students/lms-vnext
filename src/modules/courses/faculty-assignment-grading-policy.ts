export function facultyAssignmentGradingAllowed(status:string,points:number,max:number){
 return status==="PUBLISHED"&&Number.isInteger(points)&&Number.isInteger(max)&&
  max>=0&&points>=0&&points<=max;
}
export function facultyAssignmentGradePublicationAllowed(status:string,gradingStatus:string){
 return status==="PUBLISHED"&&gradingStatus==="GRADED";
}
