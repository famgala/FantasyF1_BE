import React from "react";
import { Link } from "react-router-dom";
import "./NotFoundPage.scss";

const NotFoundPage: React.FC = () => {
  return (
    <div className="error-page error-page--404">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for does not exist or has been moved.</p>
      <Link to="/" className="error-page__button">Go to Home</Link>
    </div>
  );
};

export default NotFoundPage;
