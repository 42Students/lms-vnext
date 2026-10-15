export const TPO_HOME_ROWS=["BATCHES","DRIVES","APPLICANTS","INTERVIEWS","OFFERS","JOINING"] as const;
export type TpoHomeRow=(typeof TPO_HOME_ROWS)[number];
export type TpoAttention={key:TpoHomeRow;label:string;count:number;href:string};
export function buildTpoHomeAttention(rows:readonly TpoAttention[]){
 const order=new Map<string,number>(TPO_HOME_ROWS.map((key,index)=>[key,index]));
 const ordered=rows.filter(row=>order.has(row.key)).sort((a,b)=>(order.get(a.key)??99)-(order.get(b.key)??99));
 const next=ordered.find(row=>row.count>0)??null;
 return {next,quiet:next===null,rows:ordered.map(row=>({...row,needsAttention:row.count>0}))};
}