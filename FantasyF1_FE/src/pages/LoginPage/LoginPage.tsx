import React from "react";
import LoginForm from "../../components/auth/LoginForm";

/**
 * LoginPage - Authentication page for existing users
 * 
 * Wrapper page for LoginForm component.
 * Expects email to be passed via location state from EmailCheckForm.
 */
const LoginPage: React.FC = () => {
  return <LoginForm />;
};

export default LoginPage;
