import { createRef } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import TpoGrid from "../TpoGrid";

const rows = [{ id: 1, name: "Asha", roll: "R1" }, { id: 2, name: "Bala", roll: "R2" }, { id: 3, name: "Chitra", roll: "R3" }];
const columns = [{ field: "name", headerName: "Name" }, { field: "roll", headerName: "Roll no." }];

test("the real grid renders rows, filters through the side-panel predicate and selects through its handle", async () => {
  const handle = createRef();
  const onSelection = jest.fn();
  const onShown = jest.fn();
  const { rerender } = render(<TpoGrid handle={handle} rows={rows} columns={columns} rowId={(r) => r.id} onSelection={onSelection} onShownChange={onShown} />);
  expect(await screen.findByText("Asha")).toBeInTheDocument();
  expect(screen.getByText("Roll no.")).toBeInTheDocument();

  await act(async () => { handle.current.selectWhere((r) => r.roll !== "R2"); });
  await waitFor(() => expect(onSelection).toHaveBeenLastCalledWith([rows[0], rows[2]]));

  rerender(<TpoGrid handle={handle} rows={rows} columns={columns} rowId={(r) => r.id} onSelection={onSelection} onShownChange={onShown} externalFilter={(r) => r.name !== "Bala"} />);
  await waitFor(() => expect(handle.current.shownRows().map((r) => r.id)).toEqual([1, 3]));
});
