import {collegeSignInMethodSchema} from "./signin-methods-model";
export function signInPolicyReadState(tableExists:boolean,rawMethod:string|null){
 if(!tableExists)return {kind:"MIGRATION_PENDING" as const,method:null};
 if(rawMethod===null)return {kind:"NOT_CONFIGURED" as const,method:null};
 const parsed=collegeSignInMethodSchema.safeParse(rawMethod);
 if(!parsed.success)return {kind:"INVALID_POLICY" as const,method:null};
 return {kind:"CONFIGURED" as const,method:parsed.data};
}
