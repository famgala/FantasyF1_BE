import React, { useState } from 'react';
import { MobileNav } from '../components/MobileNav';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
}

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

interface KeyboardShortcut {
  key: string;
  description: string;
  category: string;
}

const helpArticles: HelpArticle[] = [
  {
    id: 'getting-started-1',
    title: 'Creating Your Account',
    category: 'Getting Started',
    content: `
      <h3>How to Create Your Account</h3>
      <p>Follow these steps to create your FantasyF1 account:</p>
      <ol>
        <li>Click the "Sign Up" button on the landing page</li>
        <li>Fill in your username, email, full name, and password</li>
        <li>Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit</li>
        <li>Click "Create Account" to complete registration</li>
        <li>You'll be automatically logged in and redirected to your dashboard</li>
      </ol>
      <p><strong>Tip:</strong> Use a strong password and keep it secure. You can always reset it later if needed.</p>
    `,
    tags: ['account', 'registration', 'signup']
  },
  {
    id: 'getting-started-2',
    title: 'Logging In',
    category: 'Getting Started',
    content: `
      <h3>How to Log In</h3>
      <p>To access your FantasyF1 account:</p>
      <ol>
        <li>Click the "Log In" button on the landing page</li>
        <li>Enter your username and password</li>
        <li>Check "Remember me" to stay logged in on this device</li>
        <li>Click "Log In" to access your dashboard</li>
      </ol>
      <p><strong>Forgot your password?</strong> Click "Forgot Password" on the login page to reset it.</p>
    `,
    tags: ['login', 'authentication', 'signin']
  },
  {
    id: 'leagues-1',
    title: 'Creating a League',
    category: 'Leagues',
    content: `
      <h3>How to Create a League</h3>
      <p>Create your own fantasy F1 league and invite friends to compete:</p>
      <ol>
        <li>Go to your dashboard and click "Create League"</li>
        <li>Fill in the league details:
          <ul>
            <li><strong>Name:</strong> Your league's name</li>
            <li><strong>Description:</strong> Tell others about your league</li>
            <li><strong>Max Teams:</strong> Number of participants (2-50)</li>
            <li><strong>Privacy:</strong> Public (anyone can join) or Private (invite only)</li>
            <li><strong>Draft Method:</strong> Random, Sequential, or Snake draft</li>
          </ul>
        </li>
        <li>Click "Create League" to finish</li>
        <li>You'll receive a unique league code to share with others</li>
      </ol>
      <p><strong>Note:</strong> As the creator, you're automatically the league manager with full permissions.</p>
    `,
    tags: ['league', 'create', 'manager']
  },
  {
    id: 'leagues-2',
    title: 'Joining a League',
    category: 'Leagues',
    content: `
      <h3>How to Join a League</h3>
      <p>Join an existing league using a league code:</p>
      <ol>
        <li>Go to your dashboard and click "Join League"</li>
        <li>Enter the league code provided by the league creator</li>
        <li>Enter your team name</li>
        <li>Review the league information</li>
        <li>Click "Join League" to confirm</li>
      </ol>
      <p><strong>Alternative:</strong> Browse public leagues from the "Browse Leagues" page and join directly.</p>
    `,
    tags: ['league', 'join', 'team']
  },
  {
    id: 'drafting-1',
    title: 'Understanding the Draft',
    category: 'Drafting',
    content: `
      <h3>How the Draft Works</h3>
      <p>The draft is where you select drivers for your fantasy team:</p>
      <ul>
        <li><strong>Draft Order:</strong> Determined by the league creator (random, sequential, or snake)</li>
        <li><strong>Pick Timer:</strong> Each team has a limited time to make their pick</li>
        <li><strong>Auto-Pick:</strong> If you miss your turn, the system will auto-pick the highest-ranked available driver</li>
        <li><strong>Driver Selection:</strong> Choose from available F1 drivers based on their stats and price</li>
      </ul>
      <p><strong>Pro Tip:</strong> Research driver performance and team dynamics before the draft!</p>
    `,
    tags: ['draft', 'selection', 'autopick']
  },
  {
    id: 'drafting-2',
    title: 'Making Your Draft Pick',
    category: 'Drafting',
    content: `
      <h3>How to Make a Draft Pick</h3>
      <p>When it's your turn in the draft:</p>
      <ol>
        <li>Watch for the "Your Turn!" notification</li>
        <li>Go to the "Make Draft Pick" page</li>
        <li>Review available drivers with their stats:
          <ul>
            <li>Name and number</li>
            <li>Team/Constructor</li>
            <li>Price</li>
            <li>Total points earned</li>
            <li>Average points per race</li>
          </ul>
        </li>
        <li>Filter by team or search by name</li>
        <li>Select your desired driver</li>
        <li>Click "Confirm Pick" to finalize</li>
      </ol>
      <p><strong>Important:</strong> Once confirmed, picks cannot be changed. Make your selection carefully!</p>
    `,
    tags: ['draft', 'pick', 'selection']
  },
  {
    id: 'teams-1',
    title: 'Managing Your Team',
    category: 'Teams',
    content: `
      <h3>How to Manage Your Team</h3>
      <p>Keep your fantasy team competitive throughout the season:</p>
      <ul>
        <li><strong>View Team:</strong> Go to "My Teams" and click on your team</li>
        <li><strong>Edit Team Name:</strong> Change your team name anytime from the team detail page</li>
        <li><strong>Add Picks:</strong> Select drivers for upcoming races before the deadline</li>
        <li><strong>Remove Picks:</strong> Remove drivers from your lineup (before race starts)</li>
        <li><strong>Track Budget:</strong> Monitor your budget spending to stay within limits</li>
      </ul>
      <p><strong>Budget Tips:</strong> Plan your picks carefully to maximize points while staying within budget.</p>
    `,
    tags: ['team', 'management', 'budget']
  },
  {
    id: 'teams-2',
    title: 'Adding Driver Picks',
    category: 'Teams',
    content: `
      <h3>How to Add Driver Picks</h3>
      <p>Select drivers for each race to earn points:</p>
      <ol>
        <li>Go to your team detail page</li>
        <li>Click "Add Picks" for an upcoming race</li>
        <li>Review available drivers with their stats and prices</li>
        <li>Filter by team or search by name</li>
        <li>Select up to 5 drivers (max 2 per team)</li>
        <li>Monitor your budget remaining</li>
        <li>Click "Confirm Picks" to finalize</li>
      </ol>
      <p><strong>Rules:</strong> You can add picks until the race starts. After that, no changes are allowed.</p>
    `,
    tags: ['team', 'picks', 'drivers']
  },
  {
    id: 'scoring-1',
    title: 'Understanding Scoring',
    category: 'Scoring',
    content: `
      <h3>How Scoring Works</h3>
      <p>Earn points based on real F1 race results:</p>
      <ul>
        <li><strong>Finishing Position:</strong> Points awarded based on where your drivers finish (1st = 25pts, 2nd = 18pts, etc.)</li>
        <li><strong>Fastest Lap:</strong> Bonus points for drivers who set the fastest lap</li>
        <li><strong>Position Gains:</strong> Bonus points for drivers who gain positions from grid to finish</li>
        <li><strong>Team Performance:</strong> Points based on constructor results</li>
      </ul>
      <p><strong>League Scoring:</strong> Your total points are the sum of all your drivers' points for each race.</p>
    `,
    tags: ['scoring', 'points', 'rules']
  },
  {
    id: 'scoring-2',
    title: 'Viewing Leaderboards',
    category: 'Scoring',
    content: `
      <h3>How to View Leaderboards</h3>
      <p>Track your standing in your leagues:</p>
      <ol>
        <li>Go to your league detail page</li>
        <li>Click "Leaderboard" to view standings</li>
        <li>See ranked list of all teams with:
          <ul>
            <li>Rank position</li>
            <li>Team name and owner</li>
            <li>Total points</li>
            <li>Wins and podiums</li>
          </ul>
        </li>
        <li>Filter by specific race or overall season</li>
        <li>Your team is highlighted for easy reference</li>
      </ol>
      <p><strong>Podium:</strong> Top 3 teams are displayed prominently at the top of the leaderboard.</p>
    `,
    tags: ['leaderboard', 'standings', 'ranking']
  },
  {
    id: 'troubleshooting-1',
    title: 'Resetting Your Password',
    category: 'Troubleshooting',
    content: `
      <h3>How to Reset Your Password</h3>
      <p>If you've forgotten your password:</p>
      <ol>
        <li>Go to the login page</li>
        <li>Click "Forgot Password"</li>
        <li>Enter your email address</li>
        <li>Check your email for a reset link</li>
        <li>Click the link to create a new password</li>
        <li>Enter your new password (must meet security requirements)</li>
        <li>Confirm your new password</li>
        <li>You'll be redirected to login with your new password</li>
      </ol>
      <p><strong>Note:</strong> Reset links expire after 24 hours for security.</p>
    `,
    tags: ['password', 'reset', 'troubleshooting']
  },
  {
    id: 'troubleshooting-2',
    title: 'Contacting Support',
    category: 'Troubleshooting',
    content: `
      <h3>How to Get Help</h3>
      <p>If you're experiencing issues:</p>
      <ul>
        <li><strong>Check this Help Center:</strong> Search for articles related to your issue</li>
        <li><strong>Review FAQs:</strong> Common questions are answered in the FAQ section</li>
        <li><strong>Contact Support:</strong> Use the contact form below to reach our support team</li>
        <li><strong>Include Details:</strong> When contacting support, include:
          <ul>
            <li>Your username</li>
            <li>A detailed description of the issue</li>
            <li>Steps to reproduce the problem</li>
            <li>Screenshots if applicable</li>
          </ul>
        </li>
      </ul>
      <p><strong>Response Time:</strong> Our support team typically responds within 24-48 hours.</p>
    `,
    tags: ['support', 'help', 'contact']
  }
];

