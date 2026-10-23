import {z} from "zod";
export const learnerNoticeQuerySchema=z.strictObject({
 pinned:z.enum(["0","1"]).optional(),
 unread:z.enum(["0","1"]).optional(),
 q:z.string().trim().max(100).optional(),
 alertQ:z.string().trim().max(80).optional(),
 focus:z.string().uuid().optional(),
 source:z.enum(["all","placement-cell"]).optional(),
 recent:z.enum(["0","1"]).optional(),
 page:z.string().regex(/^[1-9][0-9]{0,3}$/).transform(value=>Number(value)).optional(),
 sort:z.enum(["pinned","latest","oldest"]).optional(),
});

/** Recover valid notice filters independently of malformed or duplicated peers.
 * Never accept tenant/actor selectors from a caller's query string. */
export function readLearnerNoticeFilters(raw:Record<string,unknown>){
 const allowed=["pinned","unread","recent","q","alertQ","page","sort","focus","source"];
 const parsed={
  pinned:z.enum(["0","1"]).safeParse(raw["pinned"]??"0"),
  unread:z.enum(["0","1"]).safeParse(raw["unread"]??"0"),
  recent:z.enum(["0","1"]).safeParse(raw["recent"]??"0"),
  q:z.string().trim().max(100).safeParse(raw["q"]??""),
  alertQ:z.string().trim().max(80).safeParse(raw["alertQ"]??""),
  focus:z.string().uuid().safeParse(raw["focus"]??""),
  source:z.enum(["all","placement-cell"]).safeParse(raw["source"]??"all"),
  page:z.string().regex(/^[1-9][0-9]{0,3}$/).transform(Number).safeParse(raw["page"]??"1"),
  sort:z.enum(["pinned","latest","oldest"]).safeParse(raw["sort"]??"pinned"),
 };
 return {
  pinned:parsed.pinned.success&&parsed.pinned.data==="1",
  unread:parsed.unread.success&&parsed.unread.data==="1",
  recent:parsed.recent.success&&parsed.recent.data==="1",
  q:parsed.q.success?parsed.q.data:"",
  alertQ:parsed.alertQ.success?parsed.alertQ.data:"",
  focus:parsed.focus.success?parsed.focus.data:null,
  source:parsed.source.success?parsed.source.data:"all" as const,
  page:parsed.page.success?parsed.page.data:1,
  sort:parsed.sort.success?parsed.sort.data:"pinned" as const,
  invalid:Object.keys(raw).some(key=>!allowed.includes(key))||
    Object.entries(parsed).some(([name,result])=>name!=="focus"&&!result.success)||
    (raw["focus"]!==undefined&&!parsed.focus.success),
 };
}
