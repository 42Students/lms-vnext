/** Legacy class date bounds are NOT synonyms for academic-period dates. */
export function effectiveClassDates(input:{
 classStartsOn:string|null;classEndsOn:string|null;
 periodStartDate:string;periodEndDate:string;
}):{startsOn:string;endsOn:string;source:"CLASS"|"PERIOD"|"MIXED"} {
 const startsOn=input.classStartsOn??input.periodStartDate;
 const endsOn=input.classEndsOn??input.periodEndDate;
 const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&
   Number.isFinite(Date.parse(s+"T00:00:00Z"));
 if(!valid(startsOn)||!valid(endsOn)||startsOn>endsOn)throw new Error("CLASS_DATE_RANGE_INVALID");
 return {startsOn,endsOn,source:input.classStartsOn&&input.classEndsOn?"CLASS":
   !input.classStartsOn&&!input.classEndsOn?"PERIOD":"MIXED"};
}
