/** A transient statistics read must not take down the public college page.
 * Private details, DB errors, and unpublished row data are never returned. */
export async function readOptionalPublicPlacementData<T>(load:()=>Promise<T>):
 Promise<{available:true;value:T}|{available:false;value:null}>{
 try{return {available:true,value:await load()};}
 catch{return {available:false,value:null};}
}
