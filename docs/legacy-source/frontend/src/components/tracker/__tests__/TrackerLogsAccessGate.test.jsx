import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TrackerLogsAccessGate from "../TrackerLogsAccessGate";
import { verifyTrackerLogsPassword } from "@/api/Services/TrackerLogsAccessService";
import { storeAuthResponse } from "@/utils/authUtils";

jest.mock("@/api/Services/TrackerLogsAccessService");
jest.mock("@/utils/authUtils", () => ({
  storeAuthResponse: jest.fn(),
}));

describe("TrackerLogsAccessGate", () => {
  beforeEach(() => {
    verifyTrackerLogsPassword.mockReset();
    storeAuthResponse.mockReset();
  });

  test("submits the typed password and does not ask for a username", () => {
    verifyTrackerLogsPassword.mockResolvedValue({});
    render(<TrackerLogsAccessGate />);

    expect(screen.queryByLabelText(/username|reporter|email/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "correct-horse" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));

    expect(verifyTrackerLogsPassword).toHaveBeenCalledWith("correct-horse");
  });

  test("on success, stores the returned session", async () => {
    const authData = { data: { accessToken: "a", user: { id: 0 } } };
    verifyTrackerLogsPassword.mockResolvedValue(authData);
    render(<TrackerLogsAccessGate />);

    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "correct-horse" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));

    await waitFor(() => expect(storeAuthResponse).toHaveBeenCalledWith(authData));
  });

  test("on a wrong password, shows the server's error and clears the field", async () => {
    verifyTrackerLogsPassword.mockRejectedValue({ response: { data: { message: "Incorrect password" } } });
    render(<TrackerLogsAccessGate />);

    const input = screen.getByPlaceholderText("Password");
    fireEvent.change(input, { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));

    expect(await screen.findByText("Incorrect password")).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(storeAuthResponse).not.toHaveBeenCalled();
  });
});
