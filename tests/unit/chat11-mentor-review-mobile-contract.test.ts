
import {expect,it} from "vitest";
import {mentorDeliveryReviewMobileForm} from "@/modules/projects/mentor-portfolio-model";
it("keeps review controls inside the scroll-free narrow layout",()=>{
 expect(mentorDeliveryReviewMobileForm).toContain("max-w-full");
 expect(mentorDeliveryReviewMobileForm).toContain("[&_input]:min-w-0");
 expect(mentorDeliveryReviewMobileForm).toContain("[&_select]:max-w-full");
});
