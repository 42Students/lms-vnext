import { getAdminJobDeletionImpact } from "@/api/Services/AdminService";
import Api from "@/api/ApiMethod";

jest.mock("@/api/ApiMethod", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

describe("admin job deletion impact", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Api.get.mockResolvedValue({ data: { status: "success", data: { activeApplicationCount: 3 } } });
  });

  test("uses a scoped server preview before destructive deletion", async () => {
    await getAdminJobDeletionImpact(91, 7);
    expect(Api.get).toHaveBeenCalledWith(
      "/api/v1/admin/jobs/91/delete-impact?collegeId=7",
      undefined
    );
  });

  test("refuses incomplete delete context locally", async () => {
    await expect(getAdminJobDeletionImpact(null, 7)).rejects.toThrow(/required/i);
    expect(Api.get).not.toHaveBeenCalled();
  });
});
