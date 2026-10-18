import {tpoStudentCsvCell} from "./tpo-students-csv";
export type CompanyDirectoryRow={
 name:string;contacts:number;drivesRan:number;acceptedOfferDrives:number;
 studentsPlaced:number|null;communication:string;people:readonly {name:string}[];
};
export function tpoCompanyDirectoryCsv(rows:readonly CompanyDirectoryRow[]){
 const quote=(value:string)=>tpoStudentCsvCell(value);
 const header=["Company","Communication","People","Drives that ran","Accepted-offer drives","Students placed"];
 const data=rows.map(item=>[
  item.name,item.communication.replaceAll("_"," "),
  item.people.map(p=>p.name).join("; "),
  String(item.drivesRan),String(item.acceptedOfferDrives),
  item.studentsPlaced===null?"Not enough data yet":String(item.studentsPlaced),
 ]);
 return "\uFEFF"+[header,...data].map(row=>row.map(value=>quote(value)).join(",")).join("\r\n")+"\r\n";
}
