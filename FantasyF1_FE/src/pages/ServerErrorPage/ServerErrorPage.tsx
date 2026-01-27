import React from "react";
import { Link } from "react-router-dom";
import "../NotFoundPage/NotFoundPage.scss";

const ServerErrorPage: React.FC = () => {
  return (
    <div className="error-page error-page--500">
      <h1>500</h1>
      <h2>Server Error</h2>
      <p>Something went wrong on our end. Please try again later.</p>
      <Link to="/" className="error-page__button">Go to Home</Link>
    </div>
  );
};

export default ServerErrorPage;
