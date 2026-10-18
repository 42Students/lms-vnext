import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthorizationError } from "@/modules/permissions/policy";

const fakes = vi.hoisted(() => ({
  context: vi.fn(),
  listHalls: vi.fn(),
  departments: vi.fn(),
  availability: vi.fn(),
  notFound: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: fakes.context }));
vi.mock("@/modules/academics/lecture-hall-service", () => ({ listLectureHalls: fakes.listHalls }));
vi.mock("@/modules/departments/service", () => ({ listDepartments: fakes.departments }));
vi.mock("@/modules/academics/college-hall-availability-service", () => ({
  CollegeHallAvailabilityNotFoundError: class CollegeHallAvailabilityNotFoundError extends Error {},
  getCollegeHallAvailability: fakes.availability,
}));
vi.mock("@/components/admin/lecture-hall-manager", () => ({
  LectureHallManager: () => "Scoped lecture-hall actions",
}));
vi.mock("next/navigation", () => ({
  notFound: fakes.notFound,
}));

import LectureHallsPage from "@/app/(authenticated)/admin/lecture-halls/page";
import RoomAvailabilityPage from "@/app/(authenticated)/admin/lecture-halls/[hallId]/page";

const collegeId="11111111-1111-4111-8111-111111111111";
const hallId="22222222-2222-4222-8222-222222222222";
const base={
  user:{id:"user-a",identityUid:"user-a",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,
  adminScope:{organizationId:"org-a",collegeId},
};

beforeEach(()=>{
  vi.clearAllMocks();
  fakes.context.mockResolvedValue(base);
  fakes.listHalls.mockResolvedValue({collegeName:"IIT Dharwad",pagination:{total:2},items:[]});
  fakes.departments.mockResolvedValue([]);
  fakes.notFound.mockImplementation(()=>{throw new Error("NOT_FOUND");});
});

describe("Super Admin second third: actual Lecture Halls server-page states",()=>{
  it("CHAT6-ADMIN-LECTURES-PAGE-01 renders college selector recovery before ANY roster lookup",async()=>{
    fakes.context.mockResolvedValueOnce({...base,adminScope:{collegeId:null,organizationId:null}});
    const html=renderToStaticMarkup(await LectureHallsPage({searchParams:Promise.resolve({})}));
    expect(html).toContain("Select a college to continue");
    expect(html).toContain("Choose a college");
    expect(fakes.listHalls).not.toHaveBeenCalled();
    expect(fakes.departments).not.toHaveBeenCalled();
  });

  it("CHAT6-ADMIN-LECTURES-PAGE-02 rejects foreign role and corrupt filters with a non-disclosing state",async()=>{
    fakes.context.mockResolvedValueOnce({
      ...base,user:{...base.user,systemRoles:[]},
    });
    await expect(LectureHallsPage({searchParams:Promise.resolve({})}))
      .rejects.toBeInstanceOf(AuthorizationError);
    expect(fakes.listHalls).not.toHaveBeenCalled();
    const html=renderToStaticMarkup(await LectureHallsPage({
      searchParams:Promise.resolve({collegeId:"another-college",page:"1e2"}),
    }));
    expect(html).toContain("Invalid lecture hall filters");
    expect(html).toContain("Clear filters");
    expect(fakes.listHalls).not.toHaveBeenCalled();
  });

  it("CHAT6-ADMIN-LECTURES-PAGE-03 passes the authenticated college and validated pagination to both selectors",async()=>{
    const html=renderToStaticMarkup(await LectureHallsPage({
      searchParams:Promise.resolve({q:"Hall",status:"ACTIVE",page:"2",pageSize:"25"}),
    }));
    expect(fakes.listHalls).toHaveBeenCalledWith(base,expect.objectContaining({
      collegeId,q:"Hall",status:"ACTIVE",limit:25,offset:25,
    }));
    expect(fakes.departments).toHaveBeenCalledWith(base,collegeId);
    expect(html).toContain("IIT Dharwad");
    expect(html).toContain("2 matching halls");
    expect(html).toContain("Scoped lecture-hall actions");
    expect(html).toContain("min-w-0");
  });

  it("CHAT6-ADMIN-AVAILABILITY-PAGE-01 never attempts room schedule reads without a selected college",async()=>{
    fakes.context.mockResolvedValueOnce({...base,adminScope:{collegeId:null,organizationId:null}});
    const html=renderToStaticMarkup(await RoomAvailabilityPage({
      params:Promise.resolve({hallId}),
      searchParams:Promise.resolve({from:"2099-01-01",to:"2099-01-31"}),
    }));
    expect(html).toContain("Select a college to continue");
    expect(fakes.availability).not.toHaveBeenCalled();
  });

  it("CHAT6-ADMIN-AVAILABILITY-PAGE-02 keeps an invalid IST date range recoverable without querying schedule",async()=>{
    const html=renderToStaticMarkup(await RoomAvailabilityPage({
      params:Promise.resolve({hallId}),
      searchParams:Promise.resolve({from:"2099-01-31",to:"2099-01-01"}),
    }));
    expect(html).toContain("Invalid date range");
    expect(fakes.availability).not.toHaveBeenCalled();
  });

  it("CHAT6-ADMIN-AVAILABILITY-PAGE-03 renders conflict and capacity evidence for a scoped booked room",async()=>{
    fakes.availability.mockResolvedValueOnce({
      hall:{name:"LH-201",status:"ACTIVE",capacity:50},
      conflictCount:1,truncated:false,
      sessions:[{
        id:"session-a",title:"Data structures",sectionName:"CSE A",
        startsAt:"2099-01-01T08:00:00.000Z",endsAt:"2099-01-01T09:00:00.000Z",
        sectionCapacity:60,hasConflict:true,overlapsAnother:true,
        overConfiguredCapacity:true,
      }],
    });
    const html=renderToStaticMarkup(await RoomAvailabilityPage({
      params:Promise.resolve({hallId}),
      searchParams:Promise.resolve({from:"2099-01-01",to:"2099-01-02"}),
    }));
    expect(fakes.availability).toHaveBeenCalledWith(base,{hallId,from:"2099-01-01",to:"2099-01-02"});
    expect(html).toContain("LH-201");
    expect(html).toContain("Overlapping scheduled booking");
    expect(html).toContain("Class capacity exceeds hall capacity");
    expect(html).toContain("Potential conflict");
  });
});
