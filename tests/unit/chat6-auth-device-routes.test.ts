import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const fakes = vi.hoisted(() => ({
  origin: vi.fn(),
  current: vi.fn(),
  list: vi.fn(),
  revokeOther: vi.fn(),
  revokeOwn: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: fakes.origin }));
vi.mock("@/auth/current-session", () => ({ getCurrentDeviceSession: fakes.current }));
vi.mock("@/modules/auth/session-service", () => ({
  listActiveSessions: fakes.list,
  revokeOtherSessions: fakes.revokeOther,
  revokeOwnSession: fakes.revokeOwn,
}));
vi.mock("@/modules/auth/private-response", () => ({
  privateAuthResponse: (response: NextResponse) => response,
}));
vi.mock("@/lib/api-error", () => ({
  apiErrorResponse: () => NextResponse.json({error:"DEVICE_REQUEST_INVALID"},{status:400}),
}));

import { GET as listDevices, DELETE as signOutOthers } from "@/app/api/auth/devices/route";
import { DELETE as revokeDevice } from "@/app/api/auth/devices/[sessionId]/route";

const own = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const make = () => new Request("https://college.example.edu/api/auth/devices", {method:"DELETE"});

beforeEach(() => {
  vi.clearAllMocks();
  fakes.origin.mockReturnValue(true);
  fakes.current.mockResolvedValue({userId:"user-a",sessionId:own,platformStatus:"ACTIVE"});
  fakes.list.mockResolvedValue([]);
  fakes.revokeOther.mockResolvedValue(1);
  fakes.revokeOwn.mockResolvedValue(true);
});

describe("device-session HTTP ownership and CSRF matrix", () => {
  it("AUTH-DEVICE-ROUTE-01 lists only the current signed-in user's device rows, no shared cache", async () => {
    fakes.list.mockResolvedValue([
      {id:own,device_name:"Own laptop",user_agent:"Chrome",created_at:"2026-10-19T00:00:00Z",last_seen_at:"2026-10-19T01:00:00Z",expires_at:"2026-10-24T00:00:00Z"},
      {id:other,device_name:"Own phone",user_agent:"Safari",created_at:"2026-10-18T00:00:00Z",last_seen_at:"2026-10-19T00:00:00Z",expires_at:"2026-10-23T00:00:00Z"},
    ]);
    const response=await listDevices();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(fakes.list).toHaveBeenCalledWith("user-a");
    const data=await response.json();
    expect(data.devices.map((row:{current:boolean})=>row.current)).toEqual([true,false]);
  });

  it("AUTH-DEVICE-ROUTE-02 rejects cross-site sign-out before resolving a session", async () => {
    fakes.origin.mockReturnValue(false);
    const all=await signOutOthers(make());
    expect(all.status).toBe(403);
    expect(await all.json()).toEqual({error:"INVALID_ORIGIN"});
    const one=await revokeDevice(make(),{params:Promise.resolve({sessionId:other})});
    expect(one.status).toBe(403);
    expect(fakes.current).not.toHaveBeenCalled();
    expect(fakes.revokeOther).not.toHaveBeenCalled();
    expect(fakes.revokeOwn).not.toHaveBeenCalled();
  });

  it("AUTH-DEVICE-ROUTE-03 signs out other devices while preserving the current session ID", async () => {
    const response=await signOutOthers(make());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ok:true,revoked:1});
    expect(fakes.revokeOther).toHaveBeenCalledWith("user-a",own);
  });

  it("AUTH-DEVICE-ROUTE-04 checks a strict UUID and passes the live subject user to one-device revoke", async () => {
    const invalid=await revokeDevice(make(),{params:Promise.resolve({sessionId:"../../other-user"})});
    expect(invalid.status).toBe(400);
    expect(fakes.revokeOwn).not.toHaveBeenCalled();
    const response=await revokeDevice(make(),{params:Promise.resolve({sessionId:other})});
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(fakes.revokeOwn).toHaveBeenCalledWith(other,"user-a");
  });

  it("AUTH-DEVICE-ROUTE-05 returns 404 when the requested device belongs to someone else", async () => {
    fakes.revokeOwn.mockResolvedValueOnce(false);
    const response=await revokeDevice(make(),{params:Promise.resolve({sessionId:other})});
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({error:"SESSION_NOT_FOUND"});
    expect(fakes.revokeOwn).toHaveBeenCalledWith(other,"user-a");
  });

  it("AUTH-DEVICE-ROUTE-06 never reports success when the persisted revoke/list lookup fails", async () => {
    fakes.revokeOwn.mockRejectedValueOnce(new Error("unavailable"));
    expect((await revokeDevice(make(),{params:Promise.resolve({sessionId:other})})).status).toBe(400);
    fakes.revokeOther.mockRejectedValueOnce(new Error("unavailable"));
    expect((await signOutOthers(make())).status).toBe(400);
    fakes.list.mockRejectedValueOnce(new Error("unavailable"));
    expect((await listDevices()).status).toBe(400);
  });
});
