/** Exact legacy UI strings: TPO-campaigns-public-31. */
export const PUBLIC_RECRUIT_COPY={
 heading:"Recruit from us",workEmail:"Work email",name:"Your name",company:"Company",
 mobile:"Mobile (optional)",hiringFor:"What are you hiring for? (optional)",
 code:"Enter the 6-digit code",send:"Send me a code",submit:"Send to the placement cell",
 thankYou:"Thank you",errorSend:"We couldn't send the code. Please try again.",
 errorSubmit:"Something went wrong. Please try again.",
 unavailable:"Recruiter enquiries are temporarily unavailable. The placement cell cannot receive enquiries until its recruiter CRM and verification service are ready.",
} as const;
export function publicRecruitThanks(college:string){
 return "The placement cell at "+college+" has your details and will get in touch.";
}
