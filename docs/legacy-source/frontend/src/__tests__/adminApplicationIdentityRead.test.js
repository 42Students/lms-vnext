import { getAdminJobApplication } from "@/api/Services/AdminService";
import Api from "@/api/ApiMethod";

jest.mock("@/api/ApiMethod", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe("admin application identity read", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Api.get.mockResolvedValue({ data: { status: "success", data: { id: 55 } } });
  });

  test("loads the exact application independently of list filters and pagination", async () => {
    await getAdminJobApplication(10, 55, 7);
    expect(Api.get).toHaveBeenCalledWith(
      "/api/v1/admin/jobs/10/applications/55?collegeId=7",
      undefined
    );
  });

  test("rejects incomplete application identity before making a request", async () => {
    await expect(getAdminJobApplication(10, null, 7)).rejects.toThrow(/required/i);
    expect(Api.get).not.toHaveBeenCalled();
  });
});
