import React from "react";
import { act, render } from "@testing-library/react";
import ConfirmationModal from "@/components/Global/ModalContainer/ConfirmationModal";

let latestConfig;

jest.mock("antd", () => ({
  Modal: {
    useModal: () => [
      {
        confirm: jest.fn((config) => {
          latestConfig = config;
        }),
      },
      <div key="context" />,
    ],
  },
}));

jest.mock("@ant-design/icons", () => ({
  ExclamationCircleOutlined: (props) => <span {...props} />,
}));

describe("ConfirmationModal focus lifecycle", () => {
  beforeEach(() => {
    latestConfig = null;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("restores trigger focus only after an async confirmation succeeds", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    let resolveApply;
    const onApply = jest.fn(() => new Promise((resolve) => {
      resolveApply = resolve;
    }));

    render(<ConfirmationModal open onApply={onApply} onClose={jest.fn()} confirmText="Continue?" />);
    const pending = latestConfig.onOk();

    const inside = document.createElement("button");
    document.body.appendChild(inside);
    inside.focus();
    jest.runOnlyPendingTimers();
    expect(inside).toHaveFocus();

    await act(async () => {
      resolveApply("done");
      await pending;
    });
    jest.runOnlyPendingTimers();
    expect(trigger).toHaveFocus();

    trigger.remove();
    inside.remove();
  });

  test("keeps focus in the dialog when async confirmation rejects", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    render(
      <ConfirmationModal
        open
        onApply={() => Promise.reject(new Error("save failed"))}
        onClose={jest.fn()}
        confirmText="Continue?"
      />
    );

    const inside = document.createElement("button");
    document.body.appendChild(inside);
    inside.focus();

    await expect(latestConfig.onOk()).rejects.toThrow("save failed");
    jest.runOnlyPendingTimers();
    expect(inside).toHaveFocus();

    trigger.remove();
    inside.remove();
  });
});
