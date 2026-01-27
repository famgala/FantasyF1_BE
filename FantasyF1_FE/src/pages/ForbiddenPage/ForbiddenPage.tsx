import React from "react";
import { Link } from "react-router-dom";
import "../NotFoundPage/NotFoundPage.scss";

const ForbiddenPage: React.FC = () => {
  return (
    <div className="error-page error-page--403">
      <h1>403</h1>
      <h2>Access Forbidden</h2>
      <p>You do not have permission to access this page.</p>
      <Link to="/dashboard" className="error-page__button">Go to Dashboard</Link>
    </div>
  );
};

export default ForbiddenPage;
