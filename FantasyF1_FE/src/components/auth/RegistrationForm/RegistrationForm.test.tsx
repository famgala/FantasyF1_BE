import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import RegistrationForm from "./RegistrationForm";
import * as authService from "../../../services/authService";

// Mock the authService
jest.mock("../../../services/authService");

// Mock useParams and useLocation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: { email: "test@example.com" } }),
}));

describe("RegistrationForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders registration form with pre-filled email", () => {
    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
  });

  test("displays correct email in email display", () => {
    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  test("allows changing email to editable mode", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const changeButton = screen.getByText("Change");
    await user.click(changeButton);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  test("validates username field correctly", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText("Username");
    await user.click(usernameInput);
    await user.tab(); // Trigger blur

    expect(screen.getByText("Username is required")).toBeInTheDocument();
  });

  test("validates username minimum length", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText("Username");
    await user.type(usernameInput, "ab");
    await user.tab();

    expect(screen.getByText("Username must be at least 3 characters")).toBeInTheDocument();
  });

  test("validates username pattern", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText("Username");
    await user.type(usernameInput, "user@name");
    await user.tab();

    expect(screen.getByText(/Username can only contain/)).toBeInTheDocument();
  });

  test("validates password field correctly", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText("Password");
    await user.click(passwordInput);
    await user.tab(); // Trigger blur

    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  test("validates password complexity", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText("Password");
    await user.type(passwordInput, "weak");
    await user.tab();

    expect(screen.getByText(/Password must include/)).toBeInTheDocument();
  });

  test("validates password match", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");

    await user.type(passwordInput, "Secure123");
    await user.type(confirmPasswordInput, "Different123");
    fireEvent.blur(confirmPasswordInput);

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });

  test("validates terms checkbox", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole("button", { name: "Create account" });
    await user.click(submitButton);

    expect(screen.getByText("You must accept the terms to continue")).toBeInTheDocument();
  });

  test("submits registration successfully", async () => {
    const user = userEvent.setup();
    (authService.register as jest.Mock).mockResolvedValue({ success: true });

    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText("Username");
    const fullNameInput = screen.getByLabelText(/Full Name/);
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const termsCheckbox = screen.getByRole("checkbox", { name: /terms/i });
    const submitButton = screen.getByRole("button", { name: "Create account" });

    await user.type(usernameInput, "testuser");
    await user.type(fullNameInput, "Test User");
    await user.type(passwordInput, "Secure123");
    await user.type(confirmPasswordInput, "Secure123");
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        username: "testuser",
        email: "test@example.com",
        full_name: "Test User",
        password: "Secure123",
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login", {
      replace: true,
      state: {
        email: "test@example.com",
        registrationSuccess: true,
      },
    });
  });

  test("handles registration errors - duplicate email", async () => {
    const user = userEvent.setup();
    (authService.register as jest.Mock).mockRejectedValue({
      status: 409,
      message: "Email already exists",
    });

    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const termsCheckbox = screen.getByRole("checkbox", { name: /terms/i });
    const submitButton = screen.getByRole("button", { name: "Create account" });

    await user.type(usernameInput, "testuser");
    await user.type(passwordInput, "Secure123");
    await user.type(confirmPasswordInput, "Secure123");
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Email already registered/)).toBeInTheDocument();
    });
  });

  test("handles registration errors - duplicate username", async () => {
    const user = userEvent.setup();
    (authService.register as jest.Mock).mockRejectedValue({
      status: 409,
      message: "Username already exists",
    });

    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const termsCheckbox = screen.getByRole("checkbox", { name: /terms/i });
    const submitButton = screen.getByRole("button", { name: "Create account" });

    await user.type(usernameInput, "testuser");
    await user.type(passwordInput, "Secure123");
    await user.type(confirmPasswordInput, "Secure123");
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Username already registered/)).toBeInTheDocument();
    });
  });

  test("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText("Password");
    const toggleButton = screen.getByLabelText("Show password");

    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Hide password")).toBeInTheDocument();
  });

  test("shows password strength indicator", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText("Password");

    // Type weak password
    await user.clear(passwordInput);
    await user.type(passwordInput, "weak");
    
    await waitFor(() => {
      expect(screen.getByText("Weak")).toBeInTheDocument();
    });

    // Type strong password
    await user.clear(passwordInput);
    await user.type(passwordInput, "StrongPass123");
    
    await waitFor(() => {
      expect(screen.getByText("Strong")).toBeInTheDocument();
    });
  });

  test("allows optional full name to remain empty", async () => {
    const user = userEvent.setup();
    (authService.register as jest.Mock).mockResolvedValue({ success: true });

    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const termsCheckbox = screen.getByRole("checkbox", { name: /terms/i });
    const submitButton = screen.getByRole("button", { name: "Create account" });

    // Don't type in full name field
    await user.type(usernameInput, "testuser");
    await user.type(passwordInput, "Secure123");
    await user.type(confirmPasswordInput, "Secure123");
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        username: "testuser",
        email: "test@example.com",
        full_name: "",
        password: "Secure123",
      });
    });
  });

  test("shows loading state during submission", async () => {
    const user = userEvent.setup();
    (authService.register as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    render(
      <BrowserRouter>
        <RegistrationForm />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const termsCheckbox = screen.getByRole("checkbox", { name: /terms/i });
    const submitButton = screen.getByRole("button", { name: "Create account" });

    await user.type(usernameInput, "testuser");
    await user.type(passwordInput, "Secure123");
    await user.type(confirmPasswordInput, "Secure123");
    await user.click(termsCheckbox);
    await user.click(submitButton);

    expect(screen.getByText("Creating account...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});
