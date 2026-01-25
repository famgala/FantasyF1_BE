import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmailCheckForm from "../../components/auth/EmailCheckForm";
import "./HomePage.scss";

/**
 * HomePage Component
 * 
 * The landing page of the Fantasy F1 application.
 * Displays a welcoming interface with an email check form
 * that routes users to login or registration based on email existence.
 */
const HomePage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  /**
   * Handle email form submission
   * @param event - Form submit event
   * @param emailExists - Whether the email exists in the system
   */
  const handleEmailSubmit = (
    event: FormEvent,
    emailExists?: boolean
  ): void => {
    event.preventDefault();

    if (emailExists !== undefined) {
      setSubmitting(true);
      // Add a small delay for smooth transition
      setTimeout(() => {
        if (emailExists) {
          navigate("/login", { state: { email } });
        } else {
          navigate("/register", { state: { email } });
        }
        setSubmitting(false);
      }, 300);
    }
  };

  return (
    <div className="homepage">
      <header className="homepage__header">
        <div className="homepage__logo">
          <h1 className="homepage__title">Fantasy F1</h1>
          <p className="homepage__subtitle">Experience Formula 1 like never before</p>
        </div>
      </header>

      <main className="homepage__main">
        <div className="homepage__content">
          <div className="homepage__hero">
            <h2 className="homepage__hero-title">
              Join the Ultimate F1 Fantasy League
            </h2>
            <p className="homepage__hero-text">
              Draft your favorite drivers, compete with friends, and dominate the
              standings in our weekly fantasy racing league.
            </p>
            <div className="homepage__features">
              <div className="homepage__feature">
                <div className="homepage__feature-icon">🏎️</div>
                <h3 className="homepage__feature-title">Weekly Drafts</h3>
                <p className="homepage__feature-description">
                  Select new drivers every race week based on real F1 events
                </p>
              </div>
              <div className="homepage__feature">
                <div className="homepage__feature-icon">🏆</div>
                <h3 className="homepage__feature-title">Compete</h3>
                <p className="homepage__feature-description">
                  Create or join leagues and climb the standings
                </p>
              </div>
              <div className="homepage__feature">
                <div className="homepage__feature-icon">📊</div>
                <h3 className="homepage__feature-title">Point Scoring</h3>
                <p className="homepage__feature-description">
                  Inverted position scoring creates exciting strategies
                </p>
              </div>
            </div>
          </div>

          <div className="homepage__auth-section">
            <EmailCheckForm
              onSubmit={handleEmailSubmit}
              submitting={submitting}
              onEmailChange={setEmail}
            />
          </div>
        </div>
      </main>

      <footer className="homepage__footer">
        <div className="homepage__footer-links">
          <Link to="/terms" className="homepage__footer-link">
            Terms of Service
          </Link>
          <Link to="/privacy" className="homepage__footer-link">
            Privacy Policy
          </Link>
        </div>
        <p className="homepage__copyright">
          © 2026 Fantasy F1. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
