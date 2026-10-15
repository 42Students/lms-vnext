export type VerificationFetchState<T>={phase:"IDLE"}|{phase:"LOADING";previous:T|null}|{phase:"READY";data:T}|{phase:"ERROR";message:string;previous:T|null};
export function verificationLoading<T>(state:VerificationFetchState<T>):VerificationFetchState<T>{
 return {phase:"LOADING",previous:state.phase==="READY"?state.data:state.phase==="LOADING"||state.phase==="ERROR"?state.previous:null};
}
export function verificationFailed<T>(state:VerificationFetchState<T>,message:string):VerificationFetchState<T>{
 return {phase:"ERROR",message:message.trim()||"Unable to load verification requests",previous:state.phase==="READY"?state.data:state.phase==="LOADING"||state.phase==="ERROR"?state.previous:null};
}
