import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { ButtonLoader, FormFieldError } from '../components';
import {
  Trophy,
  Users,
  Flag,
  ChevronRight,
  Mail,
  CheckCircle,
  Car,
  Timer,
  BarChart3,
  Shield,
  HelpCircle,
  FileText,
} from 'lucide-react';

// Platform statistics interface
interface PlatformStats {
  total_users: number;
  active_leagues: number;
  total_races: number;
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'exists' | 'available'>('idle');
  const [stats, setStats] = useState<PlatformStats>({
    total_users: 0,
    active_leagues: 0,
    total_races: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Fetch platform statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Try to fetch stats from public endpoint
        const response = await fetch('/api/v1/stats/public');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Fallback to mock data if endpoint not available
          setStats({
            total_users: 1250,
            active_leagues: 85,
            total_races: 24,
          });
        }
      } catch {
        // Fallback to mock data
        setStats({
          total_users: 1250,
          active_leagues: 85,
          total_races: 24,
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
    setEmailStatus('idle');
  };

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsCheckingEmail(true);
    setEmailError('');

    try {
      const result = await authService.checkEmail(email);
      if (result.exists) {
        setEmailStatus('exists');
        // Redirect to login with email pre-filled after a short delay
        setTimeout(() => {
          navigate('/login', { state: { email } });
        }, 1500);
      } else {
        setEmailStatus('available');
        // Redirect to register with email pre-filled after a short delay
        setTimeout(() => {
          navigate('/register', { state: { email } });
        }, 1500);
      }
    } catch (error: any) {
      setEmailError(error.message || 'Failed to check email. Please try again.');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const features = [
    {
      icon: <Car className="feature-icon" />,
      title: 'Draft F1 Drivers',
      description:
        'Build your dream team by drafting real Formula 1 drivers. Analyze stats, form, and track performance to make strategic picks.',
    },
    {
      icon: <Trophy className="feature-icon" />,
      title: 'Compete in Leagues',
      description:
        'Join public leagues or create private ones with friends. Challenge other F1 fans and prove your racing knowledge.',
    },
    {
      icon: <BarChart3 className="feature-icon" />,
      title: 'Real-Time Scoring',
      description:
        'Earn points based on actual race results. Watch your team climb the leaderboard as the season unfolds.',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Create an Account',
      description: 'Sign up for free and set up your FantasyF1 profile.',
      icon: <Users className="step-icon" />,
    },
    {
      step: 2,
      title: 'Join or Create a League',
      description: 'Find public leagues to join or create a private league with friends.',
      icon: <Trophy className="step-icon" />,
    },
    {
      step: 3,
      title: 'Draft Your Team',
      description: 'Participate in the draft to build your team of F1 drivers.',
      icon: <Car className="step-icon" />,
    },
    {
      step: 4,
      title: 'Make Your Picks',
      description: 'Select drivers for each race and watch them earn points.',
      icon: <Flag className="step-icon" />,
    },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Flag size={16} />
            <span>2026 F1 Season</span>
          </div>
          <h1 className="hero-title">
            Fantasy<span className="text-red-500">F1</span>
          </h1>
          <p className="hero-tagline">
            The ultimate Formula 1 fantasy racing experience. Draft drivers, compete in leagues,
            and prove you know F1 better than the rest.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started Free
              <ChevronRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>

          {/* Email Capture Form */}
          <div className="email-capture">
            <p className="email-capture-text">
              Enter your email to get started
            </p>
            <form onSubmit={handleCheckEmail} className="email-form">
              <div className="email-input-wrapper">
                <Mail size={20} className="email-input-icon" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isCheckingEmail}
                  className="email-input"
                />
              </div>
              <button
                type="submit"
                disabled={isCheckingEmail}
                className="btn btn-primary"
              >
                {isCheckingEmail ? (
                  <ButtonLoader loadingText="Checking..." spinnerSize="sm" />
                ) : (
                  'Check Email'
                )}
              </button>
            </form>
            <FormFieldError errors={emailError} />
            {emailStatus === 'exists' && (
              <div className="email-status success">
                <CheckCircle size={16} />
                <span>Account found! Redirecting to login...</span>
              </div>
            )}
            {emailStatus === 'available' && (
              <div className="email-status success">
                <CheckCircle size={16} />
                <span>Email available! Redirecting to register...</span>
              </div>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="racing-car-visual">
            <Car size={120} className="car-icon" />
            <div className="speed-lines">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title">Why Play FantasyF1?</h2>
          <p className="section-subtitle">
            Experience Formula 1 like never before with our comprehensive fantasy platform
          </p>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon-wrapper">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Get started in minutes and join the excitement of F1 fantasy racing
          </p>
          <div className="steps-grid">
            {howItWorks.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{step.step}</div>
                <div className="step-icon-wrapper">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="stats-section">
        <div className="section-container">
          <h2 className="section-title">Join Our Growing Community</h2>
          <div className="stats-grid-landing">
            <div className="stat-item">
              <Users size={32} className="stat-item-icon" />
              <div className="stat-value">
                {isLoadingStats ? '...' : stats.total_users.toLocaleString()}
              </div>
              <div className="stat-label">Active Players</div>
            </div>
            <div className="stat-item">
              <Trophy size={32} className="stat-item-icon" />
              <div className="stat-value">
                {isLoadingStats ? '...' : stats.active_leagues.toLocaleString()}
              </div>
              <div className="stat-label">Active Leagues</div>
            </div>
            <div className="stat-item">
              <Flag size={32} className="stat-item-icon" />
              <div className="stat-value">
                {isLoadingStats ? '...' : stats.total_races.toLocaleString()}
              </div>
              <div className="stat-label">Races This Season</div>
            </div>
            <div className="stat-item">
              <Timer size={32} className="stat-item-icon" />
              <div className="stat-value">Live</div>
              <div className="stat-label">Real-Time Scoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <h2 className="cta-title">Ready to Race?</h2>
          <p className="cta-description">
            Join thousands of F1 fans and start your fantasy racing journey today.
            It's free to play!
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Free Account
              <ChevronRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Already have an account?
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <h3 className="footer-logo">
              Fantasy<span className="text-red-500">F1</span>
            </h3>
            <p className="footer-tagline">
              The ultimate Formula 1 fantasy racing platform
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-link-group">
              <h4>Platform</h4>
              <Link to="/register">Get Started</Link>
              <Link to="/login">Sign In</Link>
              <Link to="/leagues">Browse Leagues</Link>
            </div>
            <div className="footer-link-group">
              <h4>Support</h4>
              <Link to="#" className="footer-link-disabled">
                <HelpCircle size={14} />
                Help Center
              </Link>
              <Link to="#" className="footer-link-disabled">
                <FileText size={14} />
                Documentation
              </Link>
            </div>
            <div className="footer-link-group">
              <h4>Legal</h4>
              <Link to="#" className="footer-link-disabled">
                <Shield size={14} />
                Privacy Policy
              </Link>
              <Link to="#" className="footer-link-disabled">
                <FileText size={14} />
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 FantasyF1. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
