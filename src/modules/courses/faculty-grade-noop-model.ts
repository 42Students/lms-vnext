export function facultyGradeHasChanges(
 current:{gradingStatus:string;pointsAwarded:number|null;feedback:string|null},
 next:{pointsAwarded:number;feedback?:string|null},
){
 if(current.gradingStatus!=="GRADED")return true;
 return current.pointsAwarded!==next.pointsAwarded ||
   (current.feedback??null)!==(next.feedback?.trim()||null);
}
