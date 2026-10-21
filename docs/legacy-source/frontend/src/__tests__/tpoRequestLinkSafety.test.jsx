/** A link a student typed in a request (offer letter, proof) is a link only when it is a web address. */
import React from "react";
import { render, screen } from "@testing-library/react";
import { RequestDetails } from "@/components/tpo/RequestsPanel";

jest.mock("@/api/Services/TpoService", () => ({ decideRequest: jest.fn() }));
jest.mock("@/api/Services/AdminService", () => ({ fetchWithErrorHandling: jest.fn() }));

test("a javascript: letter link is shown as text, a web link as a link", () => {
  const { rerender } = render(<RequestDetails request={{ type: "EXTERNAL_OFFER", payload: { companyName: "Acme", letterUrl: "javascript:alert(1)" } }} />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.getByText(/not a web link/)).toBeInTheDocument();
  rerender(<RequestDetails request={{ type: "EXTERNAL_OFFER", payload: { companyName: "Acme", letterUrl: "https://r2.example.com/x.pdf" } }} />);
  expect(screen.getByRole("link", { name: "Offer letter" })).toHaveAttribute("href", "https://r2.example.com/x.pdf");
});
