import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter, Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import LoginForm from "./LoginForm";
import { AuthContext } from "../../../contexts/AuthContext";

// Mock the authService
jest.mock("../../../services/authService", () => ({
  login: jest.fn(),
  ApiError: class extends Error {
    constructor(message: string, public status: number) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

// Mock the auth context
const mockLogin = jest.fn();
const mockAuthContext = {
  login: mockLogin,
  logout: jest.fn(),
  isAuthenticated: false,
  user: null,
  loading: false,
  sessionWarning: null,
  dismissSessionWarning: jest.fn(),
};

// Helper function to render LoginForm with router and auth provider
const renderLoginForm = (history?: any, locationState?: any) => {
  const h = history || createMemoryHistory();
  
  if (locationState) {
    h.push("/login", locationState);
  }

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <Router location={h.location} navigator={h}>
          <LoginForm />
        </Router>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the login form with email display", () => {
    renderLoginForm(undefined, { email: "test@example.com" });

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByText("Sign in to your Fantasy F1 account")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("should redirect to home if no email is provided in location state", () => {
    const history = createMemoryHistory();
    history.push("/login");
    
    renderLoginForm(history);

    expect(history.location.pathname).toBe("/");
  });

  it("should display email from location state", () => {
    renderLoginForm(undefined, { email: "user@example.com" });

    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("should have password visibility toggle button", () => {
    renderLoginForm(undefined, { email: "test@example.com" });

    const toggleButton = screen.getByLabelText(/show password/i) || screen.getByLabelText(/hide password/i);
    expect(toggleButton).toBeInTheDocument();
  });

  it("should toggle password visibility when toggle button is clicked", () => {
    renderLoginForm(undefined, { email: "test@example.com" });

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const toggleButton = screen.getByLabelText(/show password/i);

    // Initially password should be hidden
    expect(passwordInput.type).toBe("password");

    // Click to show password
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("text");

    // Click again to hide
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("password");
  });

  it("should display error when password is empty", async () => {
    renderLoginForm(undefined, { email: "test@example.com" });

    const submitButton = screen.getByRole("button", { name: "Sign in" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
  });

  it("should call login with correct credentials on form submit", async () => {
    const { login } = require("../../../services/authService");
    login.mockResolvedValue({ access_token: "token", refresh_token: "refresh" });

    renderLoginForm(undefined, { email: "test@example.com" });

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        username: "test@example.com",
        password: "password123",
      });
    });
  });

  it("should clear password field on authentication error", async () => {
    const { login, ApiError } = require("../../../services/authService");
    login.mockRejectedValue(new ApiError("Invalid credentials", 401));

    renderLoginForm(undefined, { email: "test@example.com" });

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId("api-error")).toBeInTheDocument();
    });

    // Password should be cleared
    await waitFor(() => {
      expect(screen.getByLabelText(/password/i)).toHaveValue("");
    });
  });

  it("should display appropriate error message for 401 unauthorized", async () => {
    const { login, ApiError } = require("../../../services/authService");
    login.mockRejectedValue(new ApiError("Unauthorized", 401));

    renderLoginForm(undefined, { email: "test@example.com" });

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Incorrect username or password")).toBeInTheDocument();
    });
  });

  it("should display appropriate error message for 403 inactive user", async () => {
    const { login, ApiError } = require("../../../services/authService");
    login.mockRejectedValue(new ApiError("Inactive account", 403));

    renderLoginForm(undefined, { email: "test@example.com" });

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Your account is inactive. Please contact support.")).toBeInTheDocument();
    });
  });

  it("should display appropriate error message for 429 rate limit", async () => {
    const { login, ApiError } = require("../../../services/authService");
    login.mockRejectedValue(new ApiError("Too many requests", 429));

    renderLoginForm(undefined, { email: "test@example.com" });

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Too many login attempts. Please try again later.")).toBeInTheDocument();
    });
  });

  it("should redirect to dashboard on successful login", async () => {
    const history = createMemoryHistory();
    history.push("/login", { email: "test@example.com" });

    const { login } = require("../../../services/authService");
    login.mockResolvedValue({ access_token: "token", refresh_token: "refresh" });

    history.push = jest.fn();

    renderLoginForm(history, { email: "test@example.com" });

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(login).toHaveBeenCalled();
    });
  });

  it("should redirect to returnUrl from query params on successful login", async () => {
    const history = createMemoryHistory();
    history.push("/login?returnUrl=/leagues/1", { email: "test@example.com" });

    history.push = jest.fn();

    const { login } = require("../../../services/authService");
    login.mockResolvedValue({ access_token: "token", refresh_token: "refresh" });

    renderLoginForm(history, { email: "test@example.com" });

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(login).toHaveBeenCalled();
    });
  });

  it("should have forgot password link", () => {
    renderLoginForm(undefined, { email: "test@example.com" });

    const forgotLink = screen.getByText("Forgot password?");
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink.closest("a")).toHaveAttribute("href", "/forgot-password");
  });

  it("should have sign up link in footer", () => {
    renderLoginForm(undefined, { email: "test@example.com" });

    const signUpLink = screen.getByText("Sign up");
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink.closest("a")).toHaveAttribute("href", "/");
  });

  it("should navigate to home when change email button is clicked", () => {
    const history = createMemoryHistory();
    history.push("/login", { email: "test@example.com" });

    renderLoginForm(history, { email: "test@example.com" });

    const changeEmailBtn = screen.getByRole("button", { name: "Change email address" });
    fireEvent.click(changeEmailBtn);

    expect(history.location.pathname).toBe("/");
  });

  it("should disable submit button during loading", async () => {
    const { login } = require("../../../services/authService");
    let resolveLogin: any;
    login.mockImplementation(() => new Promise(resolve => { resolveLogin = resolve; }));

    renderLoginForm(undefined, { email: "test@example.com" });

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText("Signing in...")).toBeInTheDocument();
    });

    // Cleanup
    resolveLogin({ access_token: "token", refresh_token: "refresh" });
  });

  it("should have proper ARIA attributes", () => {
    renderLoginForm(undefined, { email: "test@example.com" });

    // Check main role
    expect(screen.getByRole("main")).toBeInTheDocument();

    // Check form landmarks
    const form = screen.getByRole("form");
    expect(form).toBeInTheDocument();

    // Check password input attributes
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("aria-required", "true");
  });

  it("should be keyboard navigable", () => {
    renderLoginForm(undefined, { email: "test@example.com" });

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    // Tab should focus password input
    passwordInput.focus();
    expect(document.activeElement).toBe(passwordInput);

    // Tab should focus submit button
    fireEvent.tab(passwordInput);
    expect(document.activeElement).toBe(submitButton);

    // Enter should submit form
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.keyDown(submitButton, { key: "Enter", code: "Enter" });
  });
});
