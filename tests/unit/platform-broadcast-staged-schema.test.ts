import {describe,it,expect} from "vitest";
import {getTableName} from "drizzle-orm";
import {platformBroadcastsStaged,platformBroadcastTargetsStaged} from "@/modules/announcements/staged-schema";
import {platformBroadcastAudience} from "@/modules/announcements/platform-broadcast-model";
describe("platform broadcast staging",()=>{
 it("keeps global and college targets in separate owner-registered tables",()=>{
 expect(getTableName(platformBroadcastsStaged)).toBe("platform_broadcasts");
 expect(getTableName(platformBroadcastTargetsStaged)).toBe("platform_broadcast_targets");
 expect(platformBroadcastAudience([]).mode).toBe("ALL_COLLEGES");
 });
});
