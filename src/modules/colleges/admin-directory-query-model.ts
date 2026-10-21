import {z} from "zod";

export const ADMIN_DIRECTORY_PAGE_SIZES=[10,25,50,100] as const;
const allowedPageSizes=ADMIN_DIRECTORY_PAGE_SIZES;
// Explicit query strings use decimal digits only; Number coercion also accepts
// hexadecimal, scientific notation and whitespace that have no URL page meaning.
const decimalPage = z.union([
 z.number().int().min(1).max(1000),
 z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(1).max(1000)),
]);
const decimalPageSize = z.union([
 z.number().int().min(10).max(100),
 z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(10).max(100)),
]);

/** Admin tenant directories reject duplicate/foreign query parameters rather than
 * silently taking the first value or broadening the filtered tenant set. */
export const adminDirectoryQuerySchema=z.strictObject({
  q:z.string().trim().max(100).default(""),
  page:decimalPage.default(1),
  pageSize:decimalPageSize.refine(size=>allowedPageSizes.some(value=>value===size)).default(10),
});

export function parseAdminDirectorySearchParams(raw:Record<string,string|string[]|undefined>){
  if(Object.keys(raw).some(key=>!["q","page","pageSize"].includes(key)))return null;
  if(Object.values(raw).some(Array.isArray))return null;
  const params=Object.fromEntries(Object.entries(raw).filter(([,value])=>value!==undefined));
  const parsed=adminDirectoryQuerySchema.safeParse(params);
  return parsed.success?parsed.data:null;
}

/** Legacy /search top-N adapter. Older numeric org IDs need a trusted
 * college/organization crosswalk before they can be applied as UUID scope.
 * These filters are input validation, never authorization by themselves.
 */
export const legacyCollegeDirectorySearchSchema=z.strictObject({
 query:z.string().trim().max(100).default(""),
 state:z.string().trim().max(80).optional(),
 city:z.string().trim().max(100).optional(),
 orgId:z.union([z.string().uuid(),z.string().regex(/^[0-9]+$/)]).optional(),
 limit:z.union([
   z.number().int().min(1).max(15),
   z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(1).max(15)),
 ]).default(15),
});

/** Keyboard selection for the capped historic college search dropdown.
 * Empty results have no selectable row. */
export function legacyCollegeDirectoryOptionIndex(
 current:number,key:"ArrowDown"|"ArrowUp"|"Home"|"End",length:number,
):number|null{
 const count=Math.max(0,Math.min(15,Math.trunc(length)));
 if(!count)return null;
 if(key==="Home")return 0;
 if(key==="End")return count-1;
 if(key==="ArrowDown")return current<0?0:(current+1)%count;
 return current<0?count-1:(current+count-1)%count;
}
