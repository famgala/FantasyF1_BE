import React, { useEffect, useRef } from 'react';

interface AnnouncerProps {
  message: string;
  ariaLive?: 'polite' | 'assertive' | 'off';
  role?: 'status' | 'alert';
}

/**
 * Announcer component provides ARIA live region support for
 * announcing dynamic content changes to screen readers.
 * This is essential for WCAG 2.1 AA compliance.
 */
export const Announcer: React.FC<AnnouncerProps> = ({
  message,
  ariaLive = 'polite',
  role = 'status',
}) => {
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (announcerRef.current && message) {
      // Clear the message first to ensure screen readers announce changes
      announcerRef.current.textContent = '';
      // Use setTimeout to ensure the change is detected
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      }, 100);
    }
  }, [message]);

  return (
    <div
      ref={announcerRef}
      aria-live={ariaLive}
      role={role}
      className="sr-only"
      aria-atomic="true"
    />
  );
};

export default Announcer;