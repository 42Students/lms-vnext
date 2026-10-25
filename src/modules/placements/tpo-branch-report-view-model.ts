/** TPO By branch columns and packages are displayed in legacy report units.
 * Extra vNext evidence may remain available to the right of the legacy columns. */
export const LEGACY_TPO_BRANCH_COLUMNS=[
 "Branch","Looking for a job","Placed","Placement rate","Offers",
 "Average package","Highest package",
 "Registered","Unique applicants","Applications","Accepted offers",
] as const;
export function branchPackageLpa(value:number|null):string{
 if(value===null||!Number.isFinite(value))return "—";
 return new Intl.NumberFormat("en-IN",{maximumFractionDigits:2}).format(value/100000)+" LPA";
}
export function legacyTpoBranchReportRow(row:{
 departmentName:string;registered:number;placed:number;placementRatePercent:number|null;
 offers:number;averagePackageInr:number|null;highestPackageInr:number|null;
 applicants:number;applications:number;acceptedOffers:number;
}){
 return [row.departmentName,Math.max(0,row.registered-row.placed),row.placed,
  row.placementRatePercent===null?"—":row.placementRatePercent+"%",row.offers,
  branchPackageLpa(row.averagePackageInr),branchPackageLpa(row.highestPackageInr),
  row.registered,row.applicants,row.applications,row.acceptedOffers] as const;
}


/** Percent rails use a fixed 0–100 scale, never "largest branch = 100%".
 * Missing or impossible denominators stay unavailable instead of becoming zero. */
export function tpoBranchChartPercent(
 placed:number,registered:number,reportedPercent:number|null,
):number|null{
 if(!Number.isFinite(placed)||!Number.isFinite(registered)||registered<=0||
  placed<0||placed>registered||reportedPercent===null||
  !Number.isFinite(reportedPercent)||reportedPercent<0||reportedPercent>100)return null;
 return reportedPercent;
}
