/** Never schedule against unavailable college blocked-date storage. */
export function canScheduleOnCollegeBlockedDay(input:{
 storageReady:boolean;blocked:boolean;acknowledged:boolean;
}):{allowed:true}|{allowed:false;reason:"STORAGE_UNAVAILABLE"|"ACK_REQUIRED"}{
 if(!input.storageReady)return {allowed:false,reason:"STORAGE_UNAVAILABLE"};
 if(input.blocked&&!input.acknowledged)return {allowed:false,reason:"ACK_REQUIRED"};
 return {allowed:true};
}
