import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSelector } from "react-redux";
import VideoDrawer from "../VideoDrawer";
import { createLessonContent } from "@/api/Services/courseServices";
import { updateLessonContent } from "@/api/Services/AdminService";

jest.mock("react-redux", () => ({ useSelector: jest.fn() }));
jest.mock("@/api/Services/courseServices", () => ({ createLessonContent: jest.fn() }));
jest.mock("@/api/Services/AdminService", () => ({ updateLessonContent: jest.fn() }));
jest.mock("@/utils/uploadToR2", () => ({ uploadFileViaPresign: jest.fn() }));
jest.mock("@/components/Global/Editor/editor", () => function MockEditor() { return null; });

// A minimal stand-in that still exercises real antd Form validation (form.validateFields()),
// which is what makes the "edit without re-uploading" regression this bug fix is guarding
// against actually reachable in a test.
jest.mock("@/components/Global/RightDrawer/DrawerWidget", () =>
  function MockDrawerWidget({ drawerOpen, title, children, onClickSecondary, secondaryButtonTitle }) {
    if (!drawerOpen) return null;
    return (
      <div>
        <h1>{title}</h1>
        {children}
        <button onClick={onClickSecondary}>{secondaryButtonTitle}</button>
      </div>
    );
  }
);

describe("VideoDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSelector.mockImplementation((selector) => selector({ loginUser: { id: 15, userType: "FACULTY" } }));
    createLessonContent.mockResolvedValue({});
    updateLessonContent.mockResolvedValue({});
  });

  const existingVideo = {
    id: 42,
    classId: 6,
    lessonId: 9,
    contentTitle: "Intro to OOP",
    points: 10,
    contentDataDTO: {
      file_dto: { cloud_storage_object: "https://storesuuploads.42lms.in/lesson-content/intro.mp4" },
    },
  };

  test("editing without re-uploading calls update (PUT), not create", async () => {
    render(<VideoDrawer open editSelectedVideo={existingVideo} onClose={jest.fn()} />);

    // Title/points come pre-filled from the existing content (getAssignmentAutofill), and the
    // real "required: Upload Video" rule is satisfied by the already-stored file, without a
    // fresh upload — this is exactly the save that used to fail against the create endpoint.
    fireEvent.click(await screen.findByText("Submit"));

    await waitFor(() => expect(updateLessonContent).toHaveBeenCalledTimes(1));
    expect(createLessonContent).not.toHaveBeenCalled();

    const [id, payload] = updateLessonContent.mock.calls[0];
    expect(id).toBe(42);
    expect(payload.lesson_content_id).toBe(42);
    expect(payload.class_id).toBe(6);
    expect(payload.lesson_id).toBe(9);
    expect(payload.content_data_dto.file_dto.cloud_storage_object).toBe(
      "https://storesuuploads.42lms.in/lesson-content/intro.mp4"
    );
  });

  test("creating a brand-new video (no editSelectedVideo) calls create, not update", async () => {
    const { uploadFileViaPresign } = require("@/utils/uploadToR2");
    uploadFileViaPresign.mockResolvedValue({ publicUrl: "https://storesuuploads.42lms.in/lesson-content/new.mp4" });

    render(<VideoDrawer open editSelectedVideo={null} onClose={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Enter Video Title"), { target: { value: "New lecture" } });
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(uploadFileViaPresign).toHaveBeenCalled());
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => expect(createLessonContent).toHaveBeenCalledTimes(1));
    expect(updateLessonContent).not.toHaveBeenCalled();
    expect(createLessonContent.mock.calls[0][0].lesson_content_id).toBe(0);
  });
});
