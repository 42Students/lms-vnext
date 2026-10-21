export function maskedPhone(value:string|null):string {
 if(!value)return "Not provided";
 const digits=value.replace(/\D/g,"");
 return digits.length>=4?"•••• "+digits.slice(-4):"Not available";
}
export function maskedEmail(value:string|null):string {
 if(!value)return "Not provided";
 const at=value.lastIndexOf("@");
 if(at<1||at===value.length-1)return "Not available";
 return value.slice(0,1)+"•••@"+value.slice(at+1).toLowerCase();
}
export function visibleContactDetails(input:{
 email:string|null;phone:string|null;isLearner:boolean;
 /** Only a separately authorized need-to-know workflow may opt in. */
 contactDisclosureAuthorized?:boolean;
}){
 // Learner contact information is masked in generic all-contacts results.
 // Sending, exporting or revealing it needs a separate need-to-know workflow.
 const disclose=input.contactDisclosureAuthorized===true;
 return {email:input.isLearner&&!disclose?maskedEmail(input.email):input.email?.trim()||"Not provided",
         phone:disclose?input.phone?.trim()||"Not provided":maskedPhone(input.phone)};
}
