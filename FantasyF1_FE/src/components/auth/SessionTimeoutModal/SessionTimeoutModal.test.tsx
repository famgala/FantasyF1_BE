import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SessionTimeoutModal from "./SessionTimeoutModal";

// Mock the useAuth hook
jest.mock("../../../contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from "../../../contexts/AuthContext";

describe("SessionTimeoutModal", () => {
  const mockLogout = jest.fn();
  const mockDismissSessionWarning = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      sessionWarningVisible: true,
      sessionRemainingTime: 300, // 5 minutes in seconds
      logout: mockLogout,
      dismissSessionWarning: mockDismissSessionWarning,
    });
  });

  it("should not render when sessionWarningVisible is false", () => {
    (useAuth as jest.Mock).mockReturnValue({
      sessionWarningVisible: false,
      sessionRemainingTime: 300,
      logout: mockLogout,
      dismissSessionWarning: mockDismissSessionWarning,
    });

    const { container } = render(<SessionTimeoutModal />);

    expect(container.firstChild).toBeNull();
  });

  it("should render modal when sessionWarningVisible is true", () => {
    render(<SessionTimeoutModal />);

    expect(screen.getByText("Session Expiring Soon")).toBeInTheDocument();
    expect(screen.getByText("Your session will expire in")).toBeInTheDocument();
    expect(screen.getByText(/5:00/)).toBeInTheDocument();
  });

  it("should format time correctly", () => {
    (useAuth as jest.Mock).mockReturnValue({
      sessionWarningVisible: true,
      sessionRemainingTime: 125, // 2 minutes 5 seconds
      logout: mockLogout,
      dismissSessionWarning: mockDismissSessionWarning,
    });

    render(<SessionTimeoutModal />);

    expect(screen.getByText(/2:05/)).toBeInTheDocument();
  });

  it("should call logout when Logout Now button is clicked", () => {
    render(<SessionTimeoutModal />);

    const logoutButton = screen.getByText("Logout Now");
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("should call dismissSessionWarning when Extend Session button is clicked", () => {
    render(<SessionTimeoutModal />);

    const extendButton = screen.getByText("Extend Session");
    fireEvent.click(extendButton);

    expect(mockDismissSessionWarning).toHaveBeenCalledTimes(1);
  });

  it("should display security message", () => {
    render(<SessionTimeoutModal />);

    expect(
      screen.getByText(
        "For your security, you'll be automatically logged out when your session expires."
      )
    ).toBeInTheDocument();
  });

  it("should have proper accessibility attributes", () => {
    render(<SessionTimeoutModal />);

    const overlay = screen.getByRole("dialog");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute("aria-modal", "true");
    expect(overlay).toHaveAttribute("aria-labelledby", "session-timeout-title");

    const title = screen.getByText("Session Expiring Soon");
    expect(title).toHaveAttribute("id", "session-timeout-title");
  });
});
