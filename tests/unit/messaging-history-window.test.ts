import {expect,it} from "vitest";
import {messagingHistoryPageWindow} from "@/modules/messaging/receipt-history-window-model";
it("clamps deleted/expired batch page links to a populated window",()=>{
 expect(messagingHistoryPageWindow(100,27,25)).toEqual({page:2,pages:2,offset:25});
 expect(messagingHistoryPageWindow(4,0,25)).toEqual({page:1,pages:1,offset:0});
 expect(()=>messagingHistoryPageWindow(0,30,25)).toThrow();
});
