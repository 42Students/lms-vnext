import {expect,it} from "vitest";
import {learnerOfferStatusHref} from "@/modules/placements/learner-offers-navigation-model";
it("builds an expired-offer filter URL separately from the due-soon state",()=>{
 const href=learnerOfferStatusHref("pending",{searchTerm:"",dueOnly:false,sort:"priority",expiry:"expired"});
 const q=new URL(href,"https://example.test").searchParams;
 expect(q.get("expiry")).toBe("expired");expect(q.has("due")).toBe(false);
});
