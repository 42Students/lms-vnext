import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useSelector } from "react-redux";
import NotificationDropdown from "@/components/Dropdowns/Notification/NotifivationDropdown";
import { useNotificationFeed } from "@/hooks/useNotificationFeed";

jest.mock("next/router", () => ({
  useRouter: () => ({ pathname: "/learn/courses", push: jest.fn() }),
}));

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

jest.mock("@/hooks/useNotificationFeed", () => ({
  useNotificationFeed: jest.fn(),
}));

jest.mock("@/utils/roleUtils", () => ({
  getNotificationsPath: () => "/learn/notifications",
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}));

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
  window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
  useSelector.mockImplementation((selector) =>
    selector({
      loginUser: {
        isUserLoggedIn: true,
        userType: "LEARNER",
        classId: 7,
      },
    })
  );
});

test("desktop notifications move focus inside, close on Escape and restore focus to the bell", async () => {
  useNotificationFeed.mockReturnValue({
    data: [],
    loading: false,
    error: false,
    refetch: jest.fn(),
  });

  render(<NotificationDropdown />);

  const bell = screen.getByRole("button", { name: "Open notifications" });
  fireEvent.click(bell);

  const dialog = await screen.findByRole("dialog", { name: "Notifications" });
  expect(dialog).toHaveAttribute("aria-modal", "true");

  const viewAll = screen.getByRole("link", { name: "View all notifications" });
  await waitFor(() => expect(viewAll).toHaveFocus());

  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Notifications" })).not.toBeInTheDocument());
  await waitFor(() => expect(bell).toHaveFocus());
});

test("notification load failure has an accessible retry action", async () => {
  const refetch = jest.fn();
  useNotificationFeed.mockReturnValue({
    data: [],
    loading: false,
    error: true,
    refetch,
  });

  render(<NotificationDropdown />);
  fireEvent.click(screen.getByRole("button", { name: "Open notifications" }));

  const retry = await screen.findByRole("button", { name: "Retry loading notifications" });
  fireEvent.click(retry);
  expect(refetch).toHaveBeenCalledTimes(1);
});
