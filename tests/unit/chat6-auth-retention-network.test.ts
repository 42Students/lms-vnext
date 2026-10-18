import {describe,expect,it,vi} from "vitest";
import {ATTEMPT_RETENTION_DAYS,SESSION_RETENTION_DAYS,purgeAuthData,type SqlExecutor} from "@/modules/auth/retention";
import {publicNetworkNotice} from "@/modules/auth/public-network-notice-model";
import {describeDevice} from "@/modules/auth/device-label";

describe("AUTH-retention-01 data lifecycle and network outcomes",()=>{
 it("purges old login challenges and expired/revoked device sessions with bounded parameters",async()=>{
  const query=vi.fn<SqlExecutor["query"]>()
   .mockResolvedValueOnce({rowCount:7}).mockResolvedValueOnce({rowCount:3});
  expect(ATTEMPT_RETENTION_DAYS).toBe(1);
  expect(SESSION_RETENTION_DAYS).toBe(30);
  expect(await purgeAuthData({query})).toEqual({attemptsDeleted:7,sessionsDeleted:3});
  expect(query).toHaveBeenCalledTimes(2);
  const [[attempts,attemptArgs],[sessions,sessionArgs]]=query.mock.calls;
  expect(attempts).toContain("DELETE FROM identity_auth_attempts");
  expect(attempts).toContain("expires_at < now()");
  expect(attemptArgs).toEqual([1]);
  expect(sessions).toContain("DELETE FROM identity_device_sessions");
  expect(sessions).toContain("least(expires_at, coalesce(revoked_at, expires_at))");
  expect(sessionArgs).toEqual([30]);
 });
 it("AUTH-retention-02 defaults to zero deleted rows for drivers returning null",async()=>{
  const query=vi.fn<SqlExecutor["query"]>().mockResolvedValue({rowCount:null});
  expect(await purgeAuthData({query})).toEqual({attemptsDeleted:0,sessionsDeleted:0});
 });
 it("AUTH-retention-03 never reports success when a database deletion fails",async()=>{
  const query=vi.fn<SqlExecutor["query"]>().mockResolvedValueOnce({rowCount:1})
    .mockRejectedValueOnce(new Error("transient db outage"));
  await expect(purgeAuthData({query})).rejects.toThrow("transient db outage");
 });
 it("AUTH-network-01 logout 503 and gateway faults never imply a session was safely cleared",()=>{
  for(const status of [0,502,503,504])
    expect(publicNetworkNotice({status,isSessionChange:true})).toBe("Your session has not been cleared.");
  expect(publicNetworkNotice({status:504})).toBe("Request timed out");
  expect(publicNetworkNotice({status:408})).toBe("Request timed out");
  expect(publicNetworkNotice({status:0})).toBe("Connection problem");
  expect(publicNetworkNotice({status:500})).toBe("Server Error");
  expect(publicNetworkNotice({status:403})).toBeNull();
 });
 it("AUTH-device-01 never displays raw hostile user-agent bytes in a device label",()=>{
  const secret="private-user-agent-token";
  expect(describeDevice(secret)).toBe("Unknown device");
  expect(describeDevice("Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120")).toBe("Chrome on Windows");
  expect(describeDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Safari/604")).toBe("Safari on iOS");
  expect(describeDevice(null)).toBe("Unknown device");
 });
});