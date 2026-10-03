import {
  describe,
  expect,
  it,
} from "vitest";
import {
  facultyOwnedItemActions,
  nextLessonItemSequence,
} from "@/components/courses/faculty-course-operation-model";

describe("faculty Course operation model", () => {
  it("never exposes mutation actions for shared Offering items", () => {
    expect(
      facultyOwnedItemActions({
        deliveryId: null,
        status: "DRAFT",
        kind: "CONTENT",
      }),
    ).toEqual({
      canPublish: false,
      canClose: false,
      canArchive: false,
    });

    expect(
      facultyOwnedItemActions({
        deliveryId: null,
        status: "PUBLISHED",
        kind: "QUIZ",
      }),
    ).toEqual({
      canPublish: false,
      canClose: false,
      canArchive: false,
    });
  });

  it("allows exact-delivery drafts to publish and archive", () => {
    expect(
      facultyOwnedItemActions({
        deliveryId:
          "00000000-0000-4000-8000-000000000001",
        status: "DRAFT",
        kind: "ASSIGNMENT",
      }),
    ).toEqual({
      canPublish: true,
      canClose: false,
      canArchive: true,
    });
  });

  it("uses one lesson-wide sequence across content and assessments", () => {
    expect(
      nextLessonItemSequence([]),
    ).toBe(0);
    expect(
      nextLessonItemSequence([
        0,
        2,
        1,
      ]),
    ).toBe(3);
  });

  it("only exposes close for an exact published quiz", () => {
    expect(
      facultyOwnedItemActions({
        deliveryId:
          "00000000-0000-4000-8000-000000000001",
        status: "PUBLISHED",
        kind: "QUIZ",
      }),
    ).toEqual({
      canPublish: false,
      canClose: true,
      canArchive: true,
    });

    expect(
      facultyOwnedItemActions({
        deliveryId:
          "00000000-0000-4000-8000-000000000001",
        status: "CLOSED",
        kind: "QUIZ",
      }),
    ).toEqual({
      canPublish: false,
      canClose: false,
      canArchive: true,
    });
  });
});
