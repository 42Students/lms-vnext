import React from "react";
import { render } from "@testing-library/react";
import ModalContainer from "@/components/Global/ModalContainer/ModalContainer";
import { Modal } from "antd";

jest.mock("antd", () => ({
  Modal: jest.fn(({ children, footer }) => <div data-testid="modal">{children}{footer}</div>),
}));

jest.mock("@/components/Global/Button/button", () => ({
  __esModule: true,
  default: jest.fn(({ title }) => <button type="button">{title}</button>),
}));

test("ModalContainer forwards accessibility and interaction props while keeping focus restoration enabled", () => {
  render(
    <ModalContainer
      open
      onClose={jest.fn()}
      hideFooter
      aria-label="Assignment details"
      keyboard={false}
      maskClosable={false}
    >
      Modal body
    </ModalContainer>
  );

  const props = Modal.mock.calls[0][0];
  expect(props["aria-label"]).toBe("Assignment details");
  expect(props.keyboard).toBe(false);
  expect(props.maskClosable).toBe(false);
  expect(props.focusTriggerAfterClose).toBe(true);
  expect(props.open).toBe(true);
});

test("core modal ownership stays authoritative over forwarded props", () => {
  const onClose = jest.fn();
  render(
    <ModalContainer open onClose={onClose} hideFooter rootClassName="caller-override">
      Modal body
    </ModalContainer>
  );

  const props = Modal.mock.calls[0][0];
  expect(props.open).toBe(true);
  expect(props.onCancel).toBe(onClose);
  expect(props.rootClassName).toBe("ln-modal-container-root");
});

test("shared modal footer exposes loading and disabled state for async actions", () => {
  const CustomButton = require("@/components/Global/Button/button").default;
  CustomButton.mockClear();

  render(
    <ModalContainer
      open
      onClose={jest.fn()}
      showFooter
      primaryButtonTitle="Save"
      secondaryButtonTitle="Cancel"
      primaryLoading
      disablePrimary
      disableSecondary
    >
      Modal body
    </ModalContainer>
  );

  const primaryProps = CustomButton.mock.calls.find(([props]) => props.title === "Save")?.[0];
  const secondaryProps = CustomButton.mock.calls.find(([props]) => props.title === "Cancel")?.[0];

  expect(primaryProps).toEqual(expect.objectContaining({ loading: true, disabled: true }));
  expect(secondaryProps).toEqual(expect.objectContaining({ loading: false, disabled: true }));
});
