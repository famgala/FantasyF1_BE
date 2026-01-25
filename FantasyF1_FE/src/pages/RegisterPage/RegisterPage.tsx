import React from "react";
import RegistrationForm from "../../components/auth/RegistrationForm";

/**
 * RegisterPage - Account creation page for new users
 * 
 * Wrapper page for RegistrationForm component.
 * Expects email to be passed via location state from EmailCheckForm.
 */
const RegisterPage: React.FC = () => {
  return <RegistrationForm />;
};

export default RegisterPage;
