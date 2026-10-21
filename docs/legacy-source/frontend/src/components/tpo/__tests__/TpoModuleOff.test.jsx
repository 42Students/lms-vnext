import { render, screen } from "@testing-library/react";
import TpoModuleOff, { isPlacementsOff } from "../TpoModuleOff";

test("only the college-switch refusal counts as Placements being off", () => {
  expect(isPlacementsOff({ success: false, status: 403, message: "Placements are not switched on for this college" })).toBe(true);
  expect(isPlacementsOff({ success: false, status: 403, message: "Access denied" })).toBe(false);
  expect(isPlacementsOff({ success: false, status: 500, message: "Placements are not switched on for this college" })).toBe(false);
  expect(isPlacementsOff({ success: true, data: {} })).toBe(false);
});

test("the closed workspace says nothing is lost", () => {
  render(<TpoModuleOff />);
  expect(screen.getByTestId("tpo-module-off")).toHaveTextContent("Placements is switched off for this college");
  expect(screen.getByTestId("tpo-module-off")).toHaveTextContent("Nothing has been deleted");
});
