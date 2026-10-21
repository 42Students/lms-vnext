import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import BatchPromotion from "@/pages/superadmin/sections/BatchPromotion";
import { message } from "antd";
import {
  getProgramsByCollege,
  getBatchesByCollege,
  promoteBatch,
  previewBatchPromotion,
} from "@/api/Services/AdminService";

jest.mock("@/api/Services/AdminService", () => ({
  getProgramsByCollege: jest.fn(),
  getBatchesByCollege: jest.fn(),
  promoteBatch: jest.fn(),
  previewBatchPromotion: jest.fn(),
  fetchWithErrorHandling: jest.fn(async (promise) => {
    try {
      const response = await promise;
      return { success: true, data: response?.data?.data ?? response?.data ?? [] };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }),
}));

// Render actual column callbacks and keep modal confirmation accessible.
jest.mock("antd", () => {
  const React = require("react");
  const actual = jest.requireActual("antd");
  return {
    ...actual,
    message: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
    Table: ({ columns, dataSource = [] }) =>
      React.createElement("div", null,
        dataSource.map((record) =>
          React.createElement("div", { key: record.id },
            columns.map((column, index) =>
              React.createElement("div", { key: column.key ?? index },
                column.render
                  ? column.render(record[column.dataIndex], record)
                  : String(record[column.dataIndex] ?? ""),
              ),
            ),
          ),
        ),
      ),
    Modal: ({ open, onOk, okButtonProps, okText, children }) => open
      ? React.createElement("div", null, children,
          React.createElement("button", { onClick: onOk, disabled: okButtonProps?.disabled }, okText),
        )
      : null,
  };
});

const batch = {
  id: 42,
  batchName: "First year",
  currentSemester: 1,
  programId: 8,
  status: "ACTIVE",
  currentStudents: 2,
};

const validPreview = { data: { data: { valid: true, currentSemester: 1, targetSemester: 2 } } };

describe("batch promotion regression", () => {
  beforeEach(() => {
    getBatchesByCollege.mockResolvedValue({ data: { data: [batch] } });
    getProgramsByCollege.mockResolvedValue({ data: { data: [{ id: 8, durationYears: 4 }] } });
    previewBatchPromotion.mockResolvedValue(validPreview);
    promoteBatch.mockResolvedValue({ data: { status: "OK" } });
  });

  const openPromotion = async () => {
    render(<BatchPromotion collegeId={7} />);
    const promote = await screen.findByRole("button", { name: /Promote$/ });
    await waitFor(() => expect(promote).not.toBeDisabled());
    fireEvent.click(promote);
    return screen.findByRole("button", { name: "Yes, Promote" });
  };

  it("fails closed when the server preview cannot be obtained", async () => {
    previewBatchPromotion.mockRejectedValueOnce(new Error("Preview unavailable"));
    const confirm = await openPromotion();
    await waitFor(() => expect(screen.getByText("Can’t promote yet")).toBeInTheDocument());
    expect(confirm).toBeDisabled();
    expect(promoteBatch).not.toHaveBeenCalled();
  });

  it("does not submit when revalidation fails after a successful preview", async () => {
    previewBatchPromotion.mockResolvedValueOnce(validPreview).mockRejectedValueOnce(new Error("Connection lost"));
    const confirm = await openPromotion();
    await waitFor(() => expect(confirm).not.toBeDisabled());
    fireEvent.click(confirm);
    expect(await screen.findByText(/Could not verify this promotion. Nothing was changed/)).toBeInTheDocument();
    expect(promoteBatch).not.toHaveBeenCalled();
  });

  it("promotes once and exposes no unsafe undo shortcut", async () => {
    const confirm = await openPromotion();
    await waitFor(() => expect(confirm).not.toBeDisabled());
    fireEvent.click(confirm);

    await waitFor(() => expect(promoteBatch).toHaveBeenCalledWith(42, { target_semester: 2 }));
    expect(message.success).toHaveBeenCalledWith("Batch promoted to Semester 2.");
    expect(screen.queryByText("Undo")).not.toBeInTheDocument();
    expect(message.error).not.toHaveBeenCalled();
  });
});
