import React from "react";
import "./LoadingPage.scss";

/**
 * LoadingPage Component
 * 
 * A full-page loading indicator used as a fallback for code-split routes.
 * Displays a centered loading spinner with informative text.
 * 
 * @component
 */
export const LoadingPage: React.FC = () => {
  return (
    <div className="loading-page">
      <div className="loading-page__content">
        <div className="loading-page__spinner" aria-hidden="true">
          <div className="loading-page__spinner-circle"></div>
          <div className="loading-page__spinner-circle"></div>
          <div className="loading-page__spinner-circle"></div>
        </div>
        <p className="loading-page__text" role="status">
          Loading...
        </p>
      </div>
    </div>
  );
};