const faqs: FAQ[] = [
  {
    question: 'How do I create a league?',
    answer: 'Go to your dashboard and click "Create League". Fill in the league details including name, description, max teams, privacy settings, and draft method. You\'ll receive a unique league code to share with others.',
    category: 'Leagues'
  },
  {
    question: 'What happens if I miss my draft pick?',
    answer: 'If you miss your turn, the system will auto-pick the highest-ranked available driver for you. You can enable auto-pick in your user preferences to have this happen automatically.',
    category: 'Drafting'
  },
  {
    question: 'How are points calculated?',
    answer: 'Points are based on real F1 race results. Drivers earn points for finishing position (1st = 25pts, 2nd = 18pts, etc.), fastest lap bonus, and position gains. Your team\'s total points are the sum of all your drivers\' points.',
    category: 'Scoring'
  },
  {
    question: 'Can I change my team name?',
    answer: 'Yes! Go to your team detail page and click "Edit Team Name". You can change your team name anytime as long as it\'s between 3-100 characters.',
    category: 'Teams'
  },
  {
    question: 'How do I leave a league?',
    answer: 'Go to the league detail page and click "Leave League". You\'ll need to confirm your decision. Note that you cannot leave if you\'re the league creator - you must delete the league or transfer ownership first.',
    category: 'Leagues'
  },
  {
    question: 'What is the draft timer?',
    answer: 'The draft timer is the amount of time each team has to make their pick. It\'s configured by the league creator (typically 60-120 seconds). If the timer expires, auto-pick will be triggered.',
    category: 'Drafting'
  },
  {
    question: 'How do I invite someone to my league?',
    answer: 'Share your unique league code with others, or use the "Invite Members" feature on the league management page to send invitations directly to users by username or email.',
    category: 'Leagues'
  },
  {
    question: 'Can I remove a driver from my picks?',
    answer: 'Yes, you can remove drivers from your lineup before the race starts. Go to your team detail page, find the pick you want to remove, and click "Remove Pick". Your budget will be refunded.',
    category: 'Teams'
  },
  {
    question: 'What are the different draft methods?',
    answer: 'There are three draft methods: Random (order is randomly generated), Sequential (fixed order 1-N), and Snake (order reverses each round: 1-N, N-1, 1-N, etc.).',
    category: 'Drafting'
  },
  {
    question: 'How do I view race results?',
    answer: 'Go to the Race Calendar, click on a completed race, and then click "View Results" to see detailed finishing positions, grid positions, DNF status, and points earned.',
    category: 'Scoring'
  }
];

