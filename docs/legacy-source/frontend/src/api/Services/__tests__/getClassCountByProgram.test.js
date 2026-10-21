import Api from "../../ApiMethod";
import { getClassCountByProgram } from "../AdminService";

jest.mock("../../ApiMethod", () => ({ __esModule: true, default: { get: jest.fn() } }));

describe("getClassCountByProgram", () => {
  beforeEach(() => jest.clearAllMocks());

  test("asks the real program-scoped endpoint and returns the number of classes in the {id: name} map", async () => {
    Api.get.mockResolvedValue({ data: { data: { 11: "CSE-A", 12: "CSE-B", 13: "CSE-C" } } });
    const res = await getClassCountByProgram(7);
    expect(Api.get).toHaveBeenCalledWith("/api/v1/class/getClassesByProgram?programId=7");
    expect(res.data.data).toBe(3);
  });

  test("a 404 (no classes for the program) counts as zero, not as a failed fetch", async () => {
    Api.get.mockRejectedValue({ response: { status: 404 } });
    const res = await getClassCountByProgram(7);
    expect(res.data.data).toBe(0);
  });

  test("other failures are still surfaced", async () => {
    Api.get.mockRejectedValue({ response: { status: 500 } });
    await expect(getClassCountByProgram(7)).rejects.toEqual({ response: { status: 500 } });
  });

  test("an empty map is zero classes", async () => {
    Api.get.mockResolvedValue({ data: { data: {} } });
    expect((await getClassCountByProgram(7)).data.data).toBe(0);
  });
});
