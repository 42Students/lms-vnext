import {placementReportCsv} from "../report-model";
export type TpoCompanyShareAuditView={sharePrefix:string;kind:string;at:string};
export function tpoCompanyShareAuditCsv(rows:readonly TpoCompanyShareAuditView[],limited:boolean){
 const body:(string|null)[][]=rows.map(row=>[row.sharePrefix,row.kind,row.at]);
 if(limited)body.unshift(["NOTICE","Only the 100 most recent access events are exported",null]);
 return placementReportCsv(["Link prefix","Action","UTC timestamp"],body);
}