const keyboardShortcuts: KeyboardShortcut[] = [
  { key: 'Ctrl + K', description: 'Open search', category: 'Navigation' },
  { key: 'Ctrl + /', description: 'Open keyboard shortcuts', category: 'Navigation' },
  { key: 'Esc', description: 'Close modals and dropdowns', category: 'Navigation' },
  { key: 'Enter', description: 'Submit forms', category: 'Forms' },
  { key: 'Tab', description: 'Move to next field', category: 'Forms' },
  { key: 'Shift + Tab', description: 'Move to previous field', category: 'Forms' },
  { key: 'Arrow Up/Down', description: 'Navigate lists', category: 'Navigation' },
  { key: 'Home', description: 'Go to top of page', category: 'Navigation' },
  { key: 'End', description: 'Go to bottom of page', category: 'Navigation' },
  { key: 'Page Up/Down', description: 'Scroll one page', category: 'Navigation' }
];

export const Help: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const categories = ['All', 'Getting Started', 'Leagues', 'Drafting', 'Teams', 'Scoring', 'Troubleshooting'];

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would send the form data to a support API
    console.log('Support request submitted:', contactForm);
    setFormSubmitted(true);
    setContactForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Navigation */}
      <nav className="desktop-nav bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FantasyF1</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 dark:text-gray-300 mr-4">
                Welcome, {user?.full_name || user?.username}
              </span>
              <div className="mr-2">
                <ThemeToggle />
              </div>
              <a
                href="/dashboard"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <MobileNav />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Help Center</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Find answers to your questions and learn how to use FantasyF1
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for help articles, FAQs, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Help Articles */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Help Articles</h2>
            {selectedArticle ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="mb-4 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                >
                  ← Back to articles
                </button>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {selectedArticle.title}
                </h3>
                <div
                  className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Category: {selectedArticle.category}
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedArticle.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map(article => (
                  <div
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2 block">
                      {article.category}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {article.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No articles found matching your search. Try different keywords or browse all categories.
                </p>
              </div>
            )}
          </div>

          {/* FAQ Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            {filteredFAQs.length > 0 ? (
              <div className="space-y-4">
                {filteredFAQs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                      <svg
                        className={`h-5 w-5 text-gray-500 transform transition-transform ${
                          expandedFAQ === index ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {expandedFAQ === index && (
                      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">
                          Category: {faq.category}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No FAQs found matching your search.
                </p>
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Keyboard Shortcuts</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {keyboardShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 block">
                        {shortcut.category}
                      </span>
                      <span className="text-gray-900 dark:text-white">{shortcut.description}</span>
                    </div>
                    <kbd className="px-3 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Support</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              {!showContactForm ? (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Can't find what you're looking for? Contact our support team for personalized help.
                  </p>
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                  >
                    Contact Support
                  </button>
                </div>
              ) : (
                <div>
                  {formSubmitted ? (
                    <div className="text-center py-8">
                      <svg
                        className="mx-auto h-16 w-16 text-green-500 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Support Request Submitted
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Our support team will get back to you within 24-48 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit}>
                      <div className="grid gap-4 md:grid-cols-2 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={contactForm.name}
                            onChange={handleContactChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={contactForm.email}
                            onChange={handleContactChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Subject
                        </label>
                        <input
                          type="text"
                          name="subject"
                          value={contactForm.subject}
                          onChange={handleContactChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Message
                        </label>
                        <textarea
                          name="message"
                          value={contactForm.message}
                          onChange={handleContactChange}
                          required
                          rows={5}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                        >
                          Submit Request
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowContactForm(false)}
                          className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-md font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Help;