import Api from "@/api/ApiMethod";
import { getLessonContent, getLessonContentProgress } from "@/api/Services/courseServices";

jest.mock("@/api/ApiMethod", () => ({ __esModule: true, default: { get: jest.fn() } }));

// BE-0004/BE-0005: a failed lookup rejects; it is never turned into "no content" or "no progress".
test("lesson content and progress failures reject", async () => {
  Api.get.mockRejectedValueOnce(new Error("403"));
  await expect(getLessonContent({ lessonId: 3 })).rejects.toThrow("403");
  Api.get.mockRejectedValueOnce(new Error("500"));
  await expect(getLessonContentProgress(3)).rejects.toThrow("500");
});

test("an invalid lesson id still answers 'no progress' without asking", async () => {
  Api.get.mockClear();
  await expect(getLessonContentProgress(0)).resolves.toEqual({ data: { data: [] } });
  expect(Api.get).not.toHaveBeenCalled();
});
