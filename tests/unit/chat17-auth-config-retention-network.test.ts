import { describe, expect, it, vi } from "vitest";
import { readAuthConfig, getPlatformHosts, MIN_AUTH_SECRET_LENGTH, SESSION_MAX_AGE_SECONDS, AuthConfigError } from "@/modules/auth/config";
import { publicNetworkNotice } from "@/modules/auth/public-network-notice-model";
import { purgeAuthData, ATTEMPT_RETENTION_DAYS, SESSION_RETENTION_DAYS, type SqlExecutor } from "@/modules/auth/retention";

const secret="s".repeat(MIN_AUTH_SECRET_LENGTH);
describe("WEAK-auth config, retention and public network failure cases",()=>{
  it("WEAK-auth-config-01 production never honors test OTP contacts or localhost platform host by default",()=>{
    const cfg=readAuthConfig({
      APP_ENV:"production",NODE_ENV:"production",AUTH_SECRET:secret,
      AUTH_TEST_OTP:"123456",AUTH_TEST_PHONES:"+919876543210",
      AUTH_TEST_EMAILS:"tester@example.test",
    });
    expect(cfg.appEnv).toBe("production");
    expect(cfg.testOtp).toBeNull();
    expect([...cfg.testPhones]).toEqual([]);
    expect([...cfg.testEmails]).toEqual([]);
    expect([...cfg.platformHosts]).toEqual([]);
    expect(cfg.sessionMaxAgeSeconds).toBe(SESSION_MAX_AGE_SECONDS);
    expect([...getPlatformHosts({NODE_ENV:"production",PLATFORM_HOSTS:" CAMPUS.EXAMPLE.EDU, campus.example.edu "})])
      .toEqual(["campus.example.edu"]);
  });

  it("WEAK-auth-config-02 development QA OTP is six digits and only explicitly allowlisted contacts",()=>{
    const dev=readAuthConfig({
      APP_ENV:"development",AUTH_SECRET:secret,
      AUTH_TEST_OTP:"654321",AUTH_TEST_PHONES:"+911111111111, +922222222222",
      AUTH_TEST_EMAILS:"QA@EXAMPLE.TEST, qa@example.test",
    });
    expect(dev.testOtp).toBe("654321");
    expect([...dev.testPhones]).toEqual(["+911111111111","+922222222222"]);
    expect([...dev.testEmails]).toEqual(["qa@example.test"]);
    const bad=readAuthConfig({APP_ENV:"development",AUTH_SECRET:secret,AUTH_TEST_OTP:"1a3456",
      AUTH_TEST_PHONES:"+911111111111"});
    expect(bad.testOtp).toBeNull();
    expect(bad.testPhones.size).toBe(0);
    expect(()=>readAuthConfig({AUTH_SECRET:"too-short"})).toThrow(AuthConfigError);
  });

  it("WEAK-auth-retention-01 uses parameterized retention boundaries and safe zero counts",async()=>{
    const query=vi.fn(async (_sql:string,_values?:unknown[])=>({rowCount:null}));
    const result=await purgeAuthData({query} satisfies SqlExecutor);
    expect(result).toEqual({attemptsDeleted:0,sessionsDeleted:0});
    expect(query).toHaveBeenCalledTimes(2);
    const calls=query.mock.calls;
    expect(calls[0]?.[0]).toContain("DELETE FROM identity_auth_attempts");
    expect(calls[1]?.[0]).toContain("DELETE FROM identity_device_sessions");
    expect(calls[1]?.[0]).toContain("revoked_at");
    expect(calls[0]?.[1]).toEqual([ATTEMPT_RETENTION_DAYS]);
    expect(calls[1]?.[1]).toEqual([SESSION_RETENTION_DAYS]);
  });

  it("WEAK-auth-retention-02 failed database writes propagate; no synthetic deletion success",async()=>{
    const query=vi.fn(async()=>{throw new Error("DB_UNAVAILABLE");});
    await expect(purgeAuthData({query})).rejects.toThrow("DB_UNAVAILABLE");
    expect(query).toHaveBeenCalledOnce();
  });

  it("WEAK-auth-network-01 logout failure does not falsely claim session was cleared",()=>{
    for(const status of [0,502,503,504])
      expect(publicNetworkNotice({status,isSessionChange:true}))
        .toBe("Your session has not been cleared.");
    expect(publicNetworkNotice({status:0})).toBe("Connection problem");
    expect(publicNetworkNotice({status:504})).toBe("Request timed out");
    expect(publicNetworkNotice({status:408})).toBe("Request timed out");
    expect(publicNetworkNotice({status:500})).toBe("Server Error");
    for(const status of [200,201,302,400,401,403,404,409])
      expect(publicNetworkNotice({status})).toBeNull();
  });
});
