import {z} from "zod";
const uuid=z.string().uuid();
export const TPO_REPORT_LINK_LIMIT=100;
export type TpoReportRecordLinkRow={id:string;label:string;companyName:string};
export function projectTpoReportRecordLinks(
 drives:readonly TpoReportRecordLinkRow[],companies:readonly TpoReportRecordLinkRow[],
 kind:"OFFERS"|"JOINING",
){
 const validDrives=drives.filter(row=>uuid.safeParse(row.id).success);
 const validCompanies=companies.filter(row=>uuid.safeParse(row.id).success);
 return {
  driveLinks:validDrives.slice(0,TPO_REPORT_LINK_LIMIT).map(row=>({
   id:row.id,name:row.label,company:row.companyName,
   href:"/tpo/placements/jobs/"+encodeURIComponent(row.id)+(kind==="OFFERS"?"/offers":"/joining"),
  })),
  companyLinks:validCompanies.slice(0,TPO_REPORT_LINK_LIMIT).map(row=>({
   id:row.id,name:row.label,href:"/tpo/companies/"+encodeURIComponent(row.id),
  })),
  drivesTruncated:validDrives.length>TPO_REPORT_LINK_LIMIT,
  companiesTruncated:validCompanies.length>TPO_REPORT_LINK_LIMIT,
 };
}
