import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import EmailCheckForm from "./EmailCheckForm";
import * as authService from "../../../services/authService";

// Mock the auth service
jest.mock("../../../services/authService");
const mockCheckEmailExists = authService.checkEmailExists as jest.MockedFunction<
  typeof authService.checkEmailExists
>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <EmailCheckForm />
    </BrowserRouter>
  );
};

describe("EmailCheckForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the email input field", () => {
      renderComponent();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it("renders the submit button", () => {
      renderComponent();
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    });

    it("focuses email input on mount", () => {
      renderComponent();
      expect(screen.getByLabelText(/email address/i)).toHaveFocus();
    });

    it("renders welcome message", () => {
      renderComponent();
      expect(screen.getByText(/welcome to fantasy f1/i)).toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    it("shows error for invalid email format", async () => {
      renderComponent();
      const input = screen.getByLabelText(/email address/i);
      
      await userEvent.type(input, "notanemail");
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it("shows error for empty email", async () => {
      renderComponent();
      const button = screen.getByRole("button", { name: /continue/i });
      
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
      });
    });

    it("accepts valid email format", async () => {
      mockCheckEmailExists.mockResolvedValueOnce({ exists: true });
      renderComponent();
      
      const input = screen.getByLabelText(/email address/i);
      await userEvent.type(input, "valid@email.com");
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("API Integration", () => {
    it("navigates to login when email exists", async () => {
      mockCheckEmailExists.mockResolvedValueOnce({ exists: true });
      renderComponent();
      
      const input = screen.getByLabelText(/email address/i);
      const button = screen.getByRole("button", { name: /continue/i });
      
      await userEvent.type(input, "existing@test.com");
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login", {
          state: { email: "existing@test.com" },
        });
      });
    });

    it("navigates to register when email does not exist", async () => {
      mockCheckEmailExists.mockResolvedValueOnce({ exists: false });
      renderComponent();
      
      const input = screen.getByLabelText(/email address/i);
      const button = screen.getByRole("button", { name: /continue/i });
      
      await userEvent.type(input, "new@test.com");
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/register", {
          state: { email: "new@test.com" },
        });
      });
    });

    it("shows loading state during API call", async () => {
      mockCheckEmailExists.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ exists: true }), 100))
      );
      renderComponent();
      
      const input = screen.getByLabelText(/email address/i);
      const button = screen.getByRole("button", { name: /continue/i });
      
      await userEvent.type(input, "test@test.com");
      await userEvent.click(button);
      
      expect(screen.getByText(/checking/i)).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it("displays error message on API failure", async () => {
      mockCheckEmailExists.mockRejectedValueOnce({ message: "Network error" });
      renderComponent();
      
      const input = screen.getByLabelText(/email address/i);
      const button = screen.getByRole("button", { name: /continue/i });
      
      await userEvent.type(input, "test@test.com");
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it("allows dismissing error message", async () => {
      mockCheckEmailExists.mockRejectedValueOnce({ message: "Network error" });
      renderComponent();
      
      const input = screen.getByLabelText(/email address/i);
      const button = screen.getByRole("button", { name: /continue/i });
      
      await userEvent.type(input, "test@test.com");
      await userEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
      
      const dismissButton = screen.getByText(/dismiss/i);
      await userEvent.click(dismissButton);
      
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      renderComponent();
      
      const input = screen.getByLabelText(/email address/i);
      expect(input).toHaveAttribute("aria-required", "true");
    });

    it("marks input as invalid when there are errors", async () => {
      renderComponent();
      const input = screen.getByLabelText(/email address/i);
      
      await userEvent.type(input, "invalid");
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(input).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("has accessible error messages", async () => {
      renderComponent();
      const button = screen.getByRole("button", { name: /continue/i });
      
      await userEvent.click(button);
      
      await waitFor(() => {
        const errorMessage = screen.getByRole("alert");
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });
});
