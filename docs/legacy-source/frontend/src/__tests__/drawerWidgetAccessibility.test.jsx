import React from "react";
import { render } from "@testing-library/react";
import DrawerWidget from "@/components/Global/RightDrawer/DrawerWidget";
import { Drawer } from "antd";

jest.mock("antd", () => ({
  Drawer: jest.fn(({ children }) => <div data-testid="drawer">{children}</div>),
}));

jest.mock("@/components/Global/Button/button", () => ({
  __esModule: true,
  default: ({ title }) => <button type="button">{title}</button>,
}));

test("DrawerWidget forwards dialog accessibility props to the underlying drawer", () => {
  render(
    <DrawerWidget
      drawerOpen
      onClose={jest.fn()}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      Drawer body
    </DrawerWidget>
  );

  const props = Drawer.mock.calls[0][0];
  expect(props.role).toBe("dialog");
  expect(props["aria-modal"]).toBe("true");
  expect(props["aria-label"]).toBe("Navigation menu");
  expect(props.open).toBe(true);
});

test("DrawerWidget returns focus to the element that opened the drawer", () => {
  const raf = window.requestAnimationFrame;
  window.requestAnimationFrame = (callback) => {
    callback();
    return 1;
  };

  const trigger = document.createElement("button");
  trigger.textContent = "Open drawer";
  document.body.appendChild(trigger);
  trigger.focus();

  render(
    <DrawerWidget drawerOpen onClose={jest.fn()}>
      Drawer body
    </DrawerWidget>
  );

  const props = Drawer.mock.calls.at(-1)[0];
  const inside = document.createElement("button");
  document.body.appendChild(inside);
  inside.focus();

  props.afterOpenChange(false);
  expect(trigger).toHaveFocus();

  trigger.remove();
  inside.remove();
  window.requestAnimationFrame = raf;
});
