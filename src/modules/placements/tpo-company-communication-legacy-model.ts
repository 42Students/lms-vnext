export type CompanyCommunicationFact={stage:string;manualStage:string};
export function deriveLegacyCompanyCommunication(drivesRan:number,people:readonly CompanyCommunicationFact[]){
 if(drivesRan>0||people.some(p=>["JOINED","DRIVE_PLANNED","RECRUITED"].includes(p.stage)))
  return "REPLIED" as const;
 if(people.length>0&&people.every(p=>p.manualStage==="NOT_NOW"))return "NOT_INTERESTED" as const;
 if(people.some(p=>["INVITED","CONTACTED"].includes(p.stage)))return "EMAILED" as const;
 return "NOT_CONTACTED" as const;
}
