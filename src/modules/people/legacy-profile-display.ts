/** Legacy profile screen date presentation while storage remains ISO YYYY-MM-DD. */
export function formatProfileDateDayFirst(iso:string|null|undefined):string {
 if(!iso)return "";
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
 if(!match)return iso;
 const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
 const date=new Date(Date.UTC(year,month-1,day));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()+1!==month||date.getUTCDate()!==day)return iso;
 return match[3]+"-"+match[2]+"-"+match[1];
}
export const LEARNER_PROFILE_FIELD_LIMITS:Readonly<Record<string,number>>={
 organization:200,designation:150,location:160,compensation:120,
 description:4000,institution:300,program:200,specialization:200,
 name:200,proficiency:60,githubUrl:2048,projectUrl:2048,
 issuingAuthority:200,credentialUrl:2048,skills:1000,
};
