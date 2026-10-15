import {it,expect} from "vitest";
import {learnerOfferStatusHref as href} from "@/modules/placements/learner-offers-navigation-model";
it("preserves sanitized status-independent filters but resets stale pagination",()=>{
 const x=href("pending",{searchTerm:"Acme & Beta",dueOnly:true,sort:"company"});
 const params=new URL(x,"https://lms.example").searchParams;
 expect(params.get("status")).toBe("pending");
 expect(params.get("q")).toBe("Acme & Beta");
 expect(params.get("due")).toBe("1");
 expect(params.get("sort")).toBe("company");
 expect(params.has("page")).toBe(false);
});
