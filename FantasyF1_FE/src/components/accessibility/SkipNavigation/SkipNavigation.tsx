import React from 'react';
import './SkipNavigation.scss';

interface SkipLinks {
  href: string;
  label: string;
}

const SkipNavigation: React.FC = () => {
  const skipLinks: SkipLinks[] = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
  ];

  return (
    <div className="skip-navigation" role="navigation" aria-label="Skip to content">
      {skipLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="skip-link"
          tabIndex={0}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

export default SkipNavigation;
