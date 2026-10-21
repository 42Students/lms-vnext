/** Strict, explicit legacy zero-based pagination over a college-scoped
 * program directory. This is an additive response view: no numeric aliases,
 * no implicit global listing and no changes to the standard vNext list.
 * A future database-level page query can replace the slice transparently.
 */
export type LegacyProgramPageInput={page:number;size:number};

export function parseLegacyProgramPage(params:URLSearchParams):LegacyProgramPageInput|false|null{
 const rawPage=params.get("page"),rawSize=params.get("size");
 if(rawPage===null&&rawSize===null)return null;
 const page=rawPage??"0",size=rawSize??"20";
 if(!/^(?:0|[1-9]\d{0,5})$/.test(page)||!/^(?:0|[1-9]\d{0,3})$/.test(size))return false;
 const p=Number(page),s=Number(size);
 if(!Number.isSafeInteger(p)||p>100000||!Number.isSafeInteger(s)||s<1||s>100)return false;
 return {page:p,size:s};
}

export function legacyProgramPage<T extends {
 id:string;departmentId:string;departmentName:string;name:string;
 durationTerms:number;code:string;
}>(rows:readonly T[],options:LegacyProgramPageInput){
 const totalElements=rows.length;
 const totalPages=Math.ceil(totalElements/options.size);
 const content=rows.slice(options.page*options.size,(options.page+1)*options.size).map(row=>({
  id:row.id,
  name:row.name,
  deptId:row.departmentId,
  deptName:row.departmentName,
  durationYears:row.durationTerms/2,
  code:row.code,
 }));
 return {content,totalElements,totalPages,number:options.page,size:options.size,
  first:options.page===0,last:totalPages===0||options.page>=totalPages-1,
  numberOfElements:content.length,empty:content.length===0};
}
