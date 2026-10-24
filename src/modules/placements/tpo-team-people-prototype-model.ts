export type TpoPrototypeTeamPerson={
 membershipId:string;displayName:string;roles:readonly string[];
 status:string;openAsks:number;overdueAsks:number;
 studentDutyCount:number;awayUntil:string|null;
};
export function summarizeTpoPrototypePerson(row:TpoPrototypeTeamPerson,workloadReady:boolean){
 const role=row.roles.includes("TPO_ADMIN")?"TPO admin":
  row.roles.includes("FACULTY_COORDINATOR")?"Faculty coordinator":
  row.roles.includes("TPO")?"Placement cell":
  row.roles.includes("STUDENT_COORDINATOR")?"Student coordinator":
  row.roles.map(role=>role.replaceAll("_"," ").toLowerCase()).join(", ")||"Member";
 return {
  role,
  handles:row.studentDutyCount>0
   ?row.studentDutyCount+" recorded drive-day "+(row.studentDutyCount===1?"duty":"duties")
   :"Work ownership not verified",
  late:workloadReady?row.overdueAsks===0?"Nothing overdue":
   row.overdueAsks+" overdue "+(row.overdueAsks===1?"ask":"asks"):"Unavailable",
  waiting:workloadReady?row.openAsks+" open "+(row.openAsks===1?"ask":"asks"):"Unavailable",
 };
}
