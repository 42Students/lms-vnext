/**
 * UI/UX audit (Batch 3, "Create/Edit category calculation disagrees with the backend"): the
 * frontend used >=10 LPA = Dream / >=6 LPA = Super-dream, while TpoDriveService.deriveCategory
 * uses >=10 = Dream / >=20 = Super-dream. A TPO could see one category while editing and a
 * different one after the server saved it. Thresholds here must exactly match the backend.
 */
import { categoryFromCtc } from "@/components/tpo/DriveFormPage";

test("matches TpoDriveService.deriveCategory's thresholds exactly", () => {
  expect(categoryFromCtc([{ ctcLpa: 5 }])).toBe("REGULAR");
  expect(categoryFromCtc([{ ctcLpa: 9.99 }])).toBe("REGULAR");
  expect(categoryFromCtc([{ ctcLpa: 10 }])).toBe("DREAM");
  expect(categoryFromCtc([{ ctcLpa: 19.99 }])).toBe("DREAM");
  expect(categoryFromCtc([{ ctcLpa: 20 }])).toBe("SUPER_DREAM");
  expect(categoryFromCtc([{ ctcLpa: 42 }])).toBe("SUPER_DREAM");
});

test("uses the highest CTC across multiple role options", () => {
  expect(categoryFromCtc([{ ctcLpa: 4 }, { ctcLpa: 22 }, { ctcLpa: 8 }])).toBe("SUPER_DREAM");
});

test("no role options, or no CTC set, defaults to Regular", () => {
  expect(categoryFromCtc([])).toBe("REGULAR");
  expect(categoryFromCtc(undefined)).toBe("REGULAR");
  expect(categoryFromCtc([{ name: "Default" }])).toBe("REGULAR");
});
