import {expect,it} from "vitest";
import {learnerAlertsHistoryHref} from "@/modules/placements/learner-alerts-history-navigation-model";
it("preserves unread intent when opening the owned notification history",()=>{
 expect(learnerAlertsHistoryHref(true)).toBe("/learn/notifications/history?unread=1");
 expect(learnerAlertsHistoryHref(false)).toBe("/learn/notifications/history");
});
