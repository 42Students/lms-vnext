import Api from "@/api/ApiMethod";
import { getTeachingAssignmentsForCollege } from "@/api/Services/FacultyAssignmentService";

jest.mock("@/api/ApiMethod", () => ({ __esModule: true, default: { get: jest.fn() } }));

// BE-0068: the page reads its college's assignments from the tenant-scoped paged endpoint, never fetchAll.
test("reads every page of the college's assignments from /page", async () => {
  Api.get
    .mockResolvedValueOnce({ data: { data: { content: [{ id: 1 }, { id: 2 }], totalPages: 2 } } })
    .mockResolvedValueOnce({ data: { data: { content: [{ id: 3 }], totalPages: 2 } } });
  const out = await getTeachingAssignmentsForCollege(6, { pageSize: 2 });
  expect(out.data.data.map((r) => r.id)).toEqual([1, 2, 3]);
  expect(Api.get).toHaveBeenNthCalledWith(1, "/api/v1/teaching-assignment/page", { params: { collegeId: 6, page: 0, size: 2 } });
  expect(Api.get).toHaveBeenNthCalledWith(2, "/api/v1/teaching-assignment/page", { params: { collegeId: 6, page: 1, size: 2 } });
  expect(Api.get.mock.calls.some(([url]) => url.includes("fetchAll"))).toBe(false);
});

test("a failed page fails the whole load (no partial table)", async () => {
  Api.get.mockReset().mockRejectedValueOnce(new Error("403"));
  await expect(getTeachingAssignmentsForCollege(6)).rejects.toThrow("403");
});
