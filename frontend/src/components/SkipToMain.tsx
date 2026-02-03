import React from 'react';

/**
 * SkipToMain component provides a "Skip to main content" link
 * that allows keyboard users to bypass navigation and jump directly
 * to the main content area. This is a WCAG 2.1 AA requirement.
 */
export const SkipToMain: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="skip-to-main"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
};

export default SkipToMain;