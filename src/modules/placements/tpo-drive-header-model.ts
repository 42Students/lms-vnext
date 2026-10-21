export type TpoDriveHeaderFacts={
 status:string;applicationMode:string;workMode:string;employmentType:string;
 minimumAnnualCtcInr:number|null;maximumAnnualCtcInr:number|null;
 applicationDeadline:Date|string|null;
 isDream?:boolean;stipendPerMonthInr?:number|null;
 recordedOutside?:boolean;needsReview?:boolean;
};
const STATUS:Record<string,string>={
 DRAFT:"Draft",PUBLISHED:"Open",CLOSED:"Closed",CANCELLED:"Cancelled",
 REJECTED:"Declined",REQUEST:"Needs your review",
};
const APPLICATION_MODE:Record<string,string>={
 INTERNAL:"Apply here",HYBRID:"Apply here or with the company",
 EXTERNAL_ONLY:"Apply on company site",
};
export function projectTpoDriveHeader(facts:TpoDriveHeaderFacts,asOf:Date=new Date()){
 const expiry=facts.applicationDeadline===null?null:new Date(facts.applicationDeadline);
 const expired=facts.status==="PUBLISHED"&&expiry!==null&&
   Number.isFinite(expiry.getTime())&&Number.isFinite(asOf.getTime())&&
   expiry.getTime()<asOf.getTime();
 const status=facts.needsReview?"Needs your review":
   expired?"Open · Expired":STATUS[facts.status]??"Status unavailable";
 const parts=[APPLICATION_MODE[facts.applicationMode]??"Application mode unavailable"];
 const payLow=facts.minimumAnnualCtcInr;
 const payHigh=facts.maximumAnnualCtcInr;
 const amount=(inr:number)=>"₹"+new Intl.NumberFormat("en-IN",{maximumFractionDigits:2}).format(inr/100000)+" LPA";
 const ctc=payLow===null&&payHigh===null?(facts.stipendPerMonthInr!=null?
  "₹"+new Intl.NumberFormat("en-IN").format(facts.stipendPerMonthInr)+" stipend/month":
  "CTC not yet announced"):
  payLow!==null&&payHigh!==null?(payLow===payHigh?amount(payLow):amount(payLow)+" – "+amount(payHigh)):
   payLow!==null?"From "+amount(payLow):"Up to "+amount(payHigh!);
 const deadline=facts.applicationDeadline===null?"Deadline not set":
  expiry!==null&&Number.isFinite(expiry.getTime())?
  new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"})
   .format(expiry)+" IST":"Deadline unavailable";
 return {
  status,applicationMode:parts[0],workMode:facts.workMode.replaceAll("_"," ").toLowerCase(),
  employmentType:facts.employmentType.replaceAll("_"," ").toLowerCase(),
  ctc,deadline,category:facts.isDream?"Dream":"Regular",
  recordedOutside:Boolean(facts.recordedOutside),
 };
}
