import { fireEvent, render, screen } from "@testing-library/react";
import ChoiceEditor, { choiceEditorKeys } from "../ChoiceEditor";

const options = [{ value: "PLACEMENTS", label: "Placements" }, { value: "HIGHER_STUDIES", label: "Higher studies" }, { value: "NOT_INTERESTED", label: "Not interested" }];

test("opens with every option showing and the current one marked", () => {
  render(<ChoiceEditor value="HIGHER_STUDIES" options={options} onValueChange={jest.fn()} stopEditing={jest.fn()} colDef={{ headerName: "Registration" }} />);
  expect(screen.getAllByRole("option")).toHaveLength(3);
  expect(screen.getByRole("option", { name: "Higher studies" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("listbox", { name: "Choose Registration" })).toHaveFocus();
});

test("arrow keys move and Enter picks; Esc leaves the cell unchanged", () => {
  jest.useFakeTimers();
  const onValueChange = jest.fn(); const stopEditing = jest.fn();
  render(<ChoiceEditor value="PLACEMENTS" options={options} onValueChange={onValueChange} stopEditing={stopEditing} />);
  const list = screen.getByRole("listbox");
  fireEvent.keyDown(list, { key: "ArrowDown" });
  fireEvent.keyDown(list, { key: "ArrowDown" });
  fireEvent.keyDown(list, { key: "Enter" });
  expect(onValueChange).toHaveBeenCalledWith("NOT_INTERESTED");
  jest.runAllTimers();
  expect(stopEditing).toHaveBeenCalledWith();
  stopEditing.mockClear();
  fireEvent.keyDown(list, { key: "Escape" });
  expect(stopEditing).toHaveBeenCalledWith(true);
  jest.useRealTimers();
});

test("a click picks; the grid leaves the editor's keys alone only while editing", () => {
  const onValueChange = jest.fn();
  render(<ChoiceEditor value="" options={options} onValueChange={onValueChange} stopEditing={jest.fn()} />);
  fireEvent.click(screen.getByRole("option", { name: "Placements" }));
  expect(onValueChange).toHaveBeenCalledWith("PLACEMENTS");
  expect(choiceEditorKeys({ editing: true, event: { key: "Enter" } })).toBe(true);
  expect(choiceEditorKeys({ editing: false, event: { key: "Enter" } })).toBe(false);
  expect(choiceEditorKeys({ editing: true, event: { key: "a" } })).toBe(false);
});
