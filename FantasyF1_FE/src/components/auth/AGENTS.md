# Auth Components - Developer Notes

## Directory Structure

```
auth/
├── EmailCheckForm/       # Homepage email entry form
│   ├── EmailCheckForm.tsx
│   ├── EmailCheckForm.scss
│   ├── EmailCheckForm.test.tsx
│   └── index.ts
├── LoginForm/            # Login page (Story 2)
│   ├── LoginForm.tsx
│   ├── LoginForm.scss
│   ├── LoginForm.test.tsx
│   └── index.ts
├── RegisterForm/         # Registration page (Story 3)
└── AGENTS.md
```

## Patterns and Conventions

### Form Components
- Use `react-hook-form` for all form state management
- Validation mode: `onBlur` for real-time feedback
- Always include ARIA attributes for accessibility
- Use BEM naming convention for SCSS classes

### API Integration
- All auth API calls go through `services/authService.ts`
- Use `parseApiError` for consistent error handling
- Loading states should disable form inputs and show spinner

### State Passing Between Pages
- Use `react-router-dom` location state to pass email between pages
- Access via `useLocation().state.email` in receiving components

### Styling
- F1 brand colors: Primary red `#e10600`, dark variant `#b30500`
- Use SCSS variables at component level (will migrate to global)
- Mobile-first responsive design
- 8px spacing grid system

## Component Details

### EmailCheckForm
Homepage entry point for authentication. User enters email to determine action (login vs register).

**Props**: None

**Features**:
- Email input with validation
- "Check" button that determines if email exists
- Redirects to /login if email exists, /register if not
- Loading state with spinner
- Form validation
- Accessibility features (ARIA, keyboard navigation)

**Navigation Flow**:
1. User enters email → validates
2. Calls `checkEmail(email)` API
3. Based on response:
   - exists: true → navigate to /login with email in state
   - exists: false → navigate to /register with email in state

### LoginForm
Handles user login with email (pre-entered from EmailCheckForm) and password.

**Props**: None - receives email from `useLocation().state`

**Features**:
- Password input with visibility toggle
- Form validation (password required)
- API error handling with status-specific messages:
  - 401: "Incorrect username or password"
  - 403: "Your account is inactive. Please contact support."
  - 429: "Too many login attempts. Please try again later."
  - Default: "An error occurred. Please try again."
- Loading state with spinner
- Redirects if no email in location state
- forgot password link
- Change email button
- Return URL support via query params

**State Management**:
- Local state for password, showPassword, loading, apiError
- Uses `AuthContext.login()` for authentication
- Uses `useNavigate()` for routing

**Navigation Flow**:
1. Check email in location state → redirect to / if missing
2. User enters password → validates → calls auth service
3. On success → AuthContext.login() → navigate to dashboard/returnUrl
4. On error → clear password field → show API error message

## Backend Dependencies

### Required Endpoints

**Implemented**:
- `POST /api/v1/auth/login` - Accepts `{ username, password }` → Returns `{ access_token, refresh_token }`
- `POST /api/v1/auth/token/refresh` - Accepts `{ refresh_token }` → Returns `{ access_token }`

**Not Yet Implemented**:
- `GET /api/v1/auth/check-email?email={email}` - Returns `{ exists: boolean }`
  - Should be rate-limited to prevent enumeration attacks

## Testing

- Mock `authService` functions with Jest
- Mock `useNavigate` from react-router-dom
- Test loading states, error states, and navigation
- Ensure accessibility tests check ARIA attributes

## Gotchas

1. **Form ref handling**: When using react-hook-form with custom refs, need to merge refs properly
2. **Email validation**: Use regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` for client-side
3. **Loading state**: Button should show spinner AND "Checking..." text for accessibility
4. **Password security**: Always clear password field on authentication error to prevent UI confusion
5. **Return URL handling**: Check `new URLSearchParams(location.search).get('returnUrl')` for protected route redirects
6. **Location state**: Email passed from EmailCheckForm via `location.state.email` - handle missing state gracefully
