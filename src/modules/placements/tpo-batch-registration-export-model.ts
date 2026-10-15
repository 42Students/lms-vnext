import {csvSafeGridCell} from "./tpo-grid-model";
type Row={name:string;membershipId:string;choice:string|null;source:string|null;updatedAt:string|null};
const HEADERS=["Learner","Registration choice","Recorded by/source","Last updated","Membership reference"] as const;
export function exportTpoBatchRegistrationsCsv(rows:readonly Row[]){
 return [HEADERS.map(csvSafeGridCell).join(","),
  ...rows.map(row=>[row.name,row.choice??"UNRECORDED",row.source??"",
   row.updatedAt??"",row.membershipId].map(csvSafeGridCell).join(","))].join("\r\n")+"\r\n";
}
